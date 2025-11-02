import {useAuth} from '@/contexts/AuthContext';
import {useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {useEffect} from 'react';

export const useAdminCheck = () => {
    const {user, isAuthenticated, isLoading} = useAuth();
    const {toast} = useToast();
    const navigate = useNavigate();

    const isAdmin = user?.isAdmin === true;

    useEffect(() => {
        if(!isLoading && isAuthenticated && !isAdmin) {
            toast({
                title: 'Access Denied',
                description: 'You do not have Admin privileges',
                variant: 'destructive'
            });

            navigate('/');
        }
    }, [isLoading, isAuthenticated, isAdmin, navigate, toast]);

    return { isAdmin, isLoading };
};



export const requireAdmin = (user, toast): boolean => {
    if(!user?.isAdmin) {
        toast({
        title: 'Access Denied',
        description: 'This action requires admin privileges',
        variant: 'destructive'
        });
        return false;
    }
    return true;
};

