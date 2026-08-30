import React from 'react';
import { MapPin, ShieldCheck, Zap, Radio } from 'lucide-react';

interface VoltMapRevealProps {
  progress: number;
}

export const VoltMapReveal: React.FC<VoltMapRevealProps> = ({ progress }) => {
  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-700 max-w-lg mx-auto bg-[#050A16]/60 backdrop-blur-xl p-8 rounded-3xl border border-[#29B6F6]/30 shadow-2xl">
      <div className="w-14 h-14 rounded-2xl bg-[#29B6F6]/15 border border-[#29B6F6]/40 flex items-center justify-center mx-auto text-[#29B6F6]">
        <MapPin className="w-7 h-7 animate-bounce" />
      </div>

      <div className="space-y-1.5">
        <span className="vc-badge vc-badge-sky text-[9px] uppercase font-extrabold tracking-widest">
          CHARGING INFRASTRUCTURE RECOVERY
        </span>
        <h2 className="font-heading text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
          VOLTMap
        </h2>
        <p className="text-sm font-bold text-[#22D3EE] tracking-wide uppercase">
          DISCOVER THE RIGHT CHARGER.
        </p>
      </div>

      {/* Supporting Micro-Text Badges */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-extrabold text-emerald-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Compatible
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-extrabold text-[#29B6F6] flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Available
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-extrabold text-[#22D3EE] flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5" /> Verified
        </span>
      </div>
    </div>
  );
};
