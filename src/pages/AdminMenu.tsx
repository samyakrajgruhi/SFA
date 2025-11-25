import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, UserPlus, Shield, FileUp, FileText, Building, UserX, Heart, Trash2, UserCheck, Edit } from 'lucide-react';
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
  const isFounder = user?.isFounder;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin && !isFounder) {
    return <Navigate to="/" replace />;
  }

  const adminOnlyItems = [
    {
      title: 'Collection Members',
      description: 'Make members collection members by SFA-ID',
      icon: UserPlus,
      path: '/admin/collection-members',
      color: 'text-warning'
    }
  ]

  const founderOnlyItems = [
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
      title: 'Make Founder',
      description: 'Grant founder privileges to trusted members',
      icon: Shield,
      path: '/admin/make-founder',
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
      title: 'Update SFA/Email',
      description: 'Update incorrect SFA ID or email for users',
      icon: Edit,
      path: '/admin/update-sfa',
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
      title: 'Disable User',
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

  const menuItems = isFounder ? [...founderOnlyItems, ...adminOnlyItems] : adminOnlyItems;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              {isFounder ? 'Founder' : 'Admin'} Menu
            </h1>
            <p className="text-lg text-text-secondary">
              {isFounder ? 'Manage all system features' : 'Manage collection members'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {menuItems.map((item, index) => (
              <Card 
                key={index}
                className="hover-lift cursor-pointer transition-all duration-300"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 bg-surface rounded-dashboard ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {item.description}
                      </p>
                    </div>
                  </div>
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
