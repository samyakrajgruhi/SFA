import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Clock, XCircle, FileText, User, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BeneficiaryRequest {
  id: string;
  userId: string;
  userName: string;
  sfaId: string;
  cmsId: string;
  date: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  approvalCount: number;
  totalApprovals: number;
  amount: string;
  description: string;
  verificationDoc: string;
  paySlip: string;
}

const BeneficiaryReview = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<BeneficiaryRequest | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Mock data for beneficiary requests
  const requests: BeneficiaryRequest[] = [
    {
      id: '1',
      userId: 'user1',
      userName: 'Rajesh Kumar',
      sfaId: 'SFA001',
      cmsId: 'CMS10001',
      date: '2024-12-15',
      category: 'Medical',
      status: 'pending',
      approvalCount: 2,
      totalApprovals: 5,
      amount: '50000',
      description: 'Medical emergency for family member requiring immediate surgery',
      verificationDoc: 'medical_report.pdf',
      paySlip: 'payslip_nov.pdf'
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Priya Sharma',
      sfaId: 'SFA002',
      cmsId: 'CMS10002',
      date: '2024-12-10',
      category: 'Family Emergency',
      status: 'pending',
      approvalCount: 4,
      totalApprovals: 5,
      amount: '30000',
      description: 'Urgent family situation requiring financial assistance',
      verificationDoc: 'family_doc.pdf',
      paySlip: 'payslip_nov.pdf'
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Amit Patel',
      sfaId: 'SFA003',
      cmsId: 'CMS10003',
      date: '2024-12-05',
      category: 'Housing',
      status: 'approved',
      approvalCount: 5,
      totalApprovals: 5,
      amount: '75000',
      description: 'Assistance for house repair after recent damage',
      verificationDoc: 'house_damage.pdf',
      paySlip: 'payslip_oct.pdf'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleApprove = (requestId: string) => {
    setIsApproving(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Request Approved",
        description: "Your approval has been recorded successfully"
      });
      setIsApproving(false);
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-white">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-warning text-white">Pending Review</Badge>;
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

  const calculateProgress = (count: number, total: number) => {
    return (count / total) * 100;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Beneficiary Review Dashboard</h1>
            <p className="text-lg text-text-secondary">Review and approve benefit requests from members</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Total Requests</p>
                    <p className="text-3xl font-bold text-text-primary">{requests.length}</p>
                  </div>
                  <FileText className="h-12 w-12 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Pending Review</p>
                    <p className="text-3xl font-bold text-warning">
                      {requests.filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="h-12 w-12 text-warning opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Approved</p>
                    <p className="text-3xl font-bold text-success">
                      {requests.filter(r => r.status === 'approved').length}
                    </p>
                  </div>
                  <CheckCircle className="h-12 w-12 text-success opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {requests.map((request) => (
              <Card 
                key={request.id} 
                className="hover:shadow-dashboard-lg transition-all cursor-pointer"
                onClick={() => setSelectedRequest(request)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {getStatusIcon(request.status)}
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg text-text-primary">{request.userName}</h3>
                            <p className="text-sm text-text-secondary">
                              {request.sfaId} • {request.cmsId}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-text-secondary">Category</p>
                            <p className="text-sm font-medium text-text-primary">{request.category}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-secondary">Date</p>
                            <p className="text-sm font-medium text-text-primary">{request.date}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-secondary">Amount</p>
                            <p className="text-sm font-medium text-text-primary">₹{request.amount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-secondary">Approval Status</p>
                            <p className="text-sm font-medium text-primary">
                              {request.approvalCount}/{request.totalApprovals}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-text-secondary">
                            <span>Approval Progress</span>
                            <span>{calculateProgress(request.approvalCount, request.totalApprovals).toFixed(0)}%</span>
                          </div>
                          <Progress 
                            value={calculateProgress(request.approvalCount, request.totalApprovals)} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(request.id);
                        }}
                        disabled={isApproving}
                        className="ml-4"
                      >
                        {isApproving ? (
                          <>
                            <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent"></span>
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl bg-surface border border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl">Request Details</DialogTitle>
            <DialogDescription>
              View complete information about this beneficiary request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-background rounded-lg">
                <div>
                  <p className="text-sm text-text-secondary flex items-center gap-2">
                    <User className="h-4 w-4" /> Member Name
                  </p>
                  <p className="font-semibold text-text-primary">{selectedRequest.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">SFA ID / CMS ID</p>
                  <p className="font-semibold text-text-primary">
                    {selectedRequest.sfaId} / {selectedRequest.cmsId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Submission Date
                  </p>
                  <p className="font-semibold text-text-primary">{selectedRequest.date}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Amount Requested
                  </p>
                  <p className="font-semibold text-text-primary">₹{selectedRequest.amount}</p>
                </div>
              </div>

              {/* Issue Details */}
              <div className="space-y-2">
                <Label className="text-text-secondary">Issue Category</Label>
                <p className="p-3 bg-background rounded-lg text-text-primary font-medium">
                  {selectedRequest.category}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-text-secondary">Description</Label>
                <p className="p-3 bg-background rounded-lg text-text-primary">
                  {selectedRequest.description || 'No additional description provided'}
                </p>
              </div>

              {/* Documents */}
              <div className="space-y-2">
                <Label className="text-text-secondary">Uploaded Documents</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-background rounded-lg border border-border">
                    <p className="text-sm text-text-secondary mb-1">Verification Document</p>
                    <p className="text-sm font-medium text-primary flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {selectedRequest.verificationDoc}
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border border-border">
                    <p className="text-sm text-text-secondary mb-1">Pay Slip</p>
                    <p className="text-sm font-medium text-primary flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {selectedRequest.paySlip}
                    </p>
                  </div>
                </div>
              </div>

              {/* Approval Status */}
              <div className="space-y-2">
                <Label className="text-text-secondary">Approval Status</Label>
                <div className="p-4 bg-background rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-text-primary">
                      {selectedRequest.approvalCount} out of {selectedRequest.totalApprovals} admins approved
                    </span>
                    <span className="text-sm text-primary">
                      {calculateProgress(selectedRequest.approvalCount, selectedRequest.totalApprovals).toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={calculateProgress(selectedRequest.approvalCount, selectedRequest.totalApprovals)} 
                    className="h-3"
                  />
                </div>
              </div>

              {selectedRequest.status === 'pending' && (
                <Button 
                  onClick={() => {
                    handleApprove(selectedRequest.id);
                    setSelectedRequest(null);
                  }}
                  className="w-full"
                  disabled={isApproving}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Request
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <label className={`text-sm font-medium ${className}`}>{children}</label>
);

export default BeneficiaryReview;
