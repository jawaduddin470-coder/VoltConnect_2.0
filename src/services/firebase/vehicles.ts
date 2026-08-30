import { UserVehicle } from '@/types';
import { getCollectionDocs, setDocument, updateDocumentFields, getDocument } from './firestore';
import { where } from 'firebase/firestore';

const VEHICLES_COLLECTION = 'vehicles';

export async function fetchUserVehicles(userId: string): Promise<UserVehicle[]> {
  return getCollectionDocs<UserVehicle>(VEHICLES_COLLECTION, [where('userId', '==', userId)]);
}

export async function saveUserVehicle(vehicle: UserVehicle): Promise<boolean> {
  return setDocument(VEHICLES_COLLECTION, vehicle.id, {
    ...vehicle,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateUserVehicleFields(vehicleId: string, data: Partial<UserVehicle>): Promise<boolean> {
  return updateDocumentFields(VEHICLES_COLLECTION, vehicleId, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}
