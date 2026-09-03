import { ChargingStation } from '@/types';
import { signInAnonymously } from 'firebase/auth';
import { getCollectionDocs, getDocument, setDocument, listenToCollection } from './firestore';
import { firebaseAuth } from './config';
import { normalizeStationData } from '../chargingDataService';

const STATIONS_COLLECTION = 'stations';

/**
 * Fetches all charging stations from the existing Cloud Firestore 'stations' collection.
 * Auto-ensures anonymous authentication if unauthenticated to satisfy Firestore security rules.
 * Maintains complete read-compatibility with OpenChargeMap and partner datasets.
 */
export async function fetchFirestoreStations(): Promise<ChargingStation[]> {
  try {
    // 1. Ensure Firebase Auth session exists for Firestore read security rules
    if (!firebaseAuth.currentUser) {
      try {
        await signInAnonymously(firebaseAuth);
        console.info('[Stations Service] Anonymous auth session established for Firestore read.');
      } catch (authErr) {
        console.warn('[Stations Service] Anonymous auth sign-in skipped/failed:', authErr);
      }
    }

    const docs = await getCollectionDocs<any>(STATIONS_COLLECTION);
    if (docs.length > 0) {
      return docs.map(normalizeStationData);
    }
  } catch (error: any) {
    console.warn('[Stations Service] Primary Firestore read error:', error?.message || error);
    // 2. Retry with forced anonymous sign-in if initial fetch failed
    try {
      if (!firebaseAuth.currentUser) {
        await signInAnonymously(firebaseAuth);
      }
      const retryDocs = await getCollectionDocs<any>(STATIONS_COLLECTION);
      if (retryDocs.length > 0) {
        return retryDocs.map(normalizeStationData);
      }
    } catch (retryErr) {
      console.warn('[Stations Service] Retry Firestore read failed:', retryErr);
    }
  }
  return [];
}

/**
 * Listens to real-time updates on the 'stations' collection.
 */
export function listenToFirestoreStations(onData: (stations: ChargingStation[]) => void) {
  return listenToCollection<any>(STATIONS_COLLECTION, rawDocs => {
    if (rawDocs.length > 0) {
      onData(rawDocs.map(normalizeStationData));
    }
  });
}

/**
 * Reads a specific station record by ID.
 */
export async function getStationById(stationId: string): Promise<ChargingStation | null> {
  const raw = await getDocument<any>(STATIONS_COLLECTION, stationId);
  return raw ? normalizeStationData(raw) : null;
}

/**
 * Safely adds or updates a partner station record.
 */
export async function savePartnerStation(station: Partial<ChargingStation> & { id: string }): Promise<boolean> {
  return setDocument(STATIONS_COLLECTION, station.id, {
    ...station,
    updatedAt: new Date().toISOString(),
  });
}
