import React from 'react';
import { UserVehicle } from '@/types';
import { VoltConnectLogo } from '@/components/common/VoltConnectLogo';
import {
  Battery,
  Zap,
  Navigation,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Sparkles,
  MapPin,
  Car,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

interface EVCinematicJourneyProps {
  progress: number; // 0.0 to 1.0 across 12.0s total timeline
  activeVehicle?: UserVehicle | null;
  onStartJourney: () => void;
  onEnterApp: () => void;
}

export const EVCinematicJourney: React.FC<EVCinematicJourneyProps> = ({
  progress,
  activeVehicle,
  onStartJourney,
  onEnterApp,
}) => {
  // Vehicle telemetry fallback
  const vehicleName = activeVehicle
    ? `${activeVehicle.manufacturer} ${activeVehicle.model}`
    : 'Tata Nexon EV Long Range';
  const realRangeKm = activeVehicle?.estimatedRangeKm ?? 345;
  const maxDCPower = activeVehicle?.dcMaxPowerKW ?? 60;

  // =========================================================================
  // 8-SCENE NARRATIVE STORY TIMELINE (Total 12.0s)
  // Scene 1 (0.00 - 0.14 | 0.0s - 1.7s): The Journey Begins (Highway road shot)
  // Scene 2 (0.14 - 0.28 | 1.7s - 3.4s): The Problem (Cockpit view, 42% SOC, "Can I make it?")
  // Scene 3 (0.28 - 0.44 | 3.4s - 5.3s): The Phone (Driver opens VoltConnect on phone mount)
  // Scene 4 (0.44 - 0.58 | 5.3s - 7.0s): Intelligence (Route corridor analysis & charging prediction)
  // Scene 5 (0.58 - 0.72 | 7.0s - 8.6s): Aerial Route (EV travelling along glowing corridor)
  // Scene 6 (0.72 - 0.84 | 8.6s - 10.1s): Arrival at Charger (Bay dock, cable connects, 42% -> 100%)
  // Scene 7 & 8 (0.84 - 1.00 | 10.1s - 12.0s): Back to the Road & Journey Ready Climax
  // =========================================================================

  const showScene1 = progress >= 0.0 && progress < 0.16;
  const showScene2 = progress >= 0.14 && progress < 0.30;
  const showScene3 = progress >= 0.28 && progress < 0.46;
  const showScene4 = progress >= 0.44 && progress < 0.60;
  const showScene5 = progress >= 0.58 && progress < 0.74;
  const showScene6 = progress >= 0.72 && progress < 0.86;
  const showScene78 = progress >= 0.84;

  // Dynamic Battery SOC & Charging Progression
  let displaySOC = 42;
  if (progress >= 0.74 && progress < 0.84) {
    const p = (progress - 0.74) / (0.84 - 0.74);
    displaySOC = Math.min(100, Math.round(42 + p * 58));
  } else if (progress >= 0.84) {
    displaySOC = 100;
  }

  // Exterior Vehicle Animation Dynamics
  const roadDashOffset = (progress * 1600) % 60;
  let carXPercent = 15;
  if (progress < 0.16) {
    carXPercent = 5 + (progress / 0.16) * 30; // 5% -> 35%
  } else if (progress >= 0.58 && progress < 0.74) {
    const p = (progress - 0.58) / (0.74 - 0.58);
    carXPercent = 20 + p * 40; // 20% -> 60%
  } else if (progress >= 0.84) {
    const p = (progress - 0.84) / (1.0 - 0.84);
    carXPercent = 45 + p * 35; // 45% -> 80%
  }

  return (
    <div className="absolute inset-0 w-full h-full bg-[#02050E] overflow-hidden select-none font-sans">
      
      {/* =========================================================================
          SCENE 1: THE JOURNEY BEGINS (0.0s - 1.7s)
          Realistic Highway Road Tracking Shot
          ========================================================================= */}
      {showScene1 && (
        <div className="absolute inset-0 z-10 animate-in fade-in duration-500">
          {/* Dusk Landscape Sky */}
          <div className="absolute top-0 inset-x-0 h-[65vh] bg-gradient-to-b from-[#020409] via-[#060F22] to-[#0A1A38]" />
          
          {/* Distant Hills Silhouette */}
          <div className="absolute top-[40%] inset-x-0 h-32 opacity-35 pointer-events-none">
            <svg width="1920" height="120" viewBox="0 0 1920 120" fill="none" className="w-full h-full object-cover">
              <path d="M0 120 L0 70 Q 300 20, 600 70 T 1200 40 T 1920 60 L 1920 120 Z" fill="#040915" />
            </svg>
          </div>

          {/* Realistic Highway Surface */}
          <div className="absolute top-[58%] inset-x-0 h-44 bg-gradient-to-b from-[#0A1220] via-[#060B14] to-[#020408] border-y border-slate-800/90 flex flex-col justify-center overflow-hidden">
            <div className="relative w-full h-2 my-auto opacity-75">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: 'linear-gradient(to right, #94A3B8 55%, transparent 45%)',
                  backgroundSize: '60px 100%',
                  transform: `translateX(-${roadDashOffset}px)`,
                }}
              />
            </div>
            <div className="absolute top-2 inset-x-0 h-px bg-slate-700/60" />
            <div className="absolute bottom-2 inset-x-0 h-px bg-slate-700/60" />
          </div>

          {/* EV Gliding Forward */}
          <div
            className="absolute top-[50%] -translate-y-1/2 transition-all duration-75 ease-linear z-20"
            style={{ left: `${carXPercent}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="relative">
              <div className="absolute bottom-[-8px] left-4 right-4 h-5 bg-black/90 blur-md rounded-full" />
              <div className="absolute top-[38px] left-[175px] w-72 h-24 bg-gradient-to-r from-sky-400/25 via-sky-400/5 to-transparent clip-triangle blur-xs pointer-events-none" />

              <svg width="210" height="92" viewBox="0 0 210 92" fill="none" className="drop-shadow-[0_16px_28px_rgba(0,0,0,0.85)]">
                <path d="M18 68 L40 35 C52 22, 85 16, 130 16 C160 16, 182 26, 198 46 L206 60 C210 65, 210 74, 204 76 L18 76 Z" fill="url(#carScene1)" />
                <path d="M42 34 C54 22, 85 17, 128 17" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.8" />
                <path d="M56 32 C66 22, 92 20, 126 20 C146 20, 162 27, 172 37 L135 37 L68 37 Z" fill="#040914" stroke="#1E293B" strokeWidth="1.2" />
                <path d="M192 48 L208 58" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" className="drop-shadow-[0_0_10px_#38BDF8]" />
                <g transform="translate(162, 68)">
                  <circle r="15" fill="#040812" stroke="#334155" strokeWidth="2.5" />
                  <circle r="8" fill="#1E293B" stroke="#0EA5E9" strokeWidth="1.5" />
                  <line x1="-11" y1="0" x2="11" y2="0" stroke="#38BDF8" strokeWidth="1.5" style={{ animation: 'wheelSpin 0.3s linear infinite' }} />
                  <line x1="0" y1="-11" x2="0" y2="11" stroke="#38BDF8" strokeWidth="1.5" style={{ animation: 'wheelSpin 0.3s linear infinite' }} />
                </g>
                <g transform="translate(50, 68)">
                  <circle r="15" fill="#040812" stroke="#334155" strokeWidth="2.5" />
                  <circle r="8" fill="#1E293B" stroke="#0EA5E9" strokeWidth="1.5" />
                  <line x1="-11" y1="0" x2="11" y2="0" stroke="#38BDF8" strokeWidth="1.5" style={{ animation: 'wheelSpin 0.3s linear infinite' }} />
                  <line x1="0" y1="-11" x2="0" y2="11" stroke="#38BDF8" strokeWidth="1.5" style={{ animation: 'wheelSpin 0.3s linear infinite' }} />
                </g>
                <defs>
                  <linearGradient id="carScene1" x1="0" y1="0" x2="210" y2="92" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0B132B" />
                    <stop offset="50%" stopColor="#1C2D4A" />
                    <stop offset="100%" stopColor="#0284C7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Minimal Story Title */}
          <div className="absolute top-[20%] inset-x-4 text-center z-30 pointer-events-none space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-sky-400 text-[11px] font-mono font-bold tracking-widest uppercase">
              SCENE 01 • THE HIGHWAY
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              EVERY JOURNEY STARTS WITH A PLAN.
            </h2>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCENE 2: THE PROBLEM (1.7s - 3.4s)
          Cockpit View: Driver checks battery & range ("Can I make it?")
          ========================================================================= */}
      {showScene2 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-[#040814] animate-in fade-in duration-500">
          
          {/* Cockpit Digital Instrument Cluster Card */}
          <div className="w-full max-w-lg bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-sky-500 to-amber-500" />
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                DRIVER INSTRUMENT CLUSTER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                PLANNING CHECK
              </span>
            </div>

            {/* Battery & Range Meter */}
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-bold font-mono">
                  <Battery className="w-4 h-4" /> BATTERY LEVEL
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">42%</div>
                <div className="text-[10px] text-slate-400 font-mono">Usable: ~18.2 kWh</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs text-sky-400 font-bold font-mono">
                  <Navigation className="w-4 h-4" /> ESTIMATED RANGE
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">165 km</div>
                <div className="text-[10px] text-slate-400 font-mono">Highway Speed: 90 km/h</div>
              </div>
            </div>

            {/* Driver Thought Question */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="text-sm font-heading font-extrabold text-amber-300 tracking-wide uppercase">
                "CAN I MAKE IT TO MY DESTINATION?"
              </div>
              <p className="text-xs text-slate-400">
                Destination is 340 km away. A reliable charging stop is required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCENE 3: THE PHONE / VOLTCONNECT INTRO (3.4s - 5.3s)
          Driver opens VoltConnect on phone mount
          ========================================================================= */}
      {showScene3 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-[#030612] animate-in fade-in duration-500">
          
          <div className="w-full max-w-sm bg-slate-900 border-2 border-sky-500/40 rounded-[36px] p-5 shadow-[0_0_50px_rgba(14,165,233,0.2)] space-y-4 text-center relative overflow-hidden backdrop-blur-2xl">
            {/* Phone Speaker Notch */}
            <div className="w-20 h-3.5 bg-slate-950 rounded-full mx-auto" />

            {/* App Header Inside Phone */}
            <div className="py-2 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 mx-auto flex items-center justify-center text-sky-400">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="font-heading font-extrabold text-lg text-white">
                VOLTCONNECT 2.0
              </div>
              <div className="text-[10px] font-mono text-sky-400 uppercase tracking-wider">
                Intelligent EV Copilot Active
              </div>
            </div>

            {/* Live Context Connection */}
            <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-2xl text-left space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-300">Vehicle Connected</span>
                <span className="text-emerald-400 font-mono">ONLINE</span>
              </div>
              <div className="text-xs font-bold text-white truncate">
                {vehicleName}
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>Current SOC: 42%</span>
                <span className="text-sky-400">Analyzing Route...</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-medium italic">
              "VoltConnect calculating optimal highway charging corridor..."
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCENE 4: INTELLIGENCE & CORRIDOR SCANNING (5.3s - 7.0s)
          Route Analyzer matches highway charging stop
          ========================================================================= */}
      {showScene4 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-[#030714] animate-in fade-in duration-500">
          
          <div className="w-full max-w-md bg-slate-900/95 border border-sky-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center backdrop-blur-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-mono font-bold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" /> VOLTTRIP CORRIDOR INTELLIGENCE
            </div>

            <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              OPTIMAL CHARGING STOP FOUND
            </h3>

            {/* Matched Station Details */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Tata Power Superhub — NH44</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  150 kW DC
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-3 font-mono">
                <span>📍 Distance: 85 km ahead</span>
                <span>⚡ Arrival SOC: 24% (Safe)</span>
              </div>
            </div>

            <div className="text-xs text-slate-300 font-medium">
              Enough range to reach charger safely with 15% safety reserve preserved.
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCENE 5: AERIAL HIGHWAY ROUTE VIEW (7.0s - 8.6s)
          EV cruising along planned corridor with glowing route line
          ========================================================================= */}
      {showScene5 && (
        <div className="absolute inset-0 z-10 animate-in fade-in duration-500">
          <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-[#02050E] via-[#081326] to-[#040914]" />
          
          {/* Panoramic Route Grid */}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl space-y-6 text-center">
              
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest">
                  SCENE 05 • HIGHWAY CORRIDOR
                </span>
                <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                  APPROACHING CHARGING STATION
                </h3>
              </div>

              {/* Glowing Highway Route Visual */}
              <div className="relative p-6 rounded-3xl bg-slate-900/80 border border-slate-700/80 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
                  <span>Origin (Hyderabad)</span>
                  <span className="text-amber-400">⚡ 150 kW Charging Bay (85 km)</span>
                  <span className="text-emerald-400">Destination</span>
                </div>

                <div className="relative flex items-center">
                  <div className="w-4 h-4 rounded-full bg-sky-400 border-2 border-white shadow-[0_0_12px_#38BDF8] z-10" />
                  <div className="flex-1 h-2 bg-slate-800 relative overflow-hidden rounded-full mx-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-teal-400 to-amber-400 animate-pulse" />
                  </div>
                  <div className="w-5 h-5 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_16px_#FBBF24] flex items-center justify-center text-[10px] text-slate-950 font-bold z-10">
                    ⚡
                  </div>
                  <div className="flex-1 h-2 bg-slate-800 relative overflow-hidden rounded-full mx-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400" />
                  </div>
                  <div className="w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-[0_0_12px_#10B981] z-10" />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCENE 6: ARRIVAL AT CHARGER & CHARGE TOP-UP (8.6s - 10.1s)
          Physical charging dock & rapid top-up 42% -> 100%
          ========================================================================= */}
      {showScene6 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-[#030612] animate-in fade-in duration-500">
          
          <div className="w-full max-w-md bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center backdrop-blur-xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-current" /> CHARGING IN PROGRESS
            </div>

            <div className="space-y-1">
              <h3 className="font-heading text-2xl font-extrabold text-white">
                150 kW ULTRA-FAST CHARGE
              </h3>
              <p className="text-xs text-slate-400">CCS2 Connector Docked • Bay 01</p>
            </div>

            {/* Live Charging Percentage Bar */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-slate-400">Battery Level</span>
                <span className="text-emerald-400 text-base">{displaySOC}%</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-200"
                  style={{ width: `${displaySOC}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 font-mono text-left pt-1">
                Added +24.8 kWh • Estimated Time: 18 mins
              </div>
            </div>

            <div className="text-xs font-bold text-emerald-400">
              ✓ Full Range Restored to {realRangeKm} km
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCENE 7 & 8: BACK TO ROAD & JOURNEY READY CLIMAX (10.1s - 12.0s+)
          EV returns to road with confidence -> Seamless CTA to enter real app
          ========================================================================= */}
      {showScene78 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-600">
          
          <div className="max-w-md w-full space-y-6 bg-slate-900/95 border border-emerald-500/40 p-6 sm:p-8 rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.18)]">
            
            {/* Climax Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-extrabold uppercase tracking-widest shadow-glow-volt">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>✓ JOURNEY READY</span>
            </div>

            <div className="space-y-1.5">
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                READY FOR THE ROAD.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                Charged • Connected • Optimized
              </p>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-2 gap-3 text-left pt-1">
              <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-2xl">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Restored Range</div>
                <div className="text-base font-extrabold text-white font-mono">{realRangeKm} km</div>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-2xl">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Battery State</div>
                <div className="text-base font-extrabold text-emerald-400 font-mono">100% SOC</div>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-2xl">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Route Safety</div>
                <div className="text-base font-extrabold text-teal-400 font-mono">100/100 READY</div>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-2xl">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Corridor Status</div>
                <div className="text-base font-extrabold text-sky-400 font-mono">VERIFIED</div>
              </div>
            </div>

            {/* Interactive Action CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={onStartJourney}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-extrabold text-sm tracking-wide shadow-lg hover:shadow-glow-volt transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>START JOURNEY</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onEnterApp}
                className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-body font-bold text-xs border border-slate-700 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Enter App</span>
              </button>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes wheelSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
