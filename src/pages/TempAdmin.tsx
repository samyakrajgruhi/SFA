import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { firestore } from '@/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { initializeSfaCounter, getCurrentCounterValue } from '@/utils/generateSfaId';
import { AlertCircle, CheckCircle } from 'lucide-react';
import {requireAdmin} from '@/hooks/useAdminCheck';

const DatabaseCleanup = () => {
  const handleAdminAction = async () => {
    if(!requireAdmin(user,toast)) return;
  }
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializingCounter, setIsInitializingCounter] = useState(false);
  const [startingNumber, setStartingNumber] = useState('');
  const [currentCounter, setCurrentCounter] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch current counter value on mount
  useEffect(() => {
    const fetchCounter = async () => {
      try {
        const value = await getCurrentCounterValue();
        setCurrentCounter(value);
      } catch (error) {
        console.error('Error fetching counter:', error);
      }
    };
    fetchCounter();
  }, []);

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

  const handleInitializeCounter = async () => {
    if (!startingNumber || isNaN(Number(startingNumber))) {
      toast({
        title: 'Error',
        description: 'Please enter a valid starting number',
        variant: 'destructive'
      });
      return;
    }

    const numericValue = parseInt(startingNumber);
    
    if (numericValue < 0) {
      toast({
        title: 'Error',
        description: 'Starting number must be positive',
        variant: 'destructive'
      });
      return;
    }

    setIsInitializingCounter(true);
    try {
      await initializeSfaCounter(numericValue);
      
      toast({
        title: "Success",
        description: `SFA ID counter initialized at ${numericValue}. Next auto-generated ID will be SFA${(numericValue + 1).toString().padStart(4, '0')}`
      });

      // Update local state
      setCurrentCounter(numericValue);
      setStartingNumber('');
      
    } catch (error: any) {
      console.error("Error initializing counter:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to initialize counter",
        variant: "destructive"
      });
    } finally {
      setIsInitializingCounter(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Database Cleanup Card */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Database Cleanup</h2>
        <p className="mb-4 text-text-secondary">
          This will convert all role fields to boolean flags. Run this once only.
        </p>
        <Button 
          onClick={cleanupDatabase}
          disabled={isProcessing}
          variant="destructive"
        >
          {isProcessing ? 'Processing...' : 'Run Cleanup'}
        </Button>
      </Card>

      {/* SFA ID Counter Initialization */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Initialize SFA ID Counter</h2>
        
        {/* Current Status */}
        {currentCounter !== null ? (
          <div className="mb-6 p-4 bg-success-light border border-success rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success mt-0.5" />
            <div>
              <p className="font-semibold text-success">Counter Already Initialized</p>
              <p className="text-sm text-text-secondary mt-1">
                Current value: <span className="font-mono font-bold">SFA{currentCounter.toString().padStart(4, '0')}</span>
              </p>
              <p className="text-sm text-text-secondary">
                Next auto-generated ID: <span className="font-mono font-bold">SFA{(currentCounter + 1).toString().padStart(4, '0')}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-warning-light border border-warning rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <p className="font-semibold text-warning">Counter Not Initialized</p>
              <p className="text-sm text-text-secondary mt-1">
                Please initialize the counter with the latest manually assigned SFA ID number
              </p>
            </div>
          </div>
        )}

        {/* Initialization Form */}
        {currentCounter === null && (
          <>
            <div className="mb-4">
              <p className="text-text-secondary mb-2">
                Enter the <strong>number only</strong> from the latest SFA ID you've manually assigned.
              </p>
              <p className="text-sm text-text-muted mb-4">
                For example: If the latest assigned ID is <code className="bg-surface px-2 py-1 rounded">SFA1004</code>, enter <code className="bg-surface px-2 py-1 rounded">1004</code>
              </p>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Enter starting number (e.g., 1004)"
                    value={startingNumber}
                    onChange={(e) => setStartingNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleInitializeCounter()}
                    min="0"
                  />
                </div>
                <Button 
                  onClick={handleInitializeCounter}
                  disabled={isInitializingCounter || !startingNumber}
                >
                  {isInitializingCounter ? 'Initializing...' : 'Initialize'}
                </Button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-surface border border-border rounded-lg">
              <p className="text-sm font-semibold mb-2">⚠️ Important:</p>
              <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                <li>This should only be run ONCE during initial setup</li>
                <li>Make sure you enter the correct number</li>
                <li>After initialization, new users will get auto-generated IDs</li>
                <li>Existing users can still enter their pre-assigned IDs manually</li>
              </ul>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default DatabaseCleanup;