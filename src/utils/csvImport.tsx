import { collection, writeBatch, doc } from "firebase/firestore";
import { firestore } from "../firebase";

interface TransactionRecord {
  srNo?: number;
  payDate?: string;
  lobby?: string;
  sfaId?: string;
  name?: string;
  cmsId?: string;
  receiver?: string;
  amount?: number;
  paymentMode?: string;
  remarks?: string;
  [key: string]: string | number | undefined;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors?: string;
}

/**
 * Imports CSV data to Firestore in batches
 */
export const importCSVToFirestore = async (
  csvData: TransactionRecord[],
  batchSize: number = 500
): Promise<ImportResult> => {
  try {
    let importedCount = 0;
    
    if (csvData.length === 0) {
      return { 
        success: false, 
        imported: 0, 
        errors: 'No valid records to import'
      };
    }
    
    // Process in batches
    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = writeBatch(firestore);
      const batchData = csvData.slice(i, i + batchSize);
      
      batchData.forEach((record) => {
        const docRef = doc(collection(firestore, "transactions"));
        batch.set(docRef, {
          ...record,
          createdAt: new Date(),
          importedAt: new Date()
        });
      });
      
      await batch.commit();
      importedCount += batchData.length;
      
      console.log(`Imported batch ${Math.floor(i / batchSize) + 1}: ${batchData.length} records`);
    }
    
    return { 
      success: true, 
      imported: importedCount
    };
    
  } catch (error) {
    console.error("Error importing CSV data:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return { 
      success: false, 
      imported: 0, 
      errors: errorMessage
    };
  }
};