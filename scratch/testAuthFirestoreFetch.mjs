// Diagnostic script to test Firebase Anonymous Auth + Firestore Read on voltconnect-30c9b

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

async function checkAuthAndFirestore() {
  console.log('=== TESTING ANONYMOUS AUTH + FIRESTORE QUERY ON voltconnect-30c9b ===\n');

  const config = {
    projectId: 'voltconnect-30c9b',
  };

  try {
    const app = initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('Signing in anonymously via Firebase Auth...');
    const cred = await signInAnonymously(auth);
    console.log('Signed in anonymously! UID:', cred.user.uid);

    console.log('Querying Firestore "stations" collection with Auth token...');
    const colRef = collection(db, 'stations');
    const snapshot = await getDocs(colRef);

    console.log('STATUS: SUCCESS!');
    console.log('Retrieved Station Docs Count:', snapshot.docs.length);

    if (snapshot.docs.length > 0) {
      snapshot.docs.slice(0, 5).forEach((d, idx) => {
        const data = d.data();
        console.log(`  ${idx + 1}. ID: ${d.id} | Name: ${data.name || data.station_name}`);
      });
    }
  } catch (err) {
    console.error('STATUS: FAILED');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
  }
}

checkAuthAndFirestore().catch(console.error);
