import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { FileUp, ListCheck, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const BeneficiaryRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'list' | 'form'>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    issueCategory: '',
    verificationDoc: null as File | null,
    paySlip: null as File | null,
    description: ''
  });

  // Mock past requests data
  const pastRequests = [
    {
      id: '1',
      date: '2024-12-15',
      category: 'Medical',
      status: 'approved',
      approvalCount: '5/5',
      amount: '50000'
    },
    {
      id: '2',
      date: '2024-11-20',
      category: 'Family Emergency',
      status: 'pending',
      approvalCount: '2/5',
      amount: '30000'
    },
    {
      id: '3',
      date: '2024-10-10',
      category: 'Housing',
      status: 'rejected',
      approvalCount: '1/5',
      amount: '75000'
    }
  ];

  const issueCategories = [
    'Medical',
    'Family Emergency',
    'Housing',
    'Education',
    'Other'
  ];

  const handleFileChange = (field: 'verificationDoc' | 'paySlip', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.issueCategory || !formData.verificationDoc || !formData.paySlip) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields and upload necessary documents",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Request Submitted",
        description: "Your beneficiary request has been submitted for review"
      });
      
      // Reset form
      setFormData({
        issueCategory: '',
        verificationDoc: null,
        paySlip: null,
        description: ''
      });
      
      setIsSubmitting(false);
      setActiveView('list');
    }, 1500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-white">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-warning text-white">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive text-white">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Beneficiary Request</h1>
            <p className="text-lg text-text-secondary">Submit and manage your benefit requests</p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mb-8">
            <Button
              variant={activeView === 'list' ? 'default' : 'outline'}
              onClick={() => setActiveView('list')}
              className="flex-1"
            >
              <ListCheck className="w-4 h-4 mr-2" />
              View Requests
            </Button>
            <Button
              variant={activeView === 'form' ? 'default' : 'outline'}
              onClick={() => setActiveView('form')}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>

          {/* View Past Requests */}
          {activeView === 'list' && (
            <div className="space-y-4">
              {pastRequests.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-text-secondary mb-4">No requests found</p>
                  <Button onClick={() => setActiveView('form')}>
                    Create Your First Request
                  </Button>
                </Card>
              ) : (
                pastRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-dashboard-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(request.status)}
                          <div>
                            <h3 className="font-semibold text-text-primary">{request.category}</h3>
                            <p className="text-sm text-text-secondary">Submitted: {request.date}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-text-secondary">Amount Requested</p>
                            <p className="font-semibold text-text-primary">₹{request.amount}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-text-secondary">Approvals</p>
                            <p className="font-semibold text-primary">{request.approvalCount}</p>
                          </div>
                          
                          <div>
                            {getStatusBadge(request.status)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* New Request Form */}
          {activeView === 'form' && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Benefit Request</CardTitle>
                <CardDescription>
                  Fill in the details below and upload required documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Issue Category */}
                  <div className="space-y-2">
                    <Label htmlFor="issueCategory">
                      Issue Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.issueCategory}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, issueCategory: value }))}
                    >
                      <SelectTrigger className="bg-surface border border-border">
                        <SelectValue placeholder="Select issue category" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border border-border z-50">
                        {issueCategories.map((category) => (
                          <SelectItem key={category} value={category} className="hover:bg-surface-hover">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Verification Document Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="verificationDoc">
                      Verification Document <span className="text-destructive">*</span>
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Input
                        id="verificationDoc"
                        type="file"
                        onChange={(e) => handleFileChange('verificationDoc', e.target.files?.[0] || null)}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <label htmlFor="verificationDoc" className="cursor-pointer flex flex-col items-center">
                        <FileUp className="h-10 w-10 text-text-muted mb-2" />
                        {formData.verificationDoc ? (
                          <p className="text-sm text-success">{formData.verificationDoc.name}</p>
                        ) : (
                          <p className="text-sm text-text-muted">Click to upload verification document</p>
                        )}
                        <p className="text-xs text-text-secondary mt-1">Accepted: PDF, JPG, PNG</p>
                      </label>
                    </div>
                  </div>

                  {/* Pay Slip Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="paySlip">
                      Pay Slip <span className="text-destructive">*</span>
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Input
                        id="paySlip"
                        type="file"
                        onChange={(e) => handleFileChange('paySlip', e.target.files?.[0] || null)}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <label htmlFor="paySlip" className="cursor-pointer flex flex-col items-center">
                        <FileUp className="h-10 w-10 text-text-muted mb-2" />
                        {formData.paySlip ? (
                          <p className="text-sm text-success">{formData.paySlip.name}</p>
                        ) : (
                          <p className="text-sm text-text-muted">Click to upload pay slip</p>
                        )}
                        <p className="text-xs text-text-secondary mt-1">For verification of extended leave</p>
                      </label>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Additional Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Provide additional details about your request..."
                      rows={5}
                      className="resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveView('list')}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent"></span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Request
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default BeneficiaryRequest;
