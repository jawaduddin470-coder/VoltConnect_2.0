import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  QueryConstraint,
  DocumentData,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { firebaseDb } from './config';

/**
 * Adds a new document to a collection with an auto-generated ID.
 */
export async function addDocument<T extends Record<string, any>>(
  collectionName: string,
  data: T
): Promise<string | null> {
  try {
    const colRef = collection(firebaseDb, collectionName);
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  } catch (error) {
    console.error(`[Firestore] Failed to add document to ${collectionName}:`, error);
    return null;
  }
}

/**
 * Reads a single document by collection name and document ID.
 */
export async function getDocument<T = DocumentData>(collectionName: string, docId: string): Promise<T | null> {
  try {
    const docRef = doc(firebaseDb, collectionName, docId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as T;
    }
    return null;
  } catch (error) {
    console.warn(`[Firestore] Failed to read ${collectionName}/${docId}:`, error);
    return null;
  }
}

/**
 * Reads all documents from a collection with optional query constraints.
 */
export async function getCollectionDocs<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const colRef = collection(firebaseDb, collectionName);
    const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
  } catch (error) {
    console.warn(`[Firestore] Failed to fetch collection ${collectionName}:`, error);
    return [];
  }
}

/**
 * Sets a document with setDoc (merge option supported).
 */
export async function setDocument<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: T,
  merge = true
): Promise<boolean> {
  try {
    const docRef = doc(firebaseDb, collectionName, docId);
    await setDoc(docRef, data, { merge });
    return true;
  } catch (error) {
    console.error(`[Firestore] Failed to set ${collectionName}/${docId}:`, error);
    return false;
  }
}

/**
 * Updates specific fields on an existing document.
 */
export async function updateDocumentFields(
  collectionName: string,
  docId: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    const docRef = doc(firebaseDb, collectionName, docId);
    await updateDoc(docRef, data);
    return true;
  } catch (error) {
    console.error(`[Firestore] Failed to update ${collectionName}/${docId}:`, error);
    return false;
  }
}

/**
 * Listens to a collection in real time.
 */
export function listenToCollection<T = DocumentData>(
  collectionName: string,
  onData: (items: T[]) => void,
  constraints: QueryConstraint[] = []
): Unsubscribe {
  const colRef = collection(firebaseDb, collectionName);
  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
  return onSnapshot(
    q,
    snapshot => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
      onData(items);
    },
    error => {
      console.warn(`[Firestore Listener Error] ${collectionName}:`, error);
    }
  );
}
