import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Trash2, Search, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {requireFounder } from '@/hooks/useFounderCheck';

interface TransactionInfo {
  // TODO: Define the interface based on transaction fields
  id: string;
  transaction_id: string;
  sfaId: string;
  userName: string;
  amount: string;
  receiver: string;
  dateString: string;
  lobby: string;
  screenshotUrl?: string;
}

const DeleteTransaction = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isFounder = user?.isFounder;

  const handleFounderAction = async () => {
    if(!requireFounder(user,toast)) return;
  }
  
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [foundTransaction, setFoundTransaction] = useState<TransactionInfo | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
 

  const handleSearch = async () => {
    // 1. Validate input
    if (!searchId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a transaction ID',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSearching(true);
      
      // 2. Query transactions collection
      const transactionsRef = collection(firestore, 'transactions');
      const q = query(transactionsRef, where('transaction_id', '==', searchId.trim()));
      const querySnapshot = await getDocs(q);

      // 3. Check if found
      if (querySnapshot.empty) {
        toast({
          title: 'Not Found',
          description: 'No transaction found with this ID',
          variant: 'destructive'
        });
        setFoundTransaction(null);
        return;
      }

      // 4. Get transaction data
      const transactionDoc = querySnapshot.docs[0];
      const data = transactionDoc.data();
      
      setFoundTransaction({
        id: transactionDoc.id,
        transaction_id: data.transaction_id || transactionDoc.id,
        sfaId: data.sfaId || '',
        userName: data.userName || 'Unknown',
        amount: data.amount || '0',
        receiver: data.receiver || 'Unknown',
        dateString: data.dateString || '',
        lobby: data.lobby || '',
        screenshotUrl: data.screenshotUrl || ''
      });

    } catch (error) {
      console.error('Error searching transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for transaction',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  // TODO: Implement handleDelete function
  const handleDeleteTransaction = async () => {
    if (!foundTransaction) return;

    try {
      setIsDeleting(true);
      
      // Delete transaction document from Firestore
      await deleteDoc(doc(firestore, 'transactions', foundTransaction.id));
      
      toast({
        title: 'Success',
        description: `Transaction ${foundTransaction.transaction_id} has been deleted successfully`,
      });

      // Reset form
      setFoundTransaction(null);
      setSearchId('');
      setShowDeleteDialog(false);

    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transaction. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Redirect non-admins
  if (!isAuthenticated || !isFounder) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Menu
          </Button>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Trash2 className="w-16 h-16 text-destructive" />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4">Delete Transaction</h1>
            <p className="text-lg text-text-secondary">Remove a transaction record from the system</p>
            <div className="mt-4 p-4 bg-warning-light border border-warning rounded-dashboard">
              <p className="text-warning font-medium">
                ⚠️ Warning: This will permanently delete the transaction. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Search Transaction */}
          <Card className="p-6 mb-6">
            <CardHeader>
              <CardTitle>Search Transaction</CardTitle>
              <CardDescription>
                Enter the transaction ID (format: SFAXXXX_DDMMYYYY)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter Transaction ID (e.g., SFA1001_25122024)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          {foundTransaction && (
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-text-secondary">Transaction ID</p>
                    <p className="text-lg font-semibold text-primary font-mono">
                      {foundTransaction.transaction_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Amount</p>
                    <p className="text-lg font-semibold text-accent">₹{foundTransaction.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Payer Name</p>
                    <p className="text-lg font-semibold text-text-primary">{foundTransaction.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Payer SFA ID</p>
                    <p className="text-lg font-semibold text-primary">{foundTransaction.sfaId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Receiver</p>
                    <p className="text-lg font-semibold text-text-primary">{foundTransaction.receiver}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Date</p>
                    <p className="text-lg font-semibold text-text-primary">{foundTransaction.dateString}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Lobby</p>
                    <p className="text-lg font-semibold text-text-primary">{foundTransaction.lobby}</p>
                  </div>
                  {foundTransaction.screenshotUrl && (
                    <div>
                      <p className="text-sm text-text-secondary">Screenshot</p>
                      <a 
                        href={foundTransaction.screenshotUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View Screenshot
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Transaction
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    This action cannot be undone. This will permanently delete the transaction:
                  </p>
                  <p className="font-semibold text-text-primary">
                    {foundTransaction?.transaction_id}
                  </p>
                  <p className="text-sm text-text-muted">
                    Amount: ₹{foundTransaction?.amount} | Payer: {foundTransaction?.userName}
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTransaction}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete Transaction'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
};

export default DeleteTransaction;