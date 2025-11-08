import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, Eye, User, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  getAllBeneficiaryRequests, 
  processApproval, 
  BeneficiaryRequest,
  getApprovalHistory,
  BeneficiaryApproval
} from '@/services/beneficiaryService';

const BeneficiaryReview = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<BeneficiaryRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<BeneficiaryRequest | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<BeneficiaryApproval[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const isAdmin = user?.isAdmin;

  // Fetch all requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoadingRequests(true);
        const allRequests = await getAllBeneficiaryRequests();
        setRequests(allRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
        toast({
          title: 'Error',
          description: 'Failed to load beneficiary requests',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingRequests(false);
      }
    };

    if (isAdmin) {
      fetchRequests();
    }
  }, [isAdmin]);

  // Fetch approval history when request is selected
  useEffect(() => {
    const fetchApprovalHistory = async () => {
      if (selectedRequest?.id) {
        try {
          const history = await getApprovalHistory(selectedRequest.id);
          setApprovalHistory(history);
        } catch (error) {
          console.error('Error fetching approval history:', error);
        }
      }
    };

    fetchApprovalHistory();
  }, [selectedRequest]);

  const handleApprove = async (requestId: string) => {
    if (!user?.sfaId || !user?.name) return;

    setIsApproving(true);
    try {
      await processApproval(requestId, user.sfaId, user.name, 'approved');
      
      toast({
        title: 'Request Approved',
        description: 'Your approval has been recorded'
      });

      // Refresh requests
      const allRequests = await getAllBeneficiaryRequests();
      setRequests(allRequests);
      
      // Close dialog if open
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.message || 'Failed to approve request',
        variant: 'destructive'
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user?.sfaId || !user?.name) return;

    setIsRejecting(true);
    try {
      await processApproval(requestId, user.sfaId, user.name, 'rejected', 'Request rejected by admin');
      
      toast({
        title: 'Request Rejected',
        description: 'The request has been rejected'
      });

      // Refresh requests
      const allRequests = await getAllBeneficiaryRequests();
      setRequests(allRequests);
      
      // Close dialog if open
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
    } catch (error: any) {
      toast({
        title: 'Rejection Failed',
        description: error.message || 'Failed to reject request',
        variant: 'destructive'
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-white border-0">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-warning text-white border-0">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive text-white border-0">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-6 w-6 text-success" />;
      case 'pending':
        return <Clock className="h-6 w-6 text-warning" />;
      case 'rejected':
        return <XCircle className="h-6 w-6 text-destructive" />;
      default:
        return null;
    }
  };

  const calculateProgress = (current: number, total: number) => {
    return (current / total) * 100;
  };

  const hasUserApproved = (request: BeneficiaryRequest) => {
    return request.approvedBy?.includes(user?.sfaId || '');
  };

  const hasUserRejected = (request: BeneficiaryRequest) => {
    return request.rejectedBy?.includes(user?.sfaId || '');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <Button 
            variant="ghost" 
            className="mb-4 sm:mb-6"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Menu
          </Button>

          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2 sm:mb-4">Beneficiary Requests</h1>
            <p className="text-base sm:text-lg text-text-secondary">Review and approve benefit requests from members</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-text-secondary">Total Requests</p>
                    <p className="text-2xl sm:text-3xl font-bold text-text-primary">{requests.length}</p>
                  </div>
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-text-secondary">Pending Review</p>
                    <p className="text-2xl sm:text-3xl font-bold text-warning">
                      {requests.filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-warning opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-text-secondary">Approved</p>
                    <p className="text-2xl sm:text-3xl font-bold text-success">
                      {requests.filter(r => r.status === 'approved').length}
                    </p>
                  </div>
                  <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-success opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requests List */}
          {isLoadingRequests ? (
            <Card className="p-12 text-center">
              <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading requests...</p>
            </Card>
          ) : requests.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No beneficiary requests found</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card 
                  key={request.id} 
                  className="hover:shadow-dashboard-lg transition-all"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                      {/* Top Section - Status and User Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {getStatusIcon(request.status)}
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg text-text-primary truncate">
                              {request.userName}
                            </h3>
                            <p className="text-xs sm:text-sm text-text-secondary">
                              {request.sfaId} • {request.cmsId}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                          <p className="text-xs text-text-secondary">Member</p>
                          <p className="text-sm font-medium text-text-primary truncate">{request.userName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-secondary">Date</p>
                          <p className="text-sm font-medium text-text-primary">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-secondary">Approvals</p>
                          <p className="text-sm font-medium text-primary">
                            {request.approvalCount}/{request.totalApprovals}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {request.status === 'pending' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-text-secondary">
                            <span>Approval Progress</span>
                            <span>{Math.round(calculateProgress(request.approvalCount, request.totalApprovals))}%</span>
                          </div>
                          <Progress 
                            value={calculateProgress(request.approvalCount, request.totalApprovals)} 
                            className="h-2"
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                          className="flex-1 sm:flex-none"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        
                        {request.status === 'pending' && !hasUserApproved(request) && !hasUserRejected(request) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(request.id!)}
                              disabled={isRejecting}
                              className="flex-1 sm:flex-none text-destructive border-destructive hover:bg-destructive hover:text-white"
                            >
                              {isRejecting ? (
                                <>
                                  <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id!)}
                              disabled={isApproving}
                              className="flex-1 sm:flex-none"
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
                          </>
                        )}
                        
                        {hasUserApproved(request) && (
                          <Badge className="bg-success-light text-success border-success flex-1 sm:flex-none justify-center">
                            You Approved This
                          </Badge>
                        )}
                        
                        {hasUserRejected(request) && (
                          <Badge className="bg-destructive-light text-destructive border-destructive flex-1 sm:flex-none justify-center">
                            You Rejected This
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Request Details</DialogTitle>
            <DialogDescription>
              Complete information about this beneficiary request
            </DialogDescription>
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
                <div className="flex items-center gap-3">
                  {getStatusIcon(selectedRequest.status)}
                  <div className="flex-1">
                    <p className="font-semibold text-base">{selectedRequest.status.toUpperCase()}</p>
                    <p className="text-sm mt-1">
                      {selectedRequest.status === 'approved' && 'All admins have approved this request'}
                      {selectedRequest.status === 'pending' && `Approvals: ${selectedRequest.approvalCount}/${selectedRequest.totalApprovals}`}
                      {selectedRequest.status === 'rejected' && 'This request has been rejected'}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface rounded-lg">
                <div>
                  <p className="text-xs sm:text-sm text-text-secondary flex items-center gap-2 mb-1">
                    <User className="h-4 w-4" /> Member Name
                  </p>
                  <p className="font-semibold text-text-primary">{selectedRequest.userName}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-text-secondary mb-1">SFA ID / CMS ID</p>
                  <p className="font-semibold text-text-primary">
                    {selectedRequest.sfaId} / {selectedRequest.cmsId}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-text-secondary flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4" /> Submission Date
                  </p>
                  <p className="font-semibold text-text-primary">
                    {new Date(selectedRequest.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-text-secondary mb-1">Last Updated</p>
                  <p className="font-semibold text-text-primary">
                    {new Date(selectedRequest.updatedAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Request Details */}
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-3 pb-2 border-b border-border">
                  Request Information
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-surface rounded-lg">
                    <p className="text-xs text-text-secondary mb-1">Description</p>
                    <p className="text-sm text-text-primary whitespace-pre-wrap">
                      {selectedRequest.description || 'No additional description provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-3 pb-2 border-b border-border">
                  Uploaded Documents
                </h4>
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
                        <FileText className="h-4 w-4" />
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
                        <FileText className="h-4 w-4" />
                        View Document
                      </p>
                    </a>
                  )}
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

              {/* Approval History */}
              {approvalHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-3 pb-2 border-b border-border">
                    Approval History
                  </h4>
                  <div className="space-y-2">
                    {approvalHistory.map((approval, index) => (
                      <div key={index} className="p-3 bg-surface rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{approval.adminName}</p>
                          <p className="text-xs text-text-secondary">{approval.adminSfaId}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={approval.action === 'approved' ? 'bg-success text-white border-0' : 'bg-destructive text-white border-0'}>
                            {approval.action}
                          </Badge>
                          <p className="text-xs text-text-secondary mt-1">
                            {new Date(approval.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Progress */}
              {selectedRequest.status === 'pending' && (
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-3 pb-2 border-b border-border">
                    Approval Status
                  </h4>
                  <div className="p-4 bg-surface rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">
                        {selectedRequest.approvalCount} out of {selectedRequest.totalApprovals} admins approved
                      </span>
                      <span className="text-sm text-primary font-semibold">
                        {Math.round(calculateProgress(selectedRequest.approvalCount, selectedRequest.totalApprovals))}%
                      </span>
                    </div>
                    <Progress 
                      value={calculateProgress(selectedRequest.approvalCount, selectedRequest.totalApprovals)} 
                      className="h-3"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons in Dialog */}
              {selectedRequest.status === 'pending' && !hasUserApproved(selectedRequest) && !hasUserRejected(selectedRequest) && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedRequest.id!)}
                    disabled={isRejecting}
                    className="flex-1 text-destructive border-destructive hover:bg-destructive hover:text-white"
                  >
                    {isRejecting ? (
                      <>
                        <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Request
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => handleApprove(selectedRequest.id!)}
                    disabled={isApproving}
                    className="flex-1"
                  >
                    {isApproving ? (
                      <>
                        <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent"></span>
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Request
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BeneficiaryReview;