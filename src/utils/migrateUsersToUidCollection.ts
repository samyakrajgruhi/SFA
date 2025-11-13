import { firestore } from '@/firebase';
import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';

export const migrateUsersToUidCollection = async (): Promise<{ success: boolean; count: number; errors: string[] }> => {
  try {
    console.log('🔄 Starting migration to users_by_uid collection...');
    
    const usersRef = collection(firestore, 'users');
    const snapshot = await getDocs(usersRef);
    
    const errors: string[] = [];
    let count = 0;
    
    // Process in batches of 500 (Firestore limit)
    const batchSize = 500;
    let batch = writeBatch(firestore);
    let batchCount = 0;
    
    for (const userDoc of snapshot.docs) {
      try {
        const userData = userDoc.data();
        
        if (!userData.uid) {
          errors.push(`Document ${userDoc.id} missing uid field`);
          continue;
        }
        
        // Create users_by_uid document
        const uidDocRef = doc(firestore, 'users_by_uid', userData.uid);
        batch.set(uidDocRef, {
          uid: userData.uid,
          sfa_id: userData.sfa_id || userDoc.id,
          isAdmin: userData.isAdmin || false,
          isFounder: userData.isFounder || false,
          isCollectionMember: userData.isCollectionMember || false,
          email: userData.email,
          full_name: userData.full_name,
          updatedAt: new Date()
        });
        
        batchCount++;
        count++;
        
        // Commit batch every 500 operations
        if (batchCount >= batchSize) {
          await batch.commit();
          console.log(`✅ Committed batch of ${batchCount} documents`);
          
          // ✅ Create NEW batch after committing
          batch = writeBatch(firestore);
          batchCount = 0;
        }
      } catch (error: any) {
        console.error(`Error processing user ${userDoc.id}:`, error);
        errors.push(`Error processing ${userDoc.id}: ${error.message}`);
      }
    }
    
    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Committed final batch of ${batchCount} documents`);
    }
    
    console.log(`✅ Migration complete! Processed ${count} users`);
    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} errors occurred:`, errors);
    }
    
    return { success: true, count, errors };
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return { success: false, count: 0, errors: [error.message] };
  }
};