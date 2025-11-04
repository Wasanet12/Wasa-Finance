// Test Simple Authentication - Copy ke browser console
// Test apakah Firebase auth benar-benar berfungsi

(async () => {
  console.log('🧪 Testing Simple Firebase Auth...');

  try {
    // Import Firebase modules
    const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
    const { initializeApp, getApps } = await import('firebase/app');

    console.log('✅ Firebase modules imported');

    // Check existing apps
    const existingApps = getApps();
    console.log('📊 Existing Firebase apps:', existingApps.length);

    // Use existing app or initialize new one
    let app;
    if (existingApps.length > 0) {
      app = existingApps[0];
      console.log('✅ Using existing Firebase app');
    } else {
      const config = {
        apiKey: "AIzaSyBac3tU2OQkkRZ7ctPYLVgHmLoWCCc-p9Y",
        authDomain: "wasa-finance-system.firebaseapp.com",
        projectId: "wasa-finance-system"
      };
      app = initializeApp(config);
      console.log('✅ Initialized new Firebase app');
    }

    // Get auth instance
    const auth = getAuth(app);
    console.log('✅ Auth instance:', auth);

    // Test login - GANTI dengan email/password Anda
    const testEmail = 'your-email@example.com'; // GANTI INI
    const testPassword = 'your-password';     // GANTI INI

    console.log('🔑 Testing login with:', testEmail);

    const result = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('🎉 LOGIN SUCCESSFUL!');
    console.log('👤 User:', result.user);
    console.log('📧 Email:', result.user.email);
    console.log('🆔 UID:', result.user.uid);

    // Test auth state change
    const { onAuthStateChanged } = await import('firebase/auth');
    onAuthStateChanged(auth, (user) => {
      console.log('🔄 Auth state changed:', user ? 'Logged in' : 'Logged out');
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
})();