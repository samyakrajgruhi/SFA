import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { firestore } from '@/firebase';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Interface for collection member data
interface CollectionMember {
  id: string;
  name: string;
  lobby: string;
  sfaId: string;
  cmsId: string;
}

const Payment = () => {
  const { user, isAuthenticated, isLoading: authLoading, isDataLoaded } = useAuth();
  const { toast } = useToast();
  const [collectionMembers, setCollectionMembers] = useState<CollectionMember[]>([]);
  const [selectedCollector, setSelectedCollector] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [amounts, setAmounts] = useState<number[]>([25, 500]);
  const [isLoadingAmounts, setIsLoadingAmounts] = useState(true);
  const navigate = useNavigate();

  // ✅ CRITICAL: Validate user data is fully loaded
  const isUserDataValid = () => {
    return (
      isDataLoaded &&
      user?.sfaId &&
      user.sfaId !== 'SFA000' &&
      user?.name &&
      user.name !== 'User Name' &&
      user?.cmsId &&
      user.cmsId !== 'CMS00000'
    );
  };

  // ✅ Monitor user data loading
  useEffect(() => {
    if (authLoading || !isDataLoaded) {
      console.log('⏳ Waiting for user data to load...');
      return;
    }

    if (!isAuthenticated) {
      console.log('❌ User not authenticated');
      return;
    }

    if (!isUserDataValid()) {
      console.error('⚠️ WARNING: User data incomplete!', {
        sfaId: user?.sfaId,
        name: user?.name,
        cmsId: user?.cmsId,
        isDataLoaded
      });
      return;
    }

    console.log('✅ User data validated:', {
      sfaId: user.sfaId,
      name: user.name,
      cmsId: user.cmsId
    });
  }, [authLoading, isDataLoaded, isAuthenticated, user]);

  useEffect(() => {
    const fetchPaymentAmounts = async () => {
      try {
        setIsLoadingAmounts(true);
        const configDoc = await getDoc(doc(firestore, 'config', 'payment_amounts'));

        if (configDoc.exists()) {
          const data = configDoc.data();
          setAmounts(data.amounts || [25, 500]);
        } else {
          setAmounts([25, 500]);
        }
      } catch (error) {
        console.error("Error fetching payment amounts:", error);
        setAmounts([25, 500]);
      } finally {
        setIsLoadingAmounts(false);
      }
    };

    fetchPaymentAmounts();
  }, []);

  // Fetch collection members only when user data is valid
  useEffect(() => {
    const fetchCollectionMembers = async () => {
      // ✅ Don't fetch until user data is fully validated
      if (!isUserDataValid()) {
        console.log('⏳ Skipping collection members fetch - user data not ready');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log('🔄 Fetching collection members...');
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('isCollectionMember', '==', true));
        const querySnapshot = await getDocs(q);

        const members: CollectionMember[] = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          members.push({
            id: doc.id,
            name: data.full_name || 'Unknown',
            lobby: data.lobby_id || 'Unknown',
            sfaId: data.sfa_id || 'SFAXXXX',
            cmsId: data.cms_id || 'CMSXXXX'
          });
        });

        console.log('✅ Fetched collection members:', members.length);
        setCollectionMembers(members);
      } catch (error) {
        console.error("❌ Error fetching collection members:", error);
        toast({
          title: "Error",
          description: "Failed to load collection members. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && isDataLoaded) {
      fetchCollectionMembers();
    }
  }, [isAuthenticated, isDataLoaded, user, toast]);

  const handleProceedToPay = () => {
    if (!selectedCollector || !selectedAmount) {
      toast({
        title: "Error",
        description: "Please select both collection member and amount",
        variant: "destructive"
      });
      return;
    }

    // ✅ CRITICAL: Final validation before proceeding
    if (!isUserDataValid()) {
      console.error('⚠️ Cannot proceed - invalid user data:', user);
      toast({
        title: "Error",
        description: "Your profile data is incomplete. Please refresh and ensure all details are loaded.",
        variant: "destructive"
      });
      return;
    }

    const selectedMember = collectionMembers.find(m => m.id === selectedCollector);
    
    if (!selectedMember) {
      toast({
        title: "Error",
        description: "Selected collection member not found",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ Proceeding to payment with validated data:', {
      payer: {
        sfaId: user.sfaId,
        name: user.name,
        cmsId: user.cmsId
      },
      collector: {
        sfaId: selectedMember.sfaId,
        name: selectedMember.name
      },
      amount: selectedAmount
    });

    navigate('/payment-confirm', {
      state: {
        collectorId: selectedMember.id,
        collectorName: selectedMember.name,
        collectorSfaId: selectedMember.sfaId,
        collectorCmsId: selectedMember.cmsId,
        collectorLobby: selectedMember.lobby,
        amount: selectedAmount,
        payerSfaId: user.sfaId,
        payerName: user.name,
        payerCmsId: user.cmsId,
        payerLobby: user.lobby
      }
    });
  };

  // ✅ Loading state while fetching user data
  if (authLoading || !isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div>
            <p className="text-lg text-text-primary font-semibold">Loading Your Profile</p>
            <p className="text-sm text-text-secondary mt-2">Please wait while we fetch your data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Show error if user data is invalid/incomplete
  if (!isUserDataValid()) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20">
          <div className="max-w-2xl mx-auto px-6 py-12">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="text-lg font-semibold">Profile Data Incomplete</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-4">
                  Your user data hasn't loaded properly. This could be due to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm mb-4">
                  <li>Network connectivity issues</li>
                  <li>Ad blocker interference with Firebase</li>
                  <li>Recent registration (data sync in progress)</li>
                  <li>Browser cache issues</li>
                </ul>
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold">Current Status:</p>
                  <div className="text-xs font-mono bg-background/50 p-2 rounded">
                    <p>SFA ID: {user?.sfaId || '❌ Not Loaded'}</p>
                    <p>Name: {user?.name || '❌ Not Loaded'}</p>
                    <p>CMS ID: {user?.cmsId || '❌ Not Loaded'}</p>
                    <p>Data Loaded: {isDataLoaded ? '✅ Yes' : '❌ No'}</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Card className="p-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-text-primary">What to do?</h2>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => window.location.reload()}
                    className="w-full"
                    size="lg"
                  >
                    Refresh Page
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/user-info')}
                    className="w-full"
                    size="lg"
                  >
                    Check Profile Page
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="w-full"
                  >
                    Go to Home
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-warning-light border border-warning rounded-lg">
                  <p className="text-sm text-warning font-semibold">
                    ⚠️ Do not attempt to make payments until this is resolved to prevent data errors.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Make a Payment</h1>
            <p className="text-lg text-text-secondary">Select collection member and amount to contribute</p>
            
            {/* ✅ Show confirmation that data is loaded */}
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-success-light text-success rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              Profile Loaded: {user.sfaId}
            </div>
          </div>

          {/* Payment Form */}
          <Card className="p-8 space-y-6">
            {/* Collection Member Selection */}
            <div className="space-y-4">
              <label className="text-lg font-semibold text-text-primary">
                Collection Member
              </label>
              <Select 
                value={selectedCollector} 
                onValueChange={setSelectedCollector} 
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoading ? "Loading collection members..." : "Select collection member"} />
                </SelectTrigger>
                <SelectContent>
                  {collectionMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.lobby} ({member.sfaId})
                    </SelectItem>
                  ))}
                  
                  {collectionMembers.length === 0 && !isLoading && (
                    <div className="p-2 text-center text-text-muted">
                      No collection members found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Selection */}
            <div className="space-y-4">
              <label className="text-lg font-semibold text-text-primary">
                Amount (₹)
              </label>
              {isLoadingAmounts ? (
                <div className="text-center py-4 text-text-secondary">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {amounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setSelectedAmount(amount.toString())}
                      className={`p-4 rounded-dashboard border-2 transition-all duration-200 ${
                        selectedAmount === amount.toString()
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-border hover:border-primary hover:bg-surface-hover text-text-secondary'
                      }`}
                    >
                      <div className="text-2xl font-bold">₹{amount}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Proceed to Pay Button */}
            <div className="pt-8">
              <Button 
                onClick={handleProceedToPay}
                disabled={!selectedCollector || !selectedAmount || isLoading || isLoadingAmounts}
                className="w-full py-4 text-lg font-semibold"
                size="lg"
              >
                {isLoading || isLoadingAmounts ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Proceed to Pay ₹${selectedAmount || '0'}`
                )}
              </Button>
            </div>

            {/* Payment Info */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-text-muted text-center">
                You will be redirected to payment confirmation page
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Payment;