import React from 'react';
import { Sparkles, Bot, Cpu, Layers } from 'lucide-react';

interface VoltAIRevealProps {
  progress: number;
}

export const VoltAIReveal: React.FC<VoltAIRevealProps> = ({ progress }) => {
  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-700 max-w-lg mx-auto bg-[#050A16]/60 backdrop-blur-xl p-8 rounded-3xl border border-[#29B6F6]/30 shadow-2xl">
      <div className="w-14 h-14 rounded-2xl bg-[#29B6F6]/15 border border-[#29B6F6]/40 flex items-center justify-center mx-auto text-[#29B6F6]">
        <Sparkles className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <span className="vc-badge vc-badge-sky text-[9px] uppercase font-extrabold tracking-widest">
          CONTEXTUAL EV INTELLIGENCE LAYER
        </span>
        <h2 className="font-heading text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
          VoltAI
        </h2>
        <p className="text-sm font-bold text-[#22D3EE] tracking-wide uppercase">
          TURN EV DATA INTO INTELLIGENCE.
        </p>
      </div>

      {/* Decision Flow Pipeline */}
      <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono font-extrabold text-sky-400">
        <span>DATA</span>
        <span className="text-[#94A3B8]">→</span>
        <span>UNDERSTANDING</span>
        <span className="text-[#94A3B8]">→</span>
        <span className="text-[#16C79A]">DECISION</span>
      </div>

      {/* Supporting Micro-Text */}
      <div className="flex items-center justify-center gap-4 text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider">
        <span>Vehicle</span>
        <span>•</span>
        <span>Journey</span>
        <span>•</span>
        <span>Charging</span>
        <span>•</span>
        <span>Context</span>
      </div>
    </div>
  );
};
