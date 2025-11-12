/**
 * Firebase Auth Test Helper
 * Utility untuk testing dan setup user development
 */

import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';

/**
 * Create test user for development
 */
export const createTestUser = async (email: string, password: string, displayName: string) => {
  try {
    console.log('Creating test user...');

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ User created in Firebase Auth:', userCredential.user.uid);

    // Create user document in Firestore
    const userDoc = doc(db, 'users', userCredential.user.uid);
    await setDoc(userDoc, {
      email: userCredential.user.email,
      displayName: displayName,
      photoURL: null,
      role: 'admin', // Make this user an admin for testing
      createdAt: new Date(),
      lastLogin: new Date(),
      emailVerified: userCredential.user.emailVerified
    });

    console.log('✅ User document created in Firestore');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Role: admin`);

    return {
      success: true,
      user: userCredential.user,
      message: 'Test user created successfully'
    };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    console.error('❌ Error creating test user:', firebaseError.code, firebaseError.message);

    if (firebaseError.code === 'auth/email-already-in-use') {
      return {
        success: false,
        error: 'User already exists. Try signing in instead.'
      };
    }

    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test sign in with existing user
 */
export const testSignIn = async (email: string, password: string) => {
  try {
    console.log(`Testing sign in with ${email}...`);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Sign in successful:', userCredential.user.uid);

    // Check if user document exists
    const userDoc = doc(db, 'users', userCredential.user.uid);
    const userDocSnap = await getDoc(userDoc);

    if (userDocSnap.exists()) {
      console.log('✅ User document exists in Firestore');
      console.log('📄 User data:', userDocSnap.data());
    } else {
      console.log('⚠️ User document not found in Firestore');
    }

    return {
      success: true,
      user: userCredential.user,
      message: 'Sign in successful'
    };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    console.error('❌ Sign in error:', firebaseError.code, firebaseError.message);
    return {
      success: false,
      error: firebaseError.message,
      code: firebaseError.code
    };
  }
};

/**
 * Check Firebase Auth configuration
 */
export const checkAuthConfig = () => {
  console.log('🔍 Checking Firebase Auth Configuration...');
  console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log('Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
  console.log('API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...');

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const missingFields = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    console.error('❌ Missing Firebase config:', missingFields);
    return false;
  }

  console.log('✅ Firebase configuration looks good');
  return true;
};