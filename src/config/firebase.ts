import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Handle Firebase Auth domain resolution:
// On localhost or when explicitly configured, use the canonical firebaseapp domain.
// Only use window.location.hostname in production browser environments when reverse-proxied.
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const targetAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 
  (isLocalhost ? 'voltconnect-30c9b.firebaseapp.com' : (isBrowser && window.location.hostname ? window.location.hostname : 'voltconnect-30c9b.firebaseapp.com'));

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCAzSbzrxt-kA7YSWLg-qaaT8v8dix_NKE',
  authDomain: targetAuthDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'voltconnect-30c9b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'voltconnect-30c9b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '519731202341',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:519731202341:web:3dad41a010123c1cc7b2cc',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-8LMV1VE291',
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
    '[FirebaseConfig] Missing VITE_FIREBASE_* environment variables. Using production fallback parameters for voltconnect-30c9b.'
  );
}

// Singleton initialization with clear error safety
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
