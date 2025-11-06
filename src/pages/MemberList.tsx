import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
import { Search, Shield, ShieldCheck, ShieldAlert, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/firebase';
import { collection, getDocs, updateDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { requireAdmin } from '@/hooks/useAdminCheck';

interface MemberData {
  id: string;
  name: string;
  cmsId: string;
  sfaId: string;
  lobby: string;
  isProtected?: boolean;
  isAdmin?: boolean;
  isCollectionMember: boolean;
  email: string;
}

const MemberList = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [members, setMembers] = useState<MemberData[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [protectedAdmins, setProtectedAdmins] = useState<string[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Check if user is admin
  const isAdmin = user?.isAdmin;

  // ✅ Fetch protected admins from Firestore config
  useEffect(() => {
    const fetchProtectedAdmins = async () => {
      try {
        setIsLoadingConfig(true);
        const configDoc = await getDoc(doc(firestore, 'config', 'protected_admins'));
        
        if (configDoc.exists()) {
          const data = configDoc.data();
          setProtectedAdmins(data.sfa_ids || []);
          console.log('✅ Loaded protected admins:', data.sfa_ids);
        } else {
          console.warn('⚠️ No protected admins config found');
          setProtectedAdmins([]);
        }
      } catch (error) {
        console.error('❌ Error fetching protected admins:', error);
        setProtectedAdmins([]);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    if (isAuthenticated && isAdmin) {
      fetchProtectedAdmins();
    }
  }, [isAuthenticated, isAdmin]);

  // Fetch members from firestore
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoadingMembers(true);
        const usersCollection = collection(firestore, 'users');
        const userSnapshot = await getDocs(usersCollection);
        
        const membersList: MemberData[] = userSnapshot.docs.map(doc => {
          const data = doc.data();
          
          // ✅ Check if this user is a protected admin
          const isProtectedAdmin = protectedAdmins.includes(data.sfa_id);
          
          return {
            id: doc.id,
            name: data.full_name || 'Unknown',
            cmsId: data.cms_id || 'N/A',
            sfaId: data.sfa_id || 'N/A',
            lobby: data.lobby_id || 'N/A',
            email: data.email || 'N/A',
            isProtected: isProtectedAdmin,
            isAdmin: data.isAdmin || false,
            isCollectionMember: data.isCollectionMember || false
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

    // ✅ Only fetch members after protected admins are loaded
    if (isAuthenticated && isAdmin && !isLoadingConfig) {
      fetchMembers();
    }
  }, [isAuthenticated, isAdmin, protectedAdmins, isLoadingConfig, toast]);

  // Handle Admin Toggle
  const handleAdminToggle = async (memberId: string, isCurrentlyAdmin: boolean, sfaId: string, isProtected: boolean) => {
    // ✅ Check if user is protected
    if (isProtected && isCurrentlyAdmin) {
      toast({
        title: "Protected Admin",
        description: "This user is a protected admin and cannot be demoted",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(memberId);

      const userDocRef = doc(firestore, 'users', memberId);

      await updateDoc(userDocRef, {
        isAdmin: !isCurrentlyAdmin
      });

      setMembers(members.map(member => 
        member.id === memberId ? { ...member, isAdmin: !isCurrentlyAdmin } : member
      ));

      toast({
        title: "Success",
        description: `User has been ${!isCurrentlyAdmin ? 'given' : 'removed from'} admin privileges.`
      });
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast({
        title: "Error",
        description: "Failed to update admin status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };
  
  // Filter members based on search term and role filter
  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      member.name.toLowerCase().includes(searchLower) || 
      member.sfaId.toLowerCase().includes(searchLower) ||
      member.cmsId.toLowerCase().includes(searchLower);
    
    if (roleFilter === 'all') return matchesSearch;
    if (roleFilter === 'admin') return matchesSearch && member.isAdmin;
    if (roleFilter === 'collection') return matchesSearch && member.isCollectionMember;
    if (roleFilter === 'member') return matchesSearch && !member.isAdmin && !member.isCollectionMember;
    
    return matchesSearch;
  });

  // Loading state
  if (isLoading || isLoadingConfig) {
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
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Menu
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Member List</h1>
            <p className="text-lg text-text-secondary">View and manage member roles</p>
          </div>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Members ({members.length})</CardTitle>
              <CardDescription>Search and filter members by role</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
                  <Input
                    placeholder="Search by name, SFA ID, or CMS ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="admin">Admins Only</SelectItem>
                    <SelectItem value="collection">Collection Members</SelectItem>
                    <SelectItem value="member">Regular Members</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Members Table */}
              {isLoadingMembers ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary">No members found matching your search</p>
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
                        <TableHead className="font-semibold">Roles</TableHead>
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
                          <TableCell>
                            <span className="px-2 py-1 bg-accent-light text-accent rounded-dashboard-sm font-mono text-sm">
                              {member.cmsId}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-surface-hover rounded-dashboard-sm">
                              {member.lobby}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              {member.isProtected && (
                                <span className="px-2 py-1 bg-warning-light text-warning rounded-dashboard-sm text-xs font-medium flex items-center gap-1">
                                  <ShieldAlert size={12} />
                                  Protected
                                </span>
                              )}
                              {member.isAdmin && (
                                <span className="px-2 py-1 bg-primary-light text-primary rounded-dashboard-sm text-xs font-medium flex items-center gap-1">
                                  <Shield size={12} />
                                  Admin
                                </span>
                              )}
                              {member.isCollectionMember && (
                                <span className="px-2 py-1 bg-accent-light text-accent rounded-dashboard-sm text-xs font-medium">
                                  Collection
                                </span>
                              )}
                              {!member.isAdmin && !member.isCollectionMember && (
                                <span className="px-2 py-1 bg-surface rounded-dashboard-sm text-xs text-text-muted">
                                  Member
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                variant={member.isAdmin ? "destructive" : "default"}
                                size="sm"
                                onClick={() => handleAdminToggle(member.id, member.isAdmin, member.sfaId, !!member.isProtected)}
                                disabled={
                                  processing === member.id || 
                                  member.id === user?.uid || 
                                  (member.isAdmin && member.isProtected)
                                }
                                className="flex items-center gap-2"
                              >
                                {processing === member.id ? (
                                  <span className="animate-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent"></span>
                                ) : member.isAdmin ? (
                                  member.isProtected ? (
                                    <>
                                      <ShieldAlert className="w-4 h-4" />
                                      Protected
                                    </>
                                  ) : (
                                    "Remove Admin"
                                  )
                                ) : (
                                  "Make Admin"
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MemberList;