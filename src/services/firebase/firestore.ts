import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  addDoc,
  query,
  where,
  QueryConstraint,
  DocumentData,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { firebaseDb } from './config';

export { deleteField };

/**
 * Deeply or shallowly cleans object of undefined values to prevent Firestore SDK validation errors.
 */
export function cleanUndefinedFields<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Adds a new document to a collection with an auto-generated ID.
 */
export async function addDocument<T extends Record<string, any>>(
  collectionName: string,
  data: T
): Promise<string | null> {
  try {
    const colRef = collection(firebaseDb, collectionName);
    const docRef = await addDoc(colRef, cleanUndefinedFields(data));
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
    const cleaned = cleanUndefinedFields(data);
    await setDoc(docRef, cleaned, { merge });
    return true;
  } catch (error) {
    console.error(`[Firestore] Failed to set ${collectionName}/${docId}:`, error);
    return false;
  }
}

/**
 * Updates specific fields on an existing document with undefined stripping and setDoc merge fallback.
 */
export async function updateDocumentFields(
  collectionName: string,
  docId: string,
  data: Record<string, any>
): Promise<boolean> {
  const docRef = doc(firebaseDb, collectionName, docId);
  const cleaned = cleanUndefinedFields(data);

  try {
    await updateDoc(docRef, cleaned);
    return true;
  } catch (error: any) {
    console.warn(`[Firestore] updateDoc failed for ${collectionName}/${docId}, attempting setDoc merge fallback:`, error);
    // If updateDoc failed because the document does not exist yet, fallback to setDoc with merge: true
    try {
      await setDoc(docRef, cleaned, { merge: true });
      return true;
    } catch (fallbackError) {
      console.error(`[Firestore] setDoc fallback also failed for ${collectionName}/${docId}:`, fallbackError);
      throw fallbackError;
    }
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
