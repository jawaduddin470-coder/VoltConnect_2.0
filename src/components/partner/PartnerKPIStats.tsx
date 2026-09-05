import React from 'react';
import {
  Zap,
  Clock,
  AlertTriangle,
  Activity,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Cpu,
} from 'lucide-react';
import { ChargingStation, StationReport } from '@/types';

interface PartnerKPIStatsProps {
  stations: ChargingStation[];
  reports: StationReport[];
  onFilterClick?: (filterType: 'all' | 'live' | 'pending' | 'rejected' | 'reports') => void;
}

export const PartnerKPIStats: React.FC<PartnerKPIStatsProps> = ({
  stations,
  reports,
  onFilterClick,
}) => {
  const isApproved = (s: ChargingStation) =>
    (s.verificationStatus === 'verified' || s.verificationStatus === 'approved') && s.status === 'active';
  const isPending = (s: ChargingStation) =>
    s.verificationStatus === 'pending' || s.verificationStatus === 'under_review';
  const isRejected = (s: ChargingStation) =>
    s.verificationStatus === 'rejected';

  const liveCount = stations.filter(isApproved).length;
  const pendingCount = stations.filter(isPending).length;
  const rejectedCount = stations.filter(isRejected).length;
  const openReportsCount = reports.filter(r => r.status === 'pending' || r.status === 'reviewed').length;

  const totalCapacityKW = stations.reduce((sum, s) => {
    const stationPower = s.chargers.reduce((pSum, c) => pSum + (c.powerKW || 0), 0);
    return sum + stationPower;
  }, 0);

  const totalPortsCount = stations.reduce((sum, s) => sum + s.chargers.length, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Live & Verified Stations */}
      <div
        onClick={() => onFilterClick?.('live')}
        className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm hover:shadow-emerald-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live on VoltMap</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-black text-white tracking-tight">{liveCount}</div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Publicly Discoverable
            </span>
            <span className="text-slate-500 font-medium">of {stations.length} hubs</span>
          </div>
        </div>
      </div>

      {/* 2. Pending Admin Verification */}
      <div
        onClick={() => onFilterClick?.('pending')}
        className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-amber-500/50 transition-all cursor-pointer shadow-sm hover:shadow-amber-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approval</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-black text-white tracking-tight">{pendingCount}</div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-amber-400 font-semibold">Under Admin Review</span>
            <span className="text-slate-500 font-medium">Awaiting Audit</span>
          </div>
        </div>
      </div>

      {/* 3. Needs Correction / Reports */}
      <div
        onClick={() => onFilterClick?.('rejected')}
        className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-rose-500/50 transition-all cursor-pointer shadow-sm hover:shadow-rose-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Action Required</span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-black text-white tracking-tight">
            {rejectedCount + openReportsCount}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-rose-400 font-semibold">
              {rejectedCount} rejected • {openReportsCount} reports
            </span>
            <span className="text-slate-500 font-medium">Attention</span>
          </div>
        </div>
      </div>

      {/* 4. Total Installed Capacity */}
      <div className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-sky-500/50 transition-all shadow-sm hover:shadow-sky-500/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Network Capacity</span>
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-110 transition-transform">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-black text-white tracking-tight">
            {totalCapacityKW.toLocaleString()}{' '}
            <span className="text-base font-bold text-slate-400">kW</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-sky-400 font-semibold">{totalPortsCount} Total Ports</span>
            <span className="text-slate-500 font-medium">Fast DC & AC</span>
          </div>
        </div>
      </div>
    </div>
  );
};
