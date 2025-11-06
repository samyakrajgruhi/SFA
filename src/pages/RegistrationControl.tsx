import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus, UserX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { requireAdmin } from '@/hooks/useAdminCheck';

const RegistrationControl = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const handleAdminAction = async () => {
    if (!requireAdmin(user, toast)) return;
  };

  useEffect(() => {
    fetchRegistrationStatus();
  }, []);

  const fetchRegistrationStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const configDoc = await getDoc(doc(firestore, 'config', 'registration'));
      if (configDoc.exists()) {
        setIsRegistrationOpen(configDoc.data().isOpen || false);
      }
    } catch (error) {
      console.error('Error fetching registration status:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch registration status',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const toggleRegistration = async () => {
    if (!requireAdmin(user, toast)) return;

    try {
      setIsUpdating(true);
      const newStatus = !isRegistrationOpen;
      
      await setDoc(doc(firestore, 'config', 'registration'), {
        isOpen: newStatus,
        lastUpdated: new Date(),
        updatedBy: user?.sfaId || user?.uid
      });

      setIsRegistrationOpen(newStatus);
      
      toast({
        title: 'Success',
        description: `Registration ${newStatus ? 'opened' : 'closed'} successfully`
      });
    } catch (error) {
      console.error('Error updating registration status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update registration status',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || isLoadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
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
            <h1 className="text-4xl font-bold text-text-primary mb-4">Registration Control</h1>
            <p className="text-lg text-text-secondary">Enable or disable new user registrations</p>
          </div>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Registration Status</CardTitle>
              <CardDescription>
                Control whether new users can register on the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Status Display */}
              <div className={`p-6 rounded-lg border-2 ${
                isRegistrationOpen 
                  ? 'bg-success-light border-success' 
                  : 'bg-warning-light border-warning'
              }`}>
                <div className="flex items-center gap-4">
                  {isRegistrationOpen ? (
                    <UserPlus className="w-12 h-12 text-success" />
                  ) : (
                    <UserX className="w-12 h-12 text-warning" />
                  )}
                  <div>
                    <h3 className="text-xl font-bold">
                      Registration is {isRegistrationOpen ? 'OPEN' : 'CLOSED'}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {isRegistrationOpen 
                        ? 'New users can create accounts' 
                        : 'New user registration is currently disabled'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Toggle Control */}
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                <div>
                  <h4 className="font-semibold">Allow New Registrations</h4>
                  <p className="text-sm text-text-secondary">
                    Toggle to enable or disable the registration form
                  </p>
                </div>
                <Switch
                  checked={isRegistrationOpen}
                  onCheckedChange={toggleRegistration}
                  disabled={isUpdating}
                />
              </div>

              {/* Information Box */}
              <div className="p-4 bg-surface rounded-lg border border-border">
                <h4 className="font-semibold mb-2">Important Information</h4>
                <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                  <li>When closed, the register button will be disabled on the login page</li>
                  <li>Users will see a message that registration is currently unavailable</li>
                  <li>Existing users can still log in normally</li>
                  <li>Changes take effect immediately</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default RegistrationControl;