import React from 'react';
import { ShieldCheck, Cpu, Zap, Activity } from 'lucide-react';

interface SystemInitSceneProps {
  progress: number; // 0 to 1 for Scene 0 window (0.0 to 1.2s)
}

export const SystemInitScene: React.FC<SystemInitSceneProps> = ({ progress }) => {
  const isOnline = progress > 0.75;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 w-full max-w-xl mx-auto text-center pointer-events-none select-none">
      
      {/* Title Header */}
      <div className="space-y-2">
        <h1 className="font-heading text-4xl sm:text-6xl font-extrabold text-[#F8FAFC] tracking-tight">
          VOLTCONNECT <span className="text-[#29B6F6]">2.0</span>
        </h1>
        <p className="text-xs sm:text-sm font-mono font-bold text-[#22D3EE] tracking-widest uppercase">
          INITIALIZING ELECTRIC MOBILITY ECOSYSTEM
        </p>
      </div>

      {/* Thin Cyan/Teal Progress Bar */}
      <div className="w-full max-w-sm mx-auto h-1 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#29B6F6] via-[#22D3EE] to-[#16C79A] transition-all duration-100 ease-out shadow-[0_0_10px_#29B6F6]"
          style={{ width: `${Math.min(100, progress * 130)}%` }}
        />
      </div>

      {/* 4 Quick System Checks */}
      <div className="grid grid-cols-4 gap-2 text-[10px] font-mono font-bold max-w-md mx-auto">
        <div className={`p-2 rounded-xl bg-slate-900/80 border transition-all duration-300 ${progress > 0.15 ? 'border-[#29B6F6]/50 text-[#29B6F6]' : 'border-slate-800 text-slate-600'}`}>
          <div className="flex items-center justify-center gap-1">
            <span>✓</span> NETWORK
          </div>
        </div>
        <div className={`p-2 rounded-xl bg-slate-900/80 border transition-all duration-300 ${progress > 0.35 ? 'border-[#22D3EE]/50 text-[#22D3EE]' : 'border-slate-800 text-slate-600'}`}>
          <div className="flex items-center justify-center gap-1">
            <span>✓</span> VEHICLE
          </div>
        </div>
        <div className={`p-2 rounded-xl bg-slate-900/80 border transition-all duration-300 ${progress > 0.55 ? 'border-[#16C79A]/50 text-[#16C79A]' : 'border-slate-800 text-slate-600'}`}>
          <div className="flex items-center justify-center gap-1">
            <span>✓</span> INTELLIGENCE
          </div>
        </div>
        <div className={`p-2 rounded-xl bg-slate-900/80 border transition-all duration-300 ${progress > 0.70 ? 'border-[#29B6F6]/50 text-[#29B6F6]' : 'border-slate-800 text-slate-600'}`}>
          <div className="flex items-center justify-center gap-1">
            <span>✓</span> ENERGY
          </div>
        </div>
      </div>

      {/* System Online Status Badge */}
      <div className="pt-2">
        <span className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-mono font-extrabold tracking-wider transition-all duration-300 ${
          isOnline
            ? 'bg-[#16C79A]/20 text-[#16C79A] border border-[#16C79A]/40 shadow-[0_0_12px_rgba(22,199,154,0.3)]'
            : 'bg-slate-900 text-slate-500 border border-slate-800'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#16C79A] animate-ping' : 'bg-slate-600'}`} />
          {isOnline ? 'SYSTEM ONLINE' : 'BOOT SEQUENCE ACTIVE'}
        </span>
      </div>

    </div>
  );
};
