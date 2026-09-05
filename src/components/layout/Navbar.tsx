import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogoCompact } from '@/assets/LogoCompact';
import { VoltConnectLogo } from '@/components/common/VoltConnectLogo';
import { VoiceNavigationControl } from '@/components/voice/VoiceNavigationControl';
import { useAuth } from '@/contexts/AuthContext';
import {
  Compass,
  MapPin,
  Navigation,
  Car,
  Shield,
  User,
  LogOut,
  Wrench,
  Lock,
  ChevronDown,
  Sparkles,
  Bell,
  Activity,
  Plus,
  Check,
  BarChart3,
  X,
  Settings,
} from 'lucide-react';
import { UserRole } from '@/types';

export const Navbar: React.FC = () => {
  const { user, logout, activeVehicle, vehicles, setActiveVehicle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showVehicleMenu, setShowVehicleMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMyEVMenu, setShowMyEVMenu] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setShowVehicleMenu(false);
        setShowProfileMenu(false);
        setShowNotifications(false);
        setShowMyEVMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const isMyEVActive = ['/garage', '/health', '/care', '/insight'].includes(location.pathname);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate('/');
  };

  // Primary Navigation Links for Desktop & Mobile
  const primaryNavLinks = [
    { path: '/dashboard', label: 'Home', icon: Compass },
    { path: '/explore', label: 'VoltMap', icon: MapPin },
    { path: '/trips', label: 'Trips', icon: Navigation },
    { path: '/garage', label: 'My EV', icon: Car, hasSubnav: true },
    { path: '/volt-ai', label: 'VoltAI', icon: Sparkles, isAI: true },
  ];

  // My EV Subnav Links
  const myEVSubLinks = [
    { path: '/garage', label: 'Garage & Vehicles', icon: Car },
    { path: '/health', label: 'VoltHealth SOH', icon: Activity },
    { path: '/care', label: 'VoltCare Service', icon: Wrench },
    { path: '/insight', label: 'VoltInsight Analytics', icon: BarChart3 },
  ];

  return (
    <div ref={navRef}>
      {/* MAIN TOP HEADER BAR */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-1 sm:gap-4">
          
          {/* Brand Mark (Uses Official VoltConnect 2.0 Logo Asset) */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <VoltConnectLogo variant="navbar" />
          </Link>

          {/* Desktop Primary Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {user ? (
              // AUTHENTICATED DESKTOP NAVIGATION
              primaryNavLinks.map((link) => {
                const Icon = link.icon;
                const active = link.hasSubnav ? isMyEVActive : isActive(link.path);

                if (link.isAI) {
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                }

                if (link.hasSubnav) {
                  return (
                    <div key={link.path} className="relative">
                      <button
                        onClick={() => setShowMyEVMenu(!showMyEVMenu)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          active
                            ? 'bg-navy-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-teal-500" />
                        <span>{link.label}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      {/* My EV Subnav Dropdown */}
                      {showMyEVMenu && (
                        <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-card-hover border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                          <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            My EV Subsystems
                          </div>
                          {myEVSubLinks.map((sub) => {
                            const SubIcon = sub.icon;
                            const subActive = isActive(sub.path);
                            return (
                              <Link
                                key={sub.path}
                                to={sub.path}
                                onClick={() => setShowMyEVMenu(false)}
                                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors ${
                                  subActive ? 'text-teal-600 bg-teal-50/80' : 'text-slate-700'
                                }`}
                              >
                                <SubIcon className="w-4 h-4 text-teal-500" />
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-navy-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-teal-500" />
                    {link.label}
                  </Link>
                );
              })
            ) : (
              // PUBLIC UNAUTHENTICATED HEADER NAV
              <>
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive('/') ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/80'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/explore"
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive('/explore') ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/80'
                  }`}
                >
                  VoltMap
                </Link>
              </>
            )}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Intelligent Voice Navigation Control */}
            <VoiceNavigationControl />

            {user ? (
              // AUTHENTICATED RIGHT CONTROLS
              <>
                {/* 1. Active Vehicle Selector Control */}
                <div className="relative">
                  {activeVehicle ? (
                    <button
                      onClick={() => setShowVehicleMenu(!showVehicleMenu)}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold hover:bg-teal-100 transition-all max-w-[95px] xs:max-w-[130px] sm:max-w-[200px]"
                      title="Switch Active EV"
                    >
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-teal-500 animate-pulse shrink-0" />
                      <span className="truncate text-[11px] sm:text-xs">{activeVehicle.manufacturer} {activeVehicle.model}</span>
                      <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-600 shrink-0" />
                    </button>
                  ) : (
                    <Link
                      to="/garage"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] sm:text-xs font-bold hover:bg-slate-200 transition-all"
                    >
                      <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-600" />
                      <span className="hidden xs:inline">Add EV</span>
                    </Link>
                  )}

                  {/* Vehicle Switcher Popover */}
                  {showVehicleMenu && vehicles.length > 0 && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-card-hover border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Select Active EV</span>
                        <Link to="/garage" onClick={() => setShowVehicleMenu(false)} className="text-sky-600 hover:underline text-[10px]">
                          Manage
                        </Link>
                      </div>
                      {vehicles.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setActiveVehicle(v.id);
                            setShowVehicleMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left font-semibold hover:bg-slate-50 transition-colors ${
                            v.id === activeVehicle?.id ? 'text-teal-700 bg-teal-50/80 font-bold' : 'text-slate-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="truncate">{v.manufacturer} {v.model}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{v.category} • {v.currentBatteryPercent}% SOC</div>
                          </div>
                          {v.id === activeVehicle?.id && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>



                {/* 3. Notifications Popover Control */}
                <div className="relative hidden xs:block">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-all relative"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-card-hover border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                        <span className="font-heading font-extrabold text-xs text-navy-900">Notifications</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">System Stream</span>
                      </div>
                      
                      {/* Honest Notification Empty State */}
                      <div className="text-center py-6 space-y-2">
                        <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                        <div className="text-xs font-bold text-slate-700">No unread notifications</div>
                        <p className="text-[10px] text-slate-400">System updates and charging alerts will appear here.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 p-1 rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-card-hover border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 pb-3 border-b border-slate-100 space-y-0.5">
                        <div className="font-heading font-extrabold text-sm text-navy-900 truncate">{user.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                        {activeVehicle && (
                          <div className="text-[10px] font-bold text-teal-600 pt-1">
                            Active: {activeVehicle.manufacturer} {activeVehicle.model}
                          </div>
                        )}
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          Profile & Preferences
                        </Link>
                      </div>

                      <div className="pt-2 border-t border-slate-100 px-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </>
            ) : (
              // PUBLIC UNAUTHENTICATED CTAS
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-navy-900 hover:bg-slate-100 transition-all"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="vc-btn vc-btn-teal py-1.5 sm:py-2 px-3 sm:px-4 text-xs font-bold shadow-xs hover:scale-105 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}

          </div>

        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (FIXED BOTTOM FOR AUTHENTICATED DRIVERS) */}
      {user && (
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="max-w-md mx-auto grid grid-cols-5 gap-1 text-center">
            {primaryNavLinks.map((link) => {
              const Icon = link.icon;
              const active = link.hasSubnav ? isMyEVActive : isActive(link.path);

              if (link.isAI) {
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl text-[10px] font-bold transition-all ${
                      active ? 'text-sky-600 bg-sky-50 font-extrabold shadow-2xs' : 'text-sky-600 hover:text-sky-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-0.5 shrink-0" />
                    <span className="leading-tight truncate w-full px-0.5">{link.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl text-[10px] font-bold transition-all ${
                    active ? 'text-navy-900 bg-slate-100 font-extrabold shadow-2xs' : 'text-slate-500 hover:text-navy-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-0.5 shrink-0 ${active ? 'text-teal-500' : 'text-slate-400'}`} />
                  <span className="leading-tight truncate w-full px-0.5">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};
