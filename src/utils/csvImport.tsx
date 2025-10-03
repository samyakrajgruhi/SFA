import { firestore } from '@/firebase';
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

// Helper function to extract month shortform from date
const getMonthShortform = (dateString: string): string => {
  // Handle date format like "14-Sep-2025"
  const months: Record<string, string> = {
    'jan': 'jan',
    'feb': 'feb',
    'mar': 'mar',
    'apr': 'apr',
    'may': 'may',
    'jun': 'jun',
    'jul': 'jul',
    'aug': 'aug',
    'sep': 'sept',
    'oct': 'oct',
    'nov': 'nov',
    'dec': 'dec'
  };

  // Extract month from date string
  const parts = dateString.split('-');
  if (parts.length >= 2) {
    const monthPart = parts[1].toLowerCase();
    for (const [key, value] of Object.entries(months)) {
      if (monthPart.startsWith(key)) {
        return value;
      }
    }
  }

  // Default to current month if parsing fails
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sept', 'oct', 'nov', 'dec'];
  return monthNames[currentMonth];
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
    
    // Determine month from data (use first record's date)
    const month = csvData.length > 0 ? getMonthShortform(csvData[0].payDate) : getMonthShortform('');
    const collectionName = `transactions_${month}`;
    
    console.log(`Importing to collection: ${collectionName}`);
    
    // Process in batches to avoid Firestore limits
    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = writeBatch(firestore);
      const recordsSlice = csvData.slice(i, i + batchSize);
      
      recordsSlice.forEach(record => {
        // Use just the SFA ID as the document ID
        const docId = record.sfaId;
        const docRef = doc(collection(firestore, collectionName), docId);
        batch.set(docRef, {
          payDate: record.payDate,
          lobby: record.lobby,
          sfaId: record.sfaId,
          name: record.name,
          cmsId: record.cmsId,
          receiver: record.receiver,
          amount: record.amount,
          paymentMode: record.paymentMode,
          remarks: record.remarks || '',
          createdAt: new Date(),
          importedFrom: 'csv'
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