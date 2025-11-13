import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search, AlertTriangle, Check, Mail, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
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

interface UserInfo {
  id: string;
  full_name: string;
  sfa_id: string;
  cms_id: string;
  lobby_id: string;
  email: string;
  uid: string;
  [key: string]: any;
}

const UpdateSFA = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // SFA ID Update State
  const [oldSfaId, setOldSfaId] = useState('');
  const [newSfaId, setNewSfaId] = useState('');
  const [foundUserSFA, setFoundUserSFA] = useState<UserInfo | null>(null);
  const [isSearchingSFA, setIsSearchingSFA] = useState(false);
  const [isUpdatingSFA, setIsUpdatingSFA] = useState(false);
  const [showSFAUpdateDialog, setShowSFAUpdateDialog] = useState(false);
  
  // Email Update State
  const [searchIdForEmail, setSearchIdForEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [foundUserEmail, setFoundUserEmail] = useState<UserInfo | null>(null);
  const [isSearchingEmail, setIsSearchingEmail] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [showEmailUpdateDialog, setShowEmailUpdateDialog] = useState(false);
  
  const isFounder = user?.isFounder;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isFounder) {
    return <Navigate to="/" replace />;
  }

  // ==================== SFA ID UPDATE FUNCTIONS ====================

  const handleSearchSFA = async () => {
    if (!oldSfaId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter the old SFA ID',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSearchingSFA(true);
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('sfa_id', '==', oldSfaId.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: 'Not Found',
          description: 'No user found with this SFA ID',
          variant: 'destructive'
        });
        setFoundUserSFA(null);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserInfo;
      
      setFoundUserSFA({
        id: userDoc.id,
        ...userData
      });

      toast({
        title: 'User Found',
        description: `Found: ${userData.full_name}`,
      });
    } catch (error) {
      console.error('Error searching user:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for user',
        variant: 'destructive'
      });
    } finally {
      setIsSearchingSFA(false);
    }
  };

  const handleUpdateSFA = async () => {
    if (!foundUserSFA || !newSfaId.trim()) return;
    if (!requireFounder(user, toast)) return;

    const cleanedNewSfaId = newSfaId.trim().toUpperCase();
    if (!cleanedNewSfaId.startsWith('SFA') || cleanedNewSfaId.length < 7) {
      toast({
        title: 'Invalid Format',
        description: 'New SFA ID must be in format: SFA followed by numbers (e.g., SFA1001)',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUpdatingSFA(true);

      // Check if new SFA ID already exists
      const usersRef = collection(firestore, 'users');
      const checkQuery = query(usersRef, where('sfa_id', '==', cleanedNewSfaId));
      const checkSnapshot = await getDocs(checkQuery);

      if (!checkSnapshot.empty) {
        toast({
          title: 'SFA ID Already Exists',
          description: 'The new SFA ID is already in use by another user',
          variant: 'destructive'
        });
        setIsUpdatingSFA(false);
        return;
      }

      const { id, ...userDataWithoutId } = foundUserSFA;
      const updatedUserData = {
        ...userDataWithoutId,
        sfa_id: cleanedNewSfaId,
        updatedAt: new Date(),
        updatedBy: user?.sfaId || 'founder',
        previousSfaId: foundUserSFA.sfa_id
      };

      // Create new document
      await setDoc(doc(firestore, 'users', cleanedNewSfaId), updatedUserData);

      // Update users_by_uid document
      await setDoc(doc(firestore, 'users_by_uid', foundUserSFA.uid), {
        uid: foundUserSFA.uid,
        sfa_id: cleanedNewSfaId,
        email: foundUserSFA.email,
        full_name: foundUserSFA.full_name,
        isAdmin: foundUserSFA.isAdmin || false,
        isFounder: foundUserSFA.isFounder || false,
        isCollectionMember: foundUserSFA.isCollectionMember || false,
        updatedAt: new Date()
      });

      // Delete old document
      await deleteDoc(doc(firestore, 'users', foundUserSFA.id));

      toast({
        title: 'Success',
        description: `SFA ID updated from ${foundUserSFA.sfa_id} to ${cleanedNewSfaId}`,
      });

      // Reset form
      setOldSfaId('');
      setNewSfaId('');
      setFoundUserSFA(null);
      setShowSFAUpdateDialog(false);
    } catch (error) {
      console.error('Error updating SFA ID:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update SFA ID',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingSFA(false);
    }
  };

  // ==================== EMAIL UPDATE FUNCTIONS ====================

  const handleSearchEmail = async () => {
    if (!searchIdForEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an SFA ID or CMS ID',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSearchingEmail(true);
      const usersRef = collection(firestore, 'users');
      
      // Try SFA ID first
      let q = query(usersRef, where('sfa_id', '==', searchIdForEmail.trim().toUpperCase()));
      let querySnapshot = await getDocs(q);
      
      // If not found, try CMS ID
      if (querySnapshot.empty) {
        q = query(usersRef, where('cms_id', '==', searchIdForEmail.trim().toUpperCase()));
        querySnapshot = await getDocs(q);
      }

      if (querySnapshot.empty) {
        toast({
          title: 'Not Found',
          description: 'No user found with this SFA ID or CMS ID',
          variant: 'destructive'
        });
        setFoundUserEmail(null);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserInfo;
      
      setFoundUserEmail({
        id: userDoc.id,
        ...userData
      });

      toast({
        title: 'User Found',
        description: `Found: ${userData.full_name}`,
      });
    } catch (error) {
      console.error('Error searching user:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for user',
        variant: 'destructive'
      });
    } finally {
      setIsSearchingEmail(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!foundUserEmail || !newEmail.trim()) return;
    if (!requireFounder(user, toast)) return;

    const cleanedEmail = newEmail.trim().toLowerCase();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanedEmail)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    // Check if it's the same email
    if (cleanedEmail === foundUserEmail.email.toLowerCase()) {
      toast({
        title: 'No Change',
        description: 'The new email is the same as the current email',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUpdatingEmail(true);

      // Check if email is already in use by another user
      const usersRef = collection(firestore, 'users');
      const emailQuery = query(usersRef, where('email', '==', cleanedEmail));
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        toast({
          title: 'Email Already Exists',
          description: 'This email is already registered to another user',
          variant: 'destructive'
        });
        setIsUpdatingEmail(false);
        return;
      }

      // Update main user document
      const userDocRef = doc(firestore, 'users', foundUserEmail.id);
      await updateDoc(userDocRef, {
        email: cleanedEmail,
        updatedAt: new Date(),
        updatedBy: user?.sfaId || 'founder',
        previousEmail: foundUserEmail.email
      });

      // Update users_by_uid document
      const uidDocRef = doc(firestore, 'users_by_uid', foundUserEmail.uid);
      await updateDoc(uidDocRef, {
        email: cleanedEmail,
        updatedAt: new Date()
      });

      toast({
        title: 'Success',
        description: `Email updated from ${foundUserEmail.email} to ${cleanedEmail}. User should use "Forgot Password" to access their account.`,
      });

      // Reset form
      setSearchIdForEmail('');
      setNewEmail('');
      setFoundUserEmail(null);
      setShowEmailUpdateDialog(false);
    } catch (error) {
      console.error('Error updating email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update email',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

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
              <div className="p-4 bg-primary-light rounded-full">
                <Edit className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4">Update User Details</h1>
            <p className="text-lg text-text-secondary">Update SFA ID or email address for users</p>
          </div>

          <Tabs defaultValue="sfa" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="sfa">Update SFA ID</TabsTrigger>
              <TabsTrigger value="email">Update Email</TabsTrigger>
            </TabsList>

            {/* ==================== SFA ID UPDATE TAB ==================== */}
            <TabsContent value="sfa" className="space-y-6">
              {/* Search Card */}
              <Card className="p-6">
                <CardHeader>
                  <CardTitle>Find User by SFA ID</CardTitle>
                  <CardDescription>Enter the incorrect SFA ID to find the user</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="oldSfaId">Old (Incorrect) SFA ID</Label>
                      <Input
                        id="oldSfaId"
                        placeholder="Enter old SFA ID (e.g., SFA1001)"
                        value={oldSfaId}
                        onChange={(e) => setOldSfaId(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchSFA()}
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    <Button 
                      onClick={handleSearchSFA} 
                      disabled={isSearchingSFA || !oldSfaId.trim()}
                      className="w-full"
                    >
                      {isSearchingSFA ? (
                        <>
                          <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Search User
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* User Details & Update Card */}
              {foundUserSFA && (
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle>User Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* User Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface rounded-lg">
                        <div>
                          <p className="text-sm text-text-secondary">Full Name</p>
                          <p className="font-semibold text-text-primary">{foundUserSFA.full_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">Current SFA ID</p>
                          <p className="font-semibold text-primary">{foundUserSFA.sfa_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">CMS ID</p>
                          <p className="font-semibold text-text-primary">{foundUserSFA.cms_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">Email</p>
                          <p className="font-semibold text-text-primary">{foundUserSFA.email}</p>
                        </div>
                      </div>

                      {/* New SFA ID Input */}
                      <div className="space-y-4 border-t border-border pt-6">
                        <div>
                          <Label htmlFor="newSfaId">New (Correct) SFA ID</Label>
                          <Input
                            id="newSfaId"
                            placeholder="Enter correct SFA ID (e.g., SFA1002)"
                            value={newSfaId}
                            onChange={(e) => setNewSfaId(e.target.value.toUpperCase())}
                            style={{ textTransform: 'uppercase' }}
                          />
                        </div>

                        <div className="p-4 bg-warning-light border border-warning rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                            <div>
                              <div className="font-semibold text-warning mb-1">Important Notes:</div>
                              <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                                <li>The user's email and authentication will remain the same</li>
                                <li>All transaction history will be preserved</li>
                                <li>A new document will be created with the correct SFA ID</li>
                                <li>The old document will be deleted</li>
                                <li>This action cannot be undone</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={() => setShowSFAUpdateDialog(true)}
                          disabled={!newSfaId.trim() || newSfaId.trim().toUpperCase() === foundUserSFA.sfa_id}
                          className="w-full"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Update SFA ID
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ==================== EMAIL UPDATE TAB ==================== */}
            <TabsContent value="email" className="space-y-6">
              {/* Search Card */}
              <Card className="p-6">
                <CardHeader>
                  <CardTitle>Find User</CardTitle>
                  <CardDescription>Search by SFA ID or CMS ID</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="searchIdForEmail">SFA ID or CMS ID</Label>
                      <Input
                        id="searchIdForEmail"
                        placeholder="Enter SFA ID or CMS ID"
                        value={searchIdForEmail}
                        onChange={(e) => setSearchIdForEmail(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchEmail()}
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    <Button 
                      onClick={handleSearchEmail} 
                      disabled={isSearchingEmail || !searchIdForEmail.trim()}
                      className="w-full"
                    >
                      {isSearchingEmail ? (
                        <>
                          <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Search User
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* User Details & Email Update Card */}
              {foundUserEmail && (
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle>User Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* User Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface rounded-lg">
                        <div>
                          <p className="text-sm text-text-secondary">Full Name</p>
                          <p className="font-semibold text-text-primary">{foundUserEmail.full_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">SFA ID</p>
                          <p className="font-semibold text-primary">{foundUserEmail.sfa_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">CMS ID</p>
                          <p className="font-semibold text-text-primary">{foundUserEmail.cms_id}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-text-secondary">Current Email</p>
                          <p className="font-semibold text-text-primary break-all">{foundUserEmail.email}</p>
                        </div>
                      </div>

                      {/* New Email Input */}
                      <div className="space-y-4 border-t border-border pt-6">
                        <div>
                          <Label htmlFor="newEmail">New Email Address</Label>
                          <Input
                            id="newEmail"
                            type="email"
                            placeholder="Enter new email address"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value.toLowerCase())}
                          />
                        </div>

                        <div className="p-4 bg-warning-light border border-warning rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                            <div>
                              <div className="font-semibold text-warning mb-1">Important Notes:</div>
                              <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                                <li>User will need to use "Forgot Password" to reset their password</li>
                                <li>Old email will no longer work for login</li>
                                <li>All user data and transactions will be preserved</li>
                                <li>The user document will be updated in both collections</li>
                                <li>This action is logged and tracked</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={() => setShowEmailUpdateDialog(true)}
                          disabled={!newEmail.trim() || newEmail.trim().toLowerCase() === foundUserEmail.email.toLowerCase()}
                          className="w-full"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Update Email Address
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* SFA ID Update Confirmation Dialog */}
          <AlertDialog open={showSFAUpdateDialog} onOpenChange={setShowSFAUpdateDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Confirm SFA ID Update
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <div>You are about to update the SFA ID for:</div>
                  <div className="font-semibold text-text-primary">
                    {foundUserSFA?.full_name}
                  </div>
                  <div className="text-sm">
                    From: <span className="font-mono text-destructive">{foundUserSFA?.sfa_id}</span>
                  </div>
                  <div className="text-sm">
                    To: <span className="font-mono text-success">{newSfaId.toUpperCase()}</span>
                  </div>
                  <div className="mt-4 p-3 bg-info-light border border-info rounded-lg">
                    <div className="text-xs font-semibold text-info mb-1">How this works:</div>
                    <ul className="text-xs text-text-secondary space-y-1">
                      <li>✅ User logs in with same email/password</li>
                      <li>✅ System finds them using their unique UID</li>
                      <li>✅ All transaction history preserved</li>
                      <li>✅ Only the SFA ID changes</li>
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleUpdateSFA}
                  disabled={isUpdatingSFA}
                  className="bg-primary"
                >
                  {isUpdatingSFA ? 'Updating...' : 'Confirm Update'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Email Update Confirmation Dialog */}
          <AlertDialog open={showEmailUpdateDialog} onOpenChange={setShowEmailUpdateDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Confirm Email Update
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <div>You are about to update the email for:</div>
                  <div className="font-semibold text-text-primary">
                    {foundUserEmail?.full_name} ({foundUserEmail?.sfa_id})
                  </div>
                  <div className="text-sm">
                    From: <span className="font-mono text-destructive break-all">{foundUserEmail?.email}</span>
                  </div>
                  <div className="text-sm">
                    To: <span className="font-mono text-success break-all">{newEmail}</span>
                  </div>
                  <div className="mt-4 p-3 bg-warning-light border border-warning rounded-lg">
                    <div className="text-xs font-semibold text-warning mb-1">⚠️ Critical:</div>
                    <ul className="text-xs text-text-secondary space-y-1">
                      <li>• User MUST use "Forgot Password" to access account</li>
                      <li>• Old email will stop working immediately</li>
                      <li>• All data and transactions remain intact</li>
                      <li>• This action is logged with your SFA ID</li>
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleUpdateEmail}
                  disabled={isUpdatingEmail}
                  className="bg-primary"
                >
                  {isUpdatingEmail ? 'Updating...' : 'Confirm Update'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
};

export default UpdateSFA;