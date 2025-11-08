import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '@/firebase';

export interface BeneficiaryRequest {
  id?: string;
  userId: string;
  userName: string;
  sfaId: string;
  cmsId: string;
  lobby: string;
  email: string;
  phoneNumber: string;
  description: string;
  verificationDocUrl?: string;
  paySlipUrl?: string;
  applicationFormUrl?: string;  // ✅ NEW
  status: 'pending' | 'approved' | 'rejected';
  approvalCount: number;
  totalApprovals: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  approvedBy?: string[];
  rejectedBy?: string[];
}

export interface BeneficiaryApproval {
  requestId: string;
  adminSfaId: string;
  adminName: string;
  action: 'approved' | 'rejected';
  remarks?: string;
  timestamp: Date | Timestamp;
}

// Upload file to Firebase Storage
export const uploadBeneficiaryDocument = async (
  file: File,
  requestId: string,
  type: 'verification' | 'payslip' | 'application'  // ✅ UPDATED
): Promise<string> => {
  const timestamp = Date.now();
  const fileName = `${requestId}_${type}_${timestamp}_${file.name}`;
  const storageRef = ref(storage, `beneficiary_documents/${fileName}`);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
};

// ✅ UPDATED: Create new beneficiary request
export const createBeneficiaryRequest = async (
  requestData: Omit<BeneficiaryRequest, 'id' | 'createdAt' | 'updatedAt' | 'approvalCount' | 'totalApprovals' | 'status'>,
  verificationDoc: File,
  paySlip: File,
  applicationForm: File  // ✅ NEW
): Promise<string> => {
  try {
    // Get total number of admins for approval calculation
    const usersRef = collection(firestore, 'users');
    const adminsQuery = query(usersRef, where('isAdmin', '==', true));
    const adminsSnapshot = await getDocs(adminsQuery);
    const totalAdmins = adminsSnapshot.size;

    // Create initial request document
    const requestsRef = collection(firestore, 'beneficiary_requests');
    const docRef = await addDoc(requestsRef, {
      ...requestData,
      status: 'pending',
      approvalCount: 0,
      totalApprovals: totalAdmins,
      approvedBy: [],
      rejectedBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Upload documents
    const verificationUrl = await uploadBeneficiaryDocument(verificationDoc, docRef.id, 'verification');
    const paySlipUrl = await uploadBeneficiaryDocument(paySlip, docRef.id, 'payslip');
    const applicationFormUrl = await uploadBeneficiaryDocument(applicationForm, docRef.id, 'application');  // ✅ NEW

    // Update request with document URLs
    await updateDoc(doc(firestore, 'beneficiary_requests', docRef.id), {
      verificationDocUrl: verificationUrl,
      paySlipUrl: paySlipUrl,
      applicationFormUrl: applicationFormUrl  // ✅ NEW
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating beneficiary request:', error);
    throw error;
  }
};

// Get all beneficiary requests (for admin)
export const getAllBeneficiaryRequests = async (): Promise<BeneficiaryRequest[]> => {
  try {
    const requestsRef = collection(firestore, 'beneficiary_requests');
    const q = query(requestsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as BeneficiaryRequest[];
  } catch (error) {
    console.error('Error fetching beneficiary requests:', error);
    throw error;
  }
};

// Get user's beneficiary requests
export const getUserBeneficiaryRequests = async (userId: string): Promise<BeneficiaryRequest[]> => {
  try {
    const requestsRef = collection(firestore, 'beneficiary_requests');
    const q = query(requestsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as BeneficiaryRequest[];
  } catch (error) {
    console.error('Error fetching user requests:', error);
    throw error;
  }
};

// Admin approves/rejects request
export const processApproval = async (
  requestId: string,
  adminSfaId: string,
  adminName: string,
  action: 'approved' | 'rejected',
  remarks?: string
): Promise<void> => {
  try {
    const requestRef = doc(firestore, 'beneficiary_requests', requestId);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) {
      throw new Error('Request not found');
    }

    const requestData = requestDoc.data() as BeneficiaryRequest;

    // Check if admin already approved/rejected
    if (requestData.approvedBy?.includes(adminSfaId) || requestData.rejectedBy?.includes(adminSfaId)) {
      throw new Error('You have already processed this request');
    }

    // Record approval/rejection
    const approvalsRef = collection(firestore, 'beneficiary_approvals');
    await addDoc(approvalsRef, {
      requestId,
      adminSfaId,
      adminName,
      action,
      remarks: remarks || '',
      timestamp: serverTimestamp()
    });

    // Update request document
    const updates = {
      updatedAt: serverTimestamp()
    };

    if (action === 'approved') {
      updates.approvedBy = [...(requestData.approvedBy || []), adminSfaId];
      updates.approvalCount = (requestData.approvalCount || 0) + 1;

      // Check if all admins have approved
      if (updates.approvalCount >= requestData.totalApprovals) {
        updates.status = 'approved';
      }
    } else {
      updates.rejectedBy = [...(requestData.rejectedBy || []), adminSfaId];
      updates.status = 'rejected'; // One rejection = rejected
    }

    await updateDoc(requestRef, updates);
  } catch (error) {
    console.error('Error processing approval:', error);
    throw error;
  }
};

// Get approval history for a request
export const getApprovalHistory = async (requestId: string): Promise<BeneficiaryApproval[]> => {
  try {
    const approvalsRef = collection(firestore, 'beneficiary_approvals');
    const q = query(approvalsRef, where('requestId', '==', requestId), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    })) as BeneficiaryApproval[];
  } catch (error) {
    console.error('Error fetching approval history:', error);
    throw error;
  }
};