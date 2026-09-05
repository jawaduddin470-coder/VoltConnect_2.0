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
  progress: number; // 0.0 to 1.0 (across 8.0s total timeline)
  activeVehicle?: UserVehicle | null;
  onStartJourney: () => void;
  onEnterApp: () => void;
}

// GPU-accelerated smooth overlapping transition helper (cubic-bezier easing)
function getStageStyle(
  progress: number,
  startP: number,
  endP: number,
  fadeP = 0.025
): React.CSSProperties {
  if (progress < startP - fadeP || progress > endP + fadeP) {
    return { display: 'none', opacity: 0, pointerEvents: 'none' };
  }
  let opacity = 1;
  let translateY = 0;
  if (progress < startP) {
    const r = (progress - (startP - fadeP)) / fadeP;
    opacity = Math.max(0, Math.min(1, r));
    translateY = (1 - r) * 8;
  } else if (progress > endP) {
    const r = (progress - endP) / fadeP;
    opacity = Math.max(0, Math.min(1, 1 - r));
    translateY = -r * 6;
  }
  return {
    opacity,
    transform: `translate3d(0, ${translateY.toFixed(1)}px, 0)`,
    transition: 'opacity 0.15s cubic-bezier(0.22, 1, 0.36, 1), transform 0.15s cubic-bezier(0.22, 1, 0.36, 1)',
    pointerEvents: opacity > 0.8 ? 'auto' : 'none',
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
  const batterySOC = activeVehicle?.currentBatteryPercent ?? 85;
  const rangeKm = activeVehicle?.estimatedRangeKm ?? 345;
  const maxDCPower = activeVehicle?.dcMaxPowerKW ?? 60;
  const connectorType = activeVehicle?.connectorTypes?.[0] || 'CCS2';

  // =========================================================================
  // CONTINUOUS 6-STAGE CINEMATIC TIMELINE (0.0 to 1.0 across 8.0 seconds)
  // Stage 1 (0.0s - 1.0s | p: 0.00 - 0.125): OPENING ("One ecosystem. Every connection.")
  // Stage 2 (1.0s - 2.0s | p: 0.125 - 0.25): VEHICLE ("Your vehicle. Connected.")
  // Stage 3 (2.0s - 3.2s | p: 0.25 - 0.40): JOURNEY + NETWORK ("Your journey & network. Intelligent.")
  // Stage 4 (3.2s - 4.4s | p: 0.40 - 0.55): CHARGING + VOICE AI ("Your charge & assistant. Optimized.")
  // Stage 5 (4.4s - 5.5s | p: 0.55 - 0.69): PARTNERS + OPERATIONS ("Partners & operations. Powered.")
  // Stage 6 (5.5s - 8.0s | p: 0.69 - 1.00): FINAL ECOSYSTEM ("One ecosystem. Built for electric mobility.")
  // =========================================================================

  // Continuous Vehicle X-Position Motion Curve (translate3d in vw units for GPU acceleration)
  let carXvw = -15;
  let isBraking = false;

  if (progress < 0.10) {
    // Stage 1: Resting offscreen
    carXvw = -15;
  } else if (progress < 0.25) {
    // Stage 2: Enters smoothly onto highway
    const pNorm = (progress - 0.10) / (0.25 - 0.10);
    const easeOut = 1 - Math.pow(1 - pNorm, 3);
    carXvw = -15 + easeOut * 37; // -15vw -> 22vw
  } else if (progress < 0.40) {
    // Stage 3: Cruises along highway during journey & network reveal
    const pNorm = (progress - 0.25) / (0.40 - 0.25);
    carXvw = 22 + pNorm * 26; // 22vw -> 48vw
  } else if (progress < 0.50) {
    // Stage 4 early: Deceleration into charging bay
    isBraking = true;
    const pNorm = (progress - 0.40) / (0.50 - 0.40);
    const easeOut = 1 - Math.pow(1 - pNorm, 2);
    carXvw = 48 + easeOut * 24; // 48vw -> 72vw (settles at charging pedestal)
  } else {
    // Stages 4-6: Docked at charging hub as visual anchor throughout
    carXvw = 72;
  }

  // Pure hardware state flags
  const isMoving = progress >= 0.10 && progress < 0.48;
  const isChargingConnected = progress >= 0.45;
  const isChargingActive = progress >= 0.45 && progress < 0.54;
  const isChargeComplete = progress >= 0.54;

  // Dynamic Battery Top-Up Progression during Stage 4 (Smooth 85% -> 100%)
  let liveSOC = batterySOC;
  if (progress >= 0.44 && progress < 0.53) {
    const pNorm = (progress - 0.44) / (0.53 - 0.44);
    liveSOC = Math.min(100, Math.round(batterySOC + pNorm * (100 - batterySOC)));
  } else if (progress >= 0.53) {
    liveSOC = 100;
  }

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
          {/* Lane Markings (Pure CSS Composited Keyframes - 0 Layout Reflows) */}
          <div className="relative w-full h-2 my-auto opacity-70 overflow-hidden">
            <div
              className="w-[200%] h-full will-change-transform"
              style={{
                backgroundImage: 'linear-gradient(to right, #94A3B8 55%, transparent 45%)',
                backgroundSize: '60px 100%',
                animation: isMoving ? 'roadDashAnim 0.35s linear infinite' : 'none',
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
            <text x="45" y="44" fill="#38BDF8" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {isChargeComplete ? 'READY' : isChargingActive ? '150 kW' : isChargingConnected ? 'CONNECTED' : 'STANDBY'}
            </text>
            <text x="45" y="55" fill="#94A3B8" fontSize="7" fontFamily="monospace" textAnchor="middle">
              {isChargeComplete ? '100% SOH' : isChargingActive ? 'DC ULTRA' : 'DC FAST'}
            </text>

            {/* Status Indicator Strip */}
            <rect
              x="30"
              y="70"
              width="30"
              height="6"
              rx="3"
              fill={isChargeComplete ? '#10B981' : isChargingActive ? '#38BDF8' : isChargingConnected ? '#0EA5E9' : '#334155'}
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

          {/* Heavy-Duty DC Charging Cable (Connects at Stage 4) */}
          {isChargingConnected && (
            <svg className="absolute top-[88px] right-[54px] w-40 h-14 overflow-visible pointer-events-none z-20">
              <path d="M 140 10 Q 70 38, 0 12" fill="none" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" />
              <path d="M 140 10 Q 70 38, 0 12" fill="none" stroke="#10B981" strokeWidth="2.5" strokeDasharray="6 4" />
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
              <path
                d="M16 60 L24 68"
                stroke={isBraking ? '#EF4444' : '#991B1B'}
                strokeWidth={isBraking ? '6' : '3.5'}
                strokeLinecap="round"
              />

              {/* Wheels with pure CSS Composited Keyframe Spin */}
              <g transform="translate(170, 70)">
                <circle r="16" fill="#040812" stroke="#334155" strokeWidth="2.5" />
                <circle r="8.5" fill="#1E293B" stroke="#0EA5E9" strokeWidth="1.5" />
                <g style={{ animation: isMoving ? 'wheelSpin 0.3s linear infinite' : 'none', transformOrigin: '0 0' }}>
                  <line x1="-12" y1="0" x2="12" y2="0" stroke="#38BDF8" strokeWidth="1.5" />
                  <line x1="0" y1="-12" x2="0" y2="12" stroke="#38BDF8" strokeWidth="1.5" />
                </g>
              </g>

              <g transform="translate(52, 70)">
                <circle r="16" fill="#040812" stroke="#334155" strokeWidth="2.5" />
                <circle r="8.5" fill="#1E293B" stroke="#0EA5E9" strokeWidth="1.5" />
                <g style={{ animation: isMoving ? 'wheelSpin 0.3s linear infinite' : 'none', transformOrigin: '0 0' }}>
                  <line x1="-12" y1="0" x2="12" y2="0" stroke="#38BDF8" strokeWidth="1.5" />
                  <line x1="0" y1="-12" x2="0" y2="12" stroke="#38BDF8" strokeWidth="1.5" />
                </g>
              </g>

              {/* Charging Port */}
              <circle cx="36" cy="58" r="4" fill={isChargingConnected ? '#10B981' : '#1E293B'} stroke="#38BDF8" strokeWidth="1.2" />

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
        {/* STREAMLINED 6-STAGE CONTINUOUS OVERLAYS */}
        {/* ================================================================= */}

        {/* STAGE 1: OPENING (0.0s - 1.0s | p: 0.00 - 0.125) */}
        <div
          className="absolute top-[18%] sm:top-[22%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 flex flex-col items-center justify-center text-center will-change-transform max-w-xl mx-auto"
          style={getStageStyle(progress, 0.0, 0.125)}
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

        {/* STAGE 2: VEHICLE (1.0s - 2.0s | p: 0.125 - 0.25) */}
        <div
          className="absolute top-[14%] sm:top-[18%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center will-change-transform max-w-2xl mx-auto"
          style={getStageStyle(progress, 0.125, 0.25)}
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-sky-500/40 text-xs font-mono font-bold text-sky-400 shadow-md">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
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

        {/* STAGE 3: JOURNEY + NETWORK (2.0s - 3.2s | p: 0.25 - 0.40) */}
        <div
          className="absolute top-[13%] sm:top-[16%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center will-change-transform max-w-2xl mx-auto"
          style={getStageStyle(progress, 0.25, 0.40)}
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-teal-500/40 text-xs font-mono font-bold text-teal-300 shadow-md">
              <Route className="w-3.5 h-3.5" />
              <span>VOLTTRIP + VOLTMAP • 1,766 STATIONS</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Your journey & network. Intelligent.
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
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-white flex items-center justify-center text-[8px] text-slate-950 font-black">
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
            </div>

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

        {/* STAGE 4: CHARGING + VOICE AI (3.2s - 4.4s | p: 0.40 - 0.55) */}
        <div
          className="absolute top-[13%] sm:top-[16%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center will-change-transform max-w-xl mx-auto"
          style={getStageStyle(progress, 0.40, 0.55)}
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-extrabold uppercase tracking-wider shadow-md">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>SMART CHARGING • 62 VOICE INTENTS</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Your charge & assistant. Optimized.
            </h2>
            {/* Integrated Charging Meter + Voice AI Dialogue Morph */}
            <div className="bg-slate-950/95 border border-emerald-500/30 p-4 rounded-2xl shadow-xl space-y-3">
              {/* Battery Top-Up Strip */}
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-slate-300">Ultra-Fast DC Bay 02 • Connected</span>
                <span className="text-emerald-400 font-extrabold">{liveSOC}% SOC</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-150"
                  style={{ width: `${liveSOC}%` }}
                />
              </div>

              {/* Seamless Voice AI Utterance */}
              <div className="border-t border-slate-800/80 pt-2.5 flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2 max-w-[48%]">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <Mic className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="text-[10px] text-slate-300 italic">"Find the best charging stop on my route."</div>
                </div>

                <div className="flex items-center gap-2 max-w-[50%] justify-end text-right">
                  <div className="text-[10px] text-emerald-300 font-semibold">"Charging stop optimized. 150 kW DC routed."</div>
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STAGE 5: PARTNERS + OPERATIONS (4.4s - 5.5s | p: 0.55 - 0.69) */}
        <div
          className="absolute top-[13%] sm:top-[16%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center will-change-transform max-w-2xl mx-auto"
          style={getStageStyle(progress, 0.55, 0.69)}
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-400 shadow-md">
              <Building2 className="w-3.5 h-3.5" />
              <span>PARTNERS + OPERATIONS = RELIABLE ECOSYSTEM</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Partners & operations. Powered.
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

        {/* STAGE 6: FINAL ECOSYSTEM CONVERGENCE (5.5s - 8.0s | p: 0.69 - 1.00) */}
        <div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-slate-950/90 will-change-transform overflow-y-auto"
          style={getStageStyle(progress, 0.69, 1.0, 0.03)}
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

