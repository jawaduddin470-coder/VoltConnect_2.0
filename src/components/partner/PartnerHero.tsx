import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Shield,
  Layers,
  Radio,
  FileText,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';

interface PartnerHeroProps {
  activeTab: 'overview' | 'stations' | 'map' | 'add_hub' | 'reports' | 'feeds' | 'profile';
  onTabChange: (tab: 'overview' | 'stations' | 'map' | 'add_hub' | 'reports' | 'feeds' | 'profile') => void;
  liveCount: number;
  pendingCount: number;
  needsAttentionCount: number;
  totalCapacityKW: number;
}

export const PartnerHero: React.FC<PartnerHeroProps> = ({
  activeTab,
  onTabChange,
  liveCount,
  pendingCount,
  needsAttentionCount,
  totalCapacityKW,
}) => {
  const { user } = useAuth();
  const partnerName = user?.name || user?.email?.split('@')[0] || 'Partner CPO';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Welcome & Info */}
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            EV Charging Infrastructure Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">{partnerName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
            Manage your high-power charging assets, monitor real-time approval status with the Admin team, verify revenue tariffs, and track station reliability across the VoltConnect ecosystem.
          </p>
        </div>

        {/* Quick Operational Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
          <div className="px-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 text-left">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live & Active</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5 flex items-baseline gap-1">
              {liveCount}
              <span className="text-[10px] font-semibold text-slate-500">Hubs</span>
            </div>
          </div>

          <div className="px-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 text-left">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Review</div>
            <div className="text-xl font-black text-amber-400 mt-0.5 flex items-baseline gap-1">
              {pendingCount}
              <span className="text-[10px] font-semibold text-slate-500">Hubs</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 px-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 text-left">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Power</div>
            <div className="text-xl font-black text-sky-400 mt-0.5 flex items-baseline gap-1">
              {totalCapacityKW.toLocaleString()}
              <span className="text-[10px] font-semibold text-slate-500">kW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Pills Bar */}
      <div className="relative z-10 mt-6 pt-6 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: Building2 },
          { id: 'stations', label: 'Station Fleet', icon: Zap, badge: liveCount + pendingCount + needsAttentionCount },
          { id: 'map', label: 'Network Map', icon: Compass },
          { id: 'feeds', label: 'Live Telemetry', icon: Radio },
          { id: 'reports', label: 'Driver Reports', icon: FileText },
          { id: 'profile', label: 'CPO Profile', icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
