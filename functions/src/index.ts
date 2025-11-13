import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// ✅ Define proper types for the request data
interface UpdateEmailData {
  uid: string;
  newEmail: string;
  oldEmail?: string;
}

// ✅ Cloud Function to update user email (v2 syntax)
export const updateUserEmail = functions.https.onCall(
    {
    region: 'asia-southeast2', // ✅ Make sure this is here
    cors: true,
  },
  async (request) => {
    // Security check: Must be authenticated
    if (!request.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to perform this action'
      );
    }

    // Security check: Must be a founder
    const callerUid = request.auth.uid;
    const data = request.data as UpdateEmailData;
    
    try {
      const callerDoc = await admin.firestore()
        .collection('users_by_uid')
        .doc(callerUid)
        .get();
      
      if (!callerDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Caller user document not found'
        );
      }

      const callerData = callerDoc.data();
      
      if (!callerData?.isFounder) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only founders can update user emails'
        );
      }

      // Extract data from request
      const { uid, newEmail, oldEmail } = data;

      // Validate inputs
      if (!uid || !newEmail) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'UID and new email are required'
        );
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Invalid email format'
        );
      }

      // Check if new email is already in use
      try {
        const existingUser = await admin.auth().getUserByEmail(newEmail);
        if (existingUser && existingUser.uid !== uid) {
          throw new functions.https.HttpsError(
            'already-exists',
            'This email is already registered to another user'
          );
        }
      } catch (error: any) {
        // If error is 'user not found', that's good - email is available
        if (error.code !== 'auth/user-not-found') {
          throw error;
        }
      }

      // 1. Update Firebase Authentication email
      await admin.auth().updateUser(uid, {
        email: newEmail
      });

      // 2. Update Firestore - users collection
      const usersRef = admin.firestore().collection('users');
      const userQuery = await usersRef.where('uid', '==', uid).get();
      
      if (!userQuery.empty) {
        const userDoc = userQuery.docs[0];
        await userDoc.ref.update({
          email: newEmail,
          previousEmail: oldEmail || userDoc.data().email,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: callerData.sfa_id || callerUid
        });
      }

      // 3. Update Firestore - users_by_uid collection
      await admin.firestore()
        .collection('users_by_uid')
        .doc(uid)
        .update({
          email: newEmail,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      // Log the action for audit trail
      await admin.firestore().collection('audit_logs').add({
        action: 'email_update',
        performedBy: callerUid,
        performedBySfaId: callerData.sfa_id,
        targetUid: uid,
        oldEmail: oldEmail,
        newEmail: newEmail,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      return { 
        success: true, 
        message: 'Email updated successfully in both Auth and Firestore',
        oldEmail: oldEmail,
        newEmail: newEmail
      };

    } catch (error: any) {
      console.error('Error updating email:', error);
      
      // Re-throw HttpsError as-is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      // Wrap other errors
      throw new functions.https.HttpsError(
        'internal',
        `Failed to update email: ${error.message}`
      );
    }
  }
);