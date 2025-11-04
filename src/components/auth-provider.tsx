"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => ({ success: false }),
  logout: async () => {},
  register: async () => ({ success: false }),
  resetPassword: async () => {},
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

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔑 Login attempt:', { email, passwordLength: password.length });
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase login successful:', userCredential.user.uid);

      const loggedInUser: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
        photoURL: userCredential.user.photoURL || '',
        role: 'user',
        createdAt: new Date(userCredential.user.metadata.creationTime || Date.now()),
        lastLoginAt: new Date(userCredential.user.metadata.lastSignInTime || Date.now()),
        isActive: true
      };

      setUser(loggedInUser);
      console.log('✅ User state updated:', loggedInUser);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email: string, password: string, displayName?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (displayName) {
        await userCredential.user.updateProfile({ displayName });
      }

      const newUser: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
        photoURL: userCredential.user.photoURL || '',
        role: 'user',
        createdAt: new Date(userCredential.user.metadata.creationTime || Date.now()),
        lastLoginAt: new Date(userCredential.user.metadata.lastSignInTime || Date.now()),
        isActive: true
      };

      setUser(newUser);
      return { success: true };
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
      setError(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      setError('Error during logout');
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      throw new Error(errorMessage);
    }
  };

  const getErrorMessage = (error: any): string => {
    const errorCode = error?.code;
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Pengguna tidak ditemukan';
      case 'auth/wrong-password':
        return 'Password salah';
      case 'auth/email-already-in-use':
        return 'Email sudah digunakan';
      case 'auth/weak-password':
        return 'Password terlalu lemah';
      case 'auth/invalid-email':
        return 'Email tidak valid';
      case 'auth/user-disabled':
        return 'Akun pengguna dinonaktifkan';
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan. Coba lagi nanti';
      case 'auth/network-request-failed':
        return 'Koneksi internet bermasalah';
      default:
        return error?.message || 'Terjadi kesalahan. Silakan coba lagi.';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, register, resetPassword }}>
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