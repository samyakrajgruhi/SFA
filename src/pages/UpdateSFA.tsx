import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search, AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
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
  uid: string;
  [key: string]: any; // For all other fields
}

const UpdateSFA = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [oldSfaId, setOldSfaId] = useState('');
  const [newSfaId, setNewSfaId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [foundUser, setFoundUser] = useState<UserInfo | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  
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

  const handleSearch = async () => {
    if (!oldSfaId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter the old SFA ID',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSearching(true);
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('sfa_id', '==', oldSfaId.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: 'Not Found',
          description: 'No user found with this SFA ID',
          variant: 'destructive'
        });
        setFoundUser(null);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserInfo;
      
      setFoundUser({
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
      setIsSearching(false);
    }
  };

  const handleUpdateSFA = async () => {
    if (!foundUser || !newSfaId.trim()) return;

    if (!requireFounder(user, toast)) return;

    // Validate new SFA ID format
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
      setIsUpdating(true);

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
        setIsUpdating(false);
        return;
      }

      // Create new document with correct SFA ID
      const { id, ...userDataWithoutId } = foundUser;
      const updatedUserData = {
        ...userDataWithoutId,
        sfa_id: cleanedNewSfaId,
        updatedAt: new Date(),
        updatedBy: user?.sfaId || 'founder',
        previousSfaId: foundUser.sfa_id // Keep record of old ID
      };

      // Set new document with new SFA ID as document ID
      await setDoc(doc(firestore, 'users', cleanedNewSfaId), updatedUserData);

        await setDoc(doc(firestore, 'users_by_uid', foundUser.uid), {
            uid: foundUser.uid,
            sfa_id: cleanedNewSfaId,
            email: foundUser.email,
            full_name: foundUser.full_name,
            isAdmin: foundUser.isAdmin || false,
            isFounder: foundUser.isFounder || false,
            isCollectionMember: foundUser.isCollectionMember || false,
            updatedAt: new Date()
        });

      // Delete old document
      await deleteDoc(doc(firestore, 'users', foundUser.id));

      toast({
        title: 'Success',
        description: `SFA ID updated from ${foundUser.sfa_id} to ${cleanedNewSfaId}`,
      });

      // Reset form
      setOldSfaId('');
      setNewSfaId('');
      setFoundUser(null);
      setShowUpdateDialog(false);
    } catch (error) {
      console.error('Error updating SFA ID:', error);
      toast({
        title: 'Error',
        description: 'Failed to update SFA ID',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
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
            <h1 className="text-4xl font-bold text-text-primary mb-4">Update SFA ID</h1>
            <p className="text-lg text-text-secondary">
              Update incorrect SFA ID for a user
            </p>
          </div>

          {/* Search Card */}
          <Card className="p-6 mb-8">
            <CardHeader>
              <CardTitle>Find User by Old SFA ID</CardTitle>
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
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching || !oldSfaId.trim()}
                  className="w-full"
                >
                  {isSearching ? (
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
          {foundUser && (
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
                      <p className="font-semibold text-text-primary">{foundUser.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">Current SFA ID</p>
                      <p className="font-semibold text-primary">{foundUser.sfa_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">CMS ID</p>
                      <p className="font-semibold text-text-primary">{foundUser.cms_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">Lobby</p>
                      <p className="font-semibold text-text-primary">{foundUser.lobby_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">Email</p>
                      <p className="font-semibold text-text-primary">{foundUser.email}</p>
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
                      onClick={() => setShowUpdateDialog(true)}
                      disabled={!newSfaId.trim() || newSfaId.trim().toUpperCase() === foundUser.sfa_id}
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

          {/* Confirmation Dialog */}
          <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-warning" />
        Confirm SFA ID Update
      </AlertDialogTitle>
      <AlertDialogDescription className="space-y-2">
        {/* ✅ FIXED: Use div instead of p tags */}
        <div>You are about to update the SFA ID for:</div>
        <div className="font-semibold text-text-primary">
          {foundUser?.full_name}
        </div>
        <div className="text-sm">
          From: <span className="font-mono text-destructive">{foundUser?.sfa_id}</span>
        </div>
        <div className="text-sm">
          To: <span className="font-mono text-success">{newSfaId.toUpperCase()}</span>
        </div>
        <div className="mt-4 p-3 bg-info-light border border-info rounded-lg">
          <div className="text-xs font-semibold text-info mb-1">How this works:</div>
          <ul className="text-xs text-text-secondary space-y-1">
            <li>✅ User logs in with same email/password</li>
            <li>✅ System finds them using their unique UID (not SFA ID)</li>
            <li>✅ All transaction history preserved</li>
            <li>✅ Only the SFA ID changes in their profile</li>
          </ul>
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleUpdateSFA}
        disabled={isUpdating}
        className="bg-primary"
      >
        {isUpdating ? 'Updating...' : 'Confirm Update'}
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