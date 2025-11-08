import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { FileUp, ListCheck, Send, Clock, CheckCircle, XCircle, ArrowLeft, Eye, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  createBeneficiaryRequest, 
  getUserBeneficiaryRequests, 
  BeneficiaryRequest as BeneficiaryRequestType 
} from '@/services/beneficiaryService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const BeneficiaryRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'list' | 'form'>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pastRequests, setPastRequests] = useState<BeneficiaryRequestType[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<BeneficiaryRequestType | null>(null);

  // ✅ UPDATED: Form state
  const [formData, setFormData] = useState({
    verificationDoc: null as File | null,
    paySlip: null as File | null,
    applicationForm: null as File | null,  // ✅ NEW
    description: ''
  });

  // Fetch user's past requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.uid) return;

      try {
        setIsLoading(true);
        const requests = await getUserBeneficiaryRequests(user.uid);
        setPastRequests(requests);
      } catch (error) {
        console.error('Error fetching requests:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your requests',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [user?.uid,toast]);

  // ✅ UPDATED: Handle file change
  const handleFileChange = (field: 'verificationDoc' | 'paySlip' | 'applicationForm', file: File | null) => {
    if (file && file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 5MB',
        variant: 'destructive'
      });
      return;
    }
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  // ✅ UPDATED: Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.verificationDoc || !formData.paySlip || !formData.applicationForm) {
      toast({
        title: 'Missing Required Documents',
        description: 'Please upload all three required documents',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to submit a request',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        userId: user.uid,
        userName: user.name || 'Unknown',
        sfaId: user.sfaId || 'N/A',
        cmsId: user.cmsId || 'N/A',
        lobby: user.lobby || 'N/A',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        description: formData.description
      };

      await createBeneficiaryRequest(
        requestData,
        formData.verificationDoc!,
        formData.paySlip!,
        formData.applicationForm!  // ✅ NEW
      );

      toast({
        title: 'Request Submitted',
        description: 'Your beneficiary request has been submitted for admin review'
      });
      
      // Reset form
      setFormData({
        verificationDoc: null,
        paySlip: null,
        applicationForm: null,
        description: ''
      });
      
      // Refresh requests list
      const requests = await getUserBeneficiaryRequests(user.uid);
      setPastRequests(requests);
      
      setActiveView('list');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-white border-0">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-warning text-white border-0">Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive text-white border-0">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-warning flex-shrink-0" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <Button 
            variant="ghost" 
            className="mb-4 sm:mb-6"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2 sm:mb-4">Beneficiary Request</h1>
            <p className="text-base sm:text-lg text-text-secondary">Submit and manage your benefit requests</p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Button
              variant={activeView === 'list' ? 'default' : 'outline'}
              onClick={() => setActiveView('list')}
              className="flex-1 justify-center"
              size="lg"
            >
              <ListCheck className="w-4 h-4 mr-2" />
              View Requests ({pastRequests.length})
            </Button>
            <Button
              variant={activeView === 'form' ? 'default' : 'outline'}
              onClick={() => setActiveView('form')}
              className="flex-1 justify-center"
              size="lg"
            >
              <Send className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>

          {/* View Past Requests */}
          {activeView === 'list' && (
            <div className="space-y-4">
              {isLoading ? (
                <Card className="p-12 text-center">
                  <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-text-secondary">Loading your requests...</p>
                </Card>
              ) : pastRequests.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center">
                  <p className="text-text-secondary mb-4">No requests found</p>
                  <Button onClick={() => setActiveView('form')}>
                    Create Your First Request
                  </Button>
                </Card>
              ) : (
                pastRequests.map((request) => (
                  <Card 
                    key={request.id} 
                    className="hover:shadow-dashboard-lg transition-all cursor-pointer"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          {getStatusIcon(request.status)}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-text-primary mb-1 truncate">{request.userName}</h3>
                            <p className="text-sm text-text-secondary">
                              Submitted: {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                          <div className="flex-1 sm:flex-none sm:text-right">
                            <p className="text-xs sm:text-sm text-text-secondary">Approvals</p>
                            <p className="font-semibold text-primary">{request.approvalCount}/{request.totalApprovals}</p>
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
                <CardTitle className="text-xl sm:text-2xl">Submit Benefit Request</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Upload required documents for your beneficiary request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Verification Document Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="verificationDoc">
                      Verification Document <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-text-secondary mb-2">
                      Upload supporting documents (medical bills, receipts, etc.)
                    </p>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-6 text-center">
                      <input
                        id="verificationDoc"
                        type="file"
                        onChange={(e) => handleFileChange('verificationDoc', e.target.files?.[0] || null)}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <label htmlFor="verificationDoc" className="cursor-pointer flex flex-col items-center">
                        <FileUp className="h-8 w-8 sm:h-10 sm:w-10 text-text-muted mb-2" />
                        {formData.verificationDoc ? (
                          <p className="text-sm text-success break-all px-2">{formData.verificationDoc.name}</p>
                        ) : (
                          <p className="text-sm text-text-muted">Click to upload verification document</p>
                        )}
                        <p className="text-xs text-text-secondary mt-1">Accepted: PDF, JPG, PNG (Max 5MB)</p>
                      </label>
                    </div>
                  </div>

                  {/* Pay Slip Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="paySlip">
                      Pay Slip <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-text-secondary mb-2">
                      Upload your latest pay slip for verification
                    </p>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-6 text-center">
                      <input
                        id="paySlip"
                        type="file"
                        onChange={(e) => handleFileChange('paySlip', e.target.files?.[0] || null)}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <label htmlFor="paySlip" className="cursor-pointer flex flex-col items-center">
                        <FileUp className="h-8 w-8 sm:h-10 sm:w-10 text-text-muted mb-2" />
                        {formData.paySlip ? (
                          <p className="text-sm text-success break-all px-2">{formData.paySlip.name}</p>
                        ) : (
                          <p className="text-sm text-text-muted">Click to upload pay slip</p>
                        )}
                        <p className="text-xs text-text-secondary mt-1">For verification of extended leave</p>
                      </label>
                    </div>
                  </div>

                  {/* ✅ NEW: Application Form Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="applicationForm">
                      Application Form <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-text-secondary mb-2">
                      Upload the filled beneficiary application form
                    </p>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-6 text-center">
                      <input
                        id="applicationForm"
                        type="file"
                        onChange={(e) => handleFileChange('applicationForm', e.target.files?.[0] || null)}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <label htmlFor="applicationForm" className="cursor-pointer flex flex-col items-center">
                        <FileUp className="h-8 w-8 sm:h-10 sm:w-10 text-text-muted mb-2" />
                        {formData.applicationForm ? (
                          <p className="text-sm text-success break-all px-2">{formData.applicationForm.name}</p>
                        ) : (
                          <p className="text-sm text-text-muted">Click to upload application form</p>
                        )}
                        <p className="text-xs text-text-secondary mt-1">Accepted: PDF, JPG, PNG (Max 5MB)</p>
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
                  <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveView('list')}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !formData.verificationDoc || !formData.paySlip || !formData.applicationForm}
                      className="w-full sm:w-auto"
                    >
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

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Request Details</DialogTitle>
            <DialogDescription>View your submitted beneficiary request</DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6 pt-4">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg border-2 ${
                selectedRequest.status === 'approved' 
                  ? 'bg-success-light border-success' 
                  : selectedRequest.status === 'rejected'
                  ? 'bg-destructive-light border-destructive'
                  : 'bg-warning-light border-warning'
              }`}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedRequest.status)}
                  <div className="flex-1">
                    <p className="font-semibold">{selectedRequest.status.toUpperCase()}</p>
                    <p className="text-sm mt-1">
                      {selectedRequest.status === 'approved' && 'Your request has been approved by all admins'}
                      {selectedRequest.status === 'pending' && `Approvals: ${selectedRequest.approvalCount}/${selectedRequest.totalApprovals}`}
                      {selectedRequest.status === 'rejected' && 'Your request has been rejected'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface rounded-lg">
                <div>
                  <p className="text-xs text-text-secondary mb-1">Submitted By</p>
                  <p className="font-semibold text-text-primary">{selectedRequest.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary mb-1">SFA ID</p>
                  <p className="font-semibold text-primary">{selectedRequest.sfaId}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary mb-1">Submitted On</p>
                  <p className="text-sm text-text-primary">
                    {new Date(selectedRequest.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary mb-1">Last Updated</p>
                  <p className="text-sm text-text-primary">
                    {new Date(selectedRequest.updatedAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedRequest.description && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Description</Label>
                  <p className="p-3 bg-surface rounded-lg text-sm text-text-primary whitespace-pre-wrap">
                    {selectedRequest.description}
                  </p>
                </div>
              )}

              {/* Documents */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Uploaded Documents</Label>
                <div className="grid grid-cols-1 gap-3">
                  {selectedRequest.verificationDocUrl && (
                    <a
                      href={selectedRequest.verificationDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-surface rounded-lg border border-border hover:bg-surface-hover transition-colors"
                    >
                      <p className="text-xs text-text-secondary mb-1">Verification Document</p>
                      <p className="text-sm font-medium text-primary flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View Document
                      </p>
                    </a>
                  )}
                  {selectedRequest.paySlipUrl && (
                    <a
                      href={selectedRequest.paySlipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-surface rounded-lg border border-border hover:bg-surface-hover transition-colors"
                    >
                      <p className="text-xs text-text-secondary mb-1">Pay Slip</p>
                      <p className="text-sm font-medium text-primary flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View Document
                      </p>
                    </a>
                  )}
                  {/* ✅ NEW: Application Form Link */}
                  {selectedRequest.applicationFormUrl && (
                    <a
                      href={selectedRequest.applicationFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-surface rounded-lg border border-border hover:bg-surface-hover transition-colors"
                    >
                      <p className="text-xs text-text-secondary mb-1">Application Form</p>
                      <p className="text-sm font-medium text-primary flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        View Document
                      </p>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BeneficiaryRequest;