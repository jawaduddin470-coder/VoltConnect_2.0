import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogoCompact } from '@/assets/LogoCompact';
import { VoltConnectLogo } from '@/components/common/VoltConnectLogo';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Car,
  Building2,
  Sliders,
  Wrench,
  BarChart3,
  Activity,
  FileText,
  Settings,
  Search,
  Bell,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Menu,
  X,
  Lock,
  Radio,
} from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login/admin');
  };

  const sidebarLinks = [
    { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/stations', label: 'Charging Network', icon: MapPin },
    { path: '/admin/vehicles', label: 'Vehicles', icon: Car },
    { path: '/admin/partners', label: 'Partners', icon: Building2 },
    { path: '/admin/operations', label: 'Operations', icon: Sliders },
    { path: '/admin/service', label: 'Service & Maintenance', icon: Wrench },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/system-health', label: 'System Health', icon: Activity },
    { path: '/admin/audit', label: 'Audit Logs', icon: FileText },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  // Helper to determine breadcrumb label
  const getCurrentBreadcrumb = () => {
    if (location.pathname === '/admin/health' || location.pathname.startsWith('/admin/system-health')) return 'System Health';
    const current = sidebarLinks.find(l => location.pathname === l.path || (l.path !== '/admin/dashboard' && location.pathname.startsWith(l.path)));
    return current ? current.label : 'Overview';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* 1. TOP OPERATIONAL NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 shadow-md">
        
        {/* Left Side: Logo & Breadcrumbs */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/admin/dashboard" className="flex items-center gap-2.5 shrink-0">
            <VoltConnectLogo variant="navbar" />
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono uppercase">
              ADMIN PLATFORM
            </span>
          </Link>

          {/* Breadcrumbs */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-800 pl-4 ml-2">
            <span>Admin Console</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-bold text-white">{getCurrentBreadcrumb()}</span>
          </div>
        </div>

        {/* Middle: Global Search Input */}
        <div className="hidden md:flex items-center max-w-md w-full mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder="Search users, station IDs, partner requests, or audit logs..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
            />
          </div>
        </div>

        {/* Right Side: System Stream Notifications & Admin Profile */}
        <div className="flex items-center gap-3">
          
          {/* Live Stream Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>LIVE OPERATIONAL STREAM</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all relative"
              title="System Alerts"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 max-w-xs bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <span className="font-heading font-extrabold text-xs text-white">Operational Stream</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Real-time Events</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400 font-bold">STATION VERIFIED</span>
                      <span className="text-slate-500">2m ago</span>
                    </div>
                    <p className="text-slate-300 font-medium">Zeon Fast Charge Hub approved by Admin.</p>
                  </div>
                  
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-sky-400 font-bold">NEW CPO APPLICATION</span>
                      <span className="text-slate-500">14m ago</span>
                    </div>
                    <p className="text-slate-300 font-medium">VoltCharge Energy applied for partner tier.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile & Logout */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>

            <div className="hidden xl:block text-left text-xs">
              <div className="font-extrabold text-white leading-tight truncate max-w-[140px]">{user?.name || 'Administrator'}</div>
              <div className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">{role}</div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors ml-1"
              title="Admin Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </header>

      {/* 2. BODY SHELL LAYOUT: SIDEBAR + CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Mobile Backdrop Overlay */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-xs transition-opacity"
          />
        )}

        {/* OPERATIONAL SIDEBAR (DESKTOP + MOBILE DRAWER) */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4 space-y-6 overflow-y-auto">
            
            {/* Operational Role Badge */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <div className="text-xs font-extrabold text-white">Admin Command Center</div>
                <div className="text-[10px] text-slate-400 font-semibold">Full Operational Privileges</div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Core Operations
              </div>

              {sidebarLinks.map(link => {
                const Icon = link.icon;
                const active =
                  location.pathname === link.path ||
                  (link.path !== '/admin/dashboard' && location.pathname.startsWith(link.path)) ||
                  (link.path === '/admin/system-health' && location.pathname === '/admin/health');

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-sky-500 text-white shadow-md font-extrabold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

          </div>

          {/* Sidebar Footer Info */}
          <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-semibold space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>VoltConnect 2.0 Admin</span>
              <span className="text-emerald-400 font-bold">ONLINE</span>
            </div>
            <div>Build 2.0.0-PROD • Firebase Web App</div>
          </div>

        </aside>

        {/* MAIN CONTENT WORKSPACE */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-950">
          {children}
        </main>

      </div>

    </div>
  );
};
