import React from 'react';
import Navbar from '../components/Navbar';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const UserInfo = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-6 py-12 flex justify-center">
            <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-text-primary mb-4">User Information</h1>
              <p className="text-lg text-text-secondary">Please log in to view your profile information.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">{user.name || 'Name Not Provided'}</h2>
                  <p className="text-text-secondary">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-text-secondary">Full Name</Label>
                  <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-primary">
                    {user.name || 'Not provided'}
                  </p>
                </div>

                <div>
                  <Label className="text-text-secondary">Email Address</Label>
                  <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-primary">
                    {user.email || 'Not provided'}
                  </p>
                </div>

                <div>
                  <Label className="text-text-secondary">User ID</Label>
                  <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-primary font-mono text-sm">
                    {user.uid}
                  </p>
                </div>

                <div>
                  <Label className="text-text-secondary">CMS ID</Label>
                  <p className="mt-1 p-2 bg-accent-light text-accent rounded-dashboard font-mono">
                    {user.cms_id || 'Not provided'}
                  </p>
                </div>

                <div>
                  <Label className="text-text-secondary">Lobby ID</Label>
                  <p className="mt-1 p-2 bg-warning-light text-warning rounded-dashboard font-medium">
                    {user.lobby_id || 'Not provided'}
                  </p>
                </div>

                <div>
                  <Label className="text-text-secondary">Account Status</Label>
                  <p className="mt-1 p-2 bg-success-light text-success rounded-dashboard font-medium">
                    Active
                  </p>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Additional Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-text-secondary">Phone Number</Label>
                    <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-muted">
                      Not provided
                    </p>
                  </div>

                  <div>
                    <Label className="text-text-secondary">SFA ID</Label>
                    <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-muted">
                      Not provided
                    </p>
                  </div>

                  <div>
                    <Label className="text-text-secondary">Role</Label>
                    <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-muted">
                      Not provided
                    </p>
                  </div>

                  <div>
                    <Label className="text-text-secondary">Emergency Contact</Label>
                    <p className="mt-1 p-2 bg-surface rounded-dashboard text-text-muted">
                      Not provided
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserInfo;