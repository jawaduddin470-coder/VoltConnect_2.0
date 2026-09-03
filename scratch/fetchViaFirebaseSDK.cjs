const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = {
  apiKey: 'AIzaSyCAzSbzrxt-kA7YSWLg-qaaT8v8dix_NKE',
  authDomain: 'voltconnect-30c9b.firebaseapp.com',
  projectId: 'voltconnect-30c9b',
  storageBucket: 'voltconnect-30c9b.firebasestorage.app',
  messagingSenderId: '519731202341',
  appId: '1:519731202341:web:3dad41a010123c1cc7b2cc',
  measurementId: 'G-8LMV1VE291',
};

async function testFetch() {
  console.log('Initializing Firebase Web SDK...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log('Querying Firestore "stations" collection via Web SDK...');
  const snapshot = await getDocs(collection(db, 'stations'));
  
  console.log(`Retrieved ${snapshot.docs.length} documents from Firestore "stations" collection.`);

  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  fs.writeFileSync('scratch/firestore_stations_sdk_dump.json', JSON.stringify(docs, null, 2));
  console.log('Saved dump to scratch/firestore_stations_sdk_dump.json');

  let validCoords = 0;
  docs.forEach(d => {
    const lat = Number(d.latitude ?? d.AddressInfo?.Latitude);
    const lng = Number(d.longitude ?? d.AddressInfo?.Longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      validCoords++;
    }
  });

  console.log('Valid coordinates count:', validCoords);
}

testFetch().catch(console.error);
