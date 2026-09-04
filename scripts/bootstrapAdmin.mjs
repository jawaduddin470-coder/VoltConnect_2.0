#!/usr/bin/env node
/**
 * VoltConnect 2.0 — Administrative Account Bootstrapping Script
 * 
 * Safely provisions an administrator identity in Firebase Authentication and Firestore
 * with { role: "admin" } without exposing public client-side elevation.
 * 
 * Usage:
 *   node scripts/bootstrapAdmin.mjs <admin_email> <admin_password> [admin_name]
 * 
 * Example:
 *   node scripts/bootstrapAdmin.mjs meraj@voltconnect.io "MasterSecurePass123" "Mohammed Meraj Uddin"
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, addDoc, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCAzSbzrxt-kA7YSWLg-qaaT8v8dix_NKE',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'voltconnect-30c9b.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'voltconnect-30c9b',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'voltconnect-30c9b.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '519731202341',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:519731202341:web:3dad41a010123c1cc7b2cc',
};

async function bootstrapAdmin() {
  console.log('================================================================');
  console.log('VOLTCONNECT 2.0 — PLATFORM ADMIN BOOTSTRAP UTILITY');
  console.log('================================================================\n');

  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_BOOTSTRAP_EMAIL || 'meraj@voltconnect.io').trim();
  const password = (args[1] || process.env.ADMIN_BOOTSTRAP_PASSWORD || 'password123').trim();
  const name = (args[2] || 'Mohammed Meraj Uddin').trim();

  if (!email || !password) {
    console.error('ERROR: Missing required email or password arguments.');
    console.error('Usage: node scripts/bootstrapAdmin.mjs <admin_email> <admin_password> [admin_name]');
    process.exit(1);
  }

  console.log(`Target Admin Email:  ${email}`);
  console.log(`Target Admin Name:   ${name}`);
  console.log(`Firebase Project ID: ${firebaseConfig.projectId}\n`);

  const app = initializeApp(firebaseConfig, `bootstrap-${Date.now()}`);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let userUid = null;

  try {
    console.log('1. Checking if Firebase Auth account already exists...');
    try {
      const signInRes = await signInWithEmailAndPassword(auth, email, password);
      userUid = signInRes.user.uid;
      console.log(`   ✓ Existing account authenticated successfully! UID: ${userUid}`);
    } catch (signInErr) {
      if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
        console.log('   Account does not exist yet. Creating new Firebase Auth account...');
        const createRes = await createUserWithEmailAndPassword(auth, email, password);
        userUid = createRes.user.uid;
        console.log(`   ✓ New administrator account created! UID: ${userUid}`);
      } else {
        throw signInErr;
      }
    }

    console.log('\n2. Checking and provisioning Firestore /users profile...');
    const userDocRef = doc(db, 'users', userUid);
    const existingDoc = await getDoc(userDocRef);

    const now = new Date().toISOString();
    const adminProfile = {
      uid: userUid,
      name,
      email,
      role: 'admin',
      status: 'ACTIVE',
      onboardingComplete: true,
      profileComplete: true,
      activeVehicleName: 'Tata Nexon EV Empowered+ Lux 45',
      evCategory: '4-wheeler',
      createdAt: existingDoc.exists() ? (existingDoc.data()?.createdAt || now) : now,
      updatedAt: now,
      lastLoginAt: now,
    };

    await setDoc(userDocRef, adminProfile, { merge: true });
    console.log(`   ✓ Firestore profile /users/${userUid} saved with role: "admin"`);

    console.log('\n3. Recording audit event in admin_audit_logs...');
    try {
      await addDoc(collection(db, 'admin_audit_logs'), {
        action: 'ADMIN_BOOTSTRAP_PROVISION',
        actorId: userUid,
        actorEmail: email,
        actorRole: 'admin',
        targetId: userUid,
        targetCollection: 'users',
        timestamp: now,
        details: { email, role: 'admin', provisionedBy: 'bootstrapAdmin.mjs' },
      });
      console.log('   ✓ Immutable audit log entry created.');
    } catch (auditErr) {
      console.warn('   (Notice: audit log write skipped or pending rule evaluation)');
    }

    await signOut(auth);

    console.log('\n================================================================');
    console.log('SUCCESS! Admin account is fully provisioned and ready for login.');
    console.log(`URL:      /login/admin`);
    console.log(`Email:    ${email}`);
    console.log(`Role:     admin`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n✗ Bootstrap failed with error:', err.message);
    if (err.message?.includes('requests-from-referer') || err.message?.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
      console.log('\n[NOTICE] The Firebase API Key has Google Cloud HTTP Referrer restrictions.');
      console.log('To provision through Firebase Console:');
      console.log('1. Firebase Console -> Authentication -> Users -> Add User:');
      console.log(`   Email: ${email}`);
      console.log('   Password: <your_password>');
      console.log('2. Firebase Console -> Cloud Firestore -> users collection -> Add Document:');
      console.log('   Document ID: <Firebase_UID>');
      console.log(`   Fields: { uid: "<Firebase_UID>", name: "${name}", email: "${email}", role: "admin", status: "ACTIVE", onboardingComplete: true }`);
    }
    process.exit(1);
  }
}

bootstrapAdmin();
