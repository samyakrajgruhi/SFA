import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const useFounderCheck = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isFounder = user?.isFounder === true;

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isFounder) {
      toast({
        title: 'Access Denied',
        description: 'You do not have Founder privileges',
        variant: 'destructive'
      });
      navigate('/');
    }
  }, [isLoading, isAuthenticated, isFounder, navigate, toast]);

  return { isFounder, isLoading };
};

export const requireFounder = (user, toast): boolean => {
  if (!user?.isFounder) {
    toast({
      title: 'Access Denied',
      description: 'This action requires founder privileges',
      variant: 'destructive'
    });
    return false;
  }
  return true;
};