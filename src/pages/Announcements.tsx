import React, { useState,useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {firestore} from '@/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Megaphone, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {requireAdmin} from '@/hooks/useAdminCheck';

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  createdBy: string;
}

const Announcements = () => {
  const handleAdminAction = async () => {
    if(!requireAdmin(user,toast)) return;
  }
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting,setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const announcementsRef = collection(firestore,'announcements');
        const q = query(announcementsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q,(snapshot) => {
          const announcementsList: Announcement[] = [];
          snapshot.forEach((doc)=> {
            const data = doc.data();
            announcementsList.push({
              id: doc.id,
              title: data.title,
              message: data.message,
              createdAt: (() => {
                try {
                  return data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();
                } catch (error) {
                  console.error('Invalid date format:', error);
                  return new Date().toISOString();
                }
              })(),
              createdBy: data.createdByName || 'Admin'
            });
          });
          setAnnouncements(announcementsList);
          setIsLoading(false);
        });
        return unsubscribe;
      }catch(error){
        console.error('Error fetching announcements:',error);
        setIsLoading(false);
        return null;
      }
    };
    // Call the async function and handle the returned unsubscribe
    let unsubscribeFunction: (() => void) | null = null;
    
    fetchAnnouncements().then((unsubscribe) => {
      unsubscribeFunction = unsubscribe;
    });

    // Cleanup function
    return () => {
      if (unsubscribeFunction) {
        unsubscribeFunction();
      }
    };

  },[]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const announcementsRef = collection(firestore,'announcements');
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(announcementsRef, {
        title: formData.title.trim(),
        message: formData.message.trim(),
        createdAt: serverTimestamp(),
        createdBy: user?.uid,
        createdByName: user?.name || 'Admin',
        isActive: true
      });

      setFormData({title: '',message: ''});
      setShowForm(false);

      toast({
        title: "Success",
        description: "Announcement created successfully"
      });
    }catch(error){
      console.error('Error creating announcement:',error);
      toast({
        title:'Error',
        description: "Failed to create announcement. Please try again.",
        variant: "destructive",
      });
    }finally{
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'announcements', id));
      
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Error",
        description: "Failed to delete announcement. Please try again.",
        variant: "destructive",
      });
    }
  };

   if (isLoading || isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-primary" />
              Announcements
            </h1>
            <p className="text-text-secondary mt-2">
              {user?.isAdmin ? 'Create and manage announcements for all users' : 'Stay updated with the latest announcements'}
            </p>
          </div>
          
          {user?.isAdmin && (
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Announcement
            </Button>
          )}
        </div>

        {showForm && user?.isAdmin && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Announcement</CardTitle>
              <CardDescription>
                This announcement will be visible to all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter announcement title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    maxLength={100}
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter announcement message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-text-muted mt-1">
                    {formData.message.length}/500 characters
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      setFormData({ title: '', message: '' });
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent"></span>
                        Creating...
                      </>
                    ) : (
                      'Create Announcement'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="w-12 h-12 text-text-muted mb-4" />
                <p className="text-text-muted">No announcements yet</p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{announcement.title}</CardTitle>
                      <CardDescription>
                        Created by {announcement.createdBy} on {formatDate(announcement.createdAt)}
                      </CardDescription>
                    </div>
                    {user?.isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-warning hover:text-warning hover:bg-warning-light">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this announcement? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(announcement.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary">{announcement.message}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
