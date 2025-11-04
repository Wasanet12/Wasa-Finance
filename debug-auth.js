// Debug Firebase Authentication
// Copy paste ini ke browser console di halaman login

console.log('🔍 Firebase Debug Started');

// Check Firebase config
console.log('📋 Firebase Config:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'MISSING',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'MISSING',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING',
});

// Test direct Firebase import
(async () => {
  try {
    const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
    const { initializeApp, getApps } = await import('firebase/app');

    console.log('✅ Firebase modules imported successfully');

    // Check if Firebase is initialized
    if (getApps().length === 0) {
      console.log('❌ Firebase not initialized');

      // Try to initialize
      const config = {
        apiKey: "AIzaSyBac3tU2OQkkRZ7ctPYLVgHmLoWCCc-p9Y",
        authDomain: "wasa-finance-system.firebaseapp.com",
        projectId: "wasa-finance-system",
        storageBucket: "wasa-finance-system.firebasestorage.app",
        messagingSenderId: "555224175857",
        appId: "1:555224175857:web:3f9e90b71dd0d250484550"
      };

      const app = initializeApp(config);
      console.log('✅ Firebase initialized manually:', app.name);
    } else {
      console.log('✅ Firebase already initialized');
    }

    // Get auth instance
    const auth = getAuth();
    console.log('🔐 Auth instance:', auth);
    console.log('🌐 Current user:', auth.currentUser);

    // Test login with sample credentials
    console.log('🧪 Testing login with sample credentials...');

    // Ganti dengan email/password yang Anda buat di Firebase
    const testEmail = 'test@example.com'; // Ganti dengan email Anda
    const testPassword = 'password123';   // Ganti dengan password Anda

    try {
      const result = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('✅ Direct Firebase login successful:', result.user);
      console.log('👤 User info:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });
    } catch (error) {
      console.error('❌ Direct Firebase login failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }

  } catch (error) {
    console.error('❌ Firebase debug failed:', error);
  }
})();