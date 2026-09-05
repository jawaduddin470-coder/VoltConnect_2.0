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
  progress: number; // 0.0 to 1.0 (across 23.5s controlled cinematic timeline)
  activeVehicle?: UserVehicle | null;
  onStartJourney: () => void;
  onEnterApp: () => void;
}

export type StoryStage =
  | 'INTRO'
  | 'VEHICLE'
  | 'JOURNEY'
  | 'NETWORK'
  | 'CHARGING'
  | 'VOICE_AI'
  | 'PARTNERS'
  | 'OPERATIONS'
  | 'FINAL';

interface StageTiming {
  id: StoryStage;
  start: number; // seconds
  end: number;   // seconds
}

// Strictly partitioned timeline: Exactly 23.5s total duration (target 22-24s)
const TOTAL_DURATION_SEC = 23.5;

const STAGES: StageTiming[] = [
  { id: 'INTRO', start: 0.0, end: 2.0 },
  { id: 'VEHICLE', start: 2.0, end: 4.5 },
  { id: 'JOURNEY', start: 4.5, end: 7.0 },
  { id: 'NETWORK', start: 7.0, end: 9.0 },
  { id: 'CHARGING', start: 9.0, end: 16.7 },
  { id: 'VOICE_AI', start: 16.7, end: 18.7 },
  { id: 'PARTNERS', start: 18.7, end: 20.3 },
  { id: 'OPERATIONS', start: 20.3, end: 21.9 },
  { id: 'FINAL', start: 21.9, end: 24.0 },
];

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

  // Current elapsed seconds on the master timeline
  const currentTime = Math.max(0, Math.min(TOTAL_DURATION_SEC, progress * TOTAL_DURATION_SEC));

  // Determine current active story stage (strictly ONE active stage at any millisecond)
  const activeStageObj =
    STAGES.find((s) => currentTime >= s.start && currentTime < s.end) ||
    (currentTime >= 21.9 ? STAGES[8] : STAGES[0]);
  const activeStage = activeStageObj.id;

  // Single card lifecycle: 280ms enter, stable hold, 200ms exit (ABSOLUTELY ZERO OVERLAP)
  const tau = currentTime - activeStageObj.start;
  const stageDuration = activeStageObj.end - activeStageObj.start;
  let cardOpacity = 1;
  let cardTranslateY = 0;

  if (activeStage === 'FINAL') {
    const r = Math.min(1, Math.max(0, tau / 0.35));
    cardOpacity = r;
    cardTranslateY = (1 - r) * 10;
  } else {
    if (tau < 0.28) {
      // Clean 280ms entrance
      const r = tau / 0.28;
      cardOpacity = Math.max(0, Math.min(1, r));
      cardTranslateY = (1 - r) * 10;
    } else if (tau > stageDuration - 0.20) {
      // Clean 200ms exit
      const r = (stageDuration - tau) / 0.20;
      cardOpacity = Math.max(0, Math.min(1, r));
      cardTranslateY = -(1 - r) * 8;
    } else {
      // Completely stable hold
      cardOpacity = 1;
      cardTranslateY = 0;
    }
  }

  // =========================================================================
  // VEHICLE MOVEMENT: Slow, smooth, physically grounded across the 23.5s story
  // =========================================================================
  let carXvw = -18;
  let isBraking = false;
  let isCarStopped = false;
  let isDeparting = false;
  let roadAnim = 'none';
  let wheelAnim = 'none';

  if (currentTime < 2.0) {
    // 01 INTRO: Resting offscreen
    carXvw = -18;
    roadAnim = 'none';
    wheelAnim = 'none';
  } else if (currentTime < 4.5) {
    // 02 VEHICLE: Enters smoothly onto highway (cubic-bezier ease-out, calm driving speed)
    const u = (currentTime - 2.0) / 2.5;
    const ease = 1 - Math.pow(1 - u, 3);
    carXvw = -18 + ease * 34; // -18vw -> 16vw
    roadAnim = 'roadDashAnim 1.0s linear infinite';
    wheelAnim = 'wheelSpin 0.8s linear infinite';
  } else if (currentTime < 7.0) {
    // 03 JOURNEY: Cruising steadily along highway corridor
    const u = (currentTime - 4.5) / 2.5;
    carXvw = 16 + u * 16; // 16vw -> 32vw
    roadAnim = 'roadDashAnim 1.0s linear infinite';
    wheelAnim = 'wheelSpin 0.8s linear infinite';
  } else if (currentTime < 9.0) {
    // 04 NETWORK: Cruising steadily as charging network appears
    const u = (currentTime - 7.0) / 2.0;
    carXvw = 32 + u * 16; // 32vw -> 48vw
    roadAnim = 'roadDashAnim 1.0s linear infinite';
    wheelAnim = 'wheelSpin 0.8s linear infinite';
  } else if (currentTime < 10.0) {
    // 05 CHARGING: Approach charger, decelerate smoothly (velocity -> 0)
    isBraking = true;
    const u = (currentTime - 9.0) / 1.7;
    const ease = 1 - Math.pow(1 - u, 2.2);
    carXvw = 48 + ease * 17; // 48vw -> 65vw
    roadAnim = 'roadDashAnim 2.0s linear infinite'; // Visibly slowing down
    wheelAnim = 'wheelSpin 1.8s linear infinite';
  } else if (currentTime < 16.3) {
    // 05 CHARGING: Complete stop at charging pedestal during 80% -> 100% -> READY
    carXvw = 65;
    isCarStopped = true;
    roadAnim = 'none'; // Completely stationary
    wheelAnim = 'none';
  } else if (currentTime < 16.7) {
    // 05 CHARGING: Smooth acceleration departure (0.4s)
    isDeparting = true;
    const u = (currentTime - 16.3) / 0.4;
    carXvw = 65 + Math.pow(u, 2) * 12; // 65vw -> 77vw
    roadAnim = 'roadDashAnim 1.2s linear infinite';
    wheelAnim = 'wheelSpin 1.0s linear infinite';
  } else {
    // 06-09: Anchored in view on right side of the highway with headlights illuminating the scene
    carXvw = 77;
    roadAnim = 'roadDashAnim 1.0s linear infinite';
    wheelAnim = 'wheelSpin 0.8s linear infinite';
  }

  // Pure hardware state flags
  const isMoving = (currentTime >= 2.0 && currentTime < 10.0) || currentTime >= 16.3;
  const isChargingConnected = currentTime >= 10.7 && currentTime < 16.3;

  // =========================================================================
  // ⚡ 05 CHARGING WOW MOMENT: Distinct 80% -> 84% -> 88% -> 92% -> 96% -> 100%
  // =========================================================================
  let liveSOC = 80;
  let chargingPhase: 'APPROACH' | 'STOP' | 'CONNECT' | '80_84' | '84_88' | '88_92' | '92_96' | '96_100' | 'HOLD_100' | 'READY' | 'DEPART' = 'APPROACH';

  if (currentTime < 9.0) {
    liveSOC = 80;
    chargingPhase = 'APPROACH';
  } else if (currentTime < 10.0) {
    chargingPhase = 'APPROACH';
    liveSOC = 80;
  } else if (currentTime < 10.7) {
    chargingPhase = 'STOP';
    liveSOC = 80;
  } else if (currentTime < 11.2) {
    chargingPhase = 'CONNECT';
    liveSOC = 80;
  } else if (currentTime < 12.0) {
    chargingPhase = '80_84';
    const u = (currentTime - 11.2) / 0.8;
    liveSOC = Math.min(84, Math.round(80 + u * 4));
  } else if (currentTime < 12.8) {
    chargingPhase = '84_88';
    const u = (currentTime - 12.0) / 0.8;
    liveSOC = Math.min(88, Math.round(84 + u * 4));
  } else if (currentTime < 13.6) {
    chargingPhase = '88_92';
    const u = (currentTime - 12.8) / 0.8;
    liveSOC = Math.min(92, Math.round(88 + u * 4));
  } else if (currentTime < 14.4) {
    chargingPhase = '92_96';
    const u = (currentTime - 13.6) / 0.8;
    liveSOC = Math.min(96, Math.round(92 + u * 4));
  } else if (currentTime < 15.3) {
    chargingPhase = '96_100';
    const u = (currentTime - 14.4) / 0.9;
    liveSOC = Math.min(100, Math.round(96 + u * 4));
  } else if (currentTime < 15.9) {
    chargingPhase = 'HOLD_100';
    liveSOC = 100;
  } else if (currentTime < 16.3) {
    chargingPhase = 'READY';
    liveSOC = 100;
  } else {
    chargingPhase = 'DEPART';
    liveSOC = 100;
  }

  const isChargingActive = currentTime >= 11.2 && currentTime < 15.3;
  const isChargeComplete = currentTime >= 15.3;

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

          {/* Heavy-Duty DC Charging Cable (Connects at 10.7s, detaches at 16.3s) */}
          {isChargingConnected && (
            <svg className="absolute top-[88px] right-[54px] w-40 h-14 overflow-visible pointer-events-none z-20">
              <path d="M 140 10 Q 70 38, 0 12" fill="none" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" />
              <path
                d="M 140 10 Q 70 38, 0 12"
                fill="none"
                stroke={isChargeComplete ? '#10B981' : '#38BDF8'}
                strokeWidth={isChargingActive ? '3' : '2'}
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
        {/* 5. SINGLE MASTER STORY CARD SLOT — ABSOLUTELY ZERO CARD OVERLAP */}
        {/* At any millisecond, EXACTLY ONE card is mounted in the DOM slot */}
        {/* ================================================================= */}
        {activeStage !== 'FINAL' && (
          <div
            className="absolute top-[12%] sm:top-[15%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center will-change-transform max-w-2xl mx-auto"
            style={{
              opacity: cardOpacity,
              transform: `translate3d(0, ${cardTranslateY.toFixed(1)}px, 0)`,
              transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
            }}
          >
            {/* 01 — INTRO (0.0s – 2.0s) */}
            {activeStage === 'INTRO' && (
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
            )}

            {/* 02 — VEHICLE (2.0s – 4.5s) */}
            {activeStage === 'VEHICLE' && (
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
            )}

            {/* 03 — JOURNEY (4.5s – 7.0s) */}
            {activeStage === 'JOURNEY' && (
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
            )}

            {/* 04 — NETWORK (7.0s – 9.0s) */}
            {activeStage === 'NETWORK' && (
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
            )}

            {/* ⚡ 05 — CHARGING WOW MOMENT (9.0s – 16.7s, ~7.5s) */}
            {activeStage === 'CHARGING' && (
              <div className="space-y-3">
                {/* Status Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-extrabold uppercase tracking-wider shadow-md">
                  <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
                  <span>
                    {chargingPhase === 'READY'
                      ? 'READY TO DEPART • 100% SOH'
                      : chargingPhase === 'HOLD_100'
                      ? 'CHARGE COMPLETE • 100% SOH'
                      : isChargingActive
                      ? '⚡ ULTRA-FAST DC CHARGING ACTIVE'
                      : chargingPhase === 'CONNECT'
                      ? 'CHARGER CONNECTED • 150 kW DC'
                      : chargingPhase === 'STOP'
                      ? 'ALIGNED IN CHARGING BAY 02'
                      : 'APPROACHING CHARGING BAY'}
                  </span>
                </div>

                <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {chargingPhase === 'READY'
                    ? 'READY TO DEPART'
                    : isChargeComplete
                    ? 'Fully charged. Ready for the road.'
                    : isChargingActive
                    ? 'Your charge. Accelerated.'
                    : chargingPhase === 'CONNECT'
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
                        {chargingPhase === 'READY'
                          ? 'READY'
                          : isChargeComplete
                          ? 'Ready to Depart'
                          : isChargingActive
                          ? '150 kW DC Ultra Fast'
                          : 'Connecting Protocol'}
                      </span>
                    </div>

                    <div className="text-right text-emerald-400 font-bold">
                      {isChargeComplete ? '425 km Full Range Restored' : '+18 km / min'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 06 — VOICE AI (16.7s – 18.7s) */}
            {activeStage === 'VOICE_AI' && (
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
            )}

            {/* 07 — PARTNERS (18.7s – 20.3s) */}
            {activeStage === 'PARTNERS' && (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-400 shadow-md">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>CPO PARTNER ECOSYSTEM</span>
                </div>
                <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Partners power the network.
                </h2>
                <div className="bg-slate-950/95 border border-emerald-500/30 p-4 rounded-2xl shadow-lg space-y-2 max-w-md mx-auto text-left">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Partner CPO Command
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      LIVE SYNC
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[8px] font-mono text-slate-400 font-bold uppercase">Verified Hubs</div>
                      <div className="text-xs font-extrabold text-emerald-400 font-mono">8 Live</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[8px] font-mono text-slate-400 font-bold uppercase">Total Power</div>
                      <div className="text-xs font-extrabold text-sky-400 font-mono">1,420 kW</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 text-center">CPOs register stations, set tariffs, and monitor telemetry.</div>
                </div>
              </div>
            )}

            {/* 08 — OPERATIONS (20.3s – 21.9s) */}
            {activeStage === 'OPERATIONS' && (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-sky-500/40 text-xs font-mono font-bold text-sky-400 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ADMIN COMMAND CENTER</span>
                </div>
                <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Operations keep it moving.
                </h2>
                <div className="bg-slate-950/95 border border-sky-500/30 p-4 rounded-2xl shadow-lg space-y-2 max-w-md mx-auto text-left">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Central Operations
                    </span>
                    <span className="text-[9px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">
                      GOVERNANCE
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[8px] font-mono text-slate-400 font-bold uppercase">Stations</div>
                      <div className="text-xs font-extrabold text-sky-400 font-mono">1,766 Active</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[8px] font-mono text-slate-400 font-bold uppercase">Uptime</div>
                      <div className="text-xs font-extrabold text-teal-400 font-mono">99.9% Health</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 text-center">Central operations, verification, and network audit logs.</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* 6. FINAL CLIMAX ECOSYSTEM REVEAL (21.9s – 24.0s+) */}
        {/* ================================================================= */}
        {activeStage === 'FINAL' && (
          <div
            className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-slate-950/90 will-change-transform overflow-y-auto"
            style={{
              opacity: cardOpacity,
              transform: `translate3d(0, ${cardTranslateY.toFixed(1)}px, 0)`,
              transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
            }}
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
        )}

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

