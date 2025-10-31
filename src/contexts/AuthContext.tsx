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
  sfa_id?: string;  // ✅ Changed from sfaId to sfa_id
}

const getUserData = async (userId: string): Promise<FirestoreUserData> => {
  try {
    const userQuery = query(collection(firestore,'users'), where('uid','==',userId));
    const userSnapshot = await getDocs(userQuery);
    if (!userSnapshot.empty) {
      return userSnapshot.docs[0].data() as FirestoreUserData;
    }
    return {};
  } catch (error) {
    console.error("Error fetching user data:", error);
    return {};
  }
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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await getUserData(firebaseUser.uid);
          
          console.log('Fetched user data:', userData); // Debug log
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: userData.full_name || 'User Name',
            cmsId: userData.cms_id || 'CMS00000',
            lobby: userData.lobby_id || 'ANVT',
            isAdmin: userData.isAdmin || false,
            isCollectionMember: userData.isCollectionMember || false,
            sfaId: userData.sfa_id || 'SFA000',  // ✅ Changed from userData.sfaId to userData.sfa_id
            phoneNumber: userData.phone_number || '+91 98765 43210',
            emergencyNumber: userData.emergency_number || '+91 98765 43211'
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);