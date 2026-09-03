// Test Firestore stations collection fetch on voltconnect-30c9b

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

async function checkFirestoreRuntime() {
  console.log('=== TESTING FIRESTORE RUNTIME QUERY ON voltconnect-30c9b ===\n');

  // Firebase config
  const config = {
    projectId: 'voltconnect-30c9b',
  };

  try {
    const app = initializeApp(config);
    const db = getFirestore(app);
    const colRef = collection(db, 'stations');
    
    console.log('Sending getDocs query to "stations" collection...');
    const snapshot = await getDocs(colRef);

    console.log('STATUS: SUCCESS');
    console.log('Retrieved Station Docs Count:', snapshot.docs.length);

    if (snapshot.docs.length > 0) {
      console.log('\nFirst 3 Stations in Firestore:');
      snapshot.docs.slice(0, 3).forEach((d, idx) => {
        const data = d.data();
        console.log(`  ${idx + 1}. ID: ${d.id} | Name: ${data.name || data.station_name} | City: ${data.city || 'N/A'}`);
      });
    } else {
      console.log('WARNING: Firestore returned 0 documents! Collection may be unpopulated.');
    }
  } catch (err) {
    console.error('STATUS: FAILED');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
  }
}

checkFirestoreRuntime().catch(console.error);
