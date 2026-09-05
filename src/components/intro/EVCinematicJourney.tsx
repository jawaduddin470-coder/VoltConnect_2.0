import React from 'react';
import { UserVehicle } from '@/types';
import { VoltConnectLogo } from '@/components/common/VoltConnectLogo';
import {
  Battery,
  Zap,
  Navigation,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  Car,
  Mic,
  User,
  Building2,
  Route,
  Activity,
  Radio,
} from 'lucide-react';

interface EVCinematicJourneyProps {
  progress: number; // 0.0 to 1.0 (across 33.0s unhurried cinematic timeline)
  activeVehicle?: UserVehicle | null;
  onStartJourney: () => void;
  onEnterApp: () => void;
}

// GPU-accelerated smooth overlapping transition helper (cubic-bezier easing with subtle scale & translate)
function getStageStyle(
  progress: number,
  startP: number,
  endP: number,
  fadeInP = 0.025,
  fadeOutP = 0.025
): React.CSSProperties {
  if (progress < startP - fadeInP || progress > endP + fadeOutP) {
    return { display: 'none', opacity: 0, pointerEvents: 'none' };
  }
  let opacity = 1;
  let translateY = 0;
  let scale = 1;

  if (progress < startP) {
    const r = (progress - (startP - fadeInP)) / fadeInP;
    opacity = Math.max(0, Math.min(1, r));
    translateY = (1 - r) * 10;
    scale = 0.97 + r * 0.03;
  } else if (progress > endP) {
    const r = (progress - endP) / fadeOutP;
    opacity = Math.max(0, Math.min(1, 1 - r));
    translateY = -r * 8;
    scale = 1 - r * 0.02;
  }

  return {
    opacity,
    transform: `translate3d(0, ${translateY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`,
    transition: 'opacity 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
    pointerEvents: opacity > 0.75 ? 'auto' : 'none',
  };
}

export const EVCinematicJourney: React.FC<EVCinematicJourneyProps> = ({
  progress,
  activeVehicle,
  onStartJourney,
  onEnterApp,
}) => {
  // Real vehicle data fallbacks with verified high-fidelity engineering defaults
  const vehicleName = activeVehicle
    ? `${activeVehicle.manufacturer} ${activeVehicle.model}`
    : 'Tata Nexon EV Long Range';
  const batterySOC = activeVehicle?.currentBatteryPercent ?? 80;
  const rangeKm = activeVehicle?.estimatedRangeKm ?? 345;
  const maxDCPower = activeVehicle?.dcMaxPowerKW ?? 60;
  const connectorType = activeVehicle?.connectorTypes?.[0] || 'CCS2';

  // =========================================================================
  // CONTINUOUS 9-STAGE STORYLINE TIMELINE (0.0 to 1.0 across 33.0 seconds)
  // Stage 1 (0.0s - 3.0s | p: 0.000 - 0.091): INTRO ("One ecosystem. Every connection.")
  // Stage 2 (3.0s - 6.5s | p: 0.091 - 0.197): VEHICLE ("Your vehicle. Connected.")
  // Stage 3 (6.0s - 9.5s | p: 0.180 - 0.288): JOURNEY ("Your journey. Intelligent.")
  // Stage 4 (9.0s - 12.0s | p: 0.270 - 0.364): NETWORK ("Your network. Visible.")
  // Stage 5 (11.5s - 23.5s | p: 0.348 - 0.712): ⚡ CHARGING HERO MOMENT (12.0s duration!)
  //   11.5s - 14.0s (p: 0.348 - 0.424): Approach & Smooth Deceleration (2.5s)
  //   14.0s - 15.0s (p: 0.424 - 0.455): Complete Stop at Pedestal (1.0s)
  //   15.0s - 16.0s (p: 0.455 - 0.485): Charger Cable Connects (1.0s)
  //   16.0s - 21.0s (p: 0.485 - 0.636): 80% -> 100% Charging Animation (5.0s)
  //   21.0s - 22.5s (p: 0.636 - 0.682): 100% Completion Hold (1.5s)
  //   22.5s - 23.5s (p: 0.682 - 0.712): Departure & Smooth Acceleration (1.0s)
  // Stage 6 (23.5s - 26.5s | p: 0.695 - 0.788): VOICE AI ("Your assistant. Always ready.")
  // Stage 7 (26.0s - 28.5s | p: 0.770 - 0.860): PARTNERS ("Partners power the network.")
  // Stage 8 (28.0s - 30.5s | p: 0.835 - 0.920): OPERATIONS ("Operations keep it moving.")
  // Stage 9 (30.0s - 33.0s | p: 0.895 - 1.000): FINAL ECOSYSTEM ("One ecosystem. Built for electric mobility.")
  // =========================================================================

  // Continuous Vehicle X-Position Motion Curve (translate3d in vw units for GPU acceleration)
  let carXvw = -18;
  let isBraking = false;
  let isCarStopped = false;
  let isDeparting = false;
  let roadAnim = 'none';
  let wheelAnim = 'none';

  if (progress < 0.080) {
    // Stage 1: Resting offscreen during calm intro
    carXvw = -18;
    roadAnim = 'none';
    wheelAnim = 'none';
  } else if (progress < 0.197) {
    // Stage 2: Enters smoothly onto highway (relaxed driving speed, not running)
    const pNorm = (progress - 0.080) / (0.197 - 0.080);
    const easeOut = 1 - Math.pow(1 - pNorm, 2.5);
    carXvw = -18 + easeOut * 34; // -18vw -> 16vw
    roadAnim = 'roadDashAnim 0.85s linear infinite';
    wheelAnim = 'wheelSpin 0.7s linear infinite';
  } else if (progress < 0.288) {
    // Stage 3: Cruising along highway during journey reveal
    const pNorm = (progress - 0.197) / (0.288 - 0.197);
    carXvw = 16 + pNorm * 15; // 16vw -> 31vw
    roadAnim = 'roadDashAnim 0.85s linear infinite';
    wheelAnim = 'wheelSpin 0.7s linear infinite';
  } else if (progress < 0.348) {
    // Stage 4: Cruising along highway as charging network appears
    const pNorm = (progress - 0.288) / (0.348 - 0.288);
    carXvw = 31 + pNorm * 14; // 31vw -> 45vw
    roadAnim = 'roadDashAnim 0.85s linear infinite';
    wheelAnim = 'wheelSpin 0.7s linear infinite';
  } else if (progress < 0.424) {
    // Stage 5 Approach: Vehicle decelerates smoothly into the charging bay (velocity -> 0)
    isBraking = true;
    const pNorm = (progress - 0.348) / (0.424 - 0.348);
    const easeOut = 1 - Math.pow(1 - pNorm, 2.2);
    carXvw = 45 + easeOut * 20; // 45vw -> 65vw
    roadAnim = 'roadDashAnim 1.8s linear infinite'; // Visibly slowing down
    wheelAnim = 'wheelSpin 1.5s linear infinite';
  } else if (progress < 0.682) {
    // Stage 5 Stopped: Vehicle comes to a complete stop at charging pedestal
    carXvw = 65;
    isCarStopped = true;
    roadAnim = 'none'; // Completely stationary
    wheelAnim = 'none';
  } else if (progress < 0.720) {
    // Stage 5 Departure: Cable disconnects, smooth acceleration departure
    isDeparting = true;
    const pNorm = (progress - 0.682) / (0.720 - 0.682);
    const easeIn = Math.pow(pNorm, 2);
    carXvw = 65 + easeIn * 12; // 65vw -> 77vw
    roadAnim = 'roadDashAnim 1.2s linear infinite';
    wheelAnim = 'wheelSpin 1.0s linear infinite';
  } else {
    // Stages 6-9: Anchored in view on right side of the highway with headlights illuminating the scene
    carXvw = 77;
    roadAnim = 'roadDashAnim 0.9s linear infinite';
    wheelAnim = 'wheelSpin 0.75s linear infinite';
  }

  // Pure hardware state flags
  const isMoving = (progress >= 0.080 && progress < 0.424) || progress >= 0.682;
  const isChargingConnected = progress >= 0.455 && progress < 0.682;
  const isChargingActive = progress >= 0.485 && progress < 0.636;
  const isChargeComplete = progress >= 0.636;

  // Priority #3: 80% -> 100% Charging Animation (5.0 seconds duration, p: 0.485 -> 0.636)
  let liveSOC = 80;
  if (progress < 0.485) {
    liveSOC = 80;
  } else if (progress < 0.636) {
    const pNorm = (progress - 0.485) / (0.636 - 0.485);
    liveSOC = Math.min(100, Math.round(80 + pNorm * 20));
  } else {
    liveSOC = 100;
  }

  // Pedestal Digital Status Display Strings
  const pedestalText1 = isChargeComplete
    ? 'READY'
    : isChargingActive
    ? `${liveSOC}%`
    : isChargingConnected
    ? 'CONNECTED'
    : isCarStopped
    ? 'STANDBY'
    : isBraking
    ? 'BAY 02'
    : 'STANDBY';

  const pedestalText2 = isChargeComplete
    ? '100% SOH'
    : isChargingActive
    ? '150 kW'
    : isChargingConnected
    ? 'DC FAST'
    : '150 kW MAX';

  const pedestalStripColor = isChargeComplete
    ? '#10B981'
    : isChargingActive
    ? '#38BDF8'
    : isChargingConnected
    ? '#0EA5E9'
    : isCarStopped
    ? '#F59E0B'
    : '#334155';

  return (
    <div className="absolute inset-0 w-full h-full bg-[#030712] overflow-hidden select-none font-sans">
      
      {/* 1. ATMOSPHERIC DUSK ENVIRONMENT */}
      <div className="relative w-full h-full">
        {/* Subtle Ambient Night Sky */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 inset-x-0 h-[65vh] bg-gradient-to-b from-[#02050E] via-[#081126] via-50% to-[#0D1E3D]" />
          <div className="absolute top-[44%] inset-x-0 h-24 bg-gradient-to-b from-sky-500/10 via-teal-500/5 to-transparent pointer-events-none" />

          {/* Distant Skyline Silhouette */}
          <div className="absolute top-[38%] inset-x-0 h-[22vh] opacity-30 pointer-events-none">
            <svg width="1920" height="180" viewBox="0 0 1920 180" fill="none" className="w-full h-full object-cover">
              <path d="M0 180 L0 120 L100 120 L100 80 L180 80 L180 140 L300 140 L300 70 L420 70 L420 180 Z" fill="#0A1428" />
              <path d="M420 180 L420 90 L520 90 L520 50 L640 50 L640 110 L780 110 L780 180 Z" fill="#0D1D38" />
              <path d="M780 180 L780 100 L900 100 L900 65 L1020 65 L1020 180 Z" fill="#0A1428" />
              <path d="M1020 180 L1020 75 L1140 75 L1140 130 L1260 130 L1260 180 Z" fill="#0D1D38" />
              <path d="M1260 180 L1260 85 L1400 85 L1400 55 L1540 55 L1540 120 L1680 120 L1680 180 Z" fill="#0A1428" />
              <path d="M1680 180 L1680 95 L1800 95 L1800 180 L1920 180 Z" fill="#0D1D38" />
            </svg>
          </div>

          {/* Horizon Line */}
          <div className="absolute top-[58%] inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />
        </div>

        {/* 2. REALISTIC ASPHALT HIGHWAY SURFACE WITH GPU-COMPOSITED ROAD DASH ANIMATION */}
        <div className="absolute top-[58%] inset-x-0 h-44 bg-gradient-to-b from-[#09101E] via-[#060C16] to-[#02050B] border-y border-slate-800/80 flex flex-col justify-center overflow-hidden">
          {/* Lane Markings (Pure CSS Composited Keyframes - Synchronized to Vehicle Speed) */}
          <div className="relative w-full h-2 my-auto opacity-70 overflow-hidden">
            <div
              className="w-[200%] h-full will-change-transform"
              style={{
                backgroundImage: 'linear-gradient(to right, #94A3B8 55%, transparent 45%)',
                backgroundSize: '60px 100%',
                animation: roadAnim,
              }}
            />
          </div>

          {/* Road Edge Boundaries */}
          <div className="absolute top-2.5 inset-x-0 h-px bg-slate-700/60" />
          <div className="absolute bottom-2.5 inset-x-0 h-px bg-slate-700/60" />
        </div>

        {/* 3. ULTRA-FAST CHARGING PEDESTAL HUB (Right Side Bay) */}
        <div className="absolute top-[42%] right-[8%] sm:right-[10%] -translate-y-1/2 z-10 flex flex-col items-center">
          {/* Parking Bay Markings */}
          <div className="absolute bottom-[-110px] right-[-20px] w-64 h-16 border-2 border-dashed border-emerald-500/30 rounded-2xl pointer-events-none transform -skew-x-12" />

          {/* EV Fast Charger Pedestal */}
          <svg width="90" height="155" viewBox="0 0 90 155" fill="none">
            <rect x="18" y="16" width="54" height="128" rx="12" fill="url(#pedestalBody)" stroke="#334155" strokeWidth="2" />
            <rect x="24" y="26" width="42" height="36" rx="8" fill="#020617" stroke="#1E293B" strokeWidth="1.5" />

            {/* Pedestal Digital Status Display */}
            <text x="45" y="44" fill={isChargeComplete ? '#10B981' : isChargingActive ? '#38BDF8' : '#94A3B8'} fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {pedestalText1}
            </text>
            <text x="45" y="55" fill="#64748B" fontSize="7" fontFamily="monospace" textAnchor="middle">
              {pedestalText2}
            </text>

            {/* Status Indicator Strip */}
            <rect
              x="30"
              y="70"
              width="30"
              height="6"
              rx="3"
              fill={pedestalStripColor}
            />

            {/* Cable Dock */}
            <rect x="10" y="88" width="10" height="30" rx="4" fill="#1E293B" stroke="#334155" />
            <path d="M15 118 Q15 142, 5 150" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" fill="none" />

            <defs>
              <linearGradient id="pedestalBody" x1="0" y1="0" x2="90" y2="155" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="50%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </defs>
          </svg>

          {/* Heavy-Duty DC Charging Cable (Connects at Stage 5) */}
          {isChargingConnected && (
            <svg className="absolute top-[88px] right-[54px] w-40 h-14 overflow-visible pointer-events-none z-20">
              <path d="M 140 10 Q 70 38, 0 12" fill="none" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" />
              <path
                d="M 140 10 Q 70 38, 0 12"
                fill="none"
                stroke={isChargeComplete ? '#10B981' : '#38BDF8'}
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
            </svg>
          )}
        </div>

        {/* 4. CONTINUOUS VEHICLE ANCHOR (Never unmounts, GPU-composited translate3d) */}
        <div
          className="absolute top-[50%] left-0 z-20 will-change-transform"
          style={{ transform: `translate3d(${carXvw}vw, -50%, 0)` }}
        >
          <div className="relative">
            {/* Ground Shadow */}
            <div className="absolute bottom-[-10px] left-4 right-4 h-6 bg-black/90 rounded-full" />

            {/* LED Headlight Beam */}
            <div className="absolute top-[42px] left-[175px] w-72 h-24 bg-gradient-to-r from-sky-400/25 via-sky-400/5 to-transparent clip-triangle pointer-events-none transform -rotate-1" />

            {/* Chassis Underglow Reflection */}
            <div className="absolute bottom-0 left-10 right-10 h-2 bg-sky-400/30 rounded-full" />

            {/* Vehicle Vector Rendering */}
            <svg width="220" height="96" viewBox="0 0 220 96" fill="none">
              <path
                d="M18 70 L42 36 C54 22, 88 16, 134 16 C165 16, 188 26, 206 48 L214 62 C218 67, 218 76, 212 78 L18 78 Z"
                fill="url(#cinematicCarBody)"
              />
              <path d="M44 35 C56 22, 88 17, 132 17" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.85" />
              <path
                d="M58 33 C68 23, 95 21, 130 21 C150 21, 168 28, 178 38 L140 38 L70 38 Z"
                fill="#040914"
                stroke="#1E293B"
                strokeWidth="1.2"
              />
              <path d="M80 23 L124 23 L108 38 L70 38 Z" fill="white" fillOpacity="0.14" />
              <path d="M30 60 L206 60" stroke="#0F172A" strokeWidth="1.5" />
              <path d="M84 60 L140 60" stroke="#38BDF8" strokeWidth="2.5" strokeOpacity="0.8" />
              <path d="M200 50 L216 60" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
              
              {/* Brake Lights: Bright red when decelerating */}
              <path
                d="M16 60 L24 68"
                stroke={isBraking ? '#EF4444' : '#991B1B'}
                strokeWidth={isBraking ? '6' : '3.5'}
                strokeLinecap="round"
              />

              {/* Wheels with pure CSS Composited Keyframe Spin synchronized with road */}
              <g transform="translate(170, 70)">
                <circle r="16" fill="#040812" stroke="#334155" strokeWidth="2.5" />
                <circle r="8.5" fill="#1E293B" stroke="#0EA5E9" strokeWidth="1.5" />
                <g style={{ animation: wheelAnim, transformOrigin: '0 0' }}>
                  <line x1="-12" y1="0" x2="12" y2="0" stroke="#38BDF8" strokeWidth="1.5" />
                  <line x1="0" y1="-12" x2="0" y2="12" stroke="#38BDF8" strokeWidth="1.5" />
                </g>
              </g>

              <g transform="translate(52, 70)">
                <circle r="16" fill="#040812" stroke="#334155" strokeWidth="2.5" />
                <circle r="8.5" fill="#1E293B" stroke="#0EA5E9" strokeWidth="1.5" />
                <g style={{ animation: wheelAnim, transformOrigin: '0 0' }}>
                  <line x1="-12" y1="0" x2="12" y2="0" stroke="#38BDF8" strokeWidth="1.5" />
                  <line x1="0" y1="-12" x2="0" y2="12" stroke="#38BDF8" strokeWidth="1.5" />
                </g>
              </g>

              {/* Charging Port */}
              <circle
                cx="36"
                cy="58"
                r="4"
                fill={isChargeComplete ? '#10B981' : isChargingConnected ? '#38BDF8' : '#1E293B'}
                stroke="#38BDF8"
                strokeWidth="1.2"
              />

              <defs>
                <linearGradient id="cinematicCarBody" x1="0" y1="0" x2="220" y2="96" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0B132B" />
                  <stop offset="45%" stopColor="#1C2D4A" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
              </defs>
            </svg>

            {/* Model Tag */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-300 shadow-md flex items-center gap-1.5">
              <Car className="w-3 h-3 text-sky-400" />
              <span>{vehicleName}</span>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 9-STAGE UNHURRIED CINEMATIC OVERLAYS (Continuous Storytelling) */}
        {/* ================================================================= */}

        {/* 01 — INTRO: Calm (0.0s - 3.0s | p: 0.000 - 0.088) */}
        <div
          className="absolute top-[16%] sm:top-[20%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 flex flex-col items-center justify-center text-center will-change-transform max-w-xl mx-auto"
          style={getStageStyle(progress, 0.000, 0.088, 0.015, 0.020)}
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-sky-500/30 text-sky-400 text-xs font-mono font-bold tracking-widest uppercase shadow-md">
              <Sparkles className="w-3.5 h-3.5" /> VOLTCONNECT 2.0
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              One ecosystem. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400">
                Every connection.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
              Powering connected electric mobility across vehicles, drivers, charging infrastructure, and operations.
            </p>
          </div>
        </div>

        {/* 02 — VEHICLE: Slow vehicle entry (3.0s - 6.5s | p: 0.080 - 0.195) */}
        <div
          className="absolute top-[13%] sm:top-[16%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center will-change-transform max-w-2xl mx-auto"
          style={getStageStyle(progress, 0.080, 0.195, 0.025, 0.025)}
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-sky-500/40 text-xs font-mono font-bold text-sky-400 shadow-md">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>VEHICLE → VOLTCONNECT</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Your vehicle. Connected.
            </h2>
            {/* Live Telemetry HUD Cards */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap pt-1">
              <div className="bg-slate-950/95 border border-sky-500/30 px-3.5 sm:px-4 py-2.5 rounded-2xl shadow-md flex items-center gap-3 min-w-[130px]">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Battery className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[9px] font-mono text-slate-400 font-bold uppercase">Battery SOC</div>
                  <div className="text-xs sm:text-sm font-extrabold text-white font-mono">{batterySOC}% • 98% SOH</div>
                </div>
              </div>

              <div className="bg-slate-950/95 border border-teal-500/30 px-3.5 sm:px-4 py-2.5 rounded-2xl shadow-md flex items-center gap-3 min-w-[130px]">
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Navigation className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[9px] font-mono text-slate-400 font-bold uppercase">Est. Range</div>
                  <div className="text-xs sm:text-sm font-extrabold text-white font-mono">{rangeKm} km</div>
                </div>
              </div>

              <div className="bg-slate-950/95 border border-emerald-500/30 px-3.5 sm:px-4 py-2.5 rounded-2xl shadow-md flex items-center gap-3 min-w-[130px]">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[9px] font-mono text-slate-400 font-bold uppercase">Max Fast Charge</div>
                  <div className="text-xs sm:text-sm font-extrabold text-white font-mono">{maxDCPower} kW • {connectorType}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 03 — JOURNEY: Vehicle continues naturally (6.0s - 9.5s | p: 0.180 - 0.285) */}
        {/* Coexists with Vehicle from 0.180 to 0.195 for continuous storytelling */}
        <div
          className="absolute top-[13%] sm:top-[16%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center will-change-transform max-w-2xl mx-auto"
          style={getStageStyle(progress, 0.180, 0.285, 0.025, 0.025)}
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-teal-500/40 text-xs font-mono font-bold text-teal-300 shadow-md">
              <Route className="w-3.5 h-3.5" />
              <span>VOLTTRIP ROUTE ENGINE</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Your journey. Intelligent.
            </h2>
            {/* Dynamic Route Corridor */}
            <div className="bg-slate-950/95 border border-teal-500/30 p-3.5 sm:p-4 rounded-2xl shadow-lg space-y-2">
              <div className="relative flex items-center justify-between px-2">
                <div className="flex flex-col items-center gap-0.5 z-10">
                  <div className="w-3 h-3 rounded-full bg-sky-400 border-2 border-white" />
                  <span className="text-[9px] font-mono font-bold text-slate-300">Origin</span>
                </div>
                <div className="flex-1 h-1 mx-3 bg-slate-800 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-teal-400 to-amber-400" />
                </div>
                <div className="flex flex-col items-center gap-0.5 z-10">
                  <div className="w-4 h-4 rounded-full bg-amber-400 border border-white flex items-center justify-center text-[9px] text-slate-950 font-black">
                    ⚡
                  </div>
                  <span className="text-[9px] font-mono font-bold text-amber-300">150kW Stop</span>
                </div>
                <div className="flex-1 h-1 mx-3 bg-slate-800 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-teal-400 to-emerald-400" />
                </div>
                <div className="flex flex-col items-center gap-0.5 z-10">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                  <span className="text-[9px] font-mono font-bold text-emerald-300">Destination</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Dynamic range calculation, terrain compensation, and verified charging waypoints.
              </p>
            </div>
          </div>
        </div>

        {/* 04 — NETWORK: Network becomes visible (9.0s - 12.0s | p: 0.270 - 0.355) */}
        {/* Coexists with Journey from 0.270 to 0.285 */}
        <div
          className="absolute top-[13%] sm:top-[16%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center will-change-transform max-w-2xl mx-auto"
          style={getStageStyle(progress, 0.270, 0.355, 0.025, 0.025)}
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-sky-500/40 text-xs font-mono font-bold text-sky-400 shadow-md">
              <MapPin className="w-3.5 h-3.5" />
              <span>VOLTMAP • 1,766 VERIFIED STATIONS</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Your network. Visible.
            </h2>
            {/* Verified Network Charging Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-2xl mx-auto pt-0.5">
              <div className="bg-slate-950/95 border border-emerald-500/30 p-2.5 rounded-xl shadow-md text-left space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase">Tata Power Hub</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs font-bold text-white">150 kW DC Fast</div>
                <div className="text-[9px] text-slate-400">Available • CCS2</div>
              </div>

              <div className="bg-slate-950/95 border border-sky-500/30 p-2.5 rounded-xl shadow-md text-left space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-sky-400 uppercase">Jio-bp Pulse Hub</span>
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                </div>
                <div className="text-xs font-bold text-white">60 kW DC Rapid</div>
                <div className="text-[9px] text-slate-400">Verified Active</div>
              </div>

              <div className="bg-slate-950/95 border border-teal-500/30 p-2.5 rounded-xl shadow-md text-left space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-teal-400 uppercase">Relux Hyper Hub</span>
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                </div>
                <div className="text-xs font-bold text-white">120 kW Highway DC</div>
                <div className="text-[9px] text-slate-400">24/7 Verified</div>
              </div>
            </div>
          </div>
        </div>

        {/* ⚡ 05 — CHARGING: THE HERO WOW MOMENT (11.5s - 23.5s | p: 0.345 - 0.700) */}
        {/* Slower, deliberate pacing: Approach -> Slow Down -> Stop -> Connect -> 80% -> 100% -> Hold -> Depart */}
        <div
          className="absolute top-[12%] sm:top-[14%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center will-change-transform max-w-xl mx-auto"
          style={getStageStyle(progress, 0.345, 0.700, 0.025, 0.025)}
        >
          <div className="space-y-3">
            {/* Status Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-extrabold uppercase tracking-wider shadow-md">
              <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
              <span>
                {isChargeComplete
                  ? 'CHARGE COMPLETE • 100% SOH'
                  : isChargingActive
                  ? '⚡ ULTRA-FAST DC CHARGING ACTIVE'
                  : isChargingConnected
                  ? 'CHARGER CONNECTED • 150 kW DC'
                  : isCarStopped
                  ? 'ALIGNED IN CHARGING BAY 02'
                  : 'APPROACHING CHARGING BAY'}
              </span>
            </div>

            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {isChargeComplete
                ? 'Fully charged. Ready for the road.'
                : isChargingActive
                ? 'Your charge. Accelerated.'
                : isChargingConnected
                ? 'Your charge. Connected.'
                : 'Your charge. Approaching.'}
            </h2>

            {/* Hero Interactive Charging Meter Card */}
            <div className="bg-slate-950/95 border border-emerald-500/40 p-4 sm:p-5 rounded-2xl shadow-2xl space-y-3.5">
              
              {/* Top Readout: Bay Info & Prominent Live SOC */}
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Station Bay</div>
                  <div className="text-xs sm:text-sm font-bold text-white">Ultra-Fast DC Hub • Bay 02</div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">State of Charge</div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400 flex items-center gap-1">
                    <span>{liveSOC}%</span>
                    <span className="text-xs text-slate-400 font-normal">SOC</span>
                  </div>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700 relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-emerald-300 transition-all duration-200"
                  style={{ width: `${liveSOC}%` }}
                />
              </div>

              {/* Explicit 80% -> 84% -> 88% -> 92% -> 96% -> 100% Stepped Progress Indicators */}
              <div className="grid grid-cols-6 gap-1 pt-0.5">
                {[80, 84, 88, 92, 96, 100].map((stepSOC) => {
                  const isReached = liveSOC >= stepSOC;
                  const isCurrent = liveSOC === stepSOC || (liveSOC > stepSOC && liveSOC < stepSOC + 4);
                  return (
                    <div
                      key={stepSOC}
                      className={`py-1 rounded-lg border text-center font-mono text-[10px] font-bold transition-colors ${
                        isReached
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500'
                      } ${isCurrent ? 'ring-1 ring-emerald-400' : ''}`}
                    >
                      {stepSOC}%
                    </div>
                  );
                })}
              </div>

              {/* Charging Telemetry Details */}
              <div className="border-t border-slate-800/80 pt-2.5 flex items-center justify-between text-left text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">
                    {isChargeComplete ? 'Ready to Depart' : isChargingActive ? '150 kW DC Ultra Fast' : 'Connecting Protocol'}
                  </span>
                </div>

                <div className="text-right text-emerald-400 font-bold">
                  {isChargeComplete ? '425 km Full Range' : '+18 km / min'}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 06 — VOICE AI: Vehicle resumes (23.5s - 26.5s | p: 0.695 - 0.780) */}
        <div
          className="absolute top-[13%] sm:top-[16%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center will-change-transform max-w-xl mx-auto"
          style={getStageStyle(progress, 0.695, 0.780, 0.025, 0.025)}
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold uppercase tracking-wider shadow-md">
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span>VOLT VOICE AI • 62 INTENTS</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Your assistant. Always ready.
            </h2>
            {/* Seamless Voice AI Utterance Dialog */}
            <div className="bg-slate-950/95 border border-purple-500/30 p-4 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2.5 max-w-[48%]">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-xs text-slate-300 italic">"Find the best charging stop on my route."</div>
                </div>

                <div className="flex items-center gap-2.5 max-w-[50%] justify-end text-right">
                  <div className="text-xs text-emerald-300 font-semibold">"Charging stop optimized. 150 kW DC routed."</div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 07 & 08 — PARTNERS + OPERATIONS: Coexisting Dual Pillars (26.0s - 30.5s | p: 0.770 - 0.910) */}
        <div
          className="absolute top-[13%] sm:top-[16%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center will-change-transform max-w-2xl mx-auto"
          style={getStageStyle(progress, 0.770, 0.910, 0.025, 0.025)}
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-400 shadow-md">
              <Building2 className="w-3.5 h-3.5" />
              <span>PARTNERS + OPERATIONS = RELIABLE ECOSYSTEM</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Partners power it. Operations keep it moving.
            </h2>
            {/* Lightweight Floating Dual Cards (Partner + Admin Operations) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {/* CPO Partner Card */}
              <div className="bg-slate-950/95 border border-emerald-500/30 p-3.5 rounded-2xl shadow-lg space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Partner CPO Command
                  </span>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    LIVE SYNC
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[8px] font-mono text-slate-400 font-bold uppercase">Verified Hubs</div>
                    <div className="text-xs font-extrabold text-emerald-400 font-mono">8 Live</div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[8px] font-mono text-slate-400 font-bold uppercase">Total Power</div>
                    <div className="text-xs font-extrabold text-sky-400 font-mono">1,420 kW</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400">CPOs register stations, set tariffs, and verify telemetry.</div>
              </div>

              {/* Admin Operations Card */}
              <div className="bg-slate-950/95 border border-sky-500/30 p-3.5 rounded-2xl shadow-lg space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Admin Command Center
                  </span>
                  <span className="text-[9px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">
                    GOVERNANCE
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[8px] font-mono text-slate-400 font-bold uppercase">Stations</div>
                    <div className="text-xs font-extrabold text-sky-400 font-mono">1,766 Active</div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[8px] font-mono text-slate-400 font-bold uppercase">Uptime</div>
                    <div className="text-xs font-extrabold text-teal-400 font-mono">99.9% Health</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400">Central operations, verification, and audit logs.</div>
              </div>
            </div>
          </div>
        </div>

        {/* 09 — FINAL ECOSYSTEM CONVERGENCE (30.0s - 33.0s+ | p: 0.895 - 1.000) */}
        <div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-slate-950/90 will-change-transform overflow-y-auto"
          style={getStageStyle(progress, 0.895, 1.0, 0.025, 0.000)}
        >
          <div className="max-w-xl w-full space-y-3.5 bg-slate-900/95 border border-emerald-500/40 p-5 sm:p-6 rounded-3xl shadow-2xl my-auto">
            
            {/* Luminous Convergence Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] sm:text-[11px] font-mono font-extrabold uppercase tracking-widest">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>EVERYTHING CONNECTED</span>
            </div>

            <div className="space-y-0.5">
              <h2 className="font-heading text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                One ecosystem. Built for electric mobility.
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-300 font-medium">
                Vehicle • Driver • Voice AI • VoltTrip • VoltMap • Charging Network • Partners • Operations
              </p>
            </div>

            {/* 8-Node Converging Matrix */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { label: 'Vehicle', icon: Car, color: 'text-sky-400', border: 'border-sky-500/30' },
                { label: 'Driver', icon: User, color: 'text-teal-400', border: 'border-teal-500/30' },
                { label: 'Voice AI', icon: Mic, color: 'text-purple-400', border: 'border-purple-500/30' },
                { label: 'VoltTrip', icon: Route, color: 'text-emerald-400', border: 'border-emerald-500/30' },
                { label: 'VoltMap', icon: MapPin, color: 'text-sky-400', border: 'border-sky-500/30' },
                { label: 'Network', icon: Zap, color: 'text-amber-400', border: 'border-amber-500/30' },
                { label: 'Partners', icon: Building2, color: 'text-emerald-400', border: 'border-emerald-500/30' },
                { label: 'Operations', icon: ShieldCheck, color: 'text-cyan-400', border: 'border-cyan-500/30' },
              ].map((node, i) => {
                const Icon = node.icon;
                return (
                  <div key={i} className={`p-2 rounded-2xl bg-slate-950/80 border ${node.border} text-center space-y-0.5 shadow-sm hover:scale-105 transition-transform`}>
                    <Icon className={`w-3.5 h-3.5 mx-auto ${node.color}`} />
                    <div className="text-[9px] font-mono font-bold text-slate-300 truncate">{node.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Official Brand Identity Lockup */}
            <div className="pt-1 flex flex-col items-center gap-1">
              <VoltConnectLogo variant="navbar" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                The EV ecosystem, connected.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={onEnterApp}
                className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-extrabold text-xs sm:text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>ENTER VOLTCONNECT</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onStartJourney}
                className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-body font-bold text-xs border border-slate-700 hover:border-slate-600 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Plan Trip</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* GPU Hardware-accelerated CSS Keyframes */}
      <style>{`
        @keyframes roadDashAnim {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-60px, 0, 0); }
        }
        @keyframes wheelSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .will-change-transform {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

