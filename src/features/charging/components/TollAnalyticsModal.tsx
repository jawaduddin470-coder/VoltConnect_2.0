import React from 'react';
import { EVTripPlan } from '@/services/tripPlanningEngine';
import { X, Zap, Sparkles, CheckCircle2, AlertCircle, Info, ShieldCheck, ChevronRight, Receipt } from 'lucide-react';

interface TollAnalyticsModalProps {
  tripPlan: EVTripPlan;
  onClose: () => void;
}

export const TollAnalyticsModal: React.FC<TollAnalyticsModalProps> = ({ tripPlan, onClose }) => {
  const { tollSummary, costSummary, waypoints, totalRoadDistanceKm, recommendedStops, startingSOCPercent } = tripPlan;

  const originName = waypoints[0]?.name.split(',')[0] || 'Origin';
  const destName = waypoints[waypoints.length - 1]?.name.split(',')[0] || 'Destination';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200 font-sans">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between border-b border-slate-800 shrink-0 gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase text-sky-400 font-mono tracking-wider">
                JOURNEY COST INTELLIGENCE BREAKDOWN
              </span>
              <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border ${
                costSummary.dataConfidence === 'HIGH_CONFIDENCE'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {costSummary.dataConfidence === 'HIGH_CONFIDENCE' ? 'Verified Tariffs + FASTag' : 'Estimated Tariff Data'}
              </span>
            </div>
            <h2 className="font-heading text-base sm:text-lg font-extrabold text-white mt-1">
              {originName} ➔ {destName} ({totalRoadDistanceKm} km)
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-slate-900">
          
          {/* Section 1: Primary Journey Cost Card & Metric Badges */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-wider">
                  TOTAL ESTIMATED JOURNEY COST
                </span>
                <div className="font-heading text-3xl font-black text-slate-900 mt-0.5 flex items-baseline gap-2">
                  <span>₹{costSummary.totalJourneyCostINR.toLocaleString('en-IN')}</span>
                  {costSummary.costPerKmINR > 0 && (
                    <span className="text-xs font-mono font-extrabold text-sky-600">
                      (₹{costSummary.costPerKmINR} / km)
                    </span>
                  )}
                </div>
              </div>

              {costSummary.estimatedSavingsINR > 0 && (
                <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Saves ~₹{costSummary.estimatedSavingsINR.toLocaleString('en-IN')} vs Petrol ICE</span>
                </div>
              )}
            </div>

            {/* Horizontal Distribution Split Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-sky-600 flex items-center gap-1">
                  ⚡ Charging: ₹{costSummary.estimatedChargingCostINR.toLocaleString('en-IN')} ({costSummary.chargingCostPercent}%)
                </span>
                <span className="text-amber-600 flex items-center gap-1">
                  🛣️ Tolls: ₹{costSummary.estimatedTollCostINR.toLocaleString('en-IN')} ({costSummary.tollCostPercent}%)
                </span>
              </div>

              <div className="w-full h-3.5 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
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

            {/* Dynamic Cost Insight Box */}
            <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-200 text-sky-900 text-xs font-bold flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span>{costSummary.costInsight}</span>
            </div>

            {/* Data Confidence Indicator */}
            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>{costSummary.dataConfidenceMessage}</span>
            </div>
          </div>

          {/* Section 2: Key Journey Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">ROAD DISTANCE</span>
              <span className="font-extrabold text-slate-900 text-sm">{totalRoadDistanceKm} km</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">STARTING BATTERY</span>
              <span className="font-extrabold text-emerald-600 text-sm">{startingSOCPercent}% SOC</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">CHARGING ENERGY</span>
              <span className="font-extrabold text-sky-600 text-sm">{costSummary.kwhEnergyAddedTotal} kWh</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-sans">ESTIMATED COST / KM</span>
              <span className="font-extrabold text-slate-900 text-sm">₹{costSummary.costPerKmINR} / km</span>
            </div>
          </div>

          {/* Section 3: Itemized Charging Stops Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-extrabold text-slate-900">
                  ⚡ Planned Charging Energy ({costSummary.chargingStopsCount} Stops)
                </h3>
              </div>
              <span className="text-xs font-mono font-extrabold text-sky-600">
                Total: ₹{costSummary.estimatedChargingCostINR.toLocaleString('en-IN')}
              </span>
            </div>

            {costSummary.stopCostDetails.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Single-charge journey! Vehicle completes trip using starting battery ({startingSOCPercent}% SOC). ₹0 public charging expense.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {costSummary.stopCostDetails.map((stop, idx) => (
                  <div
                    key={stop.stationId || idx}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-2xs hover:border-sky-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-mono text-[10px] font-extrabold flex items-center justify-center shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="truncate">
                        <div className="font-extrabold text-slate-900 truncate">
                          {stop.stationName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {stop.connectorType} • Purchased: <span className="font-bold text-sky-600">{stop.energyAddedKWh} kWh</span> @ ₹{stop.pricePerKWh}/kWh
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-extrabold text-slate-900 text-sm">
                        ₹{stop.costINR.toLocaleString('en-IN')}
                      </div>
                      <span className={`text-[9px] font-mono font-bold block ${
                        stop.isVerifiedPrice ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {stop.isVerifiedPrice ? '✓ Verified Tariff' : 'Estimated Rate'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Itemized FASTag Toll Plazas Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-extrabold text-slate-900">
                  KM-Matched FASTag Toll Plazas ({tollSummary.tollPlazaCount})
                </h3>
              </div>
              <span className="text-xs font-mono font-extrabold text-amber-600">
                Total: ₹{tollSummary.totalTollCostINR.toLocaleString('en-IN')}
              </span>
            </div>

            {tollSummary.matchedPlazas.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs font-extrabold text-slate-600">
                No FASTag highway toll plazas detected on this route geometry.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {tollSummary.matchedPlazas.map((item, idx) => (
                  <div
                    key={item.plaza.id || idx}
                    className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs hover:border-amber-400 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-mono text-[10px] font-extrabold flex items-center justify-center shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="truncate">
                        <div className="font-extrabold text-slate-900 truncate">
                          {item.plaza.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {item.plaza.highway} • {item.plaza.state} • ~{item.distanceFromOriginKm} km from origin
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-extrabold text-slate-900 text-xs">
                        ₹{item.plaza.carTollFeeINR}
                      </span>
                      <span className="text-[9px] text-amber-600 block font-mono font-bold">
                        FASTag LMV
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>FASTag 4-Wheeler LMV rates derived from NHAI FASTag dataset</span>
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
