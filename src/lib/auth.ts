/**
 * Authentication Utilities
 * Simplified wrapper for Wasa Finance System authentication
 *
 * This file re-exports the main auth functions from the auth service
 * for easier import and backward compatibility.
 */

// Re-export everything from the auth service
export {
  login,
  register,
  logout,
  forgotPassword,
  updateUserPassword,
  updateUserProfile,
  onAuthStateChanged,
  getAuthState,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  canEdit
} from './auth/index';

// Re-export types
export type { User, AuthState } from './auth/index';

// Export default auth service instance
export { default as authService } from './auth/index';