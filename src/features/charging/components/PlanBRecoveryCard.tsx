import React from 'react';
import { RecommendedChargingStop } from '@/services/tripPlanningEngine';
import { ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, Zap, X, ChevronRight } from 'lucide-react';

interface PlanBRecoveryCardProps {
  isAnalyzing: boolean;
  recoveryResult: {
    success: boolean;
    alternateStops: RecommendedChargingStop[];
    reason?: string;
  } | null;
  onAnalyze: () => void;
  onApplyPlanB: () => void;
  onKeepCurrentPlan: () => void;
  primaryPlanHasGap: boolean;
}

export const PlanBRecoveryCard: React.FC<PlanBRecoveryCardProps> = ({
  isAnalyzing,
  recoveryResult,
  onAnalyze,
  onApplyPlanB,
  onKeepCurrentPlan,
  primaryPlanHasGap,
}) => {
  // If primary plan is completely safe and no Plan B analysis requested yet, render a subtle trigger button
  if (!primaryPlanHasGap && !recoveryResult && !isAnalyzing) {
    return (
      <div className="pt-1 font-sans">
        <button
          onClick={onAnalyze}
          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-extrabold text-slate-700 flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-sky-600" />
            <span>Search Alternate Charging Plan (Plan B)</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    );
  }

  // Primary Plan Needs Attention Initial Trigger State
  if (primaryPlanHasGap && !recoveryResult && !isAnalyzing) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 font-sans shadow-2xs animate-in fade-in duration-300">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
          <span className="font-extrabold text-xs text-amber-950 uppercase font-mono tracking-wider">
            PRIMARY PLAN NEEDS ATTENTION
          </span>
        </div>

        <p className="text-xs text-amber-800 leading-relaxed font-medium">
          A potential charging gap or tight reserve buffer was detected in your current route strategy.
        </p>

        <button
          onClick={onAnalyze}
          className="w-full vc-btn vc-btn-teal py-2.5 px-3 text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-sky-200" />
          <span>FIND ALTERNATE PLAN</span>
        </button>
      </div>
    );
  }

  // Analyzing Loading State (200-350ms transition)
  if (isAnalyzing) {
    return (
      <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-3 font-sans shadow-2xs animate-in fade-in duration-200">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
          <span className="font-extrabold text-xs text-sky-950 font-mono tracking-wider">
            ANALYZING ALTERNATE CHARGING OPTIONS...
          </span>
        </div>
        <p className="text-xs text-sky-800 leading-relaxed">
          Evaluating compatible corridor stations, route geometry, and safe reachability thresholds...
        </p>
      </div>
    );
  }

  // Plan B Alternative Found State
  if (recoveryResult && recoveryResult.success) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3.5 font-sans shadow-2xs animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            <span className="font-extrabold text-xs text-emerald-950 uppercase font-mono tracking-wider">
              ✓ ALTERNATE PLAN FOUND
            </span>
          </div>
          <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
            {recoveryResult.alternateStops.length} STOPS
          </span>
        </div>

        <p className="text-xs text-emerald-900 font-semibold leading-relaxed">
          VoltTrip identified a safer sequential charging plan using ultra-fast corridor hubs. All route legs are safely reachable within your 15% safety reserve.
        </p>

        {/* Compact Itemized Plan B Stops List */}
        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {recoveryResult.alternateStops.map((stop, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs flex items-center justify-between gap-2 shadow-2xs"
            >
              <div className="truncate">
                <span className="font-extrabold text-slate-900 block truncate">
                  ⚡ {idx + 1}. {stop.station.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {stop.distanceFromOriginKm} km from origin
                </span>
              </div>
              <div className="text-right shrink-0 font-mono text-[10px]">
                <span className="font-bold text-emerald-700 block">{stop.estimatedArrivalSOCPercent}% Arrival</span>
                <span className="text-sky-600 font-extrabold">{stop.maxPowerKW} kW</span>
              </div>
            </div>
          ))}
        </div>

        {/* Plan B Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onApplyPlanB}
            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>USE ALTERNATE PLAN</span>
          </button>

          <button
            onClick={onKeepCurrentPlan}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-extrabold cursor-pointer transition-colors"
          >
            KEEP CURRENT
          </button>
        </div>
      </div>
    );
  }

  // Plan B Failure State (No Safe Alternative Found)
  if (recoveryResult && !recoveryResult.success) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 font-sans shadow-2xs animate-in fade-in duration-300">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
          <span className="font-extrabold text-xs text-rose-950 uppercase font-mono tracking-wider">
            ⚠ NO SAFE ALTERNATIVE FOUND
          </span>
        </div>

        <p className="text-xs text-rose-800 leading-relaxed">
          {recoveryResult.reason || 'VoltTrip could not identify a compatible charging sequence that maintains the configured safety reserve. Please review route or vehicle/SOC settings.'}
        </p>

        <button
          onClick={onKeepCurrentPlan}
          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-extrabold cursor-pointer shadow-2xs"
        >
          KEEP CURRENT PLAN
        </button>
      </div>
    );
  }

  return null;
};
