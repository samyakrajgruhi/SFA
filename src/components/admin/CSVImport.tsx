import { firestore } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

// Parse date string to get date object and month/year for filtering
export const parseDateString = (dateString: string) => {
  if (!dateString) {
    const currentDate = new Date();
    return {
      date: currentDate,
      month: currentDate.getMonth(),
      year: currentDate.getFullYear()
    };
  }

  // Handle different date formats (e.g., "14-Sep-2025" or "14/09/2025")
  const monthMap: Record<string, number> = {
    'jan': 0, 'january': 0,
    'feb': 1, 'february': 1,
    'mar': 2, 'march': 2,
    'apr': 3, 'april': 3,
    'may': 4, 'may': 4,
    'jun': 5, 'june': 5,
    'jul': 6, 'july': 6,
    'aug': 7, 'august': 7,
    'sep': 8, 'september': 8,
    'oct': 9, 'october': 9,
    'nov': 10, 'november': 10,
    'dec': 11, 'december': 11
  };

  // Try to parse date with format "DD-MMM-YYYY" (e.g., "14-Sep-2025")
  const dashParts = dateString.split('-');
  if (dashParts.length === 3) {
    const day = parseInt(dashParts[0]);
    const monthPart = dashParts[1].toLowerCase();
    const year = parseInt(dashParts[2]);
    
    let month = -1;
    for (const [key, value] of Object.entries(monthMap)) {
      if (monthPart.startsWith(key)) {
        month = value;
        break;
      }
    }
    
    if (month !== -1 && !isNaN(day) && !isNaN(year)) {
      const date = new Date(year, month, day);
      return { date, month, year };
    }
  }

  // Try to parse date with format "DD/MM/YYYY"
  const slashParts = dateString.split('/');
  if (slashParts.length === 3) {
    const day = parseInt(slashParts[0]);
    const month = parseInt(slashParts[1]) - 1; // Month is 0-indexed
    const year = parseInt(slashParts[2]);
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      return { date, month, year };
    }
  }

  // Default to current date if parsing fails
  const currentDate = new Date();
  return {
    date: currentDate,
    month: currentDate.getMonth(),
    year: currentDate.getFullYear()
  };
};

// Generate a unique date-based ID for documents
const getDateDigits = (dateString: string): string => {
  const { date } = parseDateString(dateString);
  const day = date.getDate().toString().padStart(2,'0');
  const month = (date.getMonth() + 1).toString().padStart(2,'0');
  const year = date.getFullYear();
  return `${date}${month}${year}`;
};

// Process amount string to extract the numeric value
const processAmountString = (amountStr: string): number => {
  if (!amountStr) return 0;
  
  // Remove currency symbols and non-numeric characters except decimal point
  const cleanedAmount = amountStr.replace(/[^\d.]/g, '');
  const amount = parseFloat(cleanedAmount);
  return isNaN(amount) ? 0 : amount;
};

// Interface for transaction records
export interface PaymentRecord {
  srno: string;
  payDate: string;
  lobby: string;
  sfaId: string;
  name: string;
  cmsId: string;
  receiver: string;
  amount: string | number;
  paymentMode: string;
  remarks: string;
}

// Import CSV data to Firestore
export const importCSVToFirestore = async (
  csvData: PaymentRecord[],
  batchSize: number = 500
): Promise<{ success: boolean; imported: number; errors?: any }> => {
  try {
    const totalRecords = csvData.length;
    let importedCount = 0;
    
    const collectionName = 'transactions';
    
    // Process in batches to avoid Firestore limits
    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = writeBatch(firestore);
      const recordsSlice = csvData.slice(i, i + batchSize);
      
      recordsSlice.forEach(record => {
        // Skip records without SFA ID or payDate
        if (!record.sfaId || !record.payDate) return;
        
        // Parse the date to get month, year, and Date object
        const { date, month, year } = parseDateString(record.payDate);
        
        // Creating document ID in format: SfaId_DDMMYYYY
        const dateDigits = getDateDigits(record.payDate);
        const docId = `${record.sfaId}_${dateDigits}`;

        // Process amount (remove currency symbol, convert to number)
        const numericAmount = typeof record.amount === 'string' 
          ? processAmountString(record.amount)
          : record.amount;

        const docRef = doc(collection(firestore, collectionName), docId);

        batch.set(docRef, {
          sfaId: record.sfaId,
          lobby: record.lobby,
          amount: numericAmount,
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
    console.error("Error importing CSV to Firestore:", error);
    return { success: false, imported: 0, errors: error.message };
  }
};