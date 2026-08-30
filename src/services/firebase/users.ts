import { UserProfile, UserRole } from '@/types';
import { getDocument, setDocument, updateDocumentFields, getCollectionDocs } from './firestore';

const USERS_COLLECTION = 'users';

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  return getDocument<UserProfile>(USERS_COLLECTION, uid);
}

export async function saveUserProfile(user: UserProfile): Promise<boolean> {
  return setDocument(USERS_COLLECTION, user.uid, {
    ...user,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateUserRole(uid: string, role: UserRole): Promise<boolean> {
  return updateDocumentFields(USERS_COLLECTION, uid, {
    role,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateOnboardingStatus(uid: string, complete: boolean): Promise<boolean> {
  return updateDocumentFields(USERS_COLLECTION, uid, {
    onboardingComplete: complete,
    updatedAt: new Date().toISOString(),
  });
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  try {
    const docs = await getCollectionDocs<UserProfile>(USERS_COLLECTION);
    return docs || [];
  } catch (error) {
    console.warn('[UsersService] Failed to fetch all users:', error);
    return [];
  }
}

export async function updateUserStatus(uid: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<boolean> {
  return updateDocumentFields(USERS_COLLECTION, uid, {
    status,
    updatedAt: new Date().toISOString(),
  });
}
