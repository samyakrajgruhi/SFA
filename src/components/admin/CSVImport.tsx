import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { parseCSVData, importCSVToFirestore } from '@/utils/csvImport';
import { useToast } from '@/hooks/use-toast';

const CSVImport = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    imported?: number;
    total?: number;
  }>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive"
      });
      return;
    }

    try {
      setImporting(true);
      
      // Read the file content
      const text = await file.text();
      
      // Parse the CSV data
      const data = parseCSVData(text);
      
      // Import to Firestore
      const result = await importCSVToFirestore(data);
      
      setImportStatus({
        success: result.success,
        imported: result.imported,
        total: data.length
      });

      toast({
        title: result.success ? "Import Successful" : "Import Failed",
        description: result.success 
          ? `Successfully imported ${result.imported} records`
          : "Failed to import data. Check console for details.",
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      console.error("Error in import process:", error);
      toast({
        title: "Import Error",
        description: "An error occurred during import. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Payment Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="file"
                id="csv-file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="csv-file"
                className="flex items-center justify-center border-2 border-dashed border-border rounded-md p-6 cursor-pointer hover:border-primary transition-colors"
              >
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-text-muted mb-2" />
                  <span className="block text-sm font-medium text-text-primary">
                    {file ? file.name : "Click to select CSV file"}
                  </span>
                  <span className="text-xs text-text-secondary mt-1">
                    {file ? `${(file.size / 1024).toFixed(2)} KB` : "CSV files only"}
                  </span>
                </div>
              </label>
            </div>
            
            <Button 
              onClick={handleImport} 
              disabled={!file || importing}
              className="flex items-center gap-2"
            >
              {importing ? (
                <>
                  <div className="animate-spin h-4 w-4 rounded-full border-2 border-primary border-t-transparent" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>Import Data</span>
                </>
              )}
            </Button>
          </div>
          
          {importStatus.success !== undefined && (
            <Alert variant={importStatus.success ? "default" : "destructive"}>
              <div className="flex items-start">
                {importStatus.success ? (
                  <Check className="h-4 w-4 mt-0.5 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 mr-2" />
                )}
                <div>
                  <AlertTitle>
                    {importStatus.success ? "Import Successful" : "Import Failed"}
                  </AlertTitle>
                  <AlertDescription>
                    {importStatus.success
                      ? `Successfully imported ${importStatus.imported} out of ${importStatus.total} records.`
                      : "Failed to import data. Check the browser console for details."}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVImport;