import React from 'react';
import { UserVehicle } from '@/types';
import {
  Battery,
  Zap,
  Navigation,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Radio,
  Gauge,
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

  // =========================================================================
  // CONTINUOUS 8-SCENE PACING TIMELINE (Total 12.0s)
  // Scene 1: 0.00 - 0.16 (0.0s - 1.9s)  -> Highway Journey Begins
  // Scene 2: 0.16 - 0.32 (1.9s - 3.8s)  -> Vehicle Intelligence & Range Check
  // Scene 3: 0.32 - 0.48 (3.8s - 5.8s)  -> VoltConnect AI Copilot Active
  // Scene 4: 0.48 - 0.62 (5.8s - 7.4s)  -> Approaching Highway Charging Bay
  // Scene 5: 0.62 - 0.74 (7.4s - 8.9s)  -> Optimal Charging Stop Found
  // Scene 6: 0.74 - 0.88 (8.9s - 10.5s) -> 150 kW DC Fast Charging (42% -> 100%)
  // Scene 7/8: 0.88 - 1.00 (10.5s - 12.0s+) -> Journey Ready Climax & App Bridge
  // =========================================================================

  // Dynamic Opacity / Visibility Helpers for Seamless Crossfades (No blank gaps!)
  const getSceneOpacity = (start: number, end: number, fadeLen = 0.04) => {
    if (progress < start - fadeLen || progress > end + fadeLen) return 0;
    if (progress >= start && progress <= end) return 1;
    if (progress < start) return (progress - (start - fadeLen)) / fadeLen;
    return (end + fadeLen - progress) / fadeLen;
  };

  const opScene1 = getSceneOpacity(0.0, 0.16);
  const opScene2 = getSceneOpacity(0.16, 0.32);
  const opScene3 = getSceneOpacity(0.32, 0.48);
  const opScene4 = getSceneOpacity(0.48, 0.62);
  const opScene5 = getSceneOpacity(0.62, 0.74);
  const opScene6 = getSceneOpacity(0.74, 0.88);
  const opScene78 = getSceneOpacity(0.88, 1.0, 0.03);

  // Dynamic Battery SOC & Charging Progression during Scene 6
  let displaySOC = 42;
  let chargingKw = 0;
  if (progress >= 0.74 && progress < 0.88) {
    const p = (progress - 0.74) / (0.88 - 0.74);
    displaySOC = Math.min(100, Math.round(42 + p * 58));
    chargingKw = Math.round(120 + Math.sin(p * Math.PI) * 30);
  } else if (progress >= 0.88) {
    displaySOC = 100;
    chargingKw = 0;
  }

  // Persistent Environment Dynamics
  // Road speed varies dynamically: cruising -> slowing for bay -> stationary at charger -> full acceleration
  let roadSpeedFactor = 1.0;
  if (progress >= 0.62 && progress < 0.74) {
    roadSpeedFactor = 0.4; // decelerating towards charging bay
  } else if (progress >= 0.74 && progress < 0.88) {
    roadSpeedFactor = 0.0; // stationary while docked at DC charger
  } else if (progress >= 0.88) {
    roadSpeedFactor = 1.6; // high-speed acceleration on full battery
  }

  const roadDashOffset = (progress * 1800 * roadSpeedFactor) % 60;

  // Car horizontal trajectory across the continuous timeline
  let carXPercent = 18;
  if (progress < 0.16) {
    carXPercent = 8 + (progress / 0.16) * 18; // 8% -> 26%
  } else if (progress < 0.48) {
    carXPercent = 26; // steady center-left while telemetry overlays appear
  } else if (progress < 0.74) {
    const p = (progress - 0.48) / (0.74 - 0.48);
    carXPercent = 26 + p * 20; // 26% -> 46% (approaching bay)
  } else if (progress < 0.88) {
    carXPercent = 50; // docked precisely at charging bay center
  } else {
    const p = (progress - 0.88) / (1.0 - 0.88);
    carXPercent = 50 + p * 38; // 50% -> 88% (powering into the future)
  }

  return (
    <div className="absolute inset-0 w-full h-full bg-[#02050E] overflow-hidden select-none font-sans">
      
      {/* =========================================================================
          PERSISTENT 1: ATMOSPHERIC SKY & HORIZON (Always active, never unmounts)
          ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Deep Cinematic Sky Gradient */}
        <div className="absolute top-0 inset-x-0 h-[65vh] bg-gradient-to-b from-[#020409] via-[#050D1E] to-[#0A1A38]" />

        {/* Ambient Nebula Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-sky-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[200px] bg-teal-500/10 rounded-full blur-[80px]" />

        {/* Distant Topography Mountain Silhouette */}
        <div className="absolute top-[38%] inset-x-0 h-36 opacity-30">
          <svg width="1920" height="140" viewBox="0 0 1920 140" fill="none" className="w-full h-full object-cover">
            <path d="M0 140 L0 75 Q 250 25, 500 70 T 1000 35 T 1500 65 T 1920 50 L 1920 140 Z" fill="#040915" />
          </svg>
        </div>

        {/* Dynamic Horizon Glow Line */}
        <div className="absolute top-[56%] inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
      </div>

      {/* =========================================================================
          PERSISTENT 2: CONTINUOUS HIGHWAY ROAD & LANES (Always active)
          ========================================================================= */}
      <div className="absolute top-[56%] inset-x-0 h-48 bg-gradient-to-b from-[#0B1528] via-[#060C18] to-[#020409] border-y border-slate-800/80 flex flex-col justify-center overflow-hidden z-10">
        {/* Subtle Perspective Grid Lines */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Top & Bottom Lane Guard Rails */}
        <div className="absolute top-3 inset-x-0 h-[2px] bg-gradient-to-r from-sky-500/20 via-sky-400/40 to-sky-500/20" />
        <div className="absolute bottom-3 inset-x-0 h-[2px] bg-gradient-to-r from-teal-500/20 via-teal-400/40 to-teal-500/20" />

        {/* Animated Dashed Center Highway Line */}
        <div className="relative w-full h-2 my-auto opacity-80">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: 'linear-gradient(to right, #94A3B8 55%, transparent 45%)',
              backgroundSize: '60px 100%',
              transform: `translateX(-${roadDashOffset}px)`,
            }}
          />
        </div>

        {/* Stationary Charger Bay Dock Marker (Appears during Scene 5 & 6) */}
        {progress >= 0.58 && progress <= 0.92 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-opacity duration-700 pointer-events-none"
            style={{
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: progress >= 0.70 && progress <= 0.90 ? 1 : 0.4,
            }}
          >
            <div className="relative flex flex-col items-center">
              {/* Charger Bay Stanchion */}
              <div className="w-20 h-1 rounded-full bg-emerald-400 shadow-[0_0_16px_#10B981]" />
              <div className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider bg-slate-900/90 px-2 py-0.5 rounded border border-emerald-500/40 mt-1 shadow-md">
                ⚡ FAST CHARGE BAY 01
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          PERSISTENT 3: SLEEK VEHICLE ENTITY (Persistent across the continuous trip)
          ========================================================================= */}
      <div
        className="absolute top-[49%] -translate-y-1/2 transition-all duration-100 ease-linear z-20 pointer-events-none"
        style={{
          left: `${carXPercent}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="relative">
          {/* Ground Shadow Glow */}
          <div className="absolute bottom-[-10px] left-4 right-4 h-6 bg-black/95 blur-md rounded-full" />
          
          {/* Headlight Cone Beam */}
          <div
            className="absolute top-[38px] left-[175px] w-80 h-28 bg-gradient-to-r from-sky-400/30 via-sky-400/8 to-transparent clip-triangle blur-[2px] transition-opacity duration-500"
            style={{ opacity: progress >= 0.74 && progress < 0.88 ? 0.3 : 1 }}
          />

          {/* Charging Cable & Electric Arc Effect during Scene 6 */}
          {progress >= 0.74 && progress < 0.88 && (
            <div className="absolute -top-12 left-16 z-30 flex flex-col items-center animate-pulse">
              <div className="px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400 text-emerald-300 text-[9px] font-mono font-bold uppercase tracking-widest shadow-[0_0_12px_#10B981]">
                ⚡ {chargingKw} kW DC
              </div>
              <div className="w-0.5 h-10 bg-gradient-to-b from-emerald-400 to-sky-400 shadow-[0_0_8px_#10B981]" />
            </div>
          )}

          {/* Premium Vector EV Body */}
          <svg width="220" height="96" viewBox="0 0 210 92" fill="none" className="drop-shadow-[0_16px_32px_rgba(0,0,0,0.9)]">
            <path d="M18 68 L40 35 C52 22, 85 16, 130 16 C160 16, 182 26, 198 46 L206 60 C210 65, 210 74, 204 76 L18 76 Z" fill="url(#carShader)" />
            <path d="M42 34 C54 22, 85 17, 128 17" stroke="#38BDF8" strokeWidth="1.6" strokeOpacity="0.9" />
            <path d="M56 32 C66 22, 92 20, 126 20 C146 20, 162 27, 172 37 L135 37 L68 37 Z" fill="#040914" stroke="#1E293B" strokeWidth="1.2" />
            
            {/* Luminous LED Headlight Strip */}
            <path d="M192 48 L208 58" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" className="drop-shadow-[0_0_12px_#38BDF8]" />
            
            {/* Aerodynamic Tail Light Ribbon */}
            <path d="M18 64 L22 72" stroke="#F43F5E" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_#F43F5E]" />

            {/* Front Wheel */}
            <g transform="translate(162, 68)">
              <circle r="15" fill="#040812" stroke="#334155" strokeWidth="2.5" />
              <circle r="8" fill="#1E293B" stroke="#0EA5E9" strokeWidth="1.5" />
              <line
                x1="-11" y1="0" x2="11" y2="0"
                stroke="#38BDF8"
                strokeWidth="1.5"
                style={{
                  animation: roadSpeedFactor > 0 ? `wheelSpin ${0.3 / roadSpeedFactor}s linear infinite` : 'none',
                }}
              />
              <line
                x1="0" y1="-11" x2="0" y2="11"
                stroke="#38BDF8"
                strokeWidth="1.5"
                style={{
                  animation: roadSpeedFactor > 0 ? `wheelSpin ${0.3 / roadSpeedFactor}s linear infinite` : 'none',
                }}
              />
            </g>

            {/* Rear Wheel */}
            <g transform="translate(50, 68)">
              <circle r="15" fill="#040812" stroke="#334155" strokeWidth="2.5" />
              <circle r="8" fill="#1E293B" stroke="#0EA5E9" strokeWidth="1.5" />
              <line
                x1="-11" y1="0" x2="11" y2="0"
                stroke="#38BDF8"
                strokeWidth="1.5"
                style={{
                  animation: roadSpeedFactor > 0 ? `wheelSpin ${0.3 / roadSpeedFactor}s linear infinite` : 'none',
                }}
              />
              <line
                x1="0" y1="-11" x2="0" y2="11"
                stroke="#38BDF8"
                strokeWidth="1.5"
                style={{
                  animation: roadSpeedFactor > 0 ? `wheelSpin ${0.3 / roadSpeedFactor}s linear infinite` : 'none',
                }}
              />
            </g>

            <defs>
              <linearGradient id="carShader" x1="0" y1="0" x2="210" y2="92" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0B132B" />
                <stop offset="45%" stopColor="#1C2D4A" />
                <stop offset="85%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* =========================================================================
          PERSISTENT 4: CINEMATIC SCENE OVERLAYS (Smooth crossfades, NO blackouts)
          ========================================================================= */}

      {/* SCENE 01: THE HIGHWAY — "EVERY JOURNEY STARTS WITH A PLAN." */}
      <div
        className="absolute inset-0 z-30 flex flex-col items-center justify-start pt-20 px-6 text-center pointer-events-none transition-all duration-700"
        style={{
          opacity: opScene1,
          transform: `translateY(${opScene1 === 1 ? '0px' : '-10px'})`,
          visibility: opScene1 > 0 ? 'visible' : 'hidden',
        }}
      >
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/80 border border-sky-500/30 text-sky-400 text-xs font-mono font-bold tracking-widest uppercase shadow-lg backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>SCENE 01 • HIGHWAY CORRIDOR</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
            EVERY JOURNEY STARTS WITH A PLAN.
          </h2>
          <p className="text-sm text-slate-300 font-medium max-w-md mx-auto">
            Highway cruising speed: 90 km/h • Real-time telemetry synchronized
          </p>
        </div>
      </div>

      {/* SCENE 02: VEHICLE INTELLIGENCE — "CAN I MAKE IT TO MY DESTINATION?" */}
      <div
        className="absolute inset-0 z-30 flex flex-col items-center justify-start pt-16 px-6 text-center pointer-events-none transition-all duration-700"
        style={{
          opacity: opScene2,
          transform: `translateY(${opScene2 === 1 ? '0px' : '-10px'})`,
          visibility: opScene2 > 0 ? 'visible' : 'hidden',
        }}
      >
        <div className="w-full max-w-lg bg-slate-900/90 border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.15)] space-y-5 text-center relative overflow-hidden backdrop-blur-xl pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400" /> DRIVER INSTRUMENT CLUSTER
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
              RANGE WARNING
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-bold font-mono">
                <Battery className="w-4 h-4" /> BATTERY LEVEL
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">42%</div>
              <div className="text-[10px] text-slate-400 font-mono">Usable: ~18.2 kWh</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs text-sky-400 font-bold font-mono">
                <Navigation className="w-4 h-4" /> ESTIMATED RANGE
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">165 km</div>
              <div className="text-[10px] text-slate-400 font-mono">Destination: 340 km</div>
            </div>
          </div>

          <div className="space-y-1 pt-1 border-t border-slate-800">
            <div className="text-sm font-heading font-extrabold text-amber-300 tracking-wide uppercase">
              "CAN I MAKE IT TO MY DESTINATION?"
            </div>
            <p className="text-xs text-slate-300">
              Destination is 340 km away. An optimized charging stop is required.
            </p>
          </div>
        </div>
      </div>

      {/* SCENE 03: VOLTCONNECT AI COPILOT TAKES OVER */}
      <div
        className="absolute inset-0 z-30 flex flex-col items-center justify-start pt-16 px-6 text-center pointer-events-none transition-all duration-700"
        style={{
          opacity: opScene3,
          transform: `translateY(${opScene3 === 1 ? '0px' : '-10px'})`,
          visibility: opScene3 > 0 ? 'visible' : 'hidden',
        }}
      >
        <div className="w-full max-w-md bg-slate-900/95 border-2 border-sky-500/50 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(14,165,233,0.25)] space-y-4 text-center relative overflow-hidden backdrop-blur-2xl pointer-events-auto">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-glow-volt">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="text-left">
              <div className="font-heading font-extrabold text-base text-white">VOLTCONNECT 2.0</div>
              <div className="text-[10px] font-mono text-sky-400 uppercase tracking-wider">
                Intelligent EV Copilot Active
              </div>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-2xl text-left space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-300">Vehicle Connected</span>
              <span className="text-emerald-400 font-mono">ONLINE</span>
            </div>
            <div className="text-xs font-bold text-white truncate">{vehicleName}</div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Current SOC: 42%</span>
              <span className="text-sky-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                Analyzing Corridor...
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-300 font-medium italic">
            "VoltConnect has taken over the route — scanning nationwide fast chargers..."
          </div>
        </div>
      </div>

      {/* SCENE 04 & 05: HIGHWAY CORRIDOR & OPTIMAL CHARGER DISCOVERY */}
      <div
        className="absolute inset-0 z-30 flex flex-col items-center justify-start pt-14 px-6 text-center pointer-events-none transition-all duration-700"
        style={{
          opacity: Math.max(opScene4, opScene5),
          transform: `translateY(${Math.max(opScene4, opScene5) === 1 ? '0px' : '-10px'})`,
          visibility: Math.max(opScene4, opScene5) > 0 ? 'visible' : 'hidden',
        }}
      >
        <div className="w-full max-w-lg bg-slate-900/95 border border-sky-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(14,165,233,0.18)] space-y-4 text-center backdrop-blur-xl pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-mono font-bold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" /> VOLTTRIP CORRIDOR INTELLIGENCE
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">100/100 SAFE</span>
          </div>

          <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            OPTIMAL CHARGING STOP FOUND
          </h3>

          {/* Connected Route Map Pill */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
              <span>Hyderabad (Origin)</span>
              <span className="text-amber-400 font-bold">⚡ NH44 Hub (85 km)</span>
              <span>Destination (340 km)</span>
            </div>

            <div className="relative flex items-center py-1">
              <div className="w-3.5 h-3.5 rounded-full bg-sky-400 border-2 border-white shadow-[0_0_10px_#38BDF8]" />
              <div className="flex-1 h-1.5 bg-slate-800 relative overflow-hidden rounded-full mx-1">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-amber-400 animate-pulse" />
              </div>
              <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_14px_#FBBF24] flex items-center justify-center text-[8px] text-slate-950 font-bold">
                ⚡
              </div>
              <div className="flex-1 h-1.5 bg-slate-800 relative overflow-hidden rounded-full mx-1">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-emerald-400" />
              </div>
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-[0_0_10px_#10B981]" />
            </div>
          </div>

          {/* Matched Station Details */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Tata Power Superhub — NH44</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                150 kW DC FAST
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span>📍 85 km ahead</span>
              <span>⚡ Arrival SOC: 24% (Safe Reserve)</span>
            </div>
          </div>
        </div>
      </div>

      {/* SCENE 06: CHARGING IN PROGRESS (150 kW ULTRA-FAST CHARGE) */}
      <div
        className="absolute inset-0 z-30 flex flex-col items-center justify-start pt-16 px-6 text-center pointer-events-none transition-all duration-700"
        style={{
          opacity: opScene6,
          transform: `translateY(${opScene6 === 1 ? '0px' : '-10px'})`,
          visibility: opScene6 > 0 ? 'visible' : 'hidden',
        }}
      >
        <div className="w-full max-w-md bg-slate-900/95 border border-emerald-500/50 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(16,185,129,0.2)] space-y-4 text-center backdrop-blur-xl pointer-events-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 fill-current" /> CHARGING IN PROGRESS
          </div>

          <div className="space-y-1">
            <h3 className="font-heading text-2xl font-extrabold text-white">
              150 kW ULTRA-FAST CHARGE
            </h3>
            <p className="text-xs text-slate-400 font-mono">CCS2 Connector Docked • Bay 01</p>
          </div>

          {/* Dynamic SOC Progress Bar */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-400">Battery State</span>
              <span className="text-emerald-400 text-lg">{displaySOC}%</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-150"
                style={{ width: `${displaySOC}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1">
              <span>Added: +24.8 kWh</span>
              <span className="text-emerald-400 font-bold">Restored: {realRangeKm} km</span>
            </div>
          </div>
        </div>
      </div>

      {/* SCENE 07 & 08: JOURNEY READY CLIMAX & REAL APP BRIDGE */}
      <div
        className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center pointer-events-none transition-all duration-700"
        style={{
          opacity: opScene78,
          transform: `scale(${opScene78 === 1 ? 1 : 0.98})`,
          visibility: opScene78 > 0 ? 'visible' : 'hidden',
        }}
      >
        <div className="max-w-md w-full space-y-6 bg-slate-900/95 border border-emerald-500/50 p-6 sm:p-8 rounded-3xl shadow-[0_0_70px_rgba(16,185,129,0.22)] backdrop-blur-2xl pointer-events-auto">
          {/* Luminous Journey Ready Climax Pill */}
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

          {/* Key Metric Badges */}
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

          {/* Primary Action Buttons — Bridge into Real Application */}
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

      <style>{`
        @keyframes wheelSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
