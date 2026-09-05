import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCAzSbzrxt-kA7YSWLg-qaaT8v8dix_NKE',
  authDomain: 'voltconnect-30c9b.firebaseapp.com',
  projectId: 'voltconnect-30c9b',
  storageBucket: 'voltconnect-30c9b.firebasestorage.app',
  messagingSenderId: '519731202341',
  appId: '1:519731202341:web:3dad41a010123c1cc7b2cc',
};

async function checkLiveHealth() {
  console.log('=== CHECKING LIVE FIREBASE / FIRESTORE HEALTH ===\n');
  const app = initializeApp(firebaseConfig, `health-${Date.now()}`);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // 1. Check Stations collection
  try {
    const stationsSnap = await getDocs(collection(db, 'stations'));
    console.log(`[FIRESTORE STATIONS] Success: ${stationsSnap.docs.length} stations found in live Firestore.`);
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    stationsSnap.docs.forEach(doc => {
      const d = doc.data();
      if (d.verificationStatus === 'pending') pending++;
      else if (d.verificationStatus === 'rejected') rejected++;
      else approved++;
    });
    console.log(`  - Approved: ${approved}`);
    console.log(`  - Pending:  ${pending}`);
    console.log(`  - Rejected: ${rejected}`);
  } catch (err) {
    console.error(`[FIRESTORE STATIONS ERROR]: ${err.code} - ${err.message}`);
  }

  // 2. Check Users collection (note: requires auth or rule)
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log(`[FIRESTORE USERS] Success: ${usersSnap.docs.length} user documents found.`);
  } catch (err) {
    console.log(`[FIRESTORE USERS RULE CHECK]: ${err.code} - ${err.message}`);
  }

  // 3. Check Auth with admin credentials
  try {
    const cred = await signInWithEmailAndPassword(auth, 'meraj@voltconnect.io', 'password123');
    console.log(`[FIREBASE AUTH ADMIN] Success! UID: ${cred.user.uid}, Email: ${cred.user.email}`);
  } catch (err) {
    console.log(`[FIREBASE AUTH ADMIN]: ${err.code} - ${err.message}`);
  }
}

checkLiveHealth().catch(console.error);
