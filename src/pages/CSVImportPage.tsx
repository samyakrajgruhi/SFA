import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TransactionImport from '@/components/admin/TransactionImport';
import MemberImport from '@/components/admin/MemberImport';
import {requireAdmin} from '@/hooks/useAdminCheck';

const CSVImportPage = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Menu
          </Button>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <FileText className="w-16 h-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4">CSV Import</h1>
            <p className="text-lg text-text-secondary">Import data from CSV files into the system</p>
          </div>

          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="transactions">Transaction Data</TabsTrigger>
              <TabsTrigger value="members">Member Data</TabsTrigger>
            </TabsList>
            <TabsContent value="transactions">
              <TransactionImport />
            </TabsContent>
            <TabsContent value="members">
              <MemberImport />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default CSVImportPage;