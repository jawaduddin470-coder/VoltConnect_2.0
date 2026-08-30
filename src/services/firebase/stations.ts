import { ChargingStation } from '@/types';
import { getCollectionDocs, getDocument, setDocument, listenToCollection } from './firestore';
import { normalizeStationData } from '../chargingDataService';

const STATIONS_COLLECTION = 'stations';

/**
 * Fetches all charging stations from the existing Cloud Firestore 'stations' collection.
 * Maintains complete read-compatibility with OpenChargeMap and partner datasets.
 * Does NOT overwrite or mutate existing database records.
 */
export async function fetchFirestoreStations(): Promise<ChargingStation[]> {
  try {
    const docs = await getCollectionDocs<any>(STATIONS_COLLECTION);
    if (docs.length > 0) {
      return docs.map(normalizeStationData);
    }
  } catch (error) {
    console.warn('[Stations Service] Firestore read fallback to local dataset:', error);
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
