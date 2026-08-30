import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// In browser environments, use window.location.hostname as authDomain so Vercel SPA rewrites
// handle Firebase Auth via same-origin proxy (/__/auth/*), resolving Safari/Chrome ITP 3rd-party cookie blocking.
const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
const targetAuthDomain = currentHostname || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'voltconnect-30c9b.firebaseapp.com';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: targetAuthDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate environment variables before initializing to ensure production safety
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.authDomain &&
    firebaseConfig.appId
);

if (!isFirebaseConfigured) {
  console.warn(
    '[FirebaseConfig] Missing VITE_FIREBASE_* environment variables. Ensure variables are populated in .env or Vercel Environment Variables.'
  );
}

// Singleton initialization with clear error safety
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
