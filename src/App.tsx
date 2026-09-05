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

// Protected Route Guard with Absolute Portal Isolation
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, role, loading, onboardingComplete } = useAuth();
  const location = useLocation();

  // Handle Authentication Loading & Session Restoration State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin mx-auto" />
          <div className="font-heading font-extrabold text-lg text-white">VOLTCONNECT 2.0</div>
          <p className="text-xs text-slate-400 font-mono">Checking user profile & vehicle state...</p>
        </div>
      </div>
    );
  }

  const pathname = location.pathname;
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isPartnerRoute = pathname === '/partner' || pathname.startsWith('/partner/');
  const isTechnicianRoute = pathname === '/technician' || pathname.startsWith('/technician/');

  // 1. Handle Unauthenticated Visitors per Portal:
  if (!user) {
    if (isAdminRoute) {
      return <Navigate to="/login/admin" replace />;
    }
    if (isPartnerRoute) {
      return <Navigate to="/login/partner" replace />;
    }
    if (isTechnicianRoute) {
      return <Navigate to="/login/technician" replace />;
    }
    // Driver unauthenticated visitor -> Render Premium Auth Gate View inside AppLayout
    return (
      <AppLayout>
        <AuthGateView />
      </AppLayout>
    );
  }

  // 2. Handle Admin Routes: strictly allowed for 'admin' and 'super_admin'
  if (isAdminRoute) {
    if (role !== 'admin' && role !== 'super_admin') {
      if (role === 'partner') return <Navigate to="/partner/dashboard" replace />;
      if (role === 'technician') return <Navigate to="/technician/dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  // 3. Handle Partner Routes: allowed for 'partner', 'admin', 'super_admin'
  if (isPartnerRoute) {
    if (role !== 'partner' && role !== 'admin' && role !== 'super_admin') {
      if (role === 'technician') return <Navigate to="/technician/dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  // 4. Handle Technician Routes: allowed for 'technician', 'admin', 'super_admin'
  if (isTechnicianRoute) {
    if (role !== 'technician' && role !== 'admin' && role !== 'super_admin') {
      if (role === 'partner') return <Navigate to="/partner/dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  // 5. Handle Driver Routes (all other protected routes):
  // Non-drivers attempting to enter driver portal are redirected to their own dedicated command center
  if (role === 'admin' || role === 'super_admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (role === 'partner') {
    return <Navigate to="/partner/dashboard" replace />;
  }
  if (role === 'technician') {
    return <Navigate to="/technician/dashboard" replace />;
  }

  // At this point, the user is guaranteed to be a DRIVER (role === 'driver')
  // Incomplete Driver Profile -> Force Onboarding
  if (!onboardingComplete && pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Complete Driver Profile visiting /onboarding -> Redirect to Dashboard
  if (onboardingComplete && pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main App Layout Shell
const AppLayout: React.FC<{ children: React.ReactNode; hideFooter?: boolean }> = ({ children, hideFooter = false }) => {
  const location = useLocation();
  const { user, role } = useAuth();

  useEffect(() => {
    console.log(`[PORTAL_RUNTIME] role=${role} uid=${user?.uid || 'anon'} pathname=${location.pathname} portal=driver component=AppLayout`);
  }, [role, user?.uid, location.pathname]);

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
              <ProtectedRoute allowedRoles={['driver']}>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Driver Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <DriverDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/explore"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <ExplorePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/voltmap"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <ExplorePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <SmartTripPlanner />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/garage"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <GaragePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-ev"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <GaragePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/health"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <VoltHealthPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/care"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <VoltCarePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/homecharge"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <HomeChargePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sos"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <VoltSOSPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/volt-ai"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <VoltAIPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <VoltAIPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/voltai"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <VoltAIPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/insight"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <VoltInsightPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Partner Portal Protected Routes */}
          <Route
            path="/partner/dashboard"
            element={
              <ProtectedRoute allowedRoles={['partner', 'admin', 'super_admin']}>
                <PartnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Technician Portal Protected Routes */}
          <Route
            path="/technician/dashboard"
            element={
              <ProtectedRoute allowedRoles={['technician', 'admin', 'super_admin']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Console Protected Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stations"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vehicles"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/partners"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/operations"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/service"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/system-health"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/health"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};
