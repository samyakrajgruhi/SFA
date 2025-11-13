import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { parseCSV } from '@/utils/csvParser';
import { importCSVToFirestore } from '@/utils/csvImport';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TransactionRecord {
  srno?: string;
  paydate?: string;
  lobby?: string;
  'SFA-id'?: string;
  sfaId?: string;
  Name?: string;
  name?: string;
  'CMS-id'?: string;
  cmsId?: string;
  reciever?: string;
  receiver?: string;
  amount?: string;
  payment_mode?: string;
  paymentMode?: string;
  remarks?: string;
}

interface NormalizedRecord {
  srNo: number;
  payDate: string;
  lobby: string;
  sfaId: string;
  name: string;
  cmsId: string;
  receiver: string;
  amount: number;
  paymentMode: string;
  remarks: string;
}

const TransactionImport: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<NormalizedRecord[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }
    
    setFileName(file.name);
    setImportSuccess(null);
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          const parsedData = parseCSV(csvContent);
          
          // Normalize the data
          const normalized = parsedData.map((record: TransactionRecord, index: number) => {
            const amountStr = record.amount?.toString().replace(/[₹,]/g, '') || '0';
            return {
              srNo: parseInt(record.srno || '') || index + 1,
              payDate: record.paydate || '',
              lobby: record.lobby || '',
              sfaId: record['SFA-id'] || record.sfaId || '',
              name: record.Name || record.name || '',
              cmsId: record['CMS-id'] || record.cmsId || '',
              receiver: record.reciever || record.receiver || '',
              amount: parseFloat(amountStr),
              paymentMode: record.payment_mode || record.paymentMode || '',
              remarks: record.remarks || ''
            };
          });
          
          // Filter valid records
          const validRecords = normalized.filter((record: NormalizedRecord) => 
            record.sfaId && record.payDate && record.lobby
          );
          
          setPreviewData(validRecords.slice(0, 5));
          setRecordCount(validRecords.length);
          
          toast({
            title: "File Loaded",
            description: `${validRecords.length} valid records found`
          });
        } catch (error) {
          console.error("Parse error:", error);
          toast({
            title: "Parse Error",
            description: "Failed to parse CSV file",
            variant: "destructive"
          });
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error("File read error:", error);
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    if (!fileName || previewData.length === 0) return;
    
    setIsLoading(true);
    setImportSuccess(null);
    
    try {
      const fileInput = document.getElementById('transaction-csv-file') as HTMLInputElement;
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        throw new Error("No file selected");
      }
      
      const file = fileInput.files[0];
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const csvContent = event.target?.result as string;
          const parsedData = parseCSV(csvContent);
          
          // Normalize the data for consistent field names
          const normalizedData = parsedData.map((record, index) => {
            const amountStr = record.amount?.toString().replace(/[₹,]/g, '') || '0';
            return {
              srNo: parseInt(record.srno) || index + 1,
              payDate: record.paydate || '',
              lobby: record.lobby || '',
              sfaId: record['SFA-id'] || record.sfaId || '',
              name: record.Name || record.name || '',
              cmsId: record['CMS-id'] || record.cmsId || '',
              receiver: record.reciever || record.receiver || '',
              amount: parseFloat(amountStr),
              paymentMode: record.payment_mode || record.paymentMode || '',
              remarks: record.remarks || ''
            };
          });
          
          // Filter out any records with missing essential fields
          const validRecords = normalizedData.filter(record => 
            record.sfaId && record.payDate && record.lobby
          );
          
          if (validRecords.length === 0) {
            toast({
              title: "No valid records",
              description: "No valid transaction records found in the CSV",
              variant: "destructive"
            });
            setIsLoading(false);
            return;
          }
          
          // Import to Firestore
          const result = await importCSVToFirestore(validRecords);
          
          if (result.success) {
            setImportSuccess(true);
            setImportedCount(result.imported);
            toast({
              title: "Import Successful",
              description: `${result.imported} transaction records have been imported`,
            });
          } else {
            setImportSuccess(false);
            toast({
              title: "Import Failed",
              description: result.errors || "There was an error importing your CSV data",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Import error:", error);
          setImportSuccess(false);
          toast({
            title: "Import Failed",
            description: "There was an error importing your CSV data",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error("Import error:", error);
      setImportSuccess(false);
      toast({
        title: "Import Failed",
        description: "There was an error importing your CSV data",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Import Transaction Data</CardTitle>
        <CardDescription>Upload a CSV file containing transaction records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* File Input */}
          <div className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:bg-surface-hover transition-colors">
            <input
              id="transaction-csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="transaction-csv-file" className="cursor-pointer flex flex-col items-center">
              <Upload className="h-10 w-10 text-text-muted mb-4" />
              <p className="mb-2 font-medium">
                {fileName ? (
                  <span className="text-primary flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    {fileName}
                  </span>
                ) : (
                  "Click to upload or drag and drop"
                )}
              </p>
              <p className="text-xs text-text-muted">CSV files only</p>
            </label>
          </div>
          
          {/* Preview data if available */}
          {previewData.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Preview (first 5 rows):</h3>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">SFA ID</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Pay Date</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Amount</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Lobby</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="px-3 py-2">{row.sfaId}</td>
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.payDate}</td>
                        <td className="px-3 py-2">{row.amount}</td>
                        <td className="px-3 py-2">{row.lobby}</td>
                        <td className="px-3 py-2">{row.paymentMode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Import result message */}
          {importSuccess === true && (
            <Alert variant="default" className="bg-success-light border-success">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertTitle>Import Successful</AlertTitle>
              <AlertDescription>
                Successfully imported {importedCount} transaction records to the database.
              </AlertDescription>
            </Alert>
          )}
          
          {importSuccess === false && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import Failed</AlertTitle>
              <AlertDescription>
                There was an error importing the CSV data. Please check your file format and try again.
              </AlertDescription>
            </Alert>
          )}
          
          {/* File format instructions */}
          <div className="bg-surface-hover p-4 rounded-lg">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-text-secondary" />
              Required CSV Format
            </h3>
            <p className="text-sm text-text-secondary mb-2">
              CSV should include: srno, paydate, lobby, SFA-id, Name, CMS-id, receiver, amount, payment_mode, remarks
            </p>
          </div>
          
          {recordCount > 0 && (
            <div>
              <p className="text-sm text-success flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {recordCount} records ready to import
              </p>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              onClick={handleImport} 
              disabled={!fileName || recordCount === 0 || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                  Importing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Import {recordCount} Transactions
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionImport;