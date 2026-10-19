import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { VoltConnectIntro } from '@/components/intro/VoltConnectIntro';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthGateView } from '@/components/common/AuthGateView';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Pages
import { LandingPage } from '@/pages/public/LandingPage';
import { Login } from '@/pages/auth/Login';
import { AdminLogin } from '@/pages/auth/AdminLogin';
import { PartnerLogin } from '@/pages/auth/PartnerLogin';
import { TechnicianLogin } from '@/pages/auth/TechnicianLogin';
import { Signup } from '@/pages/auth/Signup';
// Lazy-Loaded Application Modules
const Onboarding = React.lazy(() => import('@/pages/onboarding/Onboarding').then(m => ({ default: m.Onboarding })));
const DriverDashboard = React.lazy(() => import('@/pages/driver/Dashboard').then(m => ({ default: m.DriverDashboard })));
const ExplorePage = React.lazy(() => import('@/pages/driver/Explore').then(m => ({ default: m.ExplorePage })));
const SmartTripPlanner = React.lazy(() => import('@/pages/driver/Trips').then(m => ({ default: m.SmartTripPlanner })));
const GaragePage = React.lazy(() => import('@/pages/driver/Garage').then(m => ({ default: m.GaragePage })));
const VoltHealthPage = React.lazy(() => import('@/pages/driver/VoltHealthPage').then(m => ({ default: m.VoltHealthPage })));
const VoltCarePage = React.lazy(() => import('@/pages/driver/VoltCarePage').then(m => ({ default: m.VoltCarePage })));
const HomeChargePage = React.lazy(() => import('@/pages/driver/HomeChargePage').then(m => ({ default: m.HomeChargePage })));
const VoltSOSPage = React.lazy(() => import('@/pages/driver/VoltSOSPage').then(m => ({ default: m.VoltSOSPage })));
const VoltAIPage = React.lazy(() => import('@/pages/driver/VoltAIPage').then(m => ({ default: m.VoltAIPage })));
const VoltInsightPage = React.lazy(() => import('@/pages/driver/VoltInsightPage').then(m => ({ default: m.VoltInsightPage })));
const ProfilePage = React.lazy(() => import('@/pages/driver/ProfilePage').then(m => ({ default: m.ProfilePage })));

// Lazy-Loaded Enterprise Portals
const PartnerDashboard = React.lazy(() => import('@/pages/partner/PartnerDashboard').then(m => ({ default: m.PartnerDashboard })));
const TechnicianDashboard = React.lazy(() => import('@/pages/technician/TechnicianDashboard').then(m => ({ default: m.TechnicianDashboard })));
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
import { UserRole } from '@/types';

import { VoltConnectLogo } from '@/components/common/VoltConnectLogo';

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4">
    <VoltConnectLogo variant="loading" size={38} />
    <div className="w-6 h-6 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
    <p className="text-xs font-semibold text-slate-500 font-mono tracking-wider">LOADING MODULE...</p>
  </div>
);

// Full-Screen High-Visibility Loading Gate
const PortalLoadingScreen: React.FC<{ title?: string; subtitle?: string }> = ({
  title = 'VOLTCONNECT 2.0',
  subtitle = 'Authenticating session...',
}) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
    <div className="space-y-3 text-center flex flex-col items-center">
      <VoltConnectLogo variant="loading" size={48} />
      <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mx-auto mt-1" />
      <div className="font-heading font-extrabold text-lg text-white">{title}</div>
      <p className="text-xs text-slate-400 font-mono">{subtitle}</p>
    </div>
  </div>
);

// Main Driver App Layout Shell
const AppLayout: React.FC<{ children: React.ReactNode; hideFooter?: boolean }> = ({ children, hideFooter = false }) => {
  const location = useLocation();
  const { user, role } = useAuth();

  useEffect(() => {
    // Assert impossible portal violation state
    const adminEl = document.querySelector('[data-portal="admin"]');
    if (role === 'driver' && adminEl) {
      console.error('[P0 PORTAL VIOLATION] Driver role attempted to render Admin portal.');
    }
    const stored = localStorage.getItem('vc_user');
    const storedRole = stored ? JSON.parse(stored)?.role : 'none';
    console.log(`[PORTAL_FORENSIC]
pathname=${location.pathname}
firebaseUid=${user?.uid || 'anon'}
firebaseEmail=${user?.email || 'none'}
firestoreRole=${user?.role || 'none'}
authContextRole=${role || 'none'}
storedRole=${storedRole}
portal=driver
expectedPortal=driver`);
  }, [role, user?.uid, user?.email, user?.role, location.pathname]);

  return (
    <div data-portal="driver" className="min-h-screen flex flex-col bg-slate-50 ev-pattern-bg">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 sm:pb-32 lg:pb-8">
        <ErrorBoundary>
          <div key={location.pathname} className="vc-page-enter">
            {children}
          </div>
        </ErrorBoundary>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

// 1. DRIVER PORTAL BOUNDARY: Strictly renders Driver UI or Public AuthGateView
const DriverPortalBoundary: React.FC<{ children: React.ReactNode; hideFooter?: boolean }> = ({
  children,
  hideFooter = false,
}) => {
  const { user, role, loading, onboardingComplete } = useAuth();
  const location = useLocation();

  // A. Still resolving auth or authoritative role -> Hold in PortalLoadingScreen
  if (loading || (user && role === null)) {
    return <PortalLoadingScreen title="VOLTCONNECT 2.0" subtitle="Authenticating driver session..." />;
  }

  // B. Unauthenticated visitor -> Render Public Auth Gate inside AppLayout
  if (!user) {
    return (
      <AppLayout hideFooter={hideFooter}>
        <AuthGateView />
      </AppLayout>
    );
  }

  // C. Authenticated user is NOT a driver: DO NOT RENDER AppLayout or Driver UI!
  if (role !== 'driver') {
    if (role === 'admin' || role === 'super_admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (role === 'partner') {
      return <Navigate to="/partner/dashboard" replace />;
    }
    if (role === 'technician') {
      return <Navigate to="/technician/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // D. Role is guaranteed 'driver':
  if (!onboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  if (onboardingComplete && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  // E. Render Driver UI inside AppLayout
  return (
    <AppLayout hideFooter={hideFooter}>
      <React.Suspense fallback={<PageLoadingFallback />}>
        {children}
      </React.Suspense>
    </AppLayout>
  );
};

// 2. ADMIN PORTAL BOUNDARY: Strictly isolates AdminShell / AdminDashboard to admin & super_admin
const AdminPortalBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, loading } = useAuth();

  if (loading || (user && role === null)) {
    return <PortalLoadingScreen title="ADMIN COMMAND CENTER" subtitle="Verifying administrator credentials..." />;
  }

  if (!user) {
    return <Navigate to="/login/admin" replace />;
  }

  if (role !== 'admin' && role !== 'super_admin') {
    if (role === 'partner') return <Navigate to="/partner/dashboard" replace />;
    if (role === 'technician') return <Navigate to="/technician/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <React.Suspense fallback={<PortalLoadingScreen title="ADMIN COMMAND CENTER" subtitle="Loading administration console..." />}>
      {children}
    </React.Suspense>
  );
};

// 3. PARTNER PORTAL BOUNDARY: Strictly isolates Partner workspace
const PartnerPortalBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, loading } = useAuth();

  if (loading || (user && role === null)) {
    return <PortalLoadingScreen title="PARTNER WORKSPACE" subtitle="Verifying CPO credentials..." />;
  }

  if (!user) {
    return <Navigate to="/login/partner" replace />;
  }

  if (role !== 'partner' && role !== 'admin' && role !== 'super_admin') {
    if (role === 'technician') return <Navigate to="/technician/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <React.Suspense fallback={<PortalLoadingScreen title="PARTNER WORKSPACE" subtitle="Loading partner workspace..." />}>
      {children}
    </React.Suspense>
  );
};

// 4. TECHNICIAN PORTAL BOUNDARY: Strictly isolates Technician workspace
const TechnicianPortalBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, loading } = useAuth();

  if (loading || (user && role === null)) {
    return <PortalLoadingScreen title="TECHNICIAN WORKSPACE" subtitle="Verifying technician credentials..." />;
  }

  if (!user) {
    return <Navigate to="/login/technician" replace />;
  }

  if (role !== 'technician' && role !== 'admin' && role !== 'super_admin') {
    if (role === 'partner') return <Navigate to="/partner/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <React.Suspense fallback={<PortalLoadingScreen title="TECHNICIAN WORKSPACE" subtitle="Loading technician workspace..." />}>
      {children}
    </React.Suspense>
  );
};

export const App: React.FC = () => {
  const [forceShowIntro, setForceShowIntro] = useState(false);

  useEffect(() => {
    const handleReplay = () => {
      sessionStorage.removeItem('vc_intro_seen');
      localStorage.removeItem('vc_intro_seen');
      setForceShowIntro(true);
    };
    window.addEventListener('vc_replay_intro', handleReplay);
    return () => window.removeEventListener('vc_replay_intro', handleReplay);
  }, []);

  return (
    <AuthProvider>
      <Router>
        {/* Cinematic Ecosystem Introduction Sequence */}
        <VoltConnectIntro
          forceShow={forceShowIntro}
          onComplete={() => setForceShowIntro(false)}
        />

        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <AppLayout>
                <LandingPage />
              </AppLayout>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/login/partner" element={<PartnerLogin />} />
          <Route path="/login/technician" element={<TechnicianLogin />} />
          <Route path="/signup" element={<Signup />} />

          {/* Onboarding Guarded Route */}
          <Route
            path="/onboarding"
            element={
              <DriverPortalBoundary>
                <Onboarding />
              </DriverPortalBoundary>
            }
          />

          {/* Driver Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <DriverPortalBoundary>
                <DriverDashboard />
              </DriverPortalBoundary>
            }
          />
          <Route
            path="/explore"
            element={
              <DriverPortalBoundary>
                <ExplorePage />
              </DriverPortalBoundary>
            }
          />
          <Route
            path="/voltmap"
            element={
              <DriverPortalBoundary>
                <ExplorePage />
              </DriverPortalBoundary>
            }
          />
          <Route
            path="/trips"
            element={
              <DriverPortalBoundary>
                <SmartTripPlanner />
              </DriverPortalBoundary>
            }
          />
          <Route
            path="/garage"
            element={
              <DriverPortalBoundary>
                <GaragePage />
              </DriverPortalBoundary>
            }
          />
          <Route
            path="/my-ev"
            element={
              <DriverPortalBoundary>
                <GaragePage />
              </DriverPortalBoundary>
            }
          />
          <Route
            path="/health"
            element={
              <DriverPortalBoundary>
                <VoltHealthPage />
              </DriverPortalBoundary>
            }
          />
          <Route
            path="/care"
            element={
              <DriverPortalBoundary>
                <VoltCarePage />
              </DriverPortalBoundary>
            }
          />
          <Route
            path="/homecharge"
            element={
              <DriverPortalBoundary>
                <HomeChargePage />
              </DriverPortalBoundary>
            }
          />
          <Route
            path="/sos"
            element={
              <DriverPortalBoundary>
                <VoltSOSPage />
              </DriverPortalBoundary>
            }
          />
          <Route
            path="/volt-ai"
            element={
              <DriverPortalBoundary>
                <VoltAIPage />
              </DriverPortalBoundary>
            }
          />
          <Route
            path="/ai"
            element={
              <DriverPortalBoundary>
                <VoltAIPage />
              </DriverPortalBoundary>
            }
          />
          <Route
            path="/voltai"
            element={
              <DriverPortalBoundary>
                <VoltAIPage />
              </DriverPortalBoundary>
            }
          />
          <Route
            path="/insight"
            element={
              <DriverPortalBoundary>
                <VoltInsightPage />
              </DriverPortalBoundary>
            }
          />
          <Route
            path="/profile"
            element={
              <DriverPortalBoundary>
                <ProfilePage />
              </DriverPortalBoundary>
            }
          />

          {/* Partner Portal Protected Routes */}
          <Route
            path="/partner/dashboard"
            element={
              <PartnerPortalBoundary>
                <PartnerDashboard />
              </PartnerPortalBoundary>
            }
          />
          <Route
            path="/partner/*"
            element={
              <PartnerPortalBoundary>
                <PartnerDashboard />
              </PartnerPortalBoundary>
            }
          />

          {/* Technician Portal Protected Routes */}
          <Route
            path="/technician/dashboard"
            element={
              <TechnicianPortalBoundary>
                <TechnicianDashboard />
              </TechnicianPortalBoundary>
            }
          />
          <Route
            path="/technician/*"
            element={
              <TechnicianPortalBoundary>
                <TechnicianDashboard />
              </TechnicianPortalBoundary>
            }
          />

          {/* Admin Console Protected Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/*"
            element={
              <AdminPortalBoundary>
                <AdminDashboard />
              </AdminPortalBoundary>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminPortalBoundary>
                <AdminDashboard />
              </AdminPortalBoundary>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminPortalBoundary>
                <AdminDashboard />
              </AdminPortalBoundary>
            }
          />
          <Route
            path="/admin/stations"
            element={
              <AdminPortalBoundary>
                <AdminDashboard />
              </AdminPortalBoundary>
            }
          />
          <Route
            path="/admin/vehicles"
            element={
              <AdminPortalBoundary>
                <AdminDashboard />
              </AdminPortalBoundary>
            }
          />
          <Route
            path="/admin/partners"
            element={
              <AdminPortalBoundary>
                <AdminDashboard />
              </AdminPortalBoundary>
            }
          />
          <Route
            path="/admin/operations"
            element={
              <AdminPortalBoundary>
                <AdminDashboard />
              </AdminPortalBoundary>
            }
          />
          <Route
            path="/admin/service"
            element={
              <AdminPortalBoundary>
                <AdminDashboard />
              </AdminPortalBoundary>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <AdminPortalBoundary>
                <AdminDashboard />
              </AdminPortalBoundary>
            }
          />
          <Route
            path="/admin/system-health"
            element={
              <AdminPortalBoundary>
                <AdminDashboard />
              </AdminPortalBoundary>
            }
          />
          <Route
            path="/admin/health"
            element={
              <AdminPortalBoundary>
                <AdminDashboard />
              </AdminPortalBoundary>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <AdminPortalBoundary>
                <AdminDashboard />
              </AdminPortalBoundary>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminPortalBoundary>
                <AdminDashboard />
              </AdminPortalBoundary>
            }
          />

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};
