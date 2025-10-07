import { firestore } from '@/firebase';
import { dataTagErrorSymbol } from '@tanstack/react-query';
import { collection, writeBatch, doc } from 'firebase/firestore';

interface PaymentRecord {
  srNo: number;
  payDate: string;
  lobby: string;
  sfaId: string;
  name: string;
  cmsId: string;
  receiver: string;
  amount: number;
  paymentMode: string;
  remarks?: string;
}

// Helper function to parse date and extract month/year
const parseDateString = (dateString: string): { date: Date; month: number; year: number } => {
  // Handle date format like "14-Sep-2025"
  const monthMap: Record<string, number> = {
    'jan': 0, 'january': 0,
    'feb': 1, 'february': 1,
    'mar': 2, 'march': 2,
    'apr': 3, 'april': 3,
    'may': 4,
    'jun': 5, 'june': 5,
    'jul': 6, 'july': 6,
    'aug': 7, 'august': 7,
    'sep': 8, 'sept': 8, 'september': 8,
    'oct': 9, 'october': 9,
    'nov': 10, 'november': 10,
    'dec': 11, 'december': 11
  };

  const parts = dateString.split('-');
  const currentDate = new Date();

  if (parts.length >= 3) {
    const day = parseInt(parts[0]);
    const monthPart = parts[1].toLowerCase();
    const year = parseInt(parts[2]);
    
    let month = currentDate.getMonth();
    for (const [key, value] of Object.entries(monthMap)) {
      if (monthPart.startsWith(key)) {
        month = value;
        break;
      }
    }
    
    const date = new Date(year, month, day);
    return { date, month, year };
  }

  // Default to current date if parsing fails
  return {
    date: currentDate,
    month: currentDate.getMonth(),
    year: currentDate.getFullYear()
  };
};

const getDateDigits = (dateString:string ) : string =>{
  const { date } = parseDateString(dateString);
   const day = date.getDate().toString().padStart(2,'0');
   const month = (date.getMonth() + 1).toString().padStart(2,'0');
   const year = date.getFullYear();
   return `${day}${month}${year}`;
};

export const parseCSVData = (csvContent: string): PaymentRecord[] => {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).filter(line => line.trim()).map((line, index) => {
    const values = line.split(',');
    const record: Record<string, any> = {};
    
    headers.forEach((header, i) => {
      let value = values[i]?.trim() || '';
      
      // Handle amount - remove currency symbol and convert to number
      if (header.toLowerCase().includes('amount')) {
        value = value.replace(/[₹,]/g, '');
        record[header.trim()] = parseFloat(value);
      } else {
        record[header.trim()] = value;
      }
    });
    
    return {
      srNo: parseInt(record['Sr.no'] || index + 1),
      payDate: record['Pay Date'] || '',
      lobby: record['Lobby'] || '',
      sfaId: record['SFA id'] || '',
      name: record['name'] || '',
      cmsId: record['cms id'] || '',
      receiver: record['receiver'] || '',
      amount: record['amount'] || 0,
      paymentMode: record['payment mode'] || '',
      remarks: record['remarks'] || ''
    };
  });
};

export const importCSVToFirestore = async (
  csvData: PaymentRecord[],
  batchSize: number = 500
): Promise<{ success: boolean; imported: number; errors?: any }> => {
  try {
    const totalRecords = csvData.length;
    let importedCount = 0;
    
    const collectionName = 'transactions';

    console.log(`Importing to collection: ${collectionName}`);
    
    // Process in batches to avoid Firestore limits
    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = writeBatch(firestore);
      const recordsSlice = csvData.slice(i, i + batchSize);
      
      recordsSlice.forEach(record => {
        // Parse the date to get month, year, and Date object
        const { date, month, year } = parseDateString(record.payDate);
        
        // Creating document ID in format : SfaId_dateDigits
        const dateDigits = getDateDigits(record.payDate);
        const docId = `${record.sfaId}_${dateDigits}`;

        const docRef = doc(collection(firestore, collectionName), docId);

        batch.set(docRef, {
          sfaId: record.sfaId,
          lobby: record.lobby,
          amount: record.amount,
          date: date, // JavaScript Date object
          dateString: record.payDate, // Original string for display
          month: month, // 0-11
          year: year, // Full year number
          mode: record.paymentMode,
          remarks: record.remarks || '',
          receiver: record.receiver,
          createdAt: new Date(),
        });
      });
      
      await batch.commit();
      importedCount += recordsSlice.length;
    }
    
    return { success: true, imported: importedCount };
  } catch (error) {
    console.error("Error importing CSV data:", error);
    return { success: false, imported: 0, errors: error };
  }
};