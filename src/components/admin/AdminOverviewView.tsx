import React, { useEffect, useState } from 'react';
import { adminOverviewService, AdminOverviewMetrics } from '@/services/adminOverviewService';
import {
  Users,
  Zap,
  Car,
  Sliders,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Database,
  ShieldCheck,
  Server,
  Layers,
  TrendingUp,
  PieChart,
  HelpCircle,
} from 'lucide-react';

export const AdminOverviewView: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = (force = false) => {
    setLoading(true);
    setError(null);
    adminOverviewService
      .getOverviewMetrics(force)
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch platform metrics from Cloud Firestore.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-slate-900 rounded-2xl border border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-900 rounded-2xl border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800" />
          <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800" />
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-4 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <div className="font-heading font-extrabold text-lg text-white">Metrics Data Load Failed</div>
        <p className="text-xs text-slate-300 max-w-md mx-auto">{error}</p>
        <button
          onClick={() => loadData(true)}
          className="vc-btn vc-btn-teal py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Fetching Firestore Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 vc-page-enter">
      
      {/* HEADER BAR WITH REFRESH ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="vc-badge vc-badge-sky text-[10px] uppercase font-bold">PLATFORM-WIDE COCKPIT</span>
            <span className="text-xs text-slate-400 font-semibold">CACHED & SYNCHRONIZED</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            VoltConnect Admin Overview
          </h1>
          <p className="text-xs text-slate-400">
            Real-time platform metrics, network distribution, vehicle catalog, and system health status.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          className="vc-btn vc-btn-secondary-dark py-2 px-4 text-xs font-bold self-start sm:self-auto flex items-center gap-2 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* 1. USER METRICS PANEL */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-sky-400 uppercase tracking-widest">
          <Users className="w-4 h-4 text-sky-400" />
          <span>User Ecosystem Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.userMetrics.map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{item.label}</span>
                <span className="text-[9px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">{item.dataSource}</span>
              </div>
              <div className="font-heading font-extrabold text-3xl text-white">{item.value}</div>
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Real Driver Accounts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. NETWORK METRICS PANEL */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 uppercase tracking-widest">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Charging Network Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {metrics.networkMetrics.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{item.label}</span>
                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{item.dataSource}</span>
              </div>
              <div className="font-heading font-extrabold text-2xl text-white">{item.value}</div>
              <div className="text-[10px] text-slate-400 font-medium">VoltMap Hub Dataset</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. VEHICLE CATALOG & OPERATIONS METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Vehicle Catalog Panel */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-teal-400" />
              <h2 className="font-heading font-extrabold text-base text-white">Vehicle Catalog Metrics</h2>
            </div>
            <span className="text-[10px] text-teal-400 font-bold uppercase">Firestore: vehicle_catalog</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {metrics.vehicleMetrics.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">{item.label}</span>
                <span className="font-heading font-extrabold text-xl text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Operations Panel */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h2 className="font-heading font-extrabold text-base text-white">Operations & Services</h2>
            </div>
            <span className="text-[10px] text-amber-400 font-bold uppercase">Live Queues & Requests</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {metrics.operationsMetrics.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">{item.label}</span>
                  <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">{item.dataSource}</span>
                </div>
                <div className={`font-heading font-extrabold ${item.isAvailable ? 'text-xl text-white' : 'text-sm text-amber-400 font-bold'}`}>
                  {item.value}
                </div>
                {item.note && <div className="text-[9px] text-slate-500 italic">{item.note}</div>}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. OPERATIONAL CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Station Growth & User Growth Progress Chart */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-400" />
              <h2 className="font-heading font-extrabold text-base text-white">Platform Growth Progression</h2>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">6-Month Trend</span>
          </div>

          <div className="space-y-4 pt-2">
            <div className="text-xs text-slate-400 font-semibold flex items-center justify-between">
              <span>Station Hub Onboardings (Mar - Aug)</span>
              <span className="text-sky-400 font-extrabold">{metrics.networkMetrics[0].value} Hubs Total</span>
            </div>

            {/* Custom SVG Bar Visualization */}
            <div className="flex items-end justify-between h-32 gap-3 pt-4 border-b border-slate-800 pb-2">
              {metrics.charts.stationGrowth.map(item => (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[10px] text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">{item.count}</span>
                  <div
                    className="w-full rounded-t-lg bg-sky-500 hover:bg-sky-400 transition-all"
                    style={{ height: `${(item.count / 50) * 100}%` }}
                  />
                  <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charging Network Distribution & Verification Status */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-teal-400" />
              <h2 className="font-heading font-extrabold text-base text-white">Network Distribution</h2>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Port Standards</span>
          </div>

          <div className="space-y-3 text-xs">
            {metrics.charts.networkDistribution.map(item => (
              <div key={item.type} className="space-y-1">
                <div className="flex justify-between text-slate-300 font-semibold">
                  <span>{item.type}</span>
                  <span className="text-teal-400 font-extrabold">{item.percentage}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-teal-400 rounded-full" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification Breakdown</div>
              {metrics.charts.verificationStatus.map(item => (
                <div key={item.status} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-300 font-semibold">{item.status}</span>
                  <span className="font-bold text-sky-400">{item.count} Hubs ({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 5. SYSTEM HEALTH STATUS PANEL */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="font-heading font-extrabold text-base text-white">Firebase & System Infrastructure Status</h2>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> ALL SYSTEMS OPERATIONAL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {metrics.systemMetrics.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase block">{item.label}</span>
              <div className="font-heading font-extrabold text-sm text-emerald-400">{item.value}</div>
              <div className="text-[9px] text-slate-500">{item.dataSource}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
