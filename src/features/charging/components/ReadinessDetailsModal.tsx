import React from 'react';
import { EVTripPlan } from '@/services/tripPlanningEngine';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, Info, ChevronRight, Zap } from 'lucide-react';

interface ReadinessDetailsModalProps {
  tripPlan: EVTripPlan;
  onClose: () => void;
}

export const ReadinessDetailsModal: React.FC<ReadinessDetailsModalProps> = ({ tripPlan, onClose }) => {
  const { readinessScore, waypoints, totalRoadDistanceKm } = tripPlan;
  const { score, status, confidence, factors, strengths, warnings, primaryConcern } = readinessScore;

  const originName = waypoints[0]?.name.split(',')[0] || 'Origin';
  const destName = waypoints[waypoints.length - 1]?.name.split(',')[0] || 'Destination';

  // Status Styling & Labeling
  const getStatusBadge = () => {
    switch (status) {
      case 'READY':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          badgeText: '✓ JOURNEY READY',
          subText: 'READY FOR THE ROAD',
          cardBg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
          textColor: 'text-emerald-700',
        };
      case 'READY_WITH_ATTENTION':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          badgeText: '✓ READY WITH ATTENTION',
          subText: 'REVIEW HIGHLIGHTED CONDITIONS',
          cardBg: 'bg-amber-50 border-amber-200 text-amber-950',
          textColor: 'text-amber-700',
        };
      case 'REVIEW':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          badgeText: '⚠ PLAN NEEDS REVIEW',
          subText: 'ATTENTION REQUIRED',
          cardBg: 'bg-amber-50 border-amber-200 text-amber-950',
          textColor: 'text-amber-700',
        };
      case 'NOT_READY':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          badgeText: '✕ NOT READY',
          subText: 'CHARGING PLAN REQUIRED',
          cardBg: 'bg-rose-50 border-rose-200 text-rose-950',
          textColor: 'text-rose-700',
        };
      default:
        return {
          bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
          badgeText: 'INSUFFICIENT DATA',
          subText: 'DATA MISSING',
          cardBg: 'bg-slate-50 border-slate-200 text-slate-900',
          textColor: 'text-slate-700',
        };
    }
  };

  const statusStyle = getStatusBadge();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase text-sky-400 font-mono tracking-wider">
                JOURNEY READINESS ANALYSIS
              </span>
              <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border ${statusStyle.bg}`}>
                {statusStyle.badgeText}
              </span>
            </div>
            <h2 className="font-heading text-lg font-extrabold text-white mt-1">
              {originName} ➔ {destName} ({totalRoadDistanceKm} km)
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-900">
          
          {/* Top Score Banner */}
          <div className={`p-5 rounded-2xl border space-y-3 shadow-xs ${statusStyle.cardBg}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider opacity-75">
                  DETERMINISTIC READINESS SCORE
                </span>
                <div className="font-heading text-3xl font-black text-slate-900 mt-0.5 flex items-baseline gap-2">
                  <span>{score} / 100</span>
                  <span className={`text-xs font-mono font-extrabold ${statusStyle.textColor}`}>
                    • {statusStyle.subText}
                  </span>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-slate-700 text-xs font-mono font-extrabold flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>DATA CONFIDENCE · {confidence}</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Your Journey Readiness score is calculated from starting battery SOC, segment-by-segment charging strategy, safety reserve buffer, corridor charger density, battery SOH, and route completeness.
            </p>
          </div>

          {/* 7-Factor Checklist Section */}
          <div className="space-y-3">
            <h3 className="font-heading text-sm font-extrabold text-slate-900">
              Factor-by-Factor Readiness Checklist
            </h3>

            <div className="grid grid-cols-1 gap-2">
              {Object.entries(factors).map(([key, f]) => (
                <div
                  key={key}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-3 truncate">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-extrabold shrink-0 mt-0.5 ${
                      f.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {f.passed ? '✓' : '⚠'}
                    </div>
                    <div className="truncate">
                      <div className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                        <span>{f.label}</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          ({f.score}/{f.maxScore} pts)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate leading-relaxed">
                        {f.detail}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                    f.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {f.passed ? 'PASSED' : 'ATTENTION'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* "WHY THIS RESULT?" Section */}
          <div className="space-y-3 pt-2">
            <h3 className="font-heading text-sm font-extrabold text-slate-900">
              Why This Result?
            </h3>

            {primaryConcern && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-start gap-2.5 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-950 text-xs font-mono uppercase">
                    PRIMARY CONCERN:
                  </span>
                  <span>{primaryConcern}</span>
                </div>
              </div>
            )}

            {strengths.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold font-mono text-slate-400 uppercase tracking-wider block">
                  KEY JOURNEY STRENGTHS
                </span>
                <div className="space-y-1">
                  {strengths.map((s, idx) => (
                    <div key={idx} className="text-xs text-slate-700 flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Calculated deterministically from route geometry & vehicle specifications</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-extrabold text-xs cursor-pointer"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};
