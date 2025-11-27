// filepath: src/pages/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, UserX, Search, AlertTriangle, ShieldAlert, UserCheck, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { requireFounder } from '@/hooks/useFounderCheck';
import {functions} from '@/firebase';
import {httpsCallable} from 'firebase/functions';

interface UserInfo {
  id: string;
  uid: string;
  full_name: string;
  sfa_id: string;
  cms_id: string;
  lobby_id: string;
  email: string;
  phone_number?: string;
  isAdmin?: boolean;
  isFounder?: boolean;
  isCollectionMember?: boolean;
  isProtected?: boolean;
  isDisabled?: boolean;
  disabledAt?: Date;
  disabledBy?: string;
}

const UserManagement = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isFounder = user?.isFounder;

  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [foundUser, setFoundUser] = useState<UserInfo | null>(null);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [protectedAdmins, setProtectedAdmins] = useState<string[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Fetch protected admins
  useEffect(() => {
    const fetchProtectedAdmins = async () => {
      try {
        setIsLoadingConfig(true);
        const configDoc = await getDoc(doc(firestore, 'config', 'protected_admins'));
        
        if (configDoc.exists()) {
          const data = configDoc.data();
          setProtectedAdmins(data.sfa_ids || []);
        } else {
          setProtectedAdmins([]);
        }
      } catch (error) {
        console.error('Error fetching protected admins:', error);
        toast({
          title: 'Warning',
          description: 'Could not load protected admins list',
          variant: 'destructive'
        });
        setProtectedAdmins([]);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    if (isAuthenticated && isFounder) {
      fetchProtectedAdmins();
    }
  }, [isAuthenticated, isFounder, toast]);

  const handleSearch = async () => {
    if (!searchId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an SFA ID or CMS ID',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSearching(true);
      const usersRef = collection(firestore, 'users');
      let q = query(usersRef, where('sfa_id', '==', searchId.trim().toUpperCase()));
      let querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        q = query(usersRef, where('cms_id', '==', searchId.trim().toUpperCase()));
        querySnapshot = await getDocs(q);
      }

      if (querySnapshot.empty) {
        toast({
          title: 'Not Found',
          description: 'No user found with this SFA ID or CMS ID',
          variant: 'destructive'
        });
        setFoundUser(null);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const isProtected = protectedAdmins.includes(userData.sfa_id);
      
      // Fetch UID from users_by_uid if not present
      let userUid = userData.uid;
      if (!userUid) {
        const uidQuery = query(
          collection(firestore, 'users_by_uid'),
          where('sfa_id', '==', userData.sfa_id)
        );
        const uidSnapshot = await getDocs(uidQuery);
        if (!uidSnapshot.empty) {
          userUid = uidSnapshot.docs[0].data().uid;
        }
      }
      
      setFoundUser({
        id: userDoc.id,
        uid: userUid || '',
        full_name: userData.full_name || 'Unknown',
        sfa_id: userData.sfa_id || '',
        cms_id: userData.cms_id || '',
        lobby_id: userData.lobby_id || '',
        email: userData.email || '',
        phone_number: userData.phone_number || '',
        isAdmin: userData.isAdmin || false,
        isFounder: userData.isFounder || false,
        isCollectionMember: userData.isCollectionMember || false,
        isProtected: isProtected,
        isDisabled: userData.isDisabled || false,
        disabledAt: userData.disabledAt?.toDate(),
        disabledBy: userData.disabledBy
      });

      if (isProtected) {
        toast({
          title: 'Protected Admin',
          description: 'This user is a protected admin',
        });
      }

    } catch (error) {
      console.error('Error searching user:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for user',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Disable User
  const handleDisableUser = async () => {
    if (!foundUser || !requireFounder(user, toast)) return;

    if (foundUser.isProtected || foundUser.sfa_id === user?.sfaId) {
      toast({
        title: 'Cannot Disable',
        description: foundUser.isProtected 
          ? 'This user is a protected admin'
          : 'You cannot disable your own account',
        variant: 'destructive'
      });
      return;
    }

    if (foundUser.isDisabled) {
      toast({
        title: 'Already Disabled',
        description: 'This user account is already disabled',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      const userDocRef = doc(firestore, 'users', foundUser.id);
      await updateDoc(userDocRef, {
        isDisabled: true,
        disabledAt: new Date(),
        disabledBy: user?.sfaId || 'founder',
        disabledReason: 'Account disabled by founder'
      });

      // Update users_by_uid if exists
      if (foundUser.uid) {
        const uidDocRef = doc(firestore, 'users_by_uid', foundUser.uid);
        const uidDocSnapshot = await getDoc(uidDocRef);
        
        if (uidDocSnapshot.exists()) {
          await updateDoc(uidDocRef, {
            isDisabled: true,
            disabledAt: new Date()
          });
        }
      }
      
      toast({
        title: 'Success',
        description: `User ${foundUser.full_name} has been disabled successfully`
      });

      setFoundUser(null);
      setSearchId('');
      setShowDisableDialog(false);

    } catch (error) {
      console.error('Error disabling user:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable user. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Enable User
  const handleEnableUser = async () => {
    if (!foundUser || !requireFounder(user, toast)) return;

    if (!foundUser.isDisabled) {
      toast({
        title: 'Not Disabled',
        description: 'This user account is not disabled',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      const userDocRef = doc(firestore, 'users', foundUser.id);
      await updateDoc(userDocRef, {
        isDisabled: false,
        enabledAt: new Date(),
        enabledBy: user?.sfaId || 'founder',
        disabledAt: null,
        disabledBy: null,
        disabledReason: null
      });

      // Update users_by_uid if exists
      if (foundUser.uid) {
        const uidDocRef = doc(firestore, 'users_by_uid', foundUser.uid);
        const uidDocSnapshot = await getDoc(uidDocRef);
        
        if (uidDocSnapshot.exists()) {
          await updateDoc(uidDocRef, {
            isDisabled: false,
            enabledAt: new Date()
          });
        }
      }
      
      toast({
        title: 'Success',
        description: `User ${foundUser.full_name} has been enabled successfully`
      });

      setFoundUser(null);
      setSearchId('');
      setShowEnableDialog(false);

    } catch (error) {
      console.error('Error enabling user:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable user. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete User (Permanent)
  const handleDeleteUser = async () => {
    if (!foundUser || !requireFounder(user, toast)) return;

    if (foundUser.isProtected || foundUser.sfa_id === user?.sfaId) {
      toast({
        title: 'Cannot Delete',
        description: foundUser.isProtected 
          ? 'This user is a protected admin and cannot be deleted'
          : 'You cannot delete your own account',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Call Cloud Function to delete user (Auth + Firestore)
      const deleteUserFunction = httpsCallable(functions, 'deleteUserAccount');
      
      const result = await deleteUserFunction({
        uid: foundUser.uid,
        sfaId: foundUser.sfa_id,
        reason: `Deleted by founder ${user?.sfaId}`
      });

      console.log('✅ User deletion result:', result.data);

      toast({
        title: 'Success',
        description: `User ${foundUser.full_name} has been permanently deleted (Auth + Database)`,
      });

      setFoundUser(null);
      setSearchId('');
      setShowDeleteDialog(false);

    } catch (error) {
      console.error('Error deleting user:', error);
      
      // Handle specific Firebase Function error codes
      if (error.code === 'functions/permission-denied') {
        toast({
          title: 'Permission Denied',
          description: 'Only founders can delete user accounts',
          variant: 'destructive'
        });
      } else if (error.code === 'functions/invalid-argument') {
        toast({
          title: 'Invalid Input',
          description: error.message || 'Invalid user data provided',
          variant: 'destructive'
        });
      } else if (error.code === 'functions/not-found') {
        toast({
          title: 'User Not Found',
          description: error.message || 'User document not found',
          variant: 'destructive'
        });
      } else if (error.code === 'functions/internal') {
        toast({
          title: 'Server Error',
          description: error.message || 'Internal server error occurred',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete user. Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || isLoadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isFounder) {
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
            Back to Founder Menu
          </Button>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <UserX className="w-16 h-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4">User Management</h1>
            <p className="text-lg text-text-secondary">Enable, disable, or permanently delete user accounts</p>
          </div>

          {/* Search User */}
          <Card className="p-6 mb-6">
            <CardHeader>
              <CardTitle>Search User</CardTitle>
              <CardDescription>Enter the SFA ID or CMS ID to manage user account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter SFA ID or CMS ID (e.g., SFA1001 or CMS12345)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value.replace(/\s/g, '').toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                  style={{ textTransform: 'uppercase' }}
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
            </CardContent>
          </Card>

          {/* User Details */}
          {foundUser && (
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 flex-wrap">
                  User Details
                  {foundUser.isProtected && (
                    <span className="px-2 py-1 bg-warning-light text-warning rounded-dashboard-sm text-xs font-medium flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      PROTECTED
                    </span>
                  )}
                  {foundUser.isFounder && (
                    <span className="px-2 py-1 bg-warning-light text-warning rounded-dashboard-sm text-xs font-medium">
                      FOUNDER
                    </span>
                  )}
                  {foundUser.isAdmin && !foundUser.isFounder && (
                    <span className="px-2 py-1 bg-primary-light text-primary rounded-dashboard-sm text-xs font-medium">
                      ADMIN
                    </span>
                  )}
                  {foundUser.isCollectionMember && (
                    <span className="px-2 py-1 bg-accent-light text-accent rounded-dashboard-sm text-xs font-medium">
                      COLLECTION MEMBER
                    </span>
                  )}
                  {foundUser.isDisabled && (
                    <span className="px-2 py-1 bg-destructive-light text-destructive rounded-dashboard-sm text-xs font-medium flex items-center gap-1">
                      <UserX className="w-3 h-3" />
                      DISABLED
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-text-secondary">Full Name</p>
                    <p className="text-lg font-semibold text-text-primary">{foundUser.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">SFA ID</p>
                    <p className="text-lg font-semibold text-primary">{foundUser.sfa_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">CMS ID</p>
                    <p className="text-lg font-semibold text-text-primary">{foundUser.cms_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Lobby</p>
                    <p className="text-lg font-semibold text-text-primary">{foundUser.lobby_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Email</p>
                    <p className="text-lg font-semibold text-text-primary">{foundUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Phone</p>
                    <p className="text-lg font-semibold text-text-primary">{foundUser.phone_number || 'N/A'}</p>
                  </div>
                </div>

                {/* Account Status */}
                {foundUser.isDisabled && (
                  <div className="mb-6 p-4 bg-destructive-light border border-destructive rounded-dashboard">
                    <p className="font-semibold text-destructive mb-2 flex items-center gap-2">
                      <UserX className="w-5 h-5" />
                      Account Status: Disabled
                    </p>
                    <div className="text-sm text-text-secondary space-y-1">
                      {foundUser.disabledAt && (
                        <p>Disabled on: {foundUser.disabledAt.toLocaleDateString()}</p>
                      )}
                      {foundUser.disabledBy && (
                        <p>Disabled by: {foundUser.disabledBy}</p>
                      )}
                      <p className="mt-2 text-destructive font-medium">
                        This user cannot log in to their account.
                      </p>
                    </div>
                  </div>
                )}

                {foundUser.isProtected && (
                  <div className="mb-6 p-4 bg-warning-light border border-warning rounded-dashboard flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-semibold text-warning">Protected Admin</p>
                      <p className="text-sm text-text-secondary mt-1">
                        This user is marked as a protected admin and cannot be disabled or deleted.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {foundUser.isDisabled ? (
                    <Button 
                      variant="default"
                      onClick={() => setShowEnableDialog(true)}
                      disabled={foundUser.sfa_id === user?.sfaId}
                      className="flex items-center gap-2 bg-success hover:bg-success/90"
                    >
                      <UserCheck className="w-4 h-4" />
                      {foundUser.sfa_id === user?.sfaId ? 'Cannot Enable (Self)' : 'Enable User Account'}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={() => setShowDisableDialog(true)}
                      disabled={foundUser.isProtected || foundUser.sfa_id === user?.sfaId}
                      className="flex items-center gap-2 border-warning text-warning hover:bg-warning-light"
                    >
                      <UserX className="w-4 h-4" />
                      {foundUser.isProtected
                        ? 'Cannot Disable (Protected)'
                        : foundUser.sfa_id === user?.sfaId
                        ? 'Cannot Disable (Self)'
                        : 'Disable User Account'
                      }
                    </Button>
                  )}

                  <Button 
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={foundUser.isProtected || foundUser.sfa_id === user?.sfaId}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {foundUser.isProtected
                      ? 'Cannot Delete (Protected)'
                      : foundUser.sfa_id === user?.sfaId
                      ? 'Cannot Delete (Self)'
                      : 'Delete Permanently'
                    }
                  </Button>
                </div>

                {/* Warning Note */}
                <div className="mt-6 p-4 bg-surface border border-border rounded-dashboard">
                  <p className="text-sm font-semibold text-text-primary mb-2">Action Notes:</p>
                  <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                    <li><strong>Disable:</strong> User cannot log in, but data is preserved (reversible)</li>
                    <li><strong>Enable:</strong> Restore access for a disabled user</li>
                    <li><strong>Delete:</strong> Permanently removes user from system (irreversible)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disable Confirmation Dialog */}
          <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Disable User Account?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>This will disable the user account and prevent login for:</p>
                  <p className="font-semibold text-text-primary">
                    {foundUser?.full_name} ({foundUser?.sfa_id})
                  </p>
                  <div className="p-3 bg-info-light border border-info rounded-lg mt-2">
                    <p className="text-sm text-text-secondary">
                      <strong>Note:</strong> All user data and transaction history will be preserved. Only login access will be blocked. This action can be reversed.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDisableUser}
                  disabled={isProcessing}
                  className="bg-warning hover:bg-warning/90"
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                      Disabling...
                    </>
                  ) : (
                    'Yes, Disable Account'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Enable Confirmation Dialog */}
          <AlertDialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-success" />
                  Enable User Account?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>This will restore login access for:</p>
                  <p className="font-semibold text-text-primary">
                    {foundUser?.full_name} ({foundUser?.sfa_id})
                  </p>
                  <div className="p-3 bg-success-light border border-success rounded-lg mt-2">
                    <p className="text-sm text-text-secondary">
                      <strong>Note:</strong> The user will be able to log in and access their account again.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleEnableUser}
                  disabled={isProcessing}
                  className="bg-success hover:bg-success/90"
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                      Enabling...
                    </>
                  ) : (
                    'Yes, Enable Account'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  Permanently Delete User?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>⚠️ This action <strong className="text-destructive">CANNOT BE UNDONE</strong>!</p>
                  <p>You are about to permanently delete:</p>
                  <div className="p-3 bg-surface rounded-lg">
                    <p className="font-semibold text-text-primary">{foundUser?.full_name}</p>
                    <p className="text-sm text-text-secondary mt-1">
                      SFA ID: <span className="font-mono">{foundUser?.sfa_id}</span>
                    </p>
                  </div>
                  <div className="p-3 bg-destructive-light border border-destructive rounded-lg">
                    <p className="text-sm font-semibold text-destructive mb-1">This will permanently remove:</p>
                    <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                      <li>✅ Firebase Authentication account (email: {foundUser?.email})</li>
                      <li>✅ User profile from Firestore database</li>
                      <li>✅ Associated records in users_by_uid collection</li>
                      <li>⚠️ User will lose all access immediately</li>
                      <li>📝 Action will be logged in audit trail</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-warning-light border border-warning rounded-lg">
                    <p className="text-xs text-text-secondary">
                      <strong className="text-warning">Note:</strong> Transaction history and payment records will remain in the system for audit purposes. The user will NOT be able to create a new account with the same email until manually re-registered.
                    </p>
                  </div>
                  <p className="text-xs text-destructive font-semibold">
                    This deletion removes both authentication and database records.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  disabled={isProcessing}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete Permanently'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
};

export default UserManagement;