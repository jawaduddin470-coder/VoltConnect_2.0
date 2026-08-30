import React from 'react';
import { Navigation, Route, Compass, BatteryCharging, ArrowRight } from 'lucide-react';

interface VoltTripRevealProps {
  progress: number;
}

export const VoltTripReveal: React.FC<VoltTripRevealProps> = ({ progress }) => {
  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-700 max-w-lg mx-auto bg-[#050A16]/60 backdrop-blur-xl p-8 rounded-3xl border border-[#22D3EE]/30 shadow-2xl">
      <div className="w-14 h-14 rounded-2xl bg-[#22D3EE]/15 border border-[#22D3EE]/40 flex items-center justify-center mx-auto text-[#22D3EE]">
        <Navigation className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <span className="vc-badge vc-badge-teal text-[9px] uppercase font-extrabold tracking-widest">
          EV JOURNEY & ENERGY PHYSICS
        </span>
        <h2 className="font-heading text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
          VOLTTrip
        </h2>
        <p className="text-sm font-bold text-[#29B6F6] tracking-wide uppercase">
          PLAN THE ENERGY FOR EVERY JOURNEY.
        </p>
      </div>

      {/* Supporting Micro-Text Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-mono font-extrabold text-[10px]">
        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-sky-400">
          <Route className="w-3.5 h-3.5 mx-auto mb-1" /> Route
        </div>
        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-emerald-400">
          <Compass className="w-3.5 h-3.5 mx-auto mb-1" /> Range
        </div>
        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-amber-400">
          <BatteryCharging className="w-3.5 h-3.5 mx-auto mb-1" /> Charging
        </div>
        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[#22D3EE]">
          <ArrowRight className="w-3.5 h-3.5 mx-auto mb-1" /> Arrival
        </div>
      </div>
    </div>
  );
};
