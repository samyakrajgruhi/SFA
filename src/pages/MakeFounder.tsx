import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Shield, Search, AlertTriangle, ShieldCheck, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
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
  uid: string;
  full_name: string;
  sfa_id: string;
  cms_id: string;
  lobby_id: string;
  email: string;
  isFounder?: boolean;
  isAdmin?: boolean;
  isCollectionMember?: boolean;
}

const MakeFounder = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const isFounder = user?.isFounder;
  
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [foundUser, setFoundUser] = useState<UserInfo | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
    
    // Try searching by SFA ID first
    let q = query(usersRef, where('sfa_id', '==', searchId.trim().toUpperCase()));
    let querySnapshot = await getDocs(q);
    
    // If not found by SFA ID, try CMS ID
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
    
    // ✅ Include UID in foundUser state
    setFoundUser({
      id: userDoc.id,
      uid: userData.uid || '', // ✅ Add UID
      full_name: userData.full_name || 'Unknown',
      sfa_id: userData.sfa_id || '',
      cms_id: userData.cms_id || '',
      lobby_id: userData.lobby_id || '',
      email: userData.email || '',
      isFounder: userData.isFounder || false,
      isAdmin: userData.isAdmin || false,
      isCollectionMember: userData.isCollectionMember || false
    });

    if (userData.isFounder) {
      toast({
        title: 'Already a Founder',
        description: 'This user already has founder privileges',
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

  const handleMakeFounder = async () => {
    if (!foundUser) return;
    if (!requireFounder(user, toast)) return;

    try {
        setIsUpdating(true);

        // Update main users document (using SFA ID as document ID)
        const userDocRef = doc(firestore, 'users', foundUser.id);
        await updateDoc(userDocRef, {
        isFounder: true,
        isAdmin: true, // Founders are also admins
        founderGrantedAt: new Date(),
        founderGrantedBy: user?.sfaId || 'founder',
        updatedAt: new Date()
        });

        // First, get the user's SFA ID from the users document
        const userSnapshot = await getDoc(userDocRef);
        const userData = userSnapshot.data();
        
        if (!userData?.uid) {
        throw new Error('User UID not found');
        }

        // Now update using the UID as the document ID
        const uidDocRef = doc(firestore, 'users_by_uid', userData.uid);
        
        // Check if document exists, if not create it
        const uidDocSnapshot = await getDoc(uidDocRef);
        
        if (uidDocSnapshot.exists()) {
        await updateDoc(uidDocRef, {
            isFounder: true,
            isAdmin: true,
            updatedAt: new Date()
        });
        } else {
        // Create the document if it doesn't exist
        await setDoc(uidDocRef, {
            uid: userData.uid,
            sfa_id: foundUser.sfa_id,
            email: foundUser.email,
            full_name: foundUser.full_name,
            isFounder: true,
            isAdmin: true,
            isCollectionMember: foundUser.isCollectionMember || false,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        }

        toast({
        title: 'Success',
        description: `${foundUser.full_name} has been granted founder privileges`,
        });

        // Reset form
        setFoundUser(null);
        setSearchId('');
        setShowConfirmDialog(false);
    } catch (error: any) {
        console.error('Error making founder:', error);
        toast({
        title: 'Error',
        description: error.message || 'Failed to grant founder privileges',
        variant: 'destructive'
        });
    } finally {
        setIsUpdating(false);
    }
    };

  // Update the handleRevokeFounder function:

    const handleRevokeFounder = async () => {
        if (!foundUser) return;
        if (!requireFounder(user, toast)) return;

        // Prevent self-revocation
        if (foundUser.sfa_id === user?.sfaId) {
            toast({
            title: 'Error',
            description: 'You cannot revoke your own founder privileges',
            variant: 'destructive'
            });
            return;
        }

        try {
            setIsUpdating(true);

            // ✅ Update main users document
            const userDocRef = doc(firestore, 'users', foundUser.id);
            await updateDoc(userDocRef, {
            isFounder: false,
            founderRevokedAt: new Date(),
            founderRevokedBy: user?.sfaId || 'founder',
            updatedAt: new Date()
            });

            // ✅ FIXED: Get UID and update users_by_uid document
            const userSnapshot = await getDoc(userDocRef);
            const userData = userSnapshot.data();
            
            if (userData?.uid) {
            const uidDocRef = doc(firestore, 'users_by_uid', userData.uid);
            const uidDocSnapshot = await getDoc(uidDocRef);
            
            if (uidDocSnapshot.exists()) {
                await updateDoc(uidDocRef, {
                isFounder: false,
                updatedAt: new Date()
                });
            }
            }

            toast({
            title: 'Success',
            description: `Founder privileges revoked from ${foundUser.full_name}`,
            });

            // Reset form
            setFoundUser(null);
            setSearchId('');
            setShowConfirmDialog(false);
        } catch (error: any) {
            console.error('Error revoking founder:', error);
            toast({
            title: 'Error',
            description: error.message || 'Failed to revoke founder privileges',
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
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-warning-light rounded-full">
                <Crown className="w-12 h-12 text-warning" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4">Make Founder</h1>
            <p className="text-lg text-text-secondary">Grant or revoke founder privileges</p>
            
            <div className="mt-6 p-4 bg-warning-light border-2 border-warning rounded-lg max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold text-warning mb-2">⚠️ Critical Operation</p>
                  <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                    <li>Founders have full system access</li>
                    <li>They can modify all settings and user roles</li>
                    <li>Only grant this to highly trusted individuals</li>
                    <li>This action is logged and tracked</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Search Card */}
          <Card className="p-6 mb-8">
            <CardHeader>
              <CardTitle>Find User</CardTitle>
              <CardDescription>Search by SFA ID or CMS ID</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Enter SFA ID or CMS ID"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={isSearching || !searchId.trim()}
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
              </div>
            </CardContent>
          </Card>

          {/* User Details Card */}
          {foundUser && (
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  User Details
                  {foundUser.isFounder && (
                    <span className="px-3 py-1 bg-warning-light text-warning rounded-dashboard text-sm font-medium flex items-center gap-1">
                      <Crown className="w-4 h-4" />
                      FOUNDER
                    </span>
                  )}
                  {foundUser.isAdmin && !foundUser.isFounder && (
                    <span className="px-3 py-1 bg-primary-light text-primary rounded-dashboard text-sm font-medium flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      ADMIN
                    </span>
                  )}
                </CardTitle>
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
                      <p className="text-sm text-text-secondary">SFA ID</p>
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
                    <div className="md:col-span-2">
                      <p className="text-sm text-text-secondary">Email</p>
                      <p className="font-semibold text-text-primary">{foundUser.email}</p>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className="p-4 bg-surface rounded-lg border border-border">
                    <p className="text-sm font-semibold mb-3">Current Privileges</p>
                    <div className="flex flex-wrap gap-2">
                      {foundUser.isFounder && (
                        <span className="px-3 py-1.5 bg-warning-light text-warning rounded-dashboard text-sm font-medium flex items-center gap-1">
                          <Crown className="w-4 h-4" />
                          Founder
                        </span>
                      )}
                      {foundUser.isAdmin && (
                        <span className="px-3 py-1.5 bg-primary-light text-primary rounded-dashboard text-sm font-medium flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          Admin
                        </span>
                      )}
                      {foundUser.isCollectionMember && (
                        <span className="px-3 py-1.5 bg-success-light text-success rounded-dashboard text-sm font-medium">
                          Collection Member
                        </span>
                      )}
                      {!foundUser.isFounder && !foundUser.isAdmin && !foundUser.isCollectionMember && (
                        <span className="px-3 py-1.5 bg-surface text-text-muted rounded-dashboard text-sm font-medium">
                          Regular Member
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    {foundUser.isFounder ? (
                      <Button
                        variant="destructive"
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={isUpdating || foundUser.sfa_id === user?.sfaId}
                        className="flex-1"
                      >
                        {isUpdating ? (
                          <>
                            <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                            Processing...
                          </>
                        ) : foundUser.sfa_id === user?.sfaId ? (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Cannot Revoke Self
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Revoke Founder Privileges
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={isUpdating}
                        className="flex-1 bg-warning hover:bg-warning/90"
                      >
                        {isUpdating ? (
                          <>
                            <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Crown className="w-4 h-4 mr-2" />
                            Grant Founder Privileges
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirmation Dialog */}
          <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  {foundUser?.isFounder ? 'Revoke Founder Privileges?' : 'Grant Founder Privileges?'}
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <div>
                    {foundUser?.isFounder ? (
                      <p>You are about to <strong className="text-destructive">REVOKE</strong> founder privileges from:</p>
                    ) : (
                      <p>You are about to <strong className="text-warning">GRANT</strong> founder privileges to:</p>
                    )}
                  </div>
                  <div className="p-3 bg-surface rounded-lg">
                    <p className="font-semibold text-text-primary">{foundUser?.full_name}</p>
                    <p className="text-sm text-text-secondary mt-1">
                      SFA ID: <span className="font-mono">{foundUser?.sfa_id}</span>
                    </p>
                  </div>
                  {!foundUser?.isFounder && (
                    <div className="p-3 bg-warning-light border border-warning rounded-lg">
                      <p className="text-sm font-semibold text-warning mb-1">This will give them:</p>
                      <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                        <li>Full system access and control</li>
                        <li>Ability to modify all settings</li>
                        <li>Permission to manage all users and roles</li>
                        <li>Access to sensitive admin functions</li>
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-text-muted">
                    This action will be logged with your SFA ID and timestamp.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={foundUser?.isFounder ? handleRevokeFounder : handleMakeFounder}
                  disabled={isUpdating}
                  className={foundUser?.isFounder ? 'bg-destructive hover:bg-destructive/90' : 'bg-warning hover:bg-warning/90'}
                >
                  {isUpdating ? 'Processing...' : foundUser?.isFounder ? 'Revoke Privileges' : 'Grant Privileges'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
};

export default MakeFounder;