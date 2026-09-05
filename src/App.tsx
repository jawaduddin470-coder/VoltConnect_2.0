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
import { Onboarding } from '@/pages/onboarding/Onboarding';
import { DriverDashboard } from '@/pages/driver/Dashboard';
import { ExplorePage } from '@/pages/driver/Explore';
import { SmartTripPlanner } from '@/pages/driver/Trips';
import { GaragePage } from '@/pages/driver/Garage';
import { VoltHealthPage } from '@/pages/driver/VoltHealthPage';
import { VoltCarePage } from '@/pages/driver/VoltCarePage';
import { HomeChargePage } from '@/pages/driver/HomeChargePage';
import { VoltSOSPage } from '@/pages/driver/VoltSOSPage';
import { VoltAIPage } from '@/pages/driver/VoltAIPage';
import { VoltInsightPage } from '@/pages/driver/VoltInsightPage';
import { ProfilePage } from '@/pages/driver/ProfilePage';

// Portals
import { PartnerDashboard } from '@/pages/partner/PartnerDashboard';
import { TechnicianDashboard } from '@/pages/technician/TechnicianDashboard';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { UserRole } from '@/types';

// Full-Screen High-Visibility Loading Gate
const PortalLoadingScreen: React.FC<{ title?: string; subtitle?: string }> = ({
  title = 'VOLTCONNECT 2.0',
  subtitle = 'Authenticating session...',
}) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
    <div className="space-y-4 text-center">
      <div className="w-12 h-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin mx-auto" />
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
      {children}
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

  return <>{children}</>;
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

  return <>{children}</>;
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

  return <>{children}</>;
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
