/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { auth, firestore } from "@/firebase";
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut ,
} from "firebase/auth";
import { doc, getDocs, collection, query, where  } from "firebase/firestore";


interface FirestoreUserData {
  full_name?: string;
  cms_id?: string;
  lobby_id?: string;
  email?: string;
  uid?: string;
  phone_number?: string;
  isAdmin?: boolean;
  isCollectionMember?: boolean;
  emergency_number?: string;
  sfa_id?: string;
}

const getUserData = async (userId: string, retries = 3): Promise<FirestoreUserData> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const userQuery = query(collection(firestore,'users'), where('uid','==',userId));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data() as FirestoreUserData;
        console.log('✅ Successfully fetched user data:', userData);
        return userData;
      }
      
      console.warn(`⚠️ Attempt ${attempt + 1}/${retries}: No user document found for uid ${userId}`);
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
      }
    } catch (error) {
      console.error(`❌ Attempt ${attempt + 1}/${retries} failed:`, error);
      
      // Wait before retrying for network errors
      if (error.code === 'unavailable' || error.message?.includes('Failed to fetch')) {
        console.warn(`Network error detected, retrying...`);
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } else {
        // Non-network error, don't retry
        break;
      }
    }
  }
  
  console.error('❌ Failed to fetch user data after all retries');
  return {};
};


interface UserData {
  uid: string;
  email: string | null;
  name?: string;
  cmsId?: string;
  lobby?: string;
  phoneNumber?: string;
  isAdmin?: boolean;
  isCollectionMember?: boolean;
  emergencyNumber?: string;
  sfaId?: string;
}

interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDataLoaded: boolean; // ✅ NEW: Track if user data is fully loaded
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>; // ✅ NEW: Manual refresh function
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isDataLoaded: false,
  logout: async () => {},
  refreshUserData: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // ✅ NEW

  const fetchAndSetUserData = async (firebaseUser: User) => {
    try {
      console.log('🔄 Fetching user data for:', firebaseUser.uid);
      setIsDataLoaded(false); // Mark as not loaded while fetching
      
      const userData = await getUserData(firebaseUser.uid);
      
      if (!userData.sfa_id) {
        console.error('⚠️ WARNING: No SFA ID found in user data!', userData);
      }
      
      const fullUserData: UserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: userData.full_name || 'User Name',
        cmsId: userData.cms_id || 'CMS00000',
        lobby: userData.lobby_id || 'ANVT',
        isAdmin: userData.isAdmin || false,
        isCollectionMember: userData.isCollectionMember || false,
        sfaId: userData.sfa_id || 'SFA000',
        phoneNumber: userData.phone_number || '',
        emergencyNumber: userData.emergency_number || ''
      };
      
      console.log('✅ Setting user data:', fullUserData);
      setUser(fullUserData);
      setIsDataLoaded(true); // ✅ Mark as loaded
    } catch (error) {
      console.error('❌ Error in fetchAndSetUserData:', error);
      setIsDataLoaded(true); // Still mark as loaded to prevent infinite loading
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchAndSetUserData(firebaseUser);
      } else {
        console.log('🚪 User logged out');
        setUser(null);
        setIsDataLoaded(true);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsDataLoaded(false);
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Error logging out:', error);
    }
  };

  const refreshUserData = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('🔄 Manually refreshing user data...');
      await fetchAndSetUserData(currentUser);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading,
      isDataLoaded,
      logout,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};