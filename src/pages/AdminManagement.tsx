import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Search, Shield, ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/firebase';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import CSVImport from '@/components/admin/CSVImport';


interface MemberData {
  id: string;
  name: string;
  cmsId: string;
  sfaId: string;
  lobby: string;
  role: string;
  email: string;
  isProtected?: boolean;
}

// List of users that should always remain admins (founders, key members, etc.)
const PROTECTED_ADMINS = [
  "SFA1001", // Example SFA IDs of protected users   
];

const AdminManagement = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [members, setMembers] = useState<MemberData[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Fetch members from firestore
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoadingMembers(true);
        const usersCollection = collection(firestore, 'users');
        const userSnapshot = await getDocs(usersCollection);
        
        const membersList: MemberData[] = userSnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Check if this user is a protected admin
          const isProtectedAdmin = PROTECTED_ADMINS.includes(data.sfa_id) || 
                                  PROTECTED_ADMINS.includes(data.full_name);
          
          return {
            id: doc.id,
            name: data.full_name || 'Unknown',
            cmsId: data.cms_id || 'N/A',
            sfaId: data.sfa_id || 'N/A',
            lobby: data.lobby_id || 'N/A',
            role: data.role || 'member',
            email: data.email || 'N/A',
            isProtected: isProtectedAdmin
          };
        });
        
        setMembers(membersList);
      } catch (error) {
        console.error("Error fetching members:", error);
        toast({
          title: "Error",
          description: "Failed to load member data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingMembers(false);
      }
    };

    if (isAuthenticated && isAdmin) {
      fetchMembers();
    }
  }, [isAuthenticated, isAdmin, toast]);

  // Handle role change
  const handleRoleChange = async (memberId: string, currentRole: string, isProtected: boolean) => {
    // If member is protected and we're trying to demote them, show error
    if (isProtected && currentRole === 'admin') {
      toast({
        title: "Protected Admin",
        description: "This user is a protected admin and cannot be demoted.",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(memberId);
      
      const newRole = currentRole === 'admin' ? 'member' : 'admin';
      const userDocRef = doc(firestore, 'users', memberId);
      
      await updateDoc(userDocRef, {
        role: newRole
      });
      
      // Update local state
      setMembers(members.map(member => 
        member.id === memberId ? {...member, role: newRole} : member
      ));
      
      toast({
        title: "Success",
        description: `User has been ${newRole === 'admin' ? 'promoted to' : 'removed from'} admin role.`
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  // Filter members based on search term and role filter
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      member.sfaId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (roleFilter === 'all') return matchesSearch;
    if (roleFilter === 'admin') return matchesSearch && member.role === 'admin';
    if (roleFilter === 'collection') return matchesSearch && member.role === 'collection';
    if (roleFilter === 'member') return matchesSearch && member.role === 'member';
    
    return matchesSearch;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Admin Management</h1>
            <p className="text-lg text-text-secondary">Manage member roles and permissions</p>
          </div>

          <Card className="p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <Input
                  className="pl-10 bg-surface"
                  placeholder="Search by name or SFA ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="bg-surface border border-border z-50">
                  <SelectItem value="all">All Members</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="collection">Collection Members</SelectItem>
                  <SelectItem value="member">Regular Members</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <CardHeader className="p-6 bg-surface border-b border-border">
              <CardTitle>Member List</CardTitle>
              <CardDescription>
                {filteredMembers.length} members found
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingMembers ? (
                <div className="flex justify-center items-center p-12">
                  <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center p-12 text-text-secondary">
                  No members found matching your search criteria
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-surface">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">SFA ID</TableHead>
                        <TableHead className="font-semibold">CMS ID</TableHead>
                        <TableHead className="font-semibold">Lobby</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.id} className="hover:bg-surface-hover">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {member.name}
                              {member.isProtected && (
                                <span title="Protected Admin" className="text-warning">
                                  <ShieldAlert size={14} />
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-primary-light text-primary rounded-dashboard-sm font-medium">
                              {member.sfaId}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono">{member.cmsId}</TableCell>
                          <TableCell>{member.lobby}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {member.role === 'admin' ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-warning-light text-warning rounded-dashboard-sm text-xs font-medium">
                                  <ShieldAlert size={14} />
                                  Admin
                                </span>
                              ) : member.role === 'collection' ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-accent-light text-accent rounded-dashboard-sm text-xs font-medium">
                                  <ShieldCheck size={14} />
                                  Collection
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 px-2 py-1 bg-surface text-text-secondary rounded-dashboard-sm text-xs font-medium">
                                  <Shield size={14} />
                                  Member
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={member.role === 'admin' ? "destructive" : "default"}
                              size="sm"
                              onClick={() => handleRoleChange(member.id, member.role, !!member.isProtected)}
                              disabled={
                                processing === member.id || 
                                member.id === user?.uid || 
                                (member.role === 'admin' && member.isProtected)
                              }
                              className="flex items-center gap-2"
                            >
                              {processing === member.id ? (
                                <span className="animate-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent"></span>
                              ) : member.id === user?.uid ? (
                                "Current User"
                              ) : member.role === 'admin' && member.isProtected ? (
                                "Protected Admin"
                              ) : member.role === 'admin' ? (
                                "Remove Admin"
                              ) : (
                                "Make Admin"
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* CSV Import Section */}
          <div className="mt-8">
            <CSVImport />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminManagement;