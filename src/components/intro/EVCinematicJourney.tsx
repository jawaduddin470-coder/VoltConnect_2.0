import React from 'react';
import { UserVehicle } from '@/types';
import { VoltConnectLogo } from '@/components/common/VoltConnectLogo';
import {
  Battery,
  Zap,
  Navigation,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Car,
  Mic,
  User,
  Building2,
  Route,
  Activity,
  Layers,
  Radio,
} from 'lucide-react';

interface EVCinematicJourneyProps {
  progress: number; // 0.0 to 1.0 (across 18.5s total timeline)
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
  // Real vehicle data fallbacks with verified high-fidelity engineering defaults
  const vehicleName = activeVehicle
    ? `${activeVehicle.manufacturer} ${activeVehicle.model}`
    : 'Tata Nexon EV Long Range';
  const batterySOC = activeVehicle?.currentBatteryPercent ?? 85;
  const rangeKm = activeVehicle?.estimatedRangeKm ?? 345;
  const maxDCPower = activeVehicle?.dcMaxPowerKW ?? 60;
  const connectorType = activeVehicle?.connectorTypes?.[0] || 'CCS2';

  // =========================================================================
  // 9-SCENE ECOSYSTEM TIMELINE SEGMENTS (0.0 to 1.0 across 18.5 seconds)
  // Scene 1 (0.00 - 0.11 | ~0.0s - 2.0s): The Ecosystem Awakens ("One ecosystem. Every connection.")
  // Scene 2 (0.11 - 0.22 | ~2.0s - 4.0s): Connected Vehicle ("Your vehicle. Connected.")
  // Scene 3 (0.22 - 0.33 | ~4.0s - 6.1s): Intelligent Journey ("Your journey. Intelligent.")
  // Scene 4 (0.33 - 0.44 | ~6.1s - 8.1s): VoltMap / Charging Network ("Your network. Visible.")
  // Scene 5 (0.44 - 0.55 | ~8.1s - 10.1s): Smart Charging ("Your charge. Optimized.")
  // Scene 6 (0.55 - 0.66 | ~10.1s - 12.2s): Voice AI ("Your assistant. Always ready.")
  // Scene 7 (0.66 - 0.77 | ~12.2s - 14.2s): Partner / CPO Ecosystem ("Partners power the network.")
  // Scene 8 (0.77 - 0.88 | ~14.2s - 16.2s): Admin Command Center ("Operations keep it moving.")
  // Scene 9 (0.88 - 1.00 | ~16.2s - 18.5s+): The Complete Ecosystem ("Everything connected.")
  // =========================================================================

  // Dynamic Scene Visibility Triggers
  const showScene1 = progress >= 0.0 && progress < 0.11;
  const showScene2 = progress >= 0.11 && progress < 0.22;
  const showScene3 = progress >= 0.22 && progress < 0.33;
  const showScene4 = progress >= 0.33 && progress < 0.44;
  const showScene5 = progress >= 0.44 && progress < 0.55;
  const showScene6 = progress >= 0.55 && progress < 0.66;
  const showScene7 = progress >= 0.66 && progress < 0.77;
  const showScene8 = progress >= 0.77 && progress < 0.88;
  const showScene9 = progress >= 0.88;

  // Vehicle X-Position Motion Curve (Smooth entrance -> cruise -> deceleration into charging hub)
  let carXPercent = -15;
  let isBraking = false;

  if (progress < 0.11) {
    // Scene 1: Resting off-screen
    carXPercent = -15;
  } else if (progress < 0.22) {
    // Scene 2: Enters smoothly onto highway
    const p = (progress - 0.11) / (0.22 - 0.11);
    const easeOut = 1 - Math.pow(1 - p, 3);
    carXPercent = -15 + easeOut * 42; // -15% -> 27%
  } else if (progress < 0.44) {
    // Scenes 3 & 4: Cruising steadily along highway corridor
    const p = (progress - 0.22) / (0.44 - 0.22);
    carXPercent = 27 + p * 38; // 27% -> 65%
  } else if (progress < 0.52) {
    // Scene 5 early: Deceleration into charging bay & settling at parking spot
    isBraking = true;
    const p = (progress - 0.44) / (0.52 - 0.44);
    const easeOut = 1 - Math.pow(1 - p, 2);
    carXPercent = 65 + easeOut * 11; // 65% -> 76% (Stationary at charging hub)
  } else {
    // Scenes 5-9: Fully docked at charging hub
    carXPercent = 76;
  }

  // Conceptual Progressive Zoom Out Tracking
  let cameraScale = 1.0;
  let cameraY = 0;
  if (showScene1) {
    cameraScale = 1.02;
  } else if (showScene2 || showScene3) {
    cameraScale = 1.04;
  } else if (showScene4) {
    cameraScale = 0.98;
  } else if (showScene5) {
    cameraScale = 1.03;
  } else if (showScene6) {
    cameraScale = 1.0;
  } else if (showScene7 || showScene8) {
    cameraScale = 0.96;
  } else if (showScene9) {
    cameraScale = 1.0;
  }

  // Road Dash Animation Speed (Smooth deceleration when braking)
  const roadSpeedFactor = progress < 0.44 ? 1400 : Math.max(0, (0.52 - progress) / 0.08) * 1400;
  const roadDashOffset = (progress * roadSpeedFactor) % 60;

  // Dynamic Battery Top-Up Progression during Scene 5 (Smooth 85% -> 100%)
  let liveSOC = batterySOC;
  if (progress >= 0.46 && progress < 0.54) {
    const p = (progress - 0.46) / (0.54 - 0.46);
    liveSOC = Math.min(100, Math.round(batterySOC + p * (100 - batterySOC)));
  } else if (progress >= 0.54) {
    liveSOC = 100;
  }

  const isChargingConnected = progress >= 0.48;
  const isChargingActive = progress >= 0.48 && progress < 0.55;
  const isChargeComplete = progress >= 0.55;

  return (
    <div className="absolute inset-0 w-full h-full bg-[#030712] overflow-hidden select-none font-sans">
      
      {/* 1. ATMOSPHERIC DUSK ENVIRONMENT & DEPTH WRAPPER */}
      <div
        className="relative w-full h-full transition-transform duration-700 ease-out"
        style={{
          transform: `scale(${cameraScale}) translateY(${cameraY}px)`,
        }}
      >
        {/* Subtle Ambient Night Sky & Particle Refraction */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 inset-x-0 h-[65vh] bg-gradient-to-b from-[#02050E] via-[#081126] via-50% to-[#0D1E3D]" />
          
          {/* Horizon Ambient Mist & Luminous Energy Ray */}
          <div className="absolute top-[44%] inset-x-0 h-24 bg-gradient-to-b from-sky-500/10 via-teal-500/5 to-transparent blur-xl pointer-events-none" />

          {/* Distant Skyline / Mountain Vector Silhouette */}
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

        {/* 2. REALISTIC ASPHALT HIGHWAY SURFACE */}
        <div className="absolute top-[58%] inset-x-0 h-44 bg-gradient-to-b from-[#09101E] via-[#060C16] to-[#02050B] border-y border-slate-800/80 flex flex-col justify-center overflow-hidden">
          {/* Subtle Road Reflection Lane */}
          <div className="absolute inset-x-0 h-16 top-4 bg-gradient-to-r from-transparent via-sky-500/8 to-transparent blur-md" />

          {/* White Lane Markings */}
          <div className="relative w-full h-2 my-auto opacity-70">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: 'linear-gradient(to right, #94A3B8 55%, transparent 45%)',
                backgroundSize: '60px 100%',
                transform: `translateX(-${roadDashOffset}px)`,
              }}
            />
          </div>

          {/* Road Edge Boundaries */}
          <div className="absolute top-2.5 inset-x-0 h-px bg-slate-700/60" />
          <div className="absolute bottom-2.5 inset-x-0 h-px bg-slate-700/60" />
        </div>

        {/* 3. ULTRA-FAST CHARGING PEDESTAL HUB (Right Side Bay) */}
        <div className="absolute top-[42%] right-[10%] -translate-y-1/2 z-10 flex flex-col items-center">
          {/* Parking Bay Ground Markings */}
          <div className="absolute bottom-[-110px] right-[-20px] w-64 h-16 border-2 border-dashed border-emerald-500/30 rounded-2xl pointer-events-none transform -skew-x-12" />

          {/* Photorealistic EV Fast Charger Pedestal */}
          <svg width="90" height="155" viewBox="0 0 90 155" fill="none" className="drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]">
            <rect x="18" y="16" width="54" height="128" rx="12" fill="url(#pedestalBody)" stroke="#334155" strokeWidth="2" />
            <rect x="24" y="26" width="42" height="36" rx="8" fill="#020617" stroke="#1E293B" strokeWidth="1.5" />

            {/* Pedestal Digital Status Display */}
            <text x="45" y="44" fill="#38BDF8" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {isChargeComplete ? 'READY' : isChargingActive ? '150 kW' : isChargingConnected ? 'CONNECTED' : 'STANDBY'}
            </text>
            <text x="45" y="55" fill="#94A3B8" fontSize="7" fontFamily="monospace" textAnchor="middle">
              {isChargeComplete ? '100% SOH' : isChargingActive ? 'DC ULTRA' : 'DC FAST'}
            </text>

            {/* Glowing Status Indicator Strip */}
            <rect
              x="30"
              y="70"
              width="30"
              height="6"
              rx="3"
              fill={isChargeComplete ? '#10B981' : isChargingActive ? '#38BDF8' : isChargingConnected ? '#0EA5E9' : '#334155'}
              className={isChargingActive ? 'animate-pulse' : ''}
            />

            {/* Heavy-Duty Cable Dock */}
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

          {/* Heavy-Duty DC Charging Cable (Connects at Scene 5) */}
          {isChargingConnected && (
            <svg className="absolute top-[88px] right-[54px] w-40 h-14 overflow-visible pointer-events-none z-20">
              <path
                d="M 140 10 Q 70 38, 0 12"
                fill="none"
                stroke="#1E293B"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M 140 10 Q 70 38, 0 12"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className={isChargingActive ? 'animate-pulse' : ''}
              />
            </svg>
          )}
        </div>

        {/* 4. HIGH-PRECISION METALLIC EV VEHICLE SILHOUETTE */}
        <div
          className="absolute top-[50%] -translate-y-1/2 transition-all duration-75 ease-linear z-20"
          style={{ left: `${carXPercent}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="relative">
            {/* Ground Contact Shadow */}
            <div className="absolute bottom-[-10px] left-4 right-4 h-6 bg-black/95 blur-md rounded-full" />

            {/* LED Headlight Projector Beam */}
            <div className="absolute top-[42px] left-[175px] w-80 h-28 bg-gradient-to-r from-sky-400/30 via-sky-400/5 to-transparent clip-triangle blur-xs pointer-events-none transform -rotate-1" />

            {/* Chassis Underglow Reflection */}
            <div className="absolute bottom-0 left-10 right-10 h-2.5 bg-sky-400/35 blur-sm rounded-full" />

            {/* Vehicle Vector Rendering */}
            <svg width="220" height="96" viewBox="0 0 220 96" fill="none" className="drop-shadow-[0_20px_32px_rgba(0,0,0,0.9)]">
              <path
                d="M18 70 L42 36 C54 22, 88 16, 134 16 C165 16, 188 26, 206 48 L214 62 C218 67, 218 76, 212 78 L18 78 Z"
                fill="url(#cinematicCarBody)"
              />

              {/* Windshield & Cabin Glass Reflection */}
              <path d="M44 35 C56 22, 88 17, 132 17" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.85" />
              <path
                d="M58 33 C68 23, 95 21, 130 21 C150 21, 168 28, 178 38 L140 38 L70 38 Z"
                fill="#040914"
                stroke="#1E293B"
                strokeWidth="1.2"
              />
              <path d="M80 23 L124 23 L108 38 L70 38 Z" fill="white" fillOpacity="0.14" />

              {/* Dynamic Shoulder Line */}
              <path d="M30 60 L206 60" stroke="#0F172A" strokeWidth="1.5" />
              <path d="M84 60 L140 60" stroke="#38BDF8" strokeWidth="2.5" strokeOpacity="0.8" />

              {/* Front Crystalline LED Headlight */}
              <path d="M200 50 L216 60" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" className="drop-shadow-[0_0_12px_#38BDF8]" />

              {/* Rear LED Taillight Strip */}
              <path
                d="M16 60 L24 68"
                stroke={isBraking ? '#EF4444' : '#991B1B'}
                strokeWidth={isBraking ? '6' : '3.5'}
                strokeLinecap="round"
                className={isBraking ? 'drop-shadow-[0_0_14px_#EF4444]' : ''}
              />

              {/* Aero-Blade Alloy Wheels */}
              <g transform="translate(170, 70)">
                <circle r="16" fill="#040812" stroke="#334155" strokeWidth="2.5" />
                <circle r="8.5" fill="#1E293B" stroke="#0EA5E9" strokeWidth="1.5" />
                <line x1="-12" y1="0" x2="12" y2="0" stroke="#38BDF8" strokeWidth="1.5" style={{ animation: progress < 0.76 ? 'wheelSpin 0.25s linear infinite' : 'none' }} />
                <line x1="0" y1="-12" x2="0" y2="12" stroke="#38BDF8" strokeWidth="1.5" style={{ animation: progress < 0.76 ? 'wheelSpin 0.25s linear infinite' : 'none' }} />
              </g>

              <g transform="translate(52, 70)">
                <circle r="16" fill="#040812" stroke="#334155" strokeWidth="2.5" />
                <circle r="8.5" fill="#1E293B" stroke="#0EA5E9" strokeWidth="1.5" />
                <line x1="-12" y1="0" x2="12" y2="0" stroke="#38BDF8" strokeWidth="1.5" style={{ animation: progress < 0.76 ? 'wheelSpin 0.25s linear infinite' : 'none' }} />
                <line x1="0" y1="-12" x2="0" y2="12" stroke="#38BDF8" strokeWidth="1.5" style={{ animation: progress < 0.76 ? 'wheelSpin 0.25s linear infinite' : 'none' }} />
              </g>

              {/* Charging Port Port Indicator */}
              <circle cx="36" cy="58" r="4" fill={isChargingConnected ? '#10B981' : '#1E293B'} stroke="#38BDF8" strokeWidth="1.2" />

              <defs>
                <linearGradient id="cinematicCarBody" x1="0" y1="0" x2="220" y2="96" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0B132B" />
                  <stop offset="45%" stopColor="#1C2D4A" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
              </defs>
            </svg>

            {/* Vehicle Model Tag Pill */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700/60 text-[10px] font-mono text-slate-300 backdrop-blur-md shadow-md flex items-center gap-1.5">
              <Car className="w-3 h-3 text-sky-400" />
              <span>{vehicleName}</span>
            </div>
          </div>
        </div>

        {/* Spatial Radar Waves (Scene 4) */}
        {showScene4 && (
          <div className="absolute inset-0 pointer-events-none z-15 flex items-center justify-center">
            <div className="w-[500px] h-[500px] rounded-full border border-sky-500/20 animate-ping opacity-30" />
            <div className="w-[800px] h-[800px] rounded-full border border-teal-500/15 animate-ping opacity-20 [animation-delay:400ms]" />
          </div>
        )}

        {/* ================================================================= */}
        {/* 9-SCENE NARRATIVE OVERLAYS */}
        {/* ================================================================= */}

        {/* SCENE 1: THE ECOSYSTEM AWAKENS (0.0s - 2.0s) */}
        {showScene1 && (
          <div className="absolute top-[18%] sm:top-[22%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 flex flex-col items-center justify-center text-center animate-in fade-in duration-700 pointer-events-none">
            <div className="space-y-3.5 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/85 border border-sky-500/30 text-sky-400 text-xs font-mono font-bold tracking-widest uppercase shadow-lg shadow-sky-500/10">
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
        )}

        {/* SCENE 2: CONNECTED VEHICLE (2.0s - 4.0s) */}
        {showScene2 && (
          <div className="absolute top-[14%] sm:top-[18%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center animate-in fade-in slide-in-from-top-3 duration-500 pointer-events-none max-w-2xl mx-auto">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-sky-500/40 text-xs font-mono font-bold text-sky-400 backdrop-blur-md shadow-xl">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                <span>VEHICLE → VOLTCONNECT</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Your vehicle. Connected.
              </h2>
              {/* Telemetry HUD Cards */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap pt-1">
                <div className="bg-slate-950/90 border border-sky-500/30 backdrop-blur-md px-3.5 sm:px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 min-w-[130px]">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Battery className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-[9px] font-mono text-slate-400 font-bold uppercase">Battery SOC</div>
                    <div className="text-xs sm:text-sm font-extrabold text-white font-mono">{batterySOC}% • 98% SOH</div>
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-teal-500/30 backdrop-blur-md px-3.5 sm:px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 min-w-[130px]">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-[9px] font-mono text-slate-400 font-bold uppercase">Est. Range</div>
                    <div className="text-xs sm:text-sm font-extrabold text-white font-mono">{rangeKm} km</div>
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-emerald-500/30 backdrop-blur-md px-3.5 sm:px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 min-w-[130px]">
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
        )}

        {/* SCENE 3: INTELLIGENT JOURNEY (4.0s - 6.1s) */}
        {showScene3 && (
          <div className="absolute top-[14%] sm:top-[18%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center animate-in fade-in slide-in-from-top-3 duration-500 pointer-events-none max-w-xl mx-auto">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-teal-500/40 text-xs font-mono font-bold text-teal-300 backdrop-blur-md shadow-xl">
                <Route className="w-3.5 h-3.5" />
                <span>VOLTTRIP • CORRIDOR INTELLIGENCE</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Your journey. Intelligent.
              </h2>
              {/* Dynamic Route Corridor Bar */}
              <div className="bg-slate-950/90 border border-teal-500/30 backdrop-blur-xl p-4 sm:p-5 rounded-3xl shadow-2xl space-y-2.5">
                <div className="relative flex items-center justify-between px-2">
                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className="w-3 h-3 rounded-full bg-sky-400 border-2 border-white shadow-[0_0_10px_#38BDF8]" />
                    <span className="text-[9px] font-mono font-bold text-slate-300">Origin</span>
                  </div>

                  <div className="flex-1 h-1.5 mx-3 bg-slate-800 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-teal-400 to-amber-400 animate-pulse" />
                  </div>

                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_12px_#FBBF24] flex items-center justify-center text-[8px] text-slate-950 font-black">
                      ⚡
                    </div>
                    <span className="text-[9px] font-mono font-bold text-amber-300">150kW Stop</span>
                  </div>

                  <div className="flex-1 h-1.5 mx-3 bg-slate-800 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-teal-400 to-emerald-400 animate-pulse" />
                  </div>

                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-[0_0_10px_#10B981]" />
                    <span className="text-[9px] font-mono font-bold text-emerald-300">Destination</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-medium">
                  Sequential charging stops calculated with energy physics & safety reserve buffers.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 4: VOLTMAP / CHARGING NETWORK (6.1s - 8.1s) */}
        {showScene4 && (
          <div className="absolute top-[14%] sm:top-[18%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center animate-in fade-in zoom-in-95 duration-500 pointer-events-none max-w-2xl mx-auto">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-sky-500/40 text-xs font-mono font-bold text-sky-400 backdrop-blur-md shadow-xl">
                <MapPin className="w-3.5 h-3.5" />
                <span>VEHICLE → JOURNEY → CHARGING NETWORK</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Your network. Visible.
              </h2>
              {/* Verified Station Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-2xl mx-auto pt-1">
                <div className="bg-slate-950/90 border border-emerald-500/30 backdrop-blur-md p-3 rounded-2xl shadow-xl text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase">Tata Power Hub</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-xs font-bold text-white">150 kW DC Fast</div>
                  <div className="text-[10px] text-slate-400">4/4 Bays Available • CCS2</div>
                </div>

                <div className="bg-slate-950/90 border border-sky-500/30 backdrop-blur-md p-3 rounded-2xl shadow-xl text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-sky-400 uppercase">Jio-bp Pulse Hub</span>
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                  </div>
                  <div className="text-xs font-bold text-white">60 kW DC Rapid</div>
                  <div className="text-[10px] text-slate-400">Verified Active • CCS2</div>
                </div>

                <div className="bg-slate-950/90 border border-teal-500/30 backdrop-blur-md p-3 rounded-2xl shadow-xl text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-teal-400 uppercase">Relux Hyper Hub</span>
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                  </div>
                  <div className="text-xs font-bold text-white">120 kW Highway DC</div>
                  <div className="text-[10px] text-slate-400">24/7 Verified Access</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 5: SMART CHARGING (8.1s - 10.1s) */}
        {showScene5 && (
          <div className="absolute top-[14%] sm:top-[18%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center animate-in fade-in zoom-in-95 duration-500 pointer-events-none max-w-sm mx-auto">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-extrabold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 fill-current" /> CHARGING STOP OPTIMIZED
              </div>
              <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Your charge. Optimized.
              </h2>
              <div className="bg-slate-950/90 border border-emerald-500/40 backdrop-blur-xl p-5 rounded-3xl shadow-2xl space-y-3">
                <div className="text-xs sm:text-sm font-extrabold text-white">
                  Ultra-Fast DC Hub • Bay 02
                </div>
                {/* Battery Top-up bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-slate-400">Energy Delivered</span>
                    <span className="text-emerald-400 font-extrabold">{liveSOC}% SOC</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-200"
                      style={{ width: `${liveSOC}%` }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Sufficient energy added to comfortably reach your destination.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 6: VOICE AI (10.1s - 12.2s) */}
        {showScene6 && (
          <div className="absolute top-[14%] sm:top-[18%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center animate-in fade-in zoom-in-95 duration-500 pointer-events-none max-w-lg mx-auto">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-sky-500/40 text-xs font-mono font-bold text-sky-400 backdrop-blur-md shadow-xl">
                <Sparkles className="w-3.5 h-3.5" />
                <span>VOICE AI • 62 INTENTS</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Your assistant. Always ready.
              </h2>
              {/* Futuristic Voice Dialogue Bubble */}
              <div className="bg-slate-950/90 border border-sky-500/30 backdrop-blur-xl p-4 sm:p-5 rounded-3xl shadow-2xl space-y-3 text-left">
                {/* User Voice Utterance */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <Mic className="w-4 h-4 text-sky-400 animate-pulse" />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium max-w-xs">
                    <span className="text-[9px] font-mono text-slate-400 block mb-0.5 font-bold uppercase">DRIVER</span>
                    "Find the best charging stop on my route."
                  </div>
                </div>

                {/* Voice AI Response */}
                <div className="flex items-start gap-3 justify-end">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-sky-950/80 to-teal-950/80 border border-sky-500/40 text-xs text-white font-medium max-w-xs text-right">
                    <span className="text-[9px] font-mono text-sky-400 block mb-0.5 font-bold uppercase">VOLTCONNECT AI</span>
                    "Charging stop optimized. 150 kW DC fast hub routed with 24% reserve buffer."
                  </div>
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 7: PARTNER / CPO ECOSYSTEM (12.2s - 14.2s) */}
        {showScene7 && (
          <div className="absolute top-[14%] sm:top-[18%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center animate-in fade-in zoom-in-95 duration-500 pointer-events-none max-w-xl mx-auto">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-400 backdrop-blur-md shadow-xl">
                <Building2 className="w-3.5 h-3.5" />
                <span>CPO PARTNER NETWORK</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Partners power the network.
              </h2>
              {/* Partner Portal Glass Card */}
              <div className="bg-slate-950/90 border border-emerald-500/30 backdrop-blur-xl p-4 sm:p-5 rounded-3xl shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-xs">
                      P
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Partner CPO Command</div>
                      <div className="text-[9px] text-slate-400">Charging Infrastructure Management</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold uppercase">
                    Live Sync Active
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-left">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[9px] font-mono text-slate-400 font-bold uppercase">Verified Hubs</div>
                    <div className="text-sm font-extrabold text-emerald-400 font-mono">8 Live</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[9px] font-mono text-slate-400 font-bold uppercase">Review Status</div>
                    <div className="text-sm font-extrabold text-amber-400 font-mono">1 Pending</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[9px] font-mono text-slate-400 font-bold uppercase">Total Power</div>
                    <div className="text-sm font-extrabold text-sky-400 font-mono">1,420 kW</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Partners submit stations, track verification approval, and manage network reliability.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 8: ADMIN COMMAND CENTER (14.2s - 16.2s) */}
        {showScene8 && (
          <div className="absolute top-[14%] sm:top-[18%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 text-center animate-in fade-in zoom-in-95 duration-500 pointer-events-none max-w-xl mx-auto">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-sky-500/40 text-xs font-mono font-bold text-sky-400 backdrop-blur-md shadow-xl">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ADMIN OPERATIONS LAYER</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Operations keep it moving.
              </h2>
              {/* Admin Command Center Glass Card */}
              <div className="bg-slate-950/90 border border-sky-500/30 backdrop-blur-xl p-4 sm:p-5 rounded-3xl shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-extrabold text-xs">
                      A
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Admin Command Center</div>
                      <div className="text-[9px] text-slate-400">Centralized Ecosystem Governance</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>OPERATIONAL STREAM</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-mono font-bold">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-sky-300">
                    <MapPin className="w-3 h-3 mx-auto mb-0.5 text-sky-400" />
                    1,766 Stations
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300">
                    <Building2 className="w-3 h-3 mx-auto mb-0.5 text-emerald-400" />
                    Partner Audit
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-teal-300">
                    <Car className="w-3 h-3 mx-auto mb-0.5 text-teal-400" />
                    Vehicle Catalog
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-purple-300">
                    <Activity className="w-3 h-3 mx-auto mb-0.5 text-purple-400" />
                    Health 99.9%
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  End-to-end verification, fleet diagnostics, and immutable audit logs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 9: THE COMPLETE ECOSYSTEM (16.2s - 18.5s+) */}
        {showScene9 && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-700 pointer-events-auto overflow-y-auto">
            <div className="max-w-xl w-full space-y-4 bg-slate-900/90 border border-emerald-500/40 p-5 sm:p-7 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] my-auto">
              
              {/* Luminous Convergence Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-mono font-extrabold uppercase tracking-widest shadow-glow-volt">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>EVERYTHING CONNECTED</span>
              </div>

              <div className="space-y-1">
                <h2 className="font-heading text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                  One ecosystem. Built for electric mobility.
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-300 font-medium">
                  Vehicle • Driver • Voice AI • VoltTrip • VoltMap • Charging Network • Partners • Operations
                </p>
              </div>

              {/* 8-Node Converging Matrix */}
              <div className="grid grid-cols-4 gap-2 pt-1">
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
                    <div key={i} className={`p-2 rounded-2xl bg-slate-950/80 border ${node.border} text-center space-y-1 shadow-md hover:scale-105 transition-transform`}>
                      <Icon className={`w-4 h-4 mx-auto ${node.color}`} />
                      <div className="text-[9px] font-mono font-bold text-slate-300 truncate">{node.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Official Brand Identity Lockup */}
              <div className="pt-2 flex flex-col items-center gap-1.5">
                <VoltConnectLogo variant="navbar" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                  The EV ecosystem, connected.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  onClick={onEnterApp}
                  className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-extrabold text-xs sm:text-sm tracking-wide shadow-lg hover:shadow-glow-volt transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
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

      <style>{`
        @keyframes wheelSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
