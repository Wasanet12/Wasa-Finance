/**
 * Deploy Firestore Security Rules
 * Run this script to deploy the security rules to Firebase
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

console.log('🚀 Deploying Firestore Security Rules...');

// Check if firebase-tools is installed
try {
  execSync('firebase --version', { stdio: 'pipe' });
} catch {
  console.error('❌ Firebase CLI not found. Please install it first:');
  console.error('npm install -g firebase-tools');
  process.exit(1);
}

// Check if firestore.rules exists
const rulesPath = path.join(__dirname, 'firestore.rules');
if (!fs.existsSync(rulesPath)) {
  console.error('❌ firestore.rules file not found!');
  process.exit(1);
}

try {
  // Deploy only Firestore rules
  console.log('📤 Deploying Firestore security rules...');
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });

  console.log('✅ Firestore security rules deployed successfully!');
  console.log('');
  console.log('📋 Rules Summary:');
  console.log('- Users can read/write their own documents');
  console.log('- Authenticated users can read/write customers, expenses, and payments');
  console.log('- Admin users have full access to all collections');
  console.log('- Package and report writes require admin/user role');
  console.log('- Settings write access requires admin role');

} catch (error) {
  console.error('❌ Failed to deploy Firestore rules:', error.message);
  console.error('');
  console.error('💡 Make sure you are logged in to Firebase:');
  console.error('firebase login');
  console.error('');
  console.error('💡 And have initialized Firebase in this project:');
  console.error('firebase init firestore');
  process.exit(1);
}