import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, UserPlus, Shield, FileUp, Building, UserX, Heart, Trash2, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { requireAdmin } from '@/hooks/useAdminCheck';
import { toast } from '@/components/ui/sonner';

const AdminMenu = () => {
  const handleAdminAction = async () => {
    if(!requireAdmin(user,toast)) return;
  }
  
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
      title: 'Beneficiary Review',
      description: 'Review and approve member benefit requests',
      icon: UserCheck,
      path: '/admin/beneficiary-review',
      color: 'text-primary'
    },
    {
      title:"Registration Form Control",
      description: 'Enable or disable new user registrations',
      icon: UserPlus,
      path: '/admin/registration-control',
      color: 'text-success'
    },
    {
      title: 'Delete User',
      description: 'Remove user accounts from the system (preserves transaction data)',
      icon: UserX,
      path: '/admin/delete-user',
      color: 'text-destructive'
    },
    {
      title: 'Delete Transaction',
      description: 'Remove Transaction entries from the system',
      icon: Trash2,
      path: '/admin/delete-transaction',
      color: 'text-destructive'
    }
  ];

  return (
  <div className="min-h-screen bg-background">
    <Navbar />
    
    <main className="pt-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">Admin Panel</h1>
          <p className="text-lg text-text-secondary">Choose an option to manage your organization</p>
        </div>

        <Card className="p-8">
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-surface-hover transition-colors duration-200 group text-left"
              >
                <div className={`p-2 rounded-lg bg-surface-hover group-hover:bg-surface ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                </div>
                
                <div className="text-text-muted group-hover:text-primary transition-colors">
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
              className="gap-2"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              Back to Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminMenu;
