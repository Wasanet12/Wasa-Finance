"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { User } from "@/lib/types";

interface SimpleAuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const SimpleAuthContext = createContext<SimpleAuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => ({ success: false }),
  logout: async () => {},
});

// Import existing Firebase configuration to avoid multiple initialization
import { auth as firebaseAuth } from '@/lib/firebase';

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auth, setAuth] = useState<any>(null);

  useEffect(() => {
    console.log('🔧 SimpleAuthProvider: Using existing Firebase auth...');

    try {
      // Use existing auth instance to avoid multiple initialization
      setAuth(firebaseAuth);
      console.log('✅ Using existing auth instance:', firebaseAuth);

      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
        console.log('🔄 Auth state changed:', firebaseUser ? 'User logged in' : 'No user');

        if (firebaseUser) {
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            role: 'user',
            createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
            lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now()),
            isActive: true
          };
          setUser(user);
          console.log('✅ User state set:', user);
        } else {
          setUser(null);
          console.log('🚫 User state cleared');
        }

        setLoading(false);
        setError(null);
      });

      return () => {
        console.log('🔌 Unsubscribing from auth state changes');
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ SimpleAuthProvider error:', error);
      setError('Failed to setup authentication');
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      console.error('❌ Auth not initialized');
      return { success: false, error: 'Authentication not initialized' };
    }

    try {
      console.log('🔑 SimpleAuthProvider login attempt:', { email });
      setError(null);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase signIn successful:', userCredential.user);

      // User state will be updated by onAuthStateChanged listener
      return { success: true };
    } catch (error: any) {
      console.error('❌ SimpleAuthProvider login error:', error);
      const errorMessage = error?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    if (!auth) return;

    try {
      await signOut(auth);
      console.log('✅ Logged out successfully');
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      setError('Error during logout');
    }
  };

  return (
    <SimpleAuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error("useSimpleAuth must be used within a SimpleAuthProvider");
  }
  return context;
}