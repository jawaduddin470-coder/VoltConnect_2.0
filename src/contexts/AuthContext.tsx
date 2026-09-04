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
  saveUserProfile,
  saveUserVehicle,
  fetchUserVehicles,
  updateUserRole,
} from '@/services/firebase';
import { MASTER_VEHICLE_CATALOG } from '@/features/vehicles/VehicleCatalog';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  loading: boolean;
  onboardingComplete: boolean;
  activeVehicle: UserVehicle | null;
  vehicles: UserVehicle[];
  login: (email: string, pass: string, role?: UserRole) => Promise<UserProfile>;
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
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('vc_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [vehicles, setVehicles] = useState<UserVehicle[]>(() => {
    const saved = localStorage.getItem('vc_vehicles');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeVehicle, setActiveVehicleState] = useState<UserVehicle | null>(() => {
    const savedVehicles = localStorage.getItem('vc_vehicles');
    const parsed: UserVehicle[] = savedVehicles ? JSON.parse(savedVehicles) : [];
    const savedUser = localStorage.getItem('vc_user');
    const parsedUser: UserProfile | null = savedUser ? JSON.parse(savedUser) : null;
    return (
      parsed.find(v => v.id === parsedUser?.activeVehicleId) ||
      parsed.find(v => v.isDefault) ||
      parsed[0] ||
      null
    );
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Subscribe to Real Firebase Auth State Listener (onAuthStateChanged)
  useEffect(() => {
    const unsubscribe = subscribeAuthState(async fbUser => {
      if (fbUser) {
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
        } catch (err) {
          console.warn('[AuthContext] Error fetching authenticated user profile:', err);
        }
      } else {
        setUser(null);
        setVehicles([]);
        setActiveVehicleState(null);
        localStorage.removeItem('vc_user');
        localStorage.removeItem('vc_vehicles');
      }
      setLoading(false);
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

  const login = async (email: string, pass: string, role: UserRole = 'driver'): Promise<UserProfile> => {
    setLoading(true);
    try {
      const fbUser = await loginWithFirebase(email, pass);
      let profile = await fetchUserProfile(fbUser.uid);
      if (!profile) {
        profile = {
          uid: fbUser.uid,
          name: email.split('@')[0].toUpperCase(),
          email,
          role,
          onboardingComplete: false,
          profileComplete: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        await saveUserProfile(profile);
      } else if (profile.role !== role) {
        profile.role = role;
        await updateUserRole(fbUser.uid, role);
      }
      setUser(profile);
      return profile;
    } catch (err: any) {
      const friendlyMsg = getAuthErrorMessage(err);
      console.error('[AuthContext] Login error:', err);
      throw new Error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async (): Promise<UserProfile> => {
    setLoading(true);
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
      setUser(profile);
      return profile;
    } catch (err: any) {
      const friendlyMsg = getAuthErrorMessage(err);
      console.error('[AuthContext] Google sign-in error:', err);
      throw new Error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, pass: string, role: UserRole = 'driver'): Promise<UserProfile> => {
    setLoading(true);
    try {
      const fbUser = await registerWithFirebase(email, pass);
      const profile: UserProfile = {
        uid: fbUser.uid,
        name,
        email,
        role,
        onboardingComplete: false,
        profileComplete: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await saveUserProfile(profile);
      setUser(profile);
      return profile;
    } catch (err: any) {
      const friendlyMsg = getAuthErrorMessage(err);
      console.error('[AuthContext] Signup error:', err);
      throw new Error(friendlyMsg);
    } finally {
      setLoading(false);
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
      setVehicles([]);
      setActiveVehicleState(null);
      localStorage.removeItem('vc_user');
      localStorage.removeItem('vc_vehicles');
      sessionStorage.removeItem('vc_onboarding_step');
      sessionStorage.removeItem('vc_onboarding_name');
    }
  };

  const switchRole = (newRole: UserRole) => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
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

  const addVehicle = (newVehicleData: Omit<UserVehicle, 'id' | 'userId' | 'createdAt'>) => {
    const newVehicle: UserVehicle = {
      ...newVehicleData,
      id: `veh-${Date.now()}`,
      userId: user?.uid || 'default-user',
      createdAt: new Date().toISOString(),
    };

    const updated = vehicles.filter(v => v.id !== 'veh-nexon-ev-45').map(v => ({ ...v, isDefault: false }));
    updated.push({ ...newVehicle, isDefault: true });

    setVehicles(updated);
    setActiveVehicleState(newVehicle);

    if (user?.uid) {
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
    const target = updated.find(v => v.id === vehicleId);
    if (target && activeVehicle?.id === vehicleId) {
      setActiveVehicleState(target);
      if (user?.uid) {
        saveUserVehicle(target);
      }
    }
  };

  // Authoritative Global Starting Battery SOC Updater
  const updateActiveVehicleSOC = (socPercent: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(socPercent)));
    if (activeVehicle) {
      updateVehicle(activeVehicle.id, { currentBatteryPercent: clamped });
    }
  };

  const removeVehicle = (vehicleId: string) => {
    const updated = vehicles.filter(v => v.id !== vehicleId);
    setVehicles(updated);
    if (activeVehicle?.id === vehicleId && updated.length > 0) {
      setActiveVehicleState(updated[0]);
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
        role: user?.role || 'driver',
        loading,
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
