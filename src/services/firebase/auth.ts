import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { firebaseAuth } from './config';

// Ensure browser local persistence for session state
setPersistence(firebaseAuth, browserLocalPersistence).catch(err => {
  console.warn('[FirebaseAuth] Persistence setup fallback:', err);
});

/**
 * Format Firebase Auth Error codes into human-readable user messages.
 */
export function getAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  const message = error?.message || '';

  if (message.includes('missing initial state') || message.includes('storage-partitioned')) {
    return 'Google Sign-In was blocked by browser storage partitioning. Please allow cookies for this site or use Email & Password authentication.';
  }

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email address or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/user-disabled':
      return 'This user account has been disabled by administrators.';
    case 'auth/operation-not-allowed':
      return 'Authentication provider disabled. Please check your Firebase Console authentication settings.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled before completion.';
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by your browser settings. Please allow popups for this site.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. You can reset your password or try again later.';
    case 'auth/network-request-failed':
      return 'Network error encountered. Please check your internet connection and try again.';
    case 'auth/web-storage-unsupported':
      return 'Browser storage is blocked. Please enable cookies and local storage to sign in.';
    default:
      return message || 'Authentication failed. Please verify your credentials.';
  }
}

/**
 * Authenticates user with Firebase Auth via Email + Password.
 */
export async function loginWithFirebase(email: string, pass: string): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), pass);
  return cred.user;
}

/**
 * Authenticates user with Firebase Auth via Google Sign-In Provider.
 * Safely catches storage-partitioned browser environment errors.
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const cred = await signInWithPopup(firebaseAuth, provider);
    return cred.user;
  } catch (err: any) {
    if (err?.message?.includes('missing initial state') || err?.code === 'auth/web-storage-unsupported') {
      console.warn('[FirebaseAuth] Storage partitioning detected during Google popup auth:', err);
      throw new Error('Google Sign-In popup was blocked by browser storage partitioning. Please allow cookies or use Email & Password sign-in.');
    }
    throw err;
  }
}

/**
 * Registers new user with Firebase Auth via Email + Password.
 */
export async function registerWithFirebase(email: string, pass: string): Promise<FirebaseUser> {
  const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), pass);
  return cred.user;
}

/**
 * Sends a password reset email via Firebase Auth.
 */
export async function sendFirebasePasswordReset(email: string): Promise<boolean> {
  await sendPasswordResetEmail(firebaseAuth, email.trim());
  return true;
}

/**
 * Signs out the current Firebase user.
 */
export async function logoutFirebase(): Promise<boolean> {
  try {
    await signOut(firebaseAuth);
    return true;
  } catch (err) {
    console.error('[FirebaseAuth] Logout error:', err);
    return false;
  }
}

/**
 * Real-time auth state listener wrapper.
 */
export function subscribeAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(firebaseAuth, callback);
}
