// Diagnostic script to query live Firestore stations collection in voltconnect-30c9b

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB...", // Will load from config
  projectId: "voltconnect-30c9b",
};

async function testFirestore() {
  console.log('=== TESTING FIRESTORE STATIONS COLLECTION IN voltconnect-30c9b ===\n');

  try {
    const app = initializeApp({ projectId: 'voltconnect-30c9b' });
    const db = getFirestore(app);
    const colRef = collection(db, 'stations');
    const snapshot = await getDocs(colRef);

    console.log('Docs Count in Firestore "stations" collection:', snapshot.docs.length);
    if (snapshot.docs.length > 0) {
      snapshot.docs.slice(0, 5).forEach((d, idx) => {
        console.log(`Doc ${idx + 1}:`, d.id, d.data().name || d.data().station_name);
      });
    }
  } catch (err) {
    console.error('Firestore Error:', err.message);
  }
}

testFirestore().catch(console.error);
