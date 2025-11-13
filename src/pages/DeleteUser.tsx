import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, UserX, Search, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { firestore, auth } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import {
  fetchSignInMethodsForEmail,
  getAuth,
  updateEmail
} from 'firebase/auth';
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
import { requireFounder } from '@/hooks/useFounderCheck';

interface UserInfo {
  id: string;
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
  isDisabledAt?: boolean;
  disabledAt?: Date;
  disabledBy?: string;
}


const DeleteUser = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isFounder = user?.isFounder;

  const handleFounderAction = async () => {
    if(!requireFounder(user,toast)) return;
  }
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [foundUser, setFoundUser] = useState<UserInfo | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [protectedAdmins, setProtectedAdmins] = useState<string[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // ✅ Fetch protected admins from Firestore config
  useEffect(() => {
    const fetchProtectedAdmins = async () => {
      try {
        setIsLoadingConfig(true);
        const configDoc = await getDoc(doc(firestore, 'config', 'protected_admins'));
        
        if (configDoc.exists()) {
          const data = configDoc.data();
          setProtectedAdmins(data.sfa_ids || []);
          console.log('✅ Loaded protected admins:', data.sfa_ids);
        } else {
          console.warn('⚠️ No protected admins config found');
          setProtectedAdmins([]);
        }
      } catch (error) {
        console.error('❌ Error fetching protected admins:', error);
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
      let q = query(usersRef, where('sfa_id', '==', searchId.trim()));
      let querySnapshot = await getDocs(q);
      
      // If not found by SFA ID, try CMS ID
      if (querySnapshot.empty) {
        q = query(usersRef, where('cms_id', '==', searchId.trim()));
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
      
      // ✅ Check if user is protected
      const isProtected = protectedAdmins.includes(userData.sfa_id);
      
      setFoundUser({
        id: userDoc.id,
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
        isDisabled: userData.isDisabled || false, // ✅ NEW
        disabledAt: userData.disabledAt?.toDate(), // ✅ NEW
        disabledBy: userData.disabledBy // ✅ NEW
      });

      if (isProtected) {
        toast({
          title: 'Protected Admin',
          description: 'This user is a protected admin and cannot be disabled',
          variant: 'destructive'
        });
      }

      // ✅ Show warning if already disabled
      if (userData.isDisabled) {
        toast({
          title: 'Account Disabled',
          description: 'This user account is already disabled',
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

  const handleDeleteUser = async () => {
    if (!foundUser) return;

    // ✅ Check if user is protected or trying to delete self
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

    if(foundUser.isDisabled) {
      toast({
        title: 'Already Disabled',
        description: 'This user account is already disabled',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsDeleting(true);
      
      const userDocRef = doc(firestore, 'users', foundUser.id);
      await updateDoc(userDocRef, {
        isDisabled: true,
        disabledAt: new Date(),
        disabledBy: user?.sfaId || 'admin',
        disabledReason: 'Account disabled by admin'
      });
      
      toast({
        title: 'Success',
        description: `User ${foundUser.full_name} has been deleted successfully`,
      });

      // Reset form
      setFoundUser(null);
      setSearchId('');
      setShowDeleteDialog(false);

    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
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
            Back to Admin Menu
          </Button>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <UserX className="w-16 h-16 text-destructive" />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4">Delete User</h1>
            <p className="text-lg text-text-secondary">Remove a user account from the system</p>
            <div className="mt-4 p-4 bg-warning-light border border-warning rounded-dashboard">
              <p className="text-warning font-medium">
                ⚠️ Warning: This will disable the user's account and prevent them from logging in. Transaction data and user information will be preserved.
              </p>
            </div>
          </div>

          {/* Search User */}
          <Card className="p-6 mb-6">
            <CardHeader>
              <CardTitle>Search User</CardTitle>
              <CardDescription>Enter the SFA ID or CMS ID of the user you want to delete</CardDescription>
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
                <CardTitle className="flex items-center gap-2">
                  User Details
                  {foundUser.isProtected && (
                    <span className="px-2 py-1 bg-warning-light text-warning rounded-dashboard-sm text-xs font-medium flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      PROTECTED ADMIN
                    </span>
                  )}
                  {foundUser.isFounder && !foundUser.isProtected && (
                    <span className="px-2 py-1 bg-primary-light text-primary rounded-dashboard-sm text-xs font-medium">
                      ADMIN
                    </span>
                  )}
                  {foundUser.isCollectionMember && (
                    <span className="px-2 py-1 bg-accent-light text-accent rounded-dashboard-sm text-xs font-medium">
                      COLLECTION MEMBER
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

                {foundUser.isDisabled && (
                  <div className="mb-6 p-4 bg-destructive-light border border-destructive rounded-dashboard">
                    <p className="font-semibold text-destructive mb-2">Account Status: Disabled</p>
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
                        This user is marked as a protected admin in the system configuration and cannot be deleted.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={foundUser.isProtected || foundUser.sfa_id === user?.sfaId || foundUser.isDisabled}
                    className="flex items-center gap-2"
                  >
                    <UserX className="w-4 h-4" />
                    {foundUser.isProtected
                      ? 'Cannot Disable (Protected)'
                      : foundUser.sfa_id === user?.sfaId
                      ? 'Cannot Disable (Self)'
                      : foundUser.isDisabled
                      ? 'Already Disabled'
                      : 'Disable User Account'
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    This will disable the user account and prevent login for:
                  </p>
                  <p className="font-semibold text-text-primary">
                    {foundUser?.full_name} ({foundUser?.sfa_id})
                  </p>
                  <p className="text-sm text-text-muted">
                    Note: All user data and transaction history will be preserved. Only login access will be blocked.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                      Disabling...
                    </>
                  ) : (
                    'Yes, Disable User'
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

export default DeleteUser;