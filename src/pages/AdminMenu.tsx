import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, UserPlus, Shield, FileUp, Building, UserX, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AdminMenu = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.isAdmin;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const menuItems = [
    {
      title: 'Member List',
      description: 'View and manage member roles and permissions',
      icon: Users,
      path: '/admin/members',
      color: 'text-primary'
    },
    {
      title: 'Payment Amounts',
      description: 'Manage payment amount options (25, 60, 500)',
      icon: DollarSign,
      path: '/admin/payment-amounts',
      color: 'text-accent'
    },
    {
      title: 'Lobby Management',
      description: 'Manage lobby codes and locations',
      icon: Building,
      path: '/admin/lobbies',
      color: 'text-success'
    },
    {
      title: 'Collection Members',
      description: 'Make members collection members by SFA-ID',
      icon: UserPlus,
      path: '/admin/collection-members',
      color: 'text-warning'
    },
    {
      title: 'CSV Import',
      description: 'Add Donation Data by importing .csv File',
      icon: FileUp,
      path:'/admin/csv-import',
      color: 'text-primary'
    },
    {
      title: 'Delete User',
      description: 'Remove user accounts from the system (preserves transaction data)',
      icon: UserX,
      path: '/admin/delete-user',
      color: 'text-destructive'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <Shield className="w-16 h-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4">Admin Panel</h1>
            <p className="text-lg text-text-secondary">Choose an option to manage your organization</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <Card 
                key={item.path} 
                className="hover:shadow-dashboard-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate(item.path)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-dashboard bg-surface">
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-text-secondary">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Open
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminMenu;
