import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { firestore } from '@/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { initializeSfaCounter, getCurrentCounterValue } from '@/utils/generateSfaId';
import { migrateUsersToUidCollection } from '@/utils/migrateUsersToUidCollection';
import { AlertCircle, CheckCircle, Users } from 'lucide-react';
import { requireFounder } from '@/hooks/useFounderCheck';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { ArrowLeft } from 'lucide-react';

const DatabaseCleanup = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializingCounter, setIsInitializingCounter] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [startingNumber, setStartingNumber] = useState('');
  const [currentCounter, setCurrentCounter] = useState<number | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<{ done: boolean; count: number }>({ done: false, count: 0 });

  const isFounder = user?.isFounder;

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

  // Check if migration has been done
  useEffect(() => {
    const checkMigration = async () => {
      try {
        const uidUsersRef = collection(firestore, 'users_by_uid');
        const snapshot = await getDocs(uidUsersRef);
        setMigrationStatus({ done: snapshot.size > 0, count: snapshot.size });
      } catch (error) {
        console.error('Error checking migration status:', error);
      }
    };
    checkMigration();
  }, []);

  const handleMigration = async () => {
    if (!requireFounder(user, toast)) return;

    setIsMigrating(true);
    try {
      const result = await migrateUsersToUidCollection();
      
      if (result.success) {
        toast({
          title: 'Migration Successful',
          description: `Created ${result.count} users_by_uid documents`,
        });
        setMigrationStatus({ done: true, count: result.count });
      } else {
        toast({
          title: 'Migration Failed',
          description: result.errors.join(', '),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete migration',
        variant: 'destructive'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const cleanupDatabase = async () => {
    if (!requireFounder(user, toast)) return;

    setIsProcessing(true);
    try {
      const usersCollection = collection(firestore, 'users');
      const userSnapshot = await getDocs(usersCollection);
      
      const batch = [];
      userSnapshot.docs.forEach(userDoc => {
        const data = userDoc.data();
        const updateData: any = {};
        
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
    if (!requireFounder(user, toast)) return;

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
      setCurrentCounter(numericValue);
      
      toast({
        title: 'Success',
        description: `SFA ID counter initialized to ${numericValue}`
      });
      
      setStartingNumber('');
    } catch (error: any) {
      console.error('Error initializing counter:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to initialize counter',
        variant: 'destructive'
      });
    } finally {
      setIsInitializingCounter(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isFounder) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Founder Menu
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Database Management</h1>
            <p className="text-lg text-text-secondary">System initialization and maintenance tools</p>
          </div>

          {/* ✅ NEW: Users UID Migration */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Migrate Users for Security Rules</h2>
            </div>
            
            {migrationStatus.done ? (
              <div className="mb-6 p-4 bg-success-light border border-success rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <p className="font-semibold text-success">Migration Complete</p>
                  <p className="text-sm text-text-secondary mt-1">
                    {migrationStatus.count} user documents created in users_by_uid collection
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-warning-light border border-warning rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <p className="font-semibold text-warning">Migration Required</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Create users_by_uid collection for security rules to work properly
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                This creates a helper collection (users_by_uid) that allows Firestore security rules 
                to verify founder/admin status. This is required for permissions to work correctly.
              </p>
              
              <div className="p-4 bg-surface rounded-lg border border-border">
                <p className="text-sm font-semibold mb-2">⚠️ Important:</p>
                <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                  <li>Run this ONCE after updating Firestore rules</li>
                  <li>Creates users_by_uid/{'{'}uid{'}'} documents for each user</li>
                  <li>Required for founder/admin permission checks to work</li>
                  <li>Safe to run multiple times (will update existing documents)</li>
                </ul>
              </div>

              <Button 
                onClick={handleMigration}
                disabled={isMigrating}
                className="w-full"
              >
                {isMigrating ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                    Migrating...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    {migrationStatus.done ? 'Re-run Migration' : 'Run Migration'}
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Existing Database Cleanup Card */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Database Role Cleanup</h2>
            <p className="mb-4">
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

          {/* Existing SFA ID Counter Card */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Initialize SFA ID Counter</h2>
            
            {currentCounter !== null ? (
              <div className="mb-6 p-4 bg-success-light border border-success rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <p className="font-semibold text-success">Counter Already Initialized</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Current value: <span className="font-mono font-bold">SFA{currentCounter.toString().padStart(4, '0')}</span>
                  </p>
                  <p className="text-xs text-text-muted mt-2">
                    Next new user will get: SFA{(currentCounter + 1).toString().padStart(4, '0')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-warning-light border border-warning rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <p className="font-semibold text-warning">Counter Not Initialized</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Please initialize the counter before allowing new registrations
                  </p>
                </div>
              </div>
            )}

            {(!currentCounter || true) && (
              <>
                <Input
                  type="number"
                  placeholder="Enter starting SFA ID number (e.g., 1001)"
                  value={startingNumber}
                  onChange={(e) => setStartingNumber(e.target.value)}
                  className="mb-4"
                />
                <Button 
                  onClick={handleInitializeCounter}
                  disabled={isInitializingCounter || !startingNumber}
                  className="w-full"
                >
                  {isInitializingCounter ? 'Initializing...' : currentCounter ? 'Re-initialize Counter' : 'Initialize Counter'}
                </Button>

                <div className="mt-6 p-4 bg-surface rounded-lg border border-border">
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
      </main>
    </div>
  );
};

export default DatabaseCleanup;