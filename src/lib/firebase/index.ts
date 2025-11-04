/**
 * Firebase Configuration & Initialization
 * Centralized Firebase setup for Wasa Finance System
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
const validateFirebaseConfig = () => {
  const requiredFields = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  const missingFields = requiredFields.filter(
    field => !process.env[field]
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Missing Firebase configuration. Please set these environment variables:\n` +
      missingFields.map(field => `- ${field}`).join('\n')
    );
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Invalid Firebase configuration. Please check your environment variables.');
  }
};

// Initialize Firebase app
const initializeFirebaseApp = () => {
  validateFirebaseConfig();

  // Check if app is already initialized
  if (getApps().length > 0) {
    return getApp();
  }

  try {
    const app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');
    return app;
  } catch (error) {
    console.error('Error initializing Firebase app:', error);
    throw new Error('Failed to initialize Firebase app. Please check your configuration.');
  }
};

// Initialize Firebase services
const app = initializeFirebaseApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export default app
export default app;

// Export configuration for reference
export { firebaseConfig };

// Export validation function
export { validateFirebaseConfig };

// Export app initialization status
export const isFirebaseInitialized = () => {
  return getApps().length > 0;
};

// Export Firebase app instance
export const getFirebaseApp = () => {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase app is not initialized. Call initializeFirebaseApp() first.');
  }
  return getApp();
};