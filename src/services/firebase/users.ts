import { UserProfile, UserRole } from '@/types';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from './config';
import { getDocument, setDocument, updateDocumentFields, getCollectionDocs, addDocument } from './firestore';

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

export interface CreatePartnerParams {
  email: string;
  password: string;
  name: string;
  companyName: string;
  phone?: string;
  createdByAdminUid: string;
}

/**
 * Creates a partner account in Firebase Auth using a secondary app instance,
 * saving the profile in Firestore without logging out the current admin.
 */
export async function adminCreatePartnerAccount(params: CreatePartnerParams): Promise<UserProfile> {
  const { email, password, name, companyName, phone, createdByAdminUid } = params;

  if (!email || !password) {
    throw new Error('Email and password are required to create a partner account');
  }

  const tempAppName = `partner-create-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp);

  try {
    const cred = await createUserWithEmailAndPassword(tempAuth, email.trim(), password);
    const newUid = cred.user.uid;
    await signOut(tempAuth);

    const partnerProfile: UserProfile = {
      uid: newUid,
      name: name || companyName || email.split('@')[0].toUpperCase(),
      email: email.trim(),
      role: 'partner',
      phone: phone || '',
      onboardingComplete: true,
      profileComplete: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await saveUserProfile(partnerProfile);

    // Save to voltconnect_partners collection as well
    await setDocument('voltconnect_partners', newUid, {
      id: newUid,
      name: companyName || name,
      partnerType: 'cpo',
      contactPerson: name || companyName,
      email: email.trim(),
      phone: phone || '',
      city: 'Pan-India',
      stationsCount: 0,
      verificationStatus: 'approved',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    // Record audit event
    await addDocument('admin_audit_logs', {
      action: 'ADMIN_CREATE_PARTNER_ACCOUNT',
      targetUid: newUid,
      targetEmail: email.trim(),
      performedBy: createdByAdminUid,
      timestamp: new Date().toISOString(),
      details: { companyName, name, role: 'partner' },
    });

    return partnerProfile;
  } finally {
    try {
      await deleteApp(tempApp);
    } catch {
      // Ignored if app already cleaned up
    }
  }
}

/**
 * Admin updates a user's role and logs an audit trail event.
 */
export async function adminUpdateUserRole(
  uid: string,
  newRole: UserRole,
  adminUid: string,
  reason?: string
): Promise<boolean> {
  const success = await updateUserRole(uid, newRole);
  if (success) {
    await addDocument('admin_audit_logs', {
      action: 'UPDATE_USER_ROLE',
      targetUid: uid,
      newRole,
      performedBy: adminUid,
      reason: reason || 'Admin updated role',
      timestamp: new Date().toISOString(),
    });
  }
  return success;
}
