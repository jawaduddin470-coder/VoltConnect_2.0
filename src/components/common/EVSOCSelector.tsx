import React, { useState } from 'react';
import { Battery, Zap, Gauge, ShieldCheck, Sparkles } from 'lucide-react';

interface EVSOCSelectorProps {
  currentSOC: number; // 0 - 100
  nominalRangeKm: number;
  vehicleModelName?: string;
  onChangeSOC: (newSOC: number) => void;
  className?: string;
}

export const EVSOCSelector: React.FC<EVSOCSelectorProps> = ({
  currentSOC,
  nominalRangeKm,
  vehicleModelName = 'EV',
  onChangeSOC,
  className = '',
}) => {
  const [localSOC, setLocalSOC] = useState(currentSOC);

  const estimatedPracticalRange = Math.round(nominalRangeKm * (localSOC / 100));

  // Determine energy level color theme
  const getEnergyTheme = (soc: number) => {
    if (soc >= 80) return { color: 'emerald', text: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]', label: 'OPTIMAL HIGH CHARGE' };
    if (soc >= 45) return { color: 'sky', text: 'text-sky-500', bg: 'bg-sky-500', border: 'border-sky-500', glow: 'shadow-[0_0_20px_rgba(14,165,233,0.3)]', label: 'OPTIMAL CHARGE' };
    if (soc >= 20) return { color: 'amber', text: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]', label: 'MEDIUM CHARGE' };
    return { color: 'rose', text: 'text-rose-500', bg: 'bg-rose-500', border: 'border-rose-500', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]', label: 'LOW BATTERY RESERVE' };
  };

  const theme = getEnergyTheme(localSOC);

  const handleChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setLocalSOC(clamped);
    onChangeSOC(clamped);
  };

  return (
    <div className={`bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 text-white shadow-2xl space-y-6 select-none ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
            <Battery className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase font-mono tracking-widest text-sky-400 block">
              STEP 3 • CURRENT CHARGE STATE
            </span>
            <h3 className="font-heading text-lg font-extrabold text-white">
              Starting Battery SOC
            </h3>
          </div>
        </div>

        <span className={`text-[10px] font-mono font-extrabold px-3 py-1 rounded-full border border-slate-800 ${theme.text} bg-slate-900`}>
          {theme.label}
        </span>
      </div>

      {/* Prominent SOC & Dynamic Range Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
        
        {/* Left: Prominent SOC Percentage */}
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-baseline justify-center sm:justify-start gap-2">
            <span className="font-heading text-5xl sm:text-6xl font-black tracking-tight text-white">
              {localSOC}
            </span>
            <span className={`text-2xl font-extrabold ${theme.text}`}>%</span>
          </div>
          <p className="text-xs font-mono text-slate-400 font-medium">
            Starting charge level for {vehicleModelName}
          </p>
        </div>

        {/* Right: Dynamic Range Recalculation Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-400 font-bold font-mono">
            <Gauge className="w-4 h-4 text-sky-400" /> ESTIMATED STARTING RANGE
          </div>
          <div className="font-heading text-2xl font-black text-sky-400">
            ≈ {estimatedPracticalRange} <span className="text-sm font-normal text-slate-300">km</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block">
            Derived from {nominalRangeKm} km rated max range
          </span>
        </div>
      </div>

      {/* Interactive Automotive Battery Bar & Drag Control */}
      <div className="space-y-3">
        <div className="relative w-full h-8 bg-slate-900 rounded-2xl p-1 border border-slate-800 overflow-hidden flex items-center shadow-inner">
          
          {/* Animated Energy Fill Level */}
          <div
            className={`h-full rounded-xl transition-all duration-150 ${theme.bg} ${theme.glow} relative flex items-center justify-end pr-2`}
            style={{ width: `${localSOC}%` }}
          >
            {localSOC >= 15 && (
              <div className="w-2 h-2 rounded-full bg-white animate-ping opacity-75" />
            )}
          </div>

          {/* Grid Segment Markers */}
          <div className="absolute inset-0 grid grid-cols-10 pointer-events-none opacity-20">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="border-r border-slate-400 h-full" />
            ))}
          </div>
        </div>

        {/* Smooth Drag Slider */}
        <input
          type="range"
          min={5}
          max={100}
          step={1}
          value={localSOC}
          onChange={e => handleChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none"
        />
      </div>

      {/* Quick SOC Preset Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-xs font-mono">
        <span className="text-[10px] text-slate-500 uppercase font-bold">Quick Presets:</span>
        <div className="flex items-center gap-2">
          {[100, 85, 60, 35].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => handleChange(val)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                localSOC === val
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {val}% {val === 100 ? '(Full)' : val === 85 ? '(Daily)' : val === 35 ? '(Low)' : ''}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
