import React from 'react';
import { MapPin, Navigation, Activity, Sparkles } from 'lucide-react';

interface EcosystemRevealProps {
  progress: number;
}

export const EcosystemReveal: React.FC<EcosystemRevealProps> = ({ progress }) => {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700 w-full max-w-3xl mx-auto text-center">
      
      <div className="space-y-2">
        <span className="vc-badge vc-badge-sky text-[9px] uppercase font-extrabold tracking-widest">
          FOUR-SYSTEM CONVERGENCE NUCLEUS
        </span>
        <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-[#F8FAFC] tracking-tight">
          FOUR INTELLIGENT SYSTEMS.
        </h2>
        <h3 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#29B6F6] tracking-tight pt-1">
          ONE CONNECTED EV ECOSYSTEM.
        </h3>
      </div>

      {/* 4 Converging System Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-extrabold">
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-[#29B6F6]/40 text-[#29B6F6] flex items-center justify-center gap-2 shadow-lg backdrop-blur-md">
          <MapPin className="w-4 h-4" /> VOLTMap
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-[#22D3EE]/40 text-[#22D3EE] flex items-center justify-center gap-2 shadow-lg backdrop-blur-md">
          <Navigation className="w-4 h-4" /> VOLTTrip
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-[#16C79A]/40 text-[#16C79A] flex items-center justify-center gap-2 shadow-lg backdrop-blur-md">
          <Activity className="w-4 h-4" /> VoltHealth
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-[#29B6F6]/40 text-[#29B6F6] flex items-center justify-center gap-2 shadow-lg backdrop-blur-md">
          <Sparkles className="w-4 h-4" /> VoltAI
        </div>
      </div>

    </div>
  );
};
