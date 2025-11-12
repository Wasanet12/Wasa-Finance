"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  Auth
} from "firebase/auth";
import { User } from "@/lib/types";

interface SimpleAuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const SimpleAuthContext = createContext<SimpleAuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => ({ success: false }),
  logout: async () => {},
  isAuthenticated: false,
});

// Import existing Firebase configuration to avoid multiple initialization
import { auth as firebaseAuth } from '@/lib/firebase';

// Cache untuk user session
let cachedUser: User | null = null;
let isInitialized = false;

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!isInitialized);
  const [error, setError] = useState<string | null>(null);
  const [auth] = useState<Auth>(() => firebaseAuth);

  // Memoize auth state to prevent unnecessary re-renders
  const authState = useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated: !!user
  }), [user, loading, error]);

  // Optimized login function
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'Authentication not initialized' };
    }

    try {
      setError(null);

      await signInWithEmailAndPassword(auth, email, password);

      // User state will be updated by onAuthStateChanged listener
      return { success: true };
    } catch (error: unknown) {
      console.error('❌ SimpleAuthProvider login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [auth]);

  // Optimized logout function
  const logout = useCallback(async (): Promise<void> => {
    if (!auth) return;

    try {
      await signOut(auth);
      // Clear cache on logout
      cachedUser = null;
    } catch (error: unknown) {
      console.error('❌ Logout error:', error);
      setError('Error during logout');
    }
  }, [auth]);

  useEffect(() => {
    // Skip if already initialized
    if (isInitialized && auth) {
      return;
    }

    try {
      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
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

          // Cache the user
          cachedUser = user;
          setUser(user);
        } else {
          cachedUser = null;
          setUser(null);
        }

        setLoading(false);
        setError(null);
        isInitialized = true;
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ SimpleAuthProvider error:', error);
      setError('Failed to setup authentication');
      setLoading(false);
    }
  }, [auth]);

  return (
    <SimpleAuthContext.Provider value={{
      user: authState.user,
      loading: authState.loading,
      error: authState.error,
      login,
      logout,
      isAuthenticated: authState.isAuthenticated
    }}>
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