import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { firestore } from '@/firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Interface for collection member data
interface CollectionMember {
  id: string;
  name: string;
  lobby: string;
  sfaId: string;
}

const Payment = () => {
  const { toast } = useToast();
  const [selectedCollector, setSelectedCollector] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [collectionMembers, setCollectionMembers] = useState<CollectionMember[]>([]);
  const [amounts, setAmounts] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAmounts, setIsLoadingAmounts] = useState(true);

  useEffect(()=>{
    const fetchPaymentAmounts = async () =>{
      try{
        setIsLoadingAmounts(true);
        const configDoc = await getDoc(doc(firestore, 'config', 'payment_amounts'));

        if(configDoc.exists()){
          const data = configDoc.data();
          setAmounts(data.amounts || [25,60,500]);
        }else {
          setAmounts([25,60,500]);
        }
      }catch(error){
        console.error("Error fetching payment amounts :",error);
        setAmounts([23,60,500]);
        toast({
          title: "Warning",
          description: "Could not load payment amounts. Using default values.",
          variant: "destructive"
        });
      }finally{
        setIsLoadingAmounts(false);
      }
    }

    fetchPaymentAmounts();
  },[toast]);

  // Fetch collection members 
  useEffect(() => {
    const fetchCollectionMembers = async () => {
      setIsLoading(true);
      try {
        // Query users with role "collection"
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('isCollectionMember','==',true));
        const querySnapshot = await getDocs(q);

        const members: CollectionMember[] = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          members.push({
            id: doc.id,
            name: data.full_name || 'Unknown',
            lobby: data.lobby_id || 'Unknown',
            sfaId: data.sfa_id || '',
          });
        });

        setCollectionMembers(members);
      } catch (error) {
        console.error("Error fetching collection members:", error);
        toast({
          title: "Error",
          description: "Failed to load collection members. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollectionMembers();
  }, [toast]);

  const handleProceedToPay = () => {
    if (selectedCollector && selectedAmount) {
      // Redirect to payment gateway
      alert('Redirecting to payment gateway...');
    }
  };

  // Get the selected member object
  const selectedMember = collectionMembers.find(m => m.id === selectedCollector);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Make Payment</h1>
            <p className="text-lg text-text-secondary">Choose your collection member and amount</p>
          </div>

          <Card className="p-8 max-w-2xl mx-auto">
            <div className="space-y-8">
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
                        {member.name} - {member.lobby} {member.sfaId ? `(${member.sfaId})` : ''}
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
              </div>

              {/* Proceed to Pay Button */}
              <div className="pt-8">
                <Button 
                  onClick={handleProceedToPay}
                  disabled={!selectedCollector || !selectedAmount || isLoading}
                  className="w-full py-4 text-lg font-semibold"
                  size="lg"
                >
                  {isLoading ? 'Loading...' : `Proceed to Pay ₹${selectedAmount || '0'}`}
                </Button>
              </div>

              {/* Payment Info */}
              {selectedCollector && selectedAmount && selectedMember && (
                <div className="mt-8 p-6 bg-surface rounded-dashboard border border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Payment Summary</h3>
                  <div className="space-y-2 text-text-secondary">
                    <div className="flex justify-between">
                      <span>Paying to:</span>
                      <span className="text-text-primary font-medium">
                        {selectedMember?.name || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lobby:</span>
                      <span className="text-text-primary font-medium">
                        {selectedMember?.lobby || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="text-text-primary font-medium">₹{selectedAmount}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Payment;