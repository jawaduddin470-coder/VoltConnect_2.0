import React from 'react';
import { EVTripPlan } from '@/services/tripPlanningEngine';
import { X, ShieldCheck, Zap, Fuel, Sparkles, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';

interface TollAnalyticsModalProps {
  tripPlan: EVTripPlan;
  onClose: () => void;
}

export const TollAnalyticsModal: React.FC<TollAnalyticsModalProps> = ({ tripPlan, onClose }) => {
  const { tollSummary, costSummary, readinessScore, waypoints, totalRoadDistanceKm } = tripPlan;

  const originName = waypoints[0]?.name.split(',')[0] || 'Origin';
  const destName = waypoints[waypoints.length - 1]?.name.split(',')[0] || 'Destination';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase text-sky-400 font-mono tracking-wider">
                JOURNEY ANALYTICS & TOLL INTELLIGENCE
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30">
                ✓ VERIFIED
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
        <div className="p-6 overflow-y-auto space-y-6 text-slate-900 font-sans">
          
          {/* Section 1: Journey Readiness Score Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white space-y-3 shadow-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  readinessScore.score >= 85 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-white tracking-wide">
                    {readinessScore.headline}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{readinessScore.subhead}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-2xl font-black text-emerald-400">
                  {readinessScore.score}<span className="text-xs text-slate-400 font-normal"> / 100</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">READINESS INDEX</span>
              </div>
            </div>

            {/* Readiness Factor Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              {readinessScore.factors.map((factor, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  {factor.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-extrabold text-slate-200 block">{factor.label}</span>
                    <span className="text-[11px] text-slate-400 leading-tight block">{factor.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Complete Journey Cost Breakdown & Split Bar */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-wider">
                  TOTAL ESTIMATED JOURNEY COST
                </span>
                <div className="font-heading text-2xl font-black text-slate-900 mt-0.5">
                  ₹{costSummary.totalJourneyCostINR.toLocaleString('en-IN')}
                </div>
              </div>

              {costSummary.estimatedSavingsINR > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saves ~₹{costSummary.estimatedSavingsINR.toLocaleString('en-IN')} vs Petrol ICE</span>
                </div>
              )}
            </div>

            {/* Proportional Split Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-sky-600 flex items-center gap-1">
                  ⚡ DC Fast Charging: ₹{costSummary.estimatedChargingCostINR.toLocaleString('en-IN')} ({costSummary.chargingCostPercent}%)
                </span>
                <span className="text-amber-600 flex items-center gap-1">
                  🛣️ FASTag Tolls: ₹{costSummary.estimatedTollCostINR.toLocaleString('en-IN')} ({costSummary.tollCostPercent}%)
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${costSummary.chargingCostPercent}%` }}
                  className="h-full bg-sky-500 transition-all duration-500"
                />
                <div
                  style={{ width: `${costSummary.tollCostPercent}%` }}
                  className="h-full bg-amber-500 transition-all duration-500"
                />
              </div>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">EV ELECTRIC COST</span>
                <span className="font-extrabold text-sky-600 text-sm">
                  ₹{costSummary.totalJourneyCostINR.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-sans">
                  ~{costSummary.kwhEnergyAddedTotal} kWh @ ₹20/kWh avg
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">ICE PETROL EQUIVALENT</span>
                <span className="font-extrabold text-slate-700 text-sm">
                  ₹{costSummary.iceEquivalentCostINR.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-sans">
                  Based on 14 km/L @ ₹102/L
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Detailed Route Toll Plazas List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-extrabold text-slate-900">
                  🛣️ Route Toll Plazas ({tollSummary.tollPlazaCount})
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  FASTag Enabled
                </span>
              </div>
              <span className="text-xs font-mono font-extrabold text-slate-900">
                Total: ₹{tollSummary.totalTollCostINR.toLocaleString('en-IN')}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {tollSummary.dataAttributionMessage}
            </p>

            {tollSummary.matchedPlazas.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs font-extrabold text-slate-600">
                No FASTag highway tolls detected on this route segment.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {tollSummary.matchedPlazas.map((item, idx) => (
                  <div
                    key={item.plaza.id}
                    className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs hover:border-sky-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-[10px] font-extrabold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="font-extrabold text-slate-900 truncate">
                          {item.plaza.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {item.plaza.highway} • {item.plaza.state} • ~{item.distanceFromOriginKm} km from start
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-extrabold text-slate-900 text-xs">
                        ₹{item.plaza.carTollFeeINR}
                      </span>
                      <span className="text-[9px] text-emerald-600 block font-mono font-bold">
                        FASTag
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between text-xs text-slate-500">
          <span>FASTag & DC Fast Charge rates estimated for Indian National Highway network</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-extrabold text-xs cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>

      </div>
    </div>
  );
};
