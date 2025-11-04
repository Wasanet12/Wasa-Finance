"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const firebaseAuth = getAuth();

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            role: 'user', // Default role, you might want to fetch this from Firestore
            createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
            lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now()),
            isActive: true
          };
          setUser(user);
        } else {
          setUser(null);
        }
        setError(null);
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError('Authentication error');
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}