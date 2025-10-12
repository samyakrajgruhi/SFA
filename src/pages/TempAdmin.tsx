import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { firestore } from '@/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const DatabaseCleanup = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const cleanupDatabase = async () => {
    setIsProcessing(true);
    try {
      const usersCollection = collection(firestore, 'users');
      const userSnapshot = await getDocs(usersCollection);
      
      const batch = [];
      userSnapshot.docs.forEach(userDoc => {
        const data = userDoc.data();
        const updateData: any = {};
        
        // Convert role to boolean flags
        if (data.role === 'admin') {
          updateData.isAdmin = true;
          updateData.isCollectionMember = false;
        } else if (data.role === 'collection') {
          updateData.isAdmin = false;
          updateData.isCollectionMember = true;
        } else {
          updateData.isAdmin = false;
          updateData.isCollectionMember = false;
        }
        
        batch.push(updateDoc(doc(firestore, 'users', userDoc.id), updateData));
      });
      
      await Promise.all(batch);
      
      toast({
        title: "Success",
        description: "Database cleanup completed successfully"
      });
    } catch (error) {
      console.error("Error during cleanup:", error);
      toast({
        title: "Error",
        description: "Database cleanup failed",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Database Cleanup</h2>
      <p className="mb-4">This will convert all role fields to boolean flags. Run this once only.</p>
      <Button 
        onClick={cleanupDatabase}
        disabled={isProcessing}
        variant="destructive"
      >
        {isProcessing ? 'Processing...' : 'Run Cleanup'}
      </Button>
    </Card>
  );
};

export default DatabaseCleanup;