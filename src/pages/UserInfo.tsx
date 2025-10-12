import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {doc,updateDoc, collection ,query, where, getDocs} from 'firebase/firestore';
import {firestore} from '@/firebase';
import {useToast} from '@/hooks/use-toast';
import {useLobbies} from '@/hooks/useLobbies';

const UserInfo = () => {
  const { user} = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [userInfo, setUserInfo] = useState({
    name: user?.name || 'User Name',
    sfaId: user?.sfaId || 'SFA000',
    cmsId: user?.cmsId || 'CMS00000',
    lobby: user?.lobby || 'ANVT',
    role: user?.role || 'Member',
    phoneNumber: user?.phoneNumber || '+91 98765 43210',
    email: user?.email || 'user@example.com',
    emergencyNumber: user?.emergencyNumber || '+91 98765 43211'
  });

  const [editedInfo, setEditedInfo] = useState({ ...userInfo });

  useEffect(() => {
    if (user) {
      setUserInfo({
        name: user.name || 'User Name',
        sfaId: user.sfaId || 'SFA000',
        cmsId: user.cmsId || 'CMS00000',
        lobby: user.lobby || 'ANVT',
        role: user.role || 'Member',
        phoneNumber: user.phoneNumber || '+91 98765 43210',
        email: user.email || 'user@example.com',
        emergencyNumber: user.emergencyNumber || '+91 98765 43211'
      });
      setEditedInfo({
        name: user.name || 'User Name',
        sfaId: user.sfaId || 'SFA000',
        cmsId: user.cmsId || 'CMS00000',
        lobby: user.lobby || 'ANVT',
        role: user.role || 'Member',
        phoneNumber: user.phoneNumber || '+91 98765 43210',
        email: user.email || 'user@example.com',
        emergencyNumber: user.emergencyNumber || '+91 98765 43211'
      });
    }
  }, [user]);

  const {lobbies, isLoading: isLoadingLobbies } = useLobbies();
  const roles = ['Admin', 'Collection Member', 'Member'];

  const handleEdit = () => {
    setIsEditing(true);
    setEditedInfo({ ...userInfo });
  };

  const handleSave = async () => {
     if (!user?.uid) {
      toast({
        title: "Error",
        description: "User information not available. Please login again.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);

    try{
      const userQuery = query(collection(firestore, 'users'),where('uid','==',user.uid));
      const userSnapshot = await getDocs(userQuery);

      if(userSnapshot.empty){
        throw new Error("User document not found");
      }

      const userDocRef = userSnapshot.docs[0].ref;
      await updateDoc(userDocRef, {
        full_name: editedInfo.name,
        cms_id: editedInfo.cmsId,
        lobby_id: editedInfo.lobby,
        phone_number: editedInfo.phoneNumber,
        emergency_number: editedInfo.emergencyNumber
      });

      setUserInfo({ ...editedInfo });
      setIsEditing(false);

      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
    }catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An error occurred while updating your profile",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  const SaveButton = () => (
    <Button 
      onClick={handleSave}
      disabled={isUpdating}
      className="flex items-center space-x-2"
    >
      {isUpdating ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
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

  const handleDiscard = () => {
    setEditedInfo({ ...userInfo });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedInfo(prev => ({ ...prev, [field]: value }));
  };

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

          <Card className="p-8">
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
        </div>
      </main>
    </div>
  );
};

export default UserInfo;