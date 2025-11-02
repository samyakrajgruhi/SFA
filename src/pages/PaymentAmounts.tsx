import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {requrieAdmin} from '@/hooks/useAdminCheck';

const PaymentAmounts = () => {
  const handleAdminAction = async () => {
    if(!requireAdmin(user,toast)) return;
  }
  
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [amounts, setAmounts] = useState<number[]>([25, 60, 500]);
  const [newAmount, setNewAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isAdmin = user?.isAdmin;

  useEffect(() => {
    const fetchAmounts = async () => {
      try {
        const configDoc = await getDoc(doc(firestore, 'config', 'payment_amounts'));
        if (configDoc.exists()) {
          setAmounts(configDoc.data().amounts || [25, 60, 500]);
        }
      } catch (error) {
        console.error('Error fetching payment amounts:', error);
      }
    };

    if (isAuthenticated && isAdmin) {
      fetchAmounts();
    }
  }, [isAuthenticated, isAdmin]);

  const handleAddAmount = () => {
    const amount = parseInt(newAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid positive number',
        variant: 'destructive'
      });
      return;
    }

    if (amounts.includes(amount)) {
      toast({
        title: 'Duplicate Amount',
        description: 'This amount already exists',
        variant: 'destructive'
      });
      return;
    }

    setAmounts([...amounts, amount].sort((a, b) => a - b));
    setNewAmount('');
  };

  const handleRemoveAmount = (amount: number) => {
    setAmounts(amounts.filter(a => a !== amount));
  };

  const handleSave = async () => {
    if (amounts.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one payment amount is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSaving(true);
      await setDoc(doc(firestore, 'config', 'payment_amounts'), {
        amounts,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid
      });

      toast({
        title: 'Success',
        description: 'Payment amounts updated successfully'
      });
    } catch (error) {
      console.error('Error saving payment amounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to save payment amounts',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) {
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
            <h1 className="text-4xl font-bold text-text-primary mb-4">Payment Amount Options</h1>
            <p className="text-lg text-text-secondary">Manage available payment amounts for members</p>
          </div>

          <Card className="p-6 mb-6">
            <CardHeader>
              <CardTitle>Add New Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  type="number"
                  placeholder="Enter amount (₹)"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddAmount()}
                  className="flex-1"
                />
                <Button onClick={handleAddAmount}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6 mb-6">
            <CardHeader>
              <CardTitle>Current Payment Amounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {amounts.map((amount) => (
                  <div 
                    key={amount}
                    className="flex items-center justify-between p-4 bg-surface rounded-dashboard border border-border"
                  >
                    <span className="text-xl font-bold text-primary">₹{amount}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAmount(amount)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {amounts.length === 0 && (
                <p className="text-center text-text-secondary py-8">
                  No payment amounts configured. Add one above.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-32"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentAmounts;
