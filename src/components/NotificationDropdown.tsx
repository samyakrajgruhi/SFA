import React, { useState,useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import {
  getDocs, 
  collection, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  limit,
  onSnapshot
} from 'firebase/firestore';
import {firestore} from '@/firebase';

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}


export const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);

  const [announcements,setAnnouncements]  = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
 

  useEffect(() => {
    const announcementsRef = collection(firestore,'announcements');
    const q = query(announcementsRef, orderBy('createdAt','desc'),limit(5));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
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
          createdBy: data.createdByName || 'Admin',
        } as Announcement;
      });

      setAnnouncements(list);
      setIsLoading(false);
    },
    (error) => {
      console.error('Announcements listener error', error);
      setIsLoading(false);
    }
    );

    return () => unsubscribe();
  }, []);

  const isWithin24Hours = (dateString: string): boolean => {
    const announcementDate = new Date(dateString);
    const now = new Date();
    const hoursDifference = (now.getTime() - announcementDate.getTime()) / (1000 * 60 * 60);

    return hoursDifference <= 24;
  };

  const hasNewAnnouncements = announcements.some(announcement =>
    isWithin24Hours(announcement.createdAt)
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-dashboard transition-all duration-200">
          <Bell className="w-5 h-5" />
          {hasNewAnnouncements && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-warning rounded-full animate-pulse" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96 max-w-96 p-0 bg-surface border-border z-[100]" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-text-primary">Notifications</h3>
        </div>
        
        <ScrollArea className="h-[400px]">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-text-muted">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-surface-hover ${
                    isWithin24Hours(announcement.createdAt) ? 'text-text-primary font-semibold' : 'text-text-secondary'
                  }`}>


                  <div className="flex items-start justify-between mb-1">
                    <h4 className={`font-medium text-sm ${
                      isWithin24Hours(announcement.createdAt) ? 'text-text-primary font-semibold' : 'text-text-secondary'
                    }`}>
                      {announcement.title}
                    </h4>
                    
                    {/* Show "NEW" badge for announcements within 24 hours */}
                    {isWithin24Hours(announcement.createdAt) && (
                      <Badge className="ml-2 bg-warning text-white text-xs px-2 py-0">
                        NEW
                      </Badge>
                    )}
                  </div>


                  <p className="text-sm text-text-secondary mb-2">
                    {announcement.message}
                  </p>
                  <span className="text-xs text-text-muted">
                    {formatDate(announcement.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
