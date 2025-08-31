import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const Payment = () => {
  const [selectedCollector, setSelectedCollector] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('');

  const collectionMembers = [
    'Rajesh Kumar - ANVT',
    'Priya Sharma - DEE', 
    'Amit Singh - DLI',
    'Sunita Devi - GHH',
    'Mohan Lal - JIND',
    'Kavita Gupta - KRJNDD',
    'Suresh Yadav - MTC',
    'Neha Verma - NZM',
    'Rakesh Jain - PNP',
    'Meera Patel - ROK',
    'Vijay Kumar - SSB'
  ];

  const amounts = [25, 60];

  const handleProceedToPay = () => {
    if (selectedCollector && selectedAmount) {
      // Redirect to payment gateway
      alert('Redirecting to payment gateway...');
    }
  };

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
                <Select value={selectedCollector} onValueChange={setSelectedCollector}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select collection member" />
                  </SelectTrigger>
                  <SelectContent>
                    {collectionMembers.map((member) => (
                      <SelectItem key={member} value={member}>
                        {member}
                      </SelectItem>
                    ))}
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
                  disabled={!selectedCollector || !selectedAmount}
                  className="w-full py-4 text-lg font-semibold"
                  size="lg"
                >
                  Proceed to Pay ₹{selectedAmount || '0'}
                </Button>
              </div>

              {/* Payment Info */}
              {selectedCollector && selectedAmount && (
                <div className="mt-8 p-6 bg-surface rounded-dashboard border border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Payment Summary</h3>
                  <div className="space-y-2 text-text-secondary">
                    <div className="flex justify-between">
                      <span>Paying to:</span>
                      <span className="text-text-primary font-medium">{selectedCollector}</span>
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