import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X, User } from 'lucide-react';

const UserInfo = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: 'Rajesh Kumar Sharma',
    sfaId: 'SFA001',
    cmsId: 'CMS12345',
    lobby: 'ANVT',
    role: 'Member',
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@railways.gov.in',
    emergencyContact: '+91 98765 43211'
  });

  const [editedInfo, setEditedInfo] = useState({ ...userInfo });

  const lobbies = ['ANVT', 'DEE', 'DLI', 'GHH', 'JIND', 'KRJNDD', 'MTC', 'NZM', 'PNP', 'ROK', 'SSB'];
  const roles = ['Admin', 'Collection Member', 'Member'];

  const handleEdit = () => {
    setIsEditing(true);
    setEditedInfo({ ...userInfo });
  };

  const handleSave = () => {
    setUserInfo({ ...editedInfo });
    setIsEditing(false);
    // Here you would typically make an API call to update the backend
    alert('Profile updated successfully!');
  };

  const handleDiscard = () => {
    setEditedInfo({ ...userInfo });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedInfo(prev => ({ ...prev, [field]: value }));
  };

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
                      value={editedInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-primary">{userInfo.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-text-secondary">Email Address</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-primary">{userInfo.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="emergency" className="text-text-secondary">Emergency Contact</Label>
                  {isEditing ? (
                    <Input
                      id="emergency"
                      value={editedInfo.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-primary">{userInfo.emergencyContact}</p>
                  )}
                </div>

                <div>
                  <Label className="text-text-secondary">SFA ID</Label>
                  <p className="mt-1 p-2 bg-primary-light text-primary rounded-dashboard font-medium">{userInfo.sfaId}</p>
                </div>

                <div>
                  <Label className="text-text-secondary">CMS ID</Label>
                  <p className="mt-1 p-2 bg-accent-light text-accent rounded-dashboard font-mono">{userInfo.cmsId}</p>
                </div>

                <div>
                  <Label htmlFor="lobby" className="text-text-secondary">Lobby</Label>
                  {isEditing ? (
                    <Select value={editedInfo.lobby} onValueChange={(value) => handleInputChange('lobby', value)}>
                      <SelectTrigger className="mt-1 bg-surface border border-border">
                        <SelectValue />
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
                  {isEditing ? (
                    <Select value={editedInfo.role} onValueChange={(value) => handleInputChange('role', value)}>
                      <SelectTrigger className="mt-1 bg-surface border border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border border-border z-50">
                        {roles.map((role) => (
                          <SelectItem key={role} value={role} className="hover:bg-surface-hover">{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-primary">{userInfo.role}</p>
                  )}
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
                <Button 
                  onClick={handleSave}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </Button>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserInfo;