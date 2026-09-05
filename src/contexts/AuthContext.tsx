import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole, UserVehicle } from '@/types';
import {
  subscribeAuthState,
  loginWithFirebase,
  loginWithGoogle,
  registerWithFirebase,
  sendFirebasePasswordReset,
  logoutFirebase,
  getAuthErrorMessage,
  fetchUserProfile,
  resolveAuthoritativeRole,
  saveUserProfile,
  saveUserVehicle,
  fetchUserVehicles,
  updateUserRole,
} from '@/services/firebase';
import { MASTER_VEHICLE_CATALOG } from '@/features/vehicles/VehicleCatalog';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  authoritativeRole: UserRole | null;
  loading: boolean;
  authLoading: boolean;
  roleLoading: boolean;
  profileLoading: boolean;
  onboardingComplete: boolean;
  activeVehicle: UserVehicle | null;
  vehicles: UserVehicle[];
  login: (email: string, pass: string, portalRole?: UserRole) => Promise<UserProfile>;
  loginGoogle: () => Promise<UserProfile>;
  signup: (name: string, email: string, pass: string, role?: UserRole) => Promise<UserProfile>;
  resetPassword: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  addVehicle: (vehicle: Omit<UserVehicle, 'id' | 'userId' | 'createdAt'>) => void;
  updateVehicle: (vehicleId: string, data: Partial<UserVehicle>) => void;
  updateActiveVehicleSOC: (socPercent: number) => void;
  removeVehicle: (vehicleId: string) => void;
  setActiveVehicle: (vehicleId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial Fallback Vehicle Model (Tata Nexon EV Long Range)
const DEFAULT_VEHICLE: UserVehicle = {
  id: 'veh-nexon-ev-45',
  userId: 'default-user',
  category: '4-wheeler',
  manufacturer: 'Tata Motors',
  model: 'Nexon EV Long Range',
  variant: 'Empowered+ Lux 45',
  batteryCapacitykWh: 45.0,
  usableCapacitykWh: 43.2,
  estimatedRangeKm: 345,
  currentBatteryPercent: 85,
  estimatedHealthSOH: 98,
  connectorTypes: ['CCS2', 'Type2'],
  acMaxPowerKW: 7.2,
  dcMaxPowerKW: 60.0,
  isDefault: true,
  dataSource: 'VERIFIED',
  createdAt: new Date().toISOString(),
};

/**
 * Evaluates whether a user's profile and vehicle setup are 100% complete.
 * Authoritative Single Source of Truth for Onboarding & Profile Status.
 */
export function isProfileComplete(
  profile: UserProfile | null,
  activeVehicle: UserVehicle | null
): boolean {
  if (!profile) return false;

  // Non-driver roles (partner, technician, admin) bypass driver vehicle onboarding
  if (profile.role && profile.role !== 'driver') return true;

  // 1. Explicit onboarding completion flag check
  if (profile.onboardingComplete !== true) return false;

  // 2. Name check
  if (!profile.name || profile.name.trim().length === 0) return false;

  // 3. Vehicle Brand & Model check (either on profile or activeVehicle)
  const brand = profile.vehicleBrand || activeVehicle?.manufacturer || '';
  const model = profile.vehicleModel || activeVehicle?.model || '';

  if (!brand || brand.trim().length === 0) return false;
  if (!model || model.trim().length === 0) return false;

  // 4. Current Battery Charge (SOC) check
  const soc = activeVehicle?.currentBatteryPercent;
  if (typeof soc !== 'number' || isNaN(soc) || soc < 0 || soc > 100) return false;

  return true;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authoritative State: NEVER derive role or user from localStorage as authorization authority!
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authoritativeRole, setAuthoritativeRole] = useState<UserRole | null>(null);

  // Explicit, separated initialization lifecycle states to eliminate race conditions
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [roleLoading, setRoleLoading] = useState<boolean>(true);

  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [activeVehicle, setActiveVehicleState] = useState<UserVehicle | null>(null);

  // Overall loading is true whenever ANY critical auth, profile, or role resolution is active
  const loading = authLoading || profileLoading || roleLoading;

  // Subscribe to Real Firebase Auth State Listener (onAuthStateChanged)
  useEffect(() => {
    const unsubscribe = subscribeAuthState(async fbUser => {
      setAuthLoading(false);

      if (!fbUser) {
        setUser(null);
        setAuthoritativeRole(null);
        setVehicles([]);
        setActiveVehicleState(null);
        setProfileLoading(false);
        setRoleLoading(false);
        localStorage.removeItem('vc_user');
        localStorage.removeItem('vc_vehicles');
        return;
      }

      setProfileLoading(true);
      setRoleLoading(true);
      try {
        let profile = await fetchUserProfile(fbUser.uid);
        if (!profile) {
          profile = {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0].toUpperCase() || 'VOLT DRIVER',
            email: fbUser.email || 'user@voltconnect.io',
            photoURL: fbUser.photoURL || undefined,
            provider: fbUser.providerData[0]?.providerId || 'password',
            role: 'driver',
            onboardingComplete: false,
            profileComplete: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };
          await saveUserProfile(profile);
        } else {
          profile.lastLoginAt = new Date().toISOString();
          if (fbUser.photoURL && !profile.photoURL) {
            profile.photoURL = fbUser.photoURL;
          }
          await saveUserProfile(profile);
        }

        // Authoritatively resolve role from Firestore profile
        const roleRes = await resolveAuthoritativeRole(fbUser.uid);
        const resolvedRole: UserRole = roleRes || (profile.role as UserRole) || 'driver';

        const dbVehicles = await fetchUserVehicles(fbUser.uid);
        let currentVehicles = dbVehicles;

        // Reconstruct vehicle if profile has saved brand/model but vehicles collection had no docs
        if (currentVehicles.length === 0 && profile?.vehicleBrand && profile?.vehicleModel) {
          const catalogMatch = MASTER_VEHICLE_CATALOG.find(
            v =>
              v.manufacturer.toLowerCase() === profile?.vehicleBrand?.toLowerCase() &&
              v.model.toLowerCase() === profile?.vehicleModel?.toLowerCase()
          );

          const recoveredVehicle: UserVehicle = {
            id: profile.activeVehicleId || profile.vehicleId || `veh-${Date.now()}`,
            userId: fbUser.uid,
            category: catalogMatch?.category || '4-wheeler',
            manufacturer: profile.vehicleBrand,
            model: profile.vehicleModel,
            variant: profile.vehicleVariant || catalogMatch?.variant || '',
            batteryCapacitykWh: catalogMatch?.batteryCapacitykWh || 45.0,
            usableCapacitykWh: catalogMatch?.usableCapacitykWh || 43.2,
            estimatedRangeKm: catalogMatch?.estimatedRangeKm || 345,
            currentBatteryPercent: 85,
            estimatedHealthSOH: 98,
            connectorTypes: catalogMatch?.connectorTypes || ['CCS2', 'Type2'],
            acMaxPowerKW: catalogMatch?.acMaxPowerKW || 7.2,
            dcMaxPowerKW: catalogMatch?.dcMaxPowerKW || 60.0,
            isDefault: true,
            dataSource: 'VERIFIED',
            createdAt: new Date().toISOString(),
          };

          currentVehicles = [recoveredVehicle];
          saveUserVehicle(recoveredVehicle).catch(err => console.warn('[AuthContext] Vehicle sync warning:', err));
        }

        if (currentVehicles.length > 0) {
          setVehicles(currentVehicles);
          const active =
            currentVehicles.find(v => v.id === profile?.activeVehicleId) ||
            currentVehicles.find(v => v.isDefault) ||
            currentVehicles[0];
          setActiveVehicleState(active);
        } else if (profile.onboardingComplete) {
          // Profile is marked complete, ensure active vehicle fallback is present
          const defaultUserVehicle: UserVehicle = {
            ...DEFAULT_VEHICLE,
            userId: fbUser.uid,
          };
          setVehicles([defaultUserVehicle]);
          setActiveVehicleState(defaultUserVehicle);
          saveUserVehicle(defaultUserVehicle).catch(() => {});
        } else {
          // Brand new user without vehicles
          setVehicles([]);
          setActiveVehicleState(null);
        }

        setUser(profile);
        setAuthoritativeRole(resolvedRole);
      } catch (err) {
        console.warn('[AuthContext] Error fetching authenticated user profile:', err);
        setUser(null);
        setAuthoritativeRole(null);
      } finally {
        setProfileLoading(false);
        setRoleLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('vc_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vc_user');
    }
  }, [user]);

  useEffect(() => {
    if (vehicles.length > 0) {
      localStorage.setItem('vc_vehicles', JSON.stringify(vehicles));
    } else {
      localStorage.removeItem('vc_vehicles');
    }
    const active =
      vehicles.find(v => v.id === user?.activeVehicleId) ||
      vehicles.find(v => v.isDefault) ||
      vehicles[0] ||
      (user?.onboardingComplete ? DEFAULT_VEHICLE : null);
    setActiveVehicleState(active);
  }, [vehicles, user]);

  const login = async (email: string, pass: string, portalRole?: UserRole): Promise<UserProfile> => {
    setAuthLoading(true);
    setProfileLoading(true);
    setRoleLoading(true);
    // Clear any previous session residue before authenticating
    setUser(null);
    setAuthoritativeRole(null);
    localStorage.removeItem('vc_user');

    try {
      const fbUser = await loginWithFirebase(email, pass);
      let profile = await fetchUserProfile(fbUser.uid);
      if (!profile) {
        // If attempting to log into a restricted portal without a pre-existing profile, reject and clear auth session
        if (portalRole && portalRole !== 'driver') {
          await logoutFirebase().catch(() => {});
          setUser(null);
          setAuthoritativeRole(null);
          localStorage.removeItem('vc_user');
          throw new Error(`Unauthorized: No registered ${portalRole} profile found for this account.`);
        }
        profile = {
          uid: fbUser.uid,
          name: email.split('@')[0].toUpperCase(),
          email,
          role: 'driver',
          onboardingComplete: false,
          profileComplete: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        await saveUserProfile(profile);
      } else {
        // Check account suspension status
        if (profile.status === 'SUSPENDED') {
          await logoutFirebase().catch(() => {});
          setUser(null);
          setAuthoritativeRole(null);
          localStorage.removeItem('vc_user');
          throw new Error('This account has been suspended by administration. Please contact support.');
        }

        // Authoritatively resolve role from Firestore
        const roleRes = await resolveAuthoritativeRole(fbUser.uid);
        const resolvedRole: UserRole = roleRes || (profile.role as UserRole) || 'driver';

        // Authoritative role validation if logging into the Driver portal
        if (portalRole === 'driver') {
          if (resolvedRole === 'admin' || resolvedRole === 'super_admin') {
            await logoutFirebase().catch(() => {});
            setUser(null);
            setAuthoritativeRole(null);
            localStorage.removeItem('vc_user');
            throw new Error("This account has Administrator privileges. Please sign in via the Admin Command Center at /login/admin.");
          }
          if (resolvedRole === 'partner') {
            await logoutFirebase().catch(() => {});
            setUser(null);
            setAuthoritativeRole(null);
            localStorage.removeItem('vc_user');
            throw new Error("This account is registered as a CPO Partner. Please sign in via the Partner Portal at /login/partner.");
          }
          if (resolvedRole === 'technician') {
            await logoutFirebase().catch(() => {});
            setUser(null);
            setAuthoritativeRole(null);
            localStorage.removeItem('vc_user');
            throw new Error("This account is registered as a Field Technician. Please sign in via the Technician Portal at /login/technician.");
          }
        }

        // Authoritative role validation if portal requested specific role
        if (portalRole && portalRole !== 'driver') {
          const isAllowed =
            resolvedRole === portalRole ||
            (portalRole === 'admin' && resolvedRole === 'super_admin') ||
            (portalRole === 'partner' && (resolvedRole === 'admin' || resolvedRole === 'super_admin')) ||
            (portalRole === 'technician' && (resolvedRole === 'admin' || resolvedRole === 'super_admin'));

          if (!isAllowed) {
            await logoutFirebase().catch(() => {});
            setUser(null);
            setAuthoritativeRole(null);
            localStorage.removeItem('vc_user');
            throw new Error(`Unauthorized: User role '${resolvedRole}' does not have '${portalRole}' access privileges.`);
          }
        }

        profile.lastLoginAt = new Date().toISOString();
        await saveUserProfile(profile);
      }

      const finalRoleRes = await resolveAuthoritativeRole(fbUser.uid);
      const finalRole: UserRole = finalRoleRes || (profile.role as UserRole) || 'driver';

      setUser(profile);
      setAuthoritativeRole(finalRole);
      return profile;
    } catch (err: any) {
      setUser(null);
      setAuthoritativeRole(null);
      const rawMsg = err?.message || '';
      const friendlyMsg = rawMsg.startsWith('Unauthorized:') || rawMsg.includes('suspended') || rawMsg.includes('privileges') || rawMsg.includes('registered as')
        ? rawMsg
        : getAuthErrorMessage(err);
      console.error('[AuthContext] Login error:', err);
      throw new Error(friendlyMsg);
    } finally {
      setAuthLoading(false);
      setProfileLoading(false);
      setRoleLoading(false);
    }
  };

  const loginGoogle = async (): Promise<UserProfile> => {
    setAuthLoading(true);
    setProfileLoading(true);
    setRoleLoading(true);
    try {
      const fbUser = await loginWithGoogle();
      let profile = await fetchUserProfile(fbUser.uid);
      if (!profile) {
        profile = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Volt Driver',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || undefined,
          provider: 'google.com',
          role: 'driver',
          onboardingComplete: false,
          profileComplete: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        await saveUserProfile(profile);
      } else {
        profile.lastLoginAt = new Date().toISOString();
        await saveUserProfile(profile);
      }

      const roleRes = await resolveAuthoritativeRole(fbUser.uid);
      const finalRole: UserRole = roleRes || (profile.role as UserRole) || 'driver';

      setUser(profile);
      setAuthoritativeRole(finalRole);
      return profile;
    } catch (err: any) {
      const friendlyMsg = getAuthErrorMessage(err);
      console.error('[AuthContext] Google sign-in error:', err);
      throw new Error(friendlyMsg);
    } finally {
      setAuthLoading(false);
      setProfileLoading(false);
      setRoleLoading(false);
    }
  };

  const signup = async (name: string, email: string, pass: string, _role: UserRole = 'driver'): Promise<UserProfile> => {
    setAuthLoading(true);
    setProfileLoading(true);
    setRoleLoading(true);
    try {
      // Public signup is strictly locked to driver role to prevent self-elevation
      const fbUser = await registerWithFirebase(email, pass);
      const profile: UserProfile = {
        uid: fbUser.uid,
        name,
        email,
        role: 'driver',
        onboardingComplete: false,
        profileComplete: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await saveUserProfile(profile);
      setUser(profile);
      setAuthoritativeRole('driver');
      return profile;
    } catch (err: any) {
      const friendlyMsg = getAuthErrorMessage(err);
      console.error('[AuthContext] Signup error:', err);
      throw new Error(friendlyMsg);
    } finally {
      setAuthLoading(false);
      setProfileLoading(false);
      setRoleLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      await sendFirebasePasswordReset(email);
      return true;
    } catch (err: any) {
      console.error('[AuthContext] Password reset error:', err);
      throw new Error(getAuthErrorMessage(err));
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutFirebase();
    } catch (err) {
      console.warn('[AuthContext] Firebase logout warning:', err);
    } finally {
      setUser(null);
      setAuthoritativeRole(null);
      setVehicles([]);
      setActiveVehicleState(null);
      localStorage.removeItem('vc_user');
      localStorage.removeItem('vc_vehicles');
      sessionStorage.clear();
    }
  };

  const switchRole = (newRole: UserRole) => {
    if (user) {
      // Only admins/super_admins can switch roles on demand (e.g. for role preview)
      if (user.role !== 'admin' && user.role !== 'super_admin' && newRole !== 'driver') {
        console.warn('[AuthContext] Unauthorized attempt to self-elevate role to', newRole);
        return;
      }
      const updated = { ...user, role: newRole };
      setUser(updated);
      setAuthoritativeRole(newRole);
      updateUserRole(user.uid, newRole);
    }
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...data, updatedAt: new Date().toISOString() };
      setUser(updated);
      saveUserProfile(updated);
    }
  };

  const addVehicle = (vehicle: Omit<UserVehicle, 'id' | 'userId' | 'createdAt'>) => {
    if (user) {
      const newVehicle: UserVehicle = {
        ...vehicle,
        id: `veh-${Date.now()}`,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };
      const updatedVehicles = [...vehicles, newVehicle];
      setVehicles(updatedVehicles);
      setActiveVehicleState(newVehicle);
      saveUserVehicle(newVehicle);
      updateProfile({
        activeVehicleId: newVehicle.id,
        vehicleId: newVehicle.id,
        vehicleBrand: newVehicle.manufacturer,
        vehicleModel: newVehicle.model,
        vehicleVariant: newVehicle.variant,
      });
    }
  };

  const updateVehicle = (vehicleId: string, data: Partial<UserVehicle>) => {
    const updated = vehicles.map(v => (v.id === vehicleId ? { ...v, ...data, updatedAt: new Date().toISOString() } : v));
    setVehicles(updated);
    const updatedActive = updated.find(v => v.id === vehicleId);
    if (updatedActive && activeVehicle?.id === vehicleId) {
      setActiveVehicleState(updatedActive);
    }
    const target = updated.find(v => v.id === vehicleId);
    if (target) {
      saveUserVehicle(target);
    }
  };

  const updateActiveVehicleSOC = (socPercent: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(socPercent)));
    if (activeVehicle) {
      updateVehicle(activeVehicle.id, { currentBatteryPercent: clamped });
    }
  };

  const removeVehicle = (vehicleId: string) => {
    const remaining = vehicles.filter(v => v.id !== vehicleId);
    setVehicles(remaining);
    if (activeVehicle?.id === vehicleId) {
      setActiveVehicleState(remaining[0] || null);
    }
  };

  const setActiveVehicle = (vehicleId: string) => {
    const target = vehicles.find(v => v.id === vehicleId);
    if (target) {
      const updated = vehicles.map(v => ({
        ...v,
        isDefault: v.id === vehicleId,
      }));
      setVehicles(updated);
      setActiveVehicleState(target);
      if (user) {
        updateProfile({
          activeVehicleId: vehicleId,
          vehicleId: vehicleId,
          vehicleBrand: target.manufacturer,
          vehicleModel: target.model,
          vehicleVariant: target.variant,
        });
      }
    }
  };

  const profileComplete = isProfileComplete(user, activeVehicle);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: authoritativeRole,
        authoritativeRole,
        loading,
        authLoading,
        roleLoading,
        profileLoading,
        onboardingComplete: profileComplete,
        activeVehicle,
        vehicles,
        login,
        loginGoogle,
        signup,
        resetPassword,
        logout,
        switchRole,
        updateProfile,
        addVehicle,
        updateVehicle,
        updateActiveVehicleSOC,
        removeVehicle,
        setActiveVehicle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
