import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShieldCheck,
  Building2,
  Mail,
  User,
  Zap,
  CheckCircle2,
  Lock,
  ExternalLink,
  LogOut,
} from 'lucide-react';

interface PartnerProfileViewProps {
  stationsCount: number;
  liveCount: number;
  totalCapacityKW: number;
}

export const PartnerProfileView: React.FC<PartnerProfileViewProps> = ({
  stationsCount,
  liveCount,
  totalCapacityKW,
}) => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* CPO Profile Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-emerald-500/20">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {user?.name || 'Charge Point Operator'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  VERIFIED CPO
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 font-bold text-xs transition-colors flex items-center gap-2 shrink-0 self-start sm:self-center"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Account Details & Network Presence */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registered Assets</div>
            <div className="text-2xl font-black text-white mt-1">{stationsCount} Hubs</div>
            <div className="text-[11px] text-slate-400 mt-1">{liveCount} Live & Discoverable</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Connected Power</div>
            <div className="text-2xl font-black text-sky-400 mt-1">{totalCapacityKW.toLocaleString()} kW</div>
            <div className="text-[11px] text-slate-400 mt-1">High-Voltage EV Infrastructure</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Security & Role</div>
            <div className="text-sm font-extrabold text-white mt-1 capitalize">{user?.role || 'Partner'} Access</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1">RBAC Authorised</div>
          </div>
        </div>

        {/* CPO Guidelines & Verification Assurance */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div className="font-extrabold text-white text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            VoltConnect CPO Verification Guidelines
          </div>
          <ul className="space-y-2 text-slate-300 list-disc list-inside text-[11px] leading-relaxed">
            <li>Charging stations submitted by your account are routed immediately to the Admin Verification Command Center.</li>
            <li>GPS location must match the exact entrance/bay pin within 50 meters to pass audit checks.</li>
            <li>Customer tariffs must accurately reflect per-kWh rates with zero hidden surge additions.</li>
            <li>In the event of a rejection, you will receive audited administrator feedback and can resubmit with 1-click.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
