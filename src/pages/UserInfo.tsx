import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X, User, Upload, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore, storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { useLobbies } from '@/hooks/useLobbies';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const UserInfo = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // QR Code Management State
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [newQrFile, setNewQrFile] = useState<File | null>(null);
  const [newQrPreview, setNewQrPreview] = useState<string | null>(null);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [isLoadingQr, setIsLoadingQr] = useState(true);

  const [userInfo, setUserInfo] = useState({
    name: user?.name || 'User Name',
    sfaId: user?.sfaId || 'SFA000',
    cmsId: user?.cmsId || 'CMS00000',
    lobby: user?.lobby || 'ANVT',
    role: user?.isAdmin ? 'Admin' : (user?.isCollectionMember ? 'Collection Member' : 'Member'),
    phoneNumber: user?.phoneNumber || '+91 98765 43210',
    email: user?.email || 'user@example.com',
    emergencyNumber: user?.emergencyNumber || '+91 98765 43211'
  });

  const [editedInfo, setEditedInfo] = useState({ ...userInfo });

  useEffect(() => {
    if (user) {
      const userRole = user.isAdmin ? 'Admin' : (user.isCollectionMember ? 'Collection Member' : 'Member');
      setUserInfo({
        name: user.name || 'User Name',
        sfaId: user.sfaId || 'SFA000',
        cmsId: user.cmsId || 'CMS00000',
        lobby: user.lobby || 'ANVT',
        role: userRole,
        phoneNumber: user.phoneNumber || '+91 98765 43210',
        email: user.email || 'user@example.com',
        emergencyNumber: user.emergencyNumber || '+91 98765 43211'
      });
      setEditedInfo({
        name: user.name || 'User Name',
        sfaId: user.sfaId || 'SFA000',
        cmsId: user.cmsId || 'CMS00000',
        lobby: user.lobby || 'ANVT',
        role: userRole,
        phoneNumber: user.phoneNumber || '+91 98765 43210',
        email: user.email || 'user@example.com',
        emergencyNumber: user.emergencyNumber || '+91 98765 43211'
      });
    }
  }, [user]);

  // Fetch QR code for collection members
  useEffect(() => {
    const fetchQrCode = async () => {
      if (!user?.isCollectionMember || !user?.sfaId) {
        setIsLoadingQr(false);
        return;
      }

      try {
        setIsLoadingQr(true);
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('sfa_id', '==', user.sfaId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setQrCodeUrl(userData.qrCodeUrl || null);
        }
      } catch (error) {
        console.error('Error fetching QR code:', error);
      } finally {
        setIsLoadingQr(false);
      }
    };

    fetchQrCode();
  }, [user]);

  const { lobbies, isLoading: isLoadingLobbies } = useLobbies();

  const handleEdit = () => {
    setIsEditing(true);
    setEditedInfo({ ...userInfo });
  };

  const handleDiscard = () => {
    setIsEditing(false);
    setEditedInfo({ ...userInfo });
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      setIsUpdating(true);
      
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('sfa_id', '==', user?.sfaId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDocRef = doc(firestore, 'users', querySnapshot.docs[0].id);
        
        await updateDoc(userDocRef, {
          full_name: editedInfo.name,
          phone_number: editedInfo.phoneNumber,
          emergency_number: editedInfo.emergencyNumber,
          lobby_id: editedInfo.lobby,
          cms_id: editedInfo.cmsId
        });

        setUserInfo(editedInfo);
        setIsEditing(false);
        
        toast({
          title: "Success",
          description: "Your profile has been updated successfully"
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // QR Code Management Functions
  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setNewQrFile(null);
      setNewQrPreview(null);
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

    setNewQrFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewQrPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQrPreview = () => {
    setNewQrFile(null);
    setNewQrPreview(null);
  };

  const handleUploadQr = async () => {
    if (!newQrFile || !user?.sfaId) return;

    try {
      setIsUploadingQr(true);

      // Upload QR code to storage
      const storageRef = ref(storage, `qr_codes/${user.sfaId}_qr.${newQrFile.name.split('.').pop()}`);
      await uploadBytes(storageRef, newQrFile);
      const downloadUrl = await getDownloadURL(storageRef);

      // Update user document
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('sfa_id', '==', user.sfaId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDocRef = doc(firestore, 'users', querySnapshot.docs[0].id);
        await updateDoc(userDocRef, {
          qrCodeUrl: downloadUrl,
          qrUpdatedAt: new Date()
        });

        setQrCodeUrl(downloadUrl);
        setNewQrFile(null);
        setNewQrPreview(null);

        toast({
          title: 'Success',
          description: 'QR code updated successfully'
        });
      }
    } catch (error) {
      console.error('Error uploading QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload QR code',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingQr(false);
    }
  };

  const SaveButton = () => (
    <Button 
      onClick={handleSaveChanges} 
      disabled={isUpdating}
      className="flex items-center space-x-2"
    >
      {isUpdating ? (
        <>
          <span className="animate-spin h-4 w-4 rounded-full border-2 border-white border-t-transparent"></span>
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </>
      )}
    </Button>
  );

  const paymentHistory = [
    {
      id: '1',
      date: '2024-05-15',
      amount: 25,
      paymentMode: 'UPI',
      status: 'Completed',
      receiver: 'Amit Verma',
      remarks: 'Monthly contribution'
    },
    {
      id: '2',
      date: '2024-04-15',
      amount: 25,
      paymentMode: 'Cash',
      status: 'Completed',
      receiver: 'Priya Sharma',
      remarks: 'Monthly contribution'
    },
    {
      id: '3',
      date: '2024-03-15',
      amount: 60,
      paymentMode: 'Bank Transfer',
      status: 'Completed',
      receiver: 'Ravi Kumar',
      remarks: 'Special contribution'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-4">User Information</h1>
            <p className="text-lg text-text-secondary">Manage your profile and SFA membership details</p>
          </div>

          <Card className="p-8 mb-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">{userInfo.name}</h2>
                  <p className="text-text-secondary">{userInfo.role}</p>
                </div>
              </div>
              
              {!isEditing && (
                <Button onClick={handleEdit} className="flex items-center space-x-2">
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </Button>
              )}
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-text-secondary">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editedInfo.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-primary">{userInfo.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-text-secondary">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editedInfo.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-primary">{userInfo.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-text-secondary">Email Address</Label>
                  <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-primary">{userInfo.email}</p>
                </div>

                <div>
                  <Label htmlFor="emergency" className="text-text-secondary">Emergency Number</Label>
                  {isEditing ? (
                    <Input
                      id="emergency"
                      value={editedInfo.emergencyNumber}
                      onChange={(e) => handleInputChange('emergencyNumber', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-primary">{userInfo.emergencyNumber}</p>
                  )}
                </div>

                <div>
                  <Label className="text-text-secondary">SFA ID</Label>
                  <p className="mt-1 p-2 bg-primary-light text-primary rounded-dashboard font-medium">{userInfo.sfaId}</p>
                </div>

                <div>
                  <Label className="text-text-secondary">CMS ID</Label>
                  {isEditing ? (
                    <Input
                      id="cmsId"
                      value={editedInfo.cmsId}
                      onChange={(e) => handleInputChange('cmsId', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-accent-light text-accent rounded-dashboard font-mono">{userInfo.cmsId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lobby" className="text-text-secondary">Lobby</Label>
                  {isEditing ? (
                    <Select 
                      value={editedInfo.lobby} 
                      onValueChange={(value) => handleInputChange('lobby', value)}
                      disabled={isLoadingLobbies}
                    >
                      <SelectTrigger className="mt-1 bg-surface border border-border">
                        <SelectValue placeholder={isLoadingLobbies ? "Loading lobbies..." : "Select lobby"} />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border border-border z-50">
                        {lobbies.map((lobby) => (
                          <SelectItem key={lobby} value={lobby} className="hover:bg-surface-hover">{lobby}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 p-2 bg-warning-light text-warning rounded-dashboard font-medium">{userInfo.lobby}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role" className="text-text-secondary">Role</Label>
                  <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-primary">{userInfo.role.toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={handleDiscard}
                  className="flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Discard Changes</span>
                </Button>
                <SaveButton />
              </div>
            )}
          </Card>

          {/* QR Code Management Section - Only for Collection Members */}
          {user?.isCollectionMember && (
            <Card className="p-8 mb-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-text-primary mb-2">QR Code Management</h3>
                    <p className="text-text-secondary">Manage your payment QR code</p>
                  </div>
                  {qrCodeUrl && (
                    <Button
                      variant="outline"
                      onClick={() => setShowQrDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Current QR
                    </Button>
                  )}
                </div>

                {isLoadingQr ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    {/* Current QR Status */}
                    <div className="p-4 bg-surface rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-text-secondary mb-1">Current Status</p>
                          <p className="font-semibold text-text-primary">
                            {qrCodeUrl ? (
                              <span className="text-success flex items-center gap-2">
                                <span className="w-2 h-2 bg-success rounded-full"></span>
                                QR Code Active
                              </span>
                            ) : (
                              <span className="text-warning flex items-center gap-2">
                                <span className="w-2 h-2 bg-warning rounded-full"></span>
                                No QR Code Uploaded
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Upload New QR */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">
                        {qrCodeUrl ? 'Update QR Code' : 'Upload QR Code'}
                      </Label>
                      
                      {!newQrPreview ? (
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-surface transition-colors">
                          <input
                            id="qr-upload-user"
                            type="file"
                            accept="image/*"
                            onChange={handleQrFileChange}
                            className="hidden"
                          />
                          <label htmlFor="qr-upload-user" className="cursor-pointer flex flex-col items-center">
                            <Upload className="h-10 w-10 text-text-muted mb-3" />
                            <p className="text-text-primary font-medium mb-1">Click to upload new QR code</p>
                            <p className="text-xs text-text-muted">PNG, JPG (Max 5MB)</p>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="relative border border-border rounded-lg p-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 bg-background hover:bg-destructive hover:text-white"
                              onClick={handleRemoveQrPreview}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <div className="flex flex-col items-center">
                              <img 
                                src={newQrPreview} 
                                alt="QR Preview" 
                                className="w-64 h-64 object-contain border border-border rounded-lg"
                              />
                              <p className="text-sm text-text-secondary mt-3">{newQrFile?.name}</p>
                            </div>
                          </div>

                          <Button 
                            onClick={handleUploadQr}
                            disabled={isUploadingQr}
                            className="w-full"
                          >
                            {isUploadingQr ? (
                              <>
                                <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent"></span>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                {qrCodeUrl ? 'Update QR Code' : 'Upload QR Code'}
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Payment History Section */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-text-primary mb-6">Payment History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Payment Mode</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Receiver</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-surface transition-colors">
                      <td className="py-3 px-4 text-text-primary">{payment.date}</td>
                      <td className="py-3 px-4 text-text-primary font-semibold">₹{payment.amount}</td>
                      <td className="py-3 px-4 text-text-primary">{payment.paymentMode}</td>
                      <td className="py-3 px-4 text-text-primary">{payment.receiver}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-success-light text-success rounded-dashboard-sm text-xs font-medium">
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>

      {/* View QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Your Payment QR Code</DialogTitle>
            <DialogDescription>Members scan this code to make payments to you</DialogDescription>
          </DialogHeader>
          {qrCodeUrl && (
            <div className="flex justify-center p-4 bg-surface rounded-lg border border-border">
              <img 
                src={qrCodeUrl} 
                alt="Payment QR Code" 
                className="w-96 h-96 object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserInfo;