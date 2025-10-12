import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, UserPlus, AlertCircle } from 'lucide-react';
import { firestore } from '@/firebase';
import { collection, doc, writeBatch, getFirestore } from 'firebase/firestore';
import { parseCSV } from '@/utils/csvParser';

interface MemberData {
  cmsid: string;
  email: string;
  emergency_number: string;
  full_name: string;
  lobby_id: string;
  phone_number: string;
  role: string;
  sfa_id: string;
}

const MemberImport: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [memberData, setMemberData] = useState<MemberData[]>([]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setFileName(null);
      setMemberData([]);
      return;
    }
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file containing member data",
        variant: "destructive"
      });
      return;
    }
    
    setFileName(file.name);
    
    // Read and parse the CSV file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string;
        const parsedData = parseCSV(csvContent);
        
        // Validate member data format
        const requiredFields = ['cmsid', 'email', 'full_name', 'lobby_id', 'sfa_id'];
        const isValidFormat = parsedData.length > 0 && 
          requiredFields.every(field => 
            Object.keys(parsedData[0]).some(header => 
              header.toLowerCase() === field
            )
          );
        
        if (!isValidFormat) {
          toast({
            title: "Invalid CSV format",
            description: "The CSV file does not have the required columns for member data",
            variant: "destructive"
          });
          setFileName(null);
          return;
        }
        
        // Normalize field names to match our schema
        const normalizedData = parsedData.map(row => {
          const member: Partial<MemberData> = {};
          
          Object.entries(row).forEach(([key, value]) => {
            const lowercaseKey = key.toLowerCase();
            if (lowercaseKey === 'cmsid') member.cmsid = value;
            else if (lowercaseKey === 'email') member.email = value;
            else if (lowercaseKey === 'emergency_number') member.emergency_number = value;
            else if (lowercaseKey === 'full_name') member.full_name = value;
            else if (lowercaseKey === 'lobby_id') member.lobby_id = value;
            else if (lowercaseKey === 'phone_number') member.phone_number = value;
            else if (lowercaseKey === 'role') member.role = value;
            else if (lowercaseKey === 'sfa_id') member.sfa_id = value;
          });
          
          return member as MemberData;
        });
        
        setMemberData(normalizedData);
        
        toast({
          title: "CSV file loaded",
          description: `Found ${normalizedData.length} members in the CSV file`,
        });
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast({
          title: "Error parsing CSV",
          description: "The CSV file could not be parsed correctly",
          variant: "destructive"
        });
        setFileName(null);
      }
    };
    
    reader.readAsText(file);
  };
  
  const handleImport = async () => {
    if (!fileName || memberData.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // Batch write to Firestore
      const batchSize = 500; // Firestore batch limit
      
      for (let i = 0; i < memberData.length; i += batchSize) {
        const batch = writeBatch(firestore);
        const membersSlice = memberData.slice(i, i + batchSize);
        
        membersSlice.forEach(member => {
          if (!member.sfa_id) return;
          
          const docRef = doc(collection(firestore, 'users'), member.sfa_id);
          batch.set(docRef, {
            cms_id: member.cmsid,
            email: member.email,
            emergency_number: member.emergency_number,
            full_name: member.full_name,
            lobby_id: member.lobby_id,
            phone_number: member.phone_number,
            isAdmin: member.role === 'admin',
            isCollectionMember: member.role === 'collection',
            sfa_id: member.sfa_id,
            createdAt: new Date()
          });
        });
        
        await batch.commit();
        console.log(`Imported batch ${Math.floor(i / batchSize) + 1}`);
      }
      
      toast({
        title: "Import successful",
        description: `Successfully imported ${memberData.length} members`,
      });
      
      // Reset state
      setFileName(null);
      setMemberData([]);
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "There was an error importing member data to Firestore",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Members</CardTitle>
        <CardDescription>
          Upload a CSV file to import member data into the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-surface transition-colors"
               onClick={() => document.getElementById('member-csv-input')?.click()}>
            <input
              type="file"
              id="member-csv-input"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <FileText className="h-10 w-10 mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-muted mb-1">
              {fileName ? (
                <span className="text-text-primary font-medium">{fileName}</span>
              ) : (
                "Upload member data CSV file"
              )}
            </p>
            <p className="text-xs text-text-muted">
              CSV should include: cmsid, email, full_name, lobby_id, sfa_id, etc.
            </p>
          </div>
          
          {memberData.length > 0 && (
            <div>
              <p className="text-sm text-success flex items-center gap-1">
                <UserPlus className="h-4 w-4" />
                {memberData.length} members ready to import
              </p>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              onClick={handleImport} 
              disabled={!fileName || memberData.length === 0 || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                  Importing...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Import {memberData.length} Members
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberImport;