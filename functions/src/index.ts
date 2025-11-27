import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

interface UpdateEmailData {
  uid: string;
  newEmail: string;
  oldEmail?: string;
}

interface DeleteUserData {
  uid: string;
  sfaId: string;
  reason?: string;
}

// Function to completely delete a user (Auth + Document)
export const deleteUserAccount = functions.https.onCall(
  { region: 'asia-southeast2', cors: true },
  async (request) => {
    // 1. Check authentication
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    // 2. Check if caller is founder
    const callerDoc = await admin.firestore()
      .collection('users_by_uid')
      .doc(request.auth.uid)
      .get();
    
    if (!callerDoc.exists || !callerDoc.data()?.isFounder) {
      throw new functions.https.HttpsError('permission-denied', 'Only founders can delete users');
    }

    // 3. Delete user
    const data = request.data as DeleteUserData;
    const { uid, sfaId, reason } = data;

    // Validate inputs
    if (!uid || !sfaId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'UID and SFA ID are required'
      );
    }

    try {
      const callerData = callerDoc.data();

      // Get user data before deletion for audit log
      const userQuery = await admin.firestore()
        .collection('users')
        .where('uid', '==', uid)
        .get();
      
      let userData: any = null;
      if (!userQuery.empty) {
        userData = userQuery.docs[0].data();
      }

      // Delete from Firebase Auth
      try {
        await admin.auth().deleteUser(uid);
        console.log(`✅ Deleted auth user: ${uid}`);
      } catch (authError: any) {
        if (authError.code !== 'auth/user-not-found') {
          console.error('Error deleting auth user:', authError);
          throw new functions.https.HttpsError(
            'internal',
            `Failed to delete authentication account: ${authError.message}`
          );
        }
        console.warn(`⚠️ Auth user not found: ${uid}, continuing with Firestore deletion`);
      }

      // Delete from Firestore - users collection
      if (!userQuery.empty) {
        await userQuery.docs[0].ref.delete();
        console.log(`✅ Deleted users document: ${userQuery.docs[0].id}`);
      }

      // Delete from Firestore - users_by_uid collection
      const uidDocRef = admin.firestore().collection('users_by_uid').doc(uid);
      const uidDoc = await uidDocRef.get();
      
      if (uidDoc.exists) {
        await uidDocRef.delete();
        console.log(`✅ Deleted users_by_uid document: ${uid}`);
      }

      // Log the deletion for audit trail
      await admin.firestore().collection('audit_logs').add({
        action: 'user_deleted',
        performedBy: callerDoc.id,
        performedBySfaId: callerData?.sfa_id || 'unknown',
        targetUid: uid,
        targetSfaId: sfaId,
        targetEmail: userData?.email || 'unknown',
        targetName: userData?.full_name || 'unknown',
        reason: reason || 'No reason provided',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      return { 
        success: true, 
        message: 'User account deleted successfully (Auth + Firestore)',
        deletedUid: uid,
        deletedSfaId: sfaId
      };

    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      // Re-throw HttpsError as-is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      // Wrap other errors
      throw new functions.https.HttpsError(
        'internal',
        `Failed to delete user: ${error.message}`
      );
    }
  }
);

// Cloud Function to update user email 
export const updateUserEmail = functions.https.onCall(
    {
    region: 'asia-southeast2',
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