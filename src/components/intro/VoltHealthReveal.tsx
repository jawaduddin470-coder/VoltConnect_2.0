import React from 'react';
import { Activity, ShieldAlert, Cpu, Gauge } from 'lucide-react';

interface VoltHealthRevealProps {
  progress: number;
}

export const VoltHealthReveal: React.FC<VoltHealthRevealProps> = ({ progress }) => {
  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-700 max-w-lg mx-auto bg-[#050A16]/60 backdrop-blur-xl p-8 rounded-3xl border border-[#16C79A]/30 shadow-2xl">
      <div className="w-14 h-14 rounded-2xl bg-[#16C79A]/15 border border-[#16C79A]/40 flex items-center justify-center mx-auto text-[#16C79A]">
        <Activity className="w-7 h-7 animate-pulse" />
      </div>

      <div className="space-y-1.5">
        <span className="vc-badge vc-badge-teal text-[9px] uppercase font-extrabold tracking-widest">
          BATTERY DIAGNOSTICS & TELEMETRY
        </span>
        <h2 className="font-heading text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
          VoltHealth
        </h2>
        <p className="text-sm font-bold text-[#16C79A] tracking-wide uppercase">
          UNDERSTAND YOUR VEHICLE.
        </p>
      </div>

      {/* Subtle Data Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-1 font-mono font-extrabold text-xs">
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-[9px] text-[#94A3B8] uppercase block">SOC</span>
          <span className="text-[#29B6F6] text-sm">85%</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-[9px] text-[#94A3B8] uppercase block">SOH</span>
          <span className="text-[#16C79A] text-sm">98%</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-[9px] text-[#94A3B8] uppercase block">Efficiency</span>
          <span className="text-[#22D3EE] text-sm">142 Wh/km</span>
        </div>
      </div>

      {/* Supporting Micro-Text */}
      <div className="flex items-center justify-center gap-4 text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider">
        <span>Battery Health</span>
        <span>•</span>
        <span>State of Charge</span>
        <span>•</span>
        <span>Efficiency</span>
        <span>•</span>
        <span>Maintenance</span>
      </div>
    </div>
  );
};
