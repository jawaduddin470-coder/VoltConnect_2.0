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

  if (
    message.includes('Illegal url for new iframe') ||
    message.includes('storage-partitioned') ||
    message.includes('missing initial state') ||
    code === 'auth/unauthorized-domain'
  ) {
    return 'Google Sign-In was restricted by browser cross-site tracking settings. Please use Email & Password authentication below or allow 3rd-party cookies for this site.';
  }

  if (
    message.includes('requests-from-referer') ||
    message.includes('API_KEY_HTTP_REFERRER_BLOCKED') ||
    code === 'auth/requests-from-referer-<empty>-are-blocked'
  ) {
    return 'Authentication service network restrictions blocked this origin. Please check Firebase domain configuration.';
  }

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email address or password. Please check your credentials and try again.';
    case 'auth/user-not-found':
      return 'No registered account found with this email address. Please check your email or contact support.';
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
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const cred = await signInWithPopup(firebaseAuth, provider);
    return cred.user;
  } catch (err: any) {
    console.warn('[FirebaseAuth] Google login error:', err);
    const friendlyMsg = getAuthErrorMessage(err);
    throw new Error(friendlyMsg);
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
