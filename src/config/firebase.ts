/**
 * Firebase Configuration Export
 * Centralized export of Firebase services and configuration
 */

import { app, auth, db, storage } from '@/lib/firebase';
import { validateFirebaseConfig } from '@/lib/firebase';

// Export Firebase services
export { app, auth, db, storage };

// Export validation function
export { validateFirebaseConfig };

// Export configuration for reference
export const config = {
  // Firebase configuration from environment
  firebaseConfig: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
  // App configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Wasa Finance System',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    debug: process.env.NEXT_PUBLIC_DEBUG === 'true',
    devMode: process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  },
  // Feature flags
  features: {
    analytics: !!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    storage: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messaging: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  }
};

// Export collections
export const collections = {
  users: 'users',
  customers: 'customers',
  packages: 'packages',
  expenses: 'expenses',
  payments: 'payments',
  reports: 'reports',
  settings: 'settings'
} as const;

// Export default configuration
export default {
  app,
  auth,
  db,
  storage,
  config,
  collections
};