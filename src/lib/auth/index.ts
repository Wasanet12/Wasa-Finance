/**
 * Firebase Authentication Service
 * Centralized authentication management for Wasa Finance System
 */

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User, AuthState } from '@/lib/types';

// Initial auth state
const authState: AuthState = {
  user: null,
  loading: true,
  error: null
};

// Auth state listeners
const authStateListeners: ((state: AuthState) => void)[] = [];

/**
 * Update auth state and notify listeners
 */
const updateAuthState = (newState: AuthState) => {
  Object.assign(authState, newState);
  authStateListeners.forEach(listener => listener({ ...authState }));
};

/**
 * Get error message from Firebase error
 */
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
    case 'auth/requires-recent-login':
      return 'Silakan login kembali untuk melanjutkan';
    default:
      return error?.message || 'Terjadi kesalahan. Silakan coba lagi.';
  }
};

// Listen for auth state changes
firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    try {
      const user = await mapFirebaseUserToUser(firebaseUser);
      updateAuthState({
        user,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error mapping user:', error);
      updateAuthState({
        user: null,
        loading: false,
        error: 'Error processing user data'
      });
    }
  } else {
    updateAuthState({
      user: null,
      loading: false,
      error: null
    });
  }
});

// ==================== AUTHENTICATION FUNCTIONS ====================

/**
 * Add listener for auth state changes
 */
const onAuthStateChanged = (callback: (state: AuthState) => void) => {
  authStateListeners.push(callback);

  // Immediately call the callback with current state
  callback(getAuthState());

  return () => {
    const index = authStateListeners.indexOf(callback);
    if (index > -1) {
      authStateListeners.splice(index, 1);
    }
  };
};

/**
 * Sign in user with email and password
 */
const signIn = async (email: string, password: string): Promise<AuthState> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = await mapFirebaseUserToUser(userCredential.user);

    updateAuthState({
      user,
      loading: false,
      error: null
    });

    return getAuthState();
  } catch (error: any) {
    const authState: AuthState = {
      user: null,
      loading: false,
      error: getErrorMessage(error)
    };

    updateAuthState(authState);
    return authState;
  }
};

/**
 * Sign up new user
 */
const signUp = async (email: string, password: string, displayName?: string): Promise<AuthState> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update profile with display name if provided
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    const user = await mapFirebaseUserToUser(userCredential.user);

    updateAuthState({
      user,
      loading: false,
      error: null
    });

    return getAuthState();
  } catch (error: any) {
    const authState: AuthState = {
      user: null,
      loading: false,
      error: getErrorMessage(error)
    };

    updateAuthState(authState);
    return authState;
  }
};

/**
 * Sign out current user
 */
const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    updateAuthState({
      user: null,
      loading: false,
      error: null
    });
  } catch (error: any) {
    console.error('Sign out error:', error);
  }
};

/**
 * Reset password
 */
const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Update user password
 */
const updateUserPassword = async (newPassword: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    await updatePassword(currentUser, newPassword);
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (updates: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    await updateProfile(currentUser, updates);

    // Update auth state with new user info
    if (authState.user) {
      const updatedUser = { ...authState.user, ...updates };
      updateAuthState({
        ...authState,
        user: updatedUser
      });
    }
  } catch (error: any) {
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get current auth state
 */
const getAuthState = (): AuthState => {
  return { ...authState };
};

/**
 * Check if user is authenticated
 */
const isAuthenticated = (): boolean => {
  return authState.user !== null;
};

/**
 * Get current user
 */
const getCurrentUser = (): User | null => {
  return authState.user;
};

/**
 * Check if current user is admin
 */
const isAdmin = (): boolean => {
  return authState.user?.role === 'admin';
};

/**
 * Check if user can edit (admin or user)
 */
const canEdit = (): boolean => {
  return authState.user?.role !== 'viewer';
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Map Firebase user to our User type
 */
const mapFirebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User> => {
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

  return user;
};

// ==================== EXPORTS ====================

export {
  signIn as login,
  signUp as register,
  signOutUser as logout,
  resetPassword as forgotPassword,
  updateUserPassword,
  updateUserProfile,
  getAuthState,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  canEdit,
  onAuthStateChanged
};