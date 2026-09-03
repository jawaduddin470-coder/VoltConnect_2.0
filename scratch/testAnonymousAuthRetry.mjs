// Test script to verify Anonymous Auth sign-in + Firestore collection query retry

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

async function runAuthRetryTest() {
  console.log('=== TESTING FIRESTORE QUERY WITH ANONYMOUS AUTH RETRY ON voltconnect-30c9b ===\n');

  const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyForNodeTest",
    projectId: "voltconnect-30c9b",
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let docs = [];
  try {
    console.log('1. Attempting unauthenticated Firestore query...');
    const snapshot = await getDocs(collection(db, 'stations'));
    docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`Unauthenticated query success! ${docs.length} docs retrieved.`);
  } catch (err) {
    console.warn(`1. Unauthenticated query failed (${err.code}). Attempting Anonymous Auth sign-in...`);
    try {
      const userCred = await signInAnonymously(auth);
      console.log(`Anonymous Auth successful! UID: ${userCred.user.uid}`);
      
      const retrySnapshot = await getDocs(collection(db, 'stations'));
      docs = retrySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log(`Authenticated retry query success! ${docs.length} docs retrieved.`);
    } catch (authErr) {
      console.error('Anonymous Auth / Retry failed:', authErr.message);
    }
  }

  console.log(`\nFinal Stations Count Retrieved: ${docs.length}`);
}

runAuthRetryTest().catch(console.error);
