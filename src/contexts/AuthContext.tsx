import { createContext, useContext, useState, useEffect } from "react";
import { auth, firestore } from "@/firebase";
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut ,
} from "firebase/auth";
import { doc, getDoc  } from "firebase/firestore";
// import { getUserData } from "../firebase/userService";

interface FirestoreUserData {
  name?: string;
  cms_id?: string;
  lobby_id?: string;
}

const getUserData = async (userId: string): Promise<FirestoreUserData> => {
  try {
    // Example implementation using Firestore
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as FirestoreUserData;
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
  cms_id?: string;
  lobby_id?: string;
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

  // In your AuthContext.tsx
useEffect(() => {
  setIsLoading(true);
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userData = await getUserData(firebaseUser.uid);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...userData
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