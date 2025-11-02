import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, UserPlus, Upload, X, Eye, UserMinus, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { firestore, storage } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MemberInfo {
  id: string;
  full_name: string;
  sfa_id: string;
  cms_id: string;
  lobby_id: string;
  isCollectionMember: boolean;
  qrCodeUrl?: string;
}

const MakeCollectionMember = () => {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State for making new CM
  const [sfaId, setSfaId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // State for CM list
  const [collectionMembers, setCollectionMembers] = useState<MemberInfo[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [selectedMember, setSelectedMember] = useState<MemberInfo | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<MemberInfo | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const isAdmin = user?.isAdmin;

  // Fetch all collection members
  useEffect(() => {
    fetchCollectionMembers();
  }, []);

  const fetchCollectionMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('isCollectionMember', '==', true));
      const querySnapshot = await getDocs(q);

      const members: MemberInfo[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        members.push({
          id: doc.id,
          full_name: data.full_name,
          sfa_id: data.sfa_id,
          cms_id: data.cms_id,
          lobby_id: data.lobby_id,
          isCollectionMember: data.isCollectionMember,
          qrCodeUrl: data.qrCodeUrl
        });
      });

      setCollectionMembers(members);
    } catch (error) {
      console.error('Error fetching collection members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load collection members',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleSearch = async () => {
    if (!sfaId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an SFA ID',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSearching(true);
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('sfa_id', '==', sfaId.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: 'Not Found',
          description: 'No member found with this SFA ID',
          variant: 'destructive'
        });
        setMemberInfo(null);
        return;
      }

      const memberDoc = querySnapshot.docs[0];
      const data = memberDoc.data();
      
      const memberData: MemberInfo = { 
        id: memberDoc.id, 
        full_name: data.full_name,
        sfa_id: data.sfa_id,
        cms_id: data.cms_id,
        lobby_id: data.lobby_id,
        isCollectionMember: data.isCollectionMember || false,
        qrCodeUrl: data.qrCodeUrl || undefined
      };
      
      setMemberInfo(memberData);

      if (memberData.isCollectionMember) {
        toast({
          title: 'Already Collection Member',
          description: 'This member is already a collection member',
        });
      }
    } catch (error) {
      console.error('Error searching member:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for member',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setQrFile(null);
      setQrPreview(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setQrFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = () => {
    setQrFile(null);
    setQrPreview(null);
  };

  const handleMakeCollectionMember = async () => {
    if (!memberInfo) return;

    if (!qrFile) {
      toast({
        title: 'QR Code Required',
        description: 'Please upload a UPI QR code before proceeding',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploading(true);

      // Upload QR code
      const storageRef = ref(storage, `qr_codes/${memberInfo.sfa_id}_qr.${qrFile.name.split('.').pop()}`);
      await uploadBytes(storageRef, qrFile);
      const qrCodeUrl = await getDownloadURL(storageRef);

      // Update user document
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('sfa_id', '==', sfaId.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const memberDoc = querySnapshot.docs[0];
        await updateDoc(memberDoc.ref, {
          isCollectionMember: true,
          qrCodeUrl: qrCodeUrl,
          cmActivatedAt: new Date(),
          cmStatus: 'active'
        });

        toast({
          title: 'Success',
          description: `${memberInfo.full_name} is now a collection member`,
        });

        // Reset form and refresh list
        setMemberInfo(null);
        setSfaId('');
        setQrFile(null);
        setQrPreview(null);
        fetchCollectionMembers();
      }
    } catch (error) {
      console.error('Error making collection member:', error);
      toast({
        title: 'Error',
        description: 'Failed to make collection member',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewDetails = (member: MemberInfo) => {
    setSelectedMember(member);
    setShowDetailsDialog(true);
  };

  const handleRemoveCM = (member: MemberInfo) => {
    setMemberToRemove(member);
    setShowRemoveDialog(true);
  };

  const confirmRemoveCM = async () => {
    if (!memberToRemove) return;

    try {
      setIsRemoving(true);
      
      const memberDocRef = doc(firestore, 'users', memberToRemove.id);
      await updateDoc(memberDocRef, {
        isCollectionMember: false,
        cmStatus: 'inactive',
        cmDeactivatedAt: new Date()
      });

      toast({
        title: 'Success',
        description: `${memberToRemove.full_name} removed from collection members`,
      });

      // Refresh list
      fetchCollectionMembers();
      setShowRemoveDialog(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error('Error removing collection member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove collection member',
        variant: 'destructive'
      });
    } finally {
      setIsRemoving(false);
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
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Menu
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Collection Member Management</h1>
            <p className="text-lg text-text-secondary">Manage collection members and their QR codes</p>
          </div>

          {/* Make New Collection Member Section */}
          <Card className="p-6 mb-8">
            <CardHeader>
              <CardTitle>Make New Collection Member</CardTitle>
              <CardDescription>Search for a member by SFA ID and assign collection member role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter SFA ID (e.g., SFA1001)"
                  value={sfaId}
                  onChange={(e) => setSfaId(e.target.value)}
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

              {memberInfo && !memberInfo.isCollectionMember && (
                <div className="space-y-6 pt-6 border-t border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-text-secondary">Name</p>
                      <p className="text-lg font-semibold">{memberInfo.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">SFA ID</p>
                      <p className="text-lg font-semibold text-primary">{memberInfo.sfa_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">CMS ID</p>
                      <p className="text-lg font-semibold">{memberInfo.cms_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">Lobby</p>
                      <p className="text-lg font-semibold">{memberInfo.lobby_id}</p>
                    </div>
                  </div>

                  {/* QR Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="qr-upload" className="text-base font-semibold">
                      UPI QR Code <span className="text-destructive">*</span>
                    </Label>
                    
                    {!qrPreview ? (
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-surface transition-colors">
                        <input
                          id="qr-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleQrFileChange}
                          className="hidden"
                        />
                        <label htmlFor="qr-upload" className="cursor-pointer flex flex-col items-center">
                          <Upload className="h-10 w-10 text-text-muted mb-3" />
                          <p className="text-text-primary font-medium mb-1">Click to upload QR code</p>
                          <p className="text-xs text-text-muted">PNG, JPG (Max 5MB)</p>
                        </label>
                      </div>
                    ) : (
                      <div className="relative border border-border rounded-lg p-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-background hover:bg-destructive hover:text-white"
                          onClick={handleRemoveQr}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div className="flex flex-col items-center">
                          <img 
                            src={qrPreview} 
                            alt="QR Preview" 
                            className="w-64 h-64 object-contain border border-border rounded-lg"
                          />
                          <p className="text-sm text-text-secondary mt-3">{qrFile?.name}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleMakeCollectionMember}
                    disabled={isUploading || !qrFile}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Make Collection Member
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Collection Members List */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Current Collection Members</CardTitle>
              <CardDescription>
                {collectionMembers.length} active collection member{collectionMembers.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : collectionMembers.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  No collection members found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-surface">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">SFA ID</TableHead>
                        <TableHead className="font-semibold">CMS ID</TableHead>
                        <TableHead className="font-semibold">Lobby</TableHead>
                        <TableHead className="font-semibold">QR Status</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collectionMembers.map((member) => (
                        <TableRow key={member.id} className="hover:bg-surface-hover">
                          <TableCell className="font-medium">{member.full_name}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-primary-light text-primary rounded-dashboard-sm font-medium">
                              {member.sfa_id}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono">{member.cms_id}</TableCell>
                          <TableCell>{member.lobby_id}</TableCell>
                          <TableCell>
                            {member.qrCodeUrl ? (
                              <span className="text-success flex items-center gap-1">
                                <span className="w-2 h-2 bg-success rounded-full"></span>
                                Active
                              </span>
                            ) : (
                              <span className="text-warning flex items-center gap-1">
                                <span className="w-2 h-2 bg-warning rounded-full"></span>
                                Missing
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(member)}
                                disabled={!member.qrCodeUrl}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRemoveCM(member)}
                                className="bg-red-600 text-white hover:bg-red-600/75 active:bg-red-600/50 border-0 transition-opacity"
                              >
                                <UserMinus className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Collection Member Details</DialogTitle>
            <DialogDescription>QR Code and member information</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Name</p>
                  <p className="font-semibold">{selectedMember.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">SFA ID</p>
                  <p className="font-semibold text-primary">{selectedMember.sfa_id}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">CMS ID</p>
                  <p className="font-semibold">{selectedMember.cms_id}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Lobby</p>
                  <p className="font-semibold">{selectedMember.lobby_id}</p>
                </div>
              </div>

              {selectedMember.qrCodeUrl && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">UPI QR Code</Label>
                  <div className="flex justify-center p-4 bg-surface rounded-lg border border-border">
                    <img 
                      src={selectedMember.qrCodeUrl} 
                      alt="QR Code" 
                      className="w-80 h-80 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Collection Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{memberToRemove?.full_name}</strong> from the collection member role.
              Their QR code data will be preserved but they won't be able to collect payments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveCM}
              disabled={isRemoving}
              className="bg-red-600 text-white hover:bg-red-600/75 active:bg-red-600/50 border-0 transition-opacity"
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MakeCollectionMember;