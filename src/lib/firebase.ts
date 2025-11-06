/**
 * Firebase Core Configuration
 * Initialize and export Firebase services for Wasa Finance System
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase configuration
export const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

  if (missingFields.length > 0) {
    console.error('Firebase configuration is missing the following fields:', missingFields);
    console.error('Please check your .env.local file and ensure all required Firebase environment variables are set.');
    return false;
  }

  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    console.log('Firebase configuration validated successfully');
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.log('Project ID:', firebaseConfig.projectId);
      console.log('Auth Domain:', firebaseConfig.authDomain);
    }
  }

  return true;
};

// Initialize Firebase
const initializeFirebaseApp = () => {
  if (!validateFirebaseConfig()) {
    throw new Error('Firebase configuration is invalid. Please check your environment variables.');
  }

  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    return app;
  } catch (error) {
    console.error('Error initializing Firebase app:', error);
    throw new Error('Failed to initialize Firebase app');
  }
};

// Initialize Firebase app
export const app = initializeFirebaseApp();

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Export Firebase app instance
export default app;

// Check Firebase connection
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    const testCollection = collection(db, 'connection-test');
    const testDoc = await addDoc(testCollection, {
      timestamp: new Date(),
      test: true
    });
    await deleteDoc(doc(db, 'connection-test', testDoc.id));
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

// Export types for better TypeScript support
export type FirebaseApp = typeof app;
export type FirebaseAuth = typeof auth;
export type FirebaseFirestore = typeof db;
export type FirebaseStorage = typeof storage;