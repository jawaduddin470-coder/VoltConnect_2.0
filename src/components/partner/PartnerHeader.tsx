import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Zap,
  Bell,
  Plus,
  ShieldCheck,
  Building2,
  ExternalLink,
  Radio,
} from 'lucide-react';

interface PartnerHeaderProps {
  onAddStationClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  unreadNotificationsCount?: number;
  liveStationsCount: number;
}

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({
  onAddStationClick,
  onNotificationsClick,
  onProfileClick,
  unreadNotificationsCount = 0,
  liveStationsCount,
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Portal Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-white tracking-tight">VoltConnect</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Partner Portal
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 hidden sm:block">
              Charge Point Operator Network Command
            </p>
          </div>
        </div>

        {/* Live Status + Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Sync Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-slate-300">
              {liveStationsCount} {liveStationsCount === 1 ? 'Station' : 'Stations'} Live on VoltMap
            </span>
          </div>

          {/* Notifications Trigger */}
          <button
            onClick={onNotificationsClick}
            className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-sm"
            title="Activity Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Add Charging Hub CTA */}
          <button
            onClick={onAddStationClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Charging Station</span>
            <span className="sm:hidden">Add Hub</span>
          </button>

          {/* Profile Avatar / Chip */}
          <button
            onClick={onProfileClick}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all text-left"
            title="View CPO Profile"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-sky-400 font-extrabold text-xs flex items-center justify-center border border-slate-700">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'P'}
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <div className="text-xs font-bold text-white truncate max-w-[110px]">
                {user?.name || user?.email?.split('@')[0] || 'CPO Partner'}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">Verified Operator</div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
