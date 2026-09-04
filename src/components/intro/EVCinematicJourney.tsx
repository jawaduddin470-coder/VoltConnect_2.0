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
} from 'lucide-react';

interface EVCinematicJourneyProps {
  progress: number; // 0.0 to 1.0 (across 11.0s total timeline)
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
  // TIMELINE SEGMENTS (0.0 to 1.0 across 11.0 seconds)
  // Scene 1 (0.00 - 0.16 | 0.0s - 1.8s): Silence / Arrival ("Every journey starts with a decision.")
  // Scene 2 (0.16 - 0.35 | 1.8s - 3.8s): The Vehicle (EV silhouette emerges, headlight beams cast)
  // Scene 3 (0.35 - 0.55 | 3.8s - 6.0s): Vehicle Intelligence (Live Battery, Range, Charging HUD Overlays)
  // Scene 4 (0.55 - 0.72 | 6.0s - 8.0s): Journey Planning ("Where are you going?" + Dynamic Route Corridor)
  // Scene 5 (0.72 - 0.86 | 8.0s - 9.5s): Smart Charging (Bay Docking, Cable Glow, 85% -> 100% Charge)
  // Scene 6 (0.86 - 1.00 | 9.5s - 11.0s+): Journey Ready Climax & Interactive Action
  // =========================================================================

  // Dynamic Scene Visibility Triggers
  const showScene1 = progress >= 0.0 && progress < 0.18;
  const showScene2 = progress >= 0.16 && progress < 0.38;
  const showScene3 = progress >= 0.35 && progress < 0.56;
  const showScene4 = progress >= 0.55 && progress < 0.74;
  const showScene5 = progress >= 0.72 && progress < 0.88;
  const showScene6 = progress >= 0.86;

  // Vehicle X-Position Motion Curve (Smooth ease in -> Drive -> Deceleration -> Park at Charger)
  let carXPercent = -15;
  let isBraking = false;

  if (progress < 0.16) {
    carXPercent = -15;
  } else if (progress < 0.36) {
    // 1.8s - 4.0s: Smooth entry onto highway
    const p = (progress - 0.16) / (0.36 - 0.16);
    const easeOut = 1 - Math.pow(1 - p, 3);
    carXPercent = -15 + easeOut * 45; // -15% -> 30%
  } else if (progress < 0.72) {
    // 4.0s - 8.0s: Cruising steadily along highway corridor
    const p = (progress - 0.36) / (0.72 - 0.36);
    carXPercent = 30 + p * 38; // 30% -> 68%
  } else if (progress < 0.80) {
    // 8.0s - 8.8s: Deceleration into charging bay & settling at parking spot
    isBraking = true;
    const p = (progress - 0.72) / (0.80 - 0.72);
    const easeOut = 1 - Math.pow(1 - p, 2);
    carXPercent = 68 + easeOut * 8; // 68% -> 76% (Stationary at charging hub)
  } else {
    // 8.8s+: Fully docked at charging hub
    carXPercent = 76;
  }

  // Camera Zoom & Pan tracking
  let cameraScale = 1.0;
  let cameraY = 0;
  if (showScene1) {
    cameraScale = 1.02;
  } else if (showScene5) {
    cameraScale = 1.04;
  } else if (showScene6) {
    cameraScale = 1.0;
  }

  // Road Dash Animation Speed (Smooth deceleration when braking)
  const roadSpeedFactor = progress < 0.72 ? 1400 : Math.max(0, (0.80 - progress) / 0.08) * 1400;
  const roadDashOffset = (progress * roadSpeedFactor) % 60;

  // Dynamic Battery Top-Up Progression during Scene 5 (Smooth 85% -> 100%)
  let liveSOC = batterySOC;
  if (progress >= 0.74 && progress < 0.86) {
    const p = (progress - 0.74) / (0.86 - 0.74);
    liveSOC = Math.min(100, Math.round(batterySOC + p * (100 - batterySOC)));
  } else if (progress >= 0.86) {
    liveSOC = 100;
  }

  const isChargingConnected = progress >= 0.76;
  const isChargingActive = progress >= 0.76 && progress < 0.86;
  const isChargeComplete = progress >= 0.86;

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

        {/* ================================================================= */}
        {/* SCENE OVERLAYS (STRICT PROGRESSION) */}
        {/* ================================================================= */}

        {/* SCENE 01: SILENCE / ARRIVAL (0.0s - 1.8s) */}
        {showScene1 && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 pointer-events-none">
            <div className="space-y-3 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-sky-400 text-xs font-mono font-bold tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5" /> VOLTCONNECT 2.0
              </div>
              <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Every journey starts with a decision.
              </h1>
              <p className="text-sm sm:text-base text-slate-400 font-medium">
                Intelligent EV mobility, connected and prepared.
              </p>
            </div>
          </div>
        )}

        {/* SCENE 02: THE VEHICLE (1.8s - 3.8s) */}
        {showScene2 && (
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 z-30 text-center animate-in fade-in slide-in-from-top-3 duration-500 pointer-events-none">
            <div className="bg-slate-950/85 border border-sky-500/30 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl inline-flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <div className="text-xs sm:text-sm font-bold text-white tracking-wide">
                <span>VEHICLE TELEMETRY ONLINE</span> • <span className="text-sky-400">{vehicleName}</span>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 03: VEHICLE INTELLIGENCE HUD OVERLAYS (3.8s - 6.0s) */}
        {showScene3 && (
          <div className="absolute top-[18%] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 flex items-center justify-center gap-3 sm:gap-4 flex-wrap max-w-2xl animate-in fade-in zoom-in-95 duration-500 pointer-events-none">
            {/* Battery Telemetry Card */}
            <div className="bg-slate-950/90 border border-sky-500/30 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 min-w-[150px]">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Battery className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Battery SOC</div>
                <div className="text-sm font-extrabold text-white font-mono">{batterySOC}% • 98% SOH</div>
              </div>
            </div>

            {/* Estimated Real Range Card */}
            <div className="bg-slate-950/90 border border-teal-500/30 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 min-w-[150px]">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Est. Range</div>
                <div className="text-sm font-extrabold text-white font-mono">{rangeKm} km</div>
              </div>
            </div>

            {/* Fast Charging Capability Card */}
            <div className="bg-slate-950/90 border border-emerald-500/30 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 min-w-[150px]">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Max Fast Charge</div>
                <div className="text-sm font-extrabold text-white font-mono">{maxDCPower} kW • {connectorType}</div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 04: JOURNEY PLANNING CORRIDOR (6.0s - 8.0s) */}
        {showScene4 && (
          <div className="absolute top-[16%] left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 text-center animate-in fade-in slide-in-from-top-4 duration-500 pointer-events-none">
            <div className="bg-slate-950/90 border border-sky-500/40 backdrop-blur-xl p-5 rounded-3xl shadow-2xl space-y-3">
              <div className="text-xs font-mono font-extrabold text-sky-400 tracking-widest uppercase flex items-center justify-center gap-2">
                <Navigation className="w-4 h-4" /> WHERE ARE YOU GOING?
              </div>
              
              {/* Dynamic Route Corridor Bar */}
              <div className="relative flex items-center justify-between pt-2 px-2">
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-3.5 h-3.5 rounded-full bg-sky-400 border-2 border-white shadow-[0_0_10px_#38BDF8]" />
                  <span className="text-[10px] font-mono font-bold text-slate-300">Origin</span>
                </div>

                {/* Animated Glowing Corridor Path */}
                <div className="flex-1 h-1.5 mx-3 bg-slate-800 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 animate-pulse" />
                </div>

                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_12px_#FBBF24] flex items-center justify-center text-[9px] text-slate-950 font-bold">
                    ⚡
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-300">150kW Stop</span>
                </div>

                <div className="flex-1 h-1.5 mx-3 bg-slate-800 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-emerald-400 to-sky-400 animate-pulse" />
                </div>

                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-[0_0_10px_#10B981]" />
                  <span className="text-[10px] font-mono font-bold text-emerald-300">Destination</span>
                </div>
              </div>

              <div className="text-xs text-slate-300 font-medium pt-1">
                VoltTrip corridor analyzer calculating safe sequential stops...
              </div>
            </div>
          </div>
        )}

        {/* SCENE 05: SMART CHARGING INTELLIGENCE (8.0s - 9.5s) */}
        {showScene5 && (
          <div className="absolute top-[18%] left-1/2 -translate-x-1/2 z-30 text-center animate-in fade-in zoom-in-95 duration-500 pointer-events-none max-w-sm px-4">
            <div className="bg-slate-950/90 border border-emerald-500/40 backdrop-blur-xl p-5 rounded-3xl shadow-2xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-extrabold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 fill-current" /> CHARGING STOP OPTIMIZED
              </div>

              <div className="text-sm font-extrabold text-white">
                Ultra-Fast DC Hub • Bay 02
              </div>

              {/* Real-time Charging Meter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-slate-400">Battery Level</span>
                  <span className="text-emerald-400 font-extrabold">{liveSOC}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-200"
                    style={{ width: `${liveSOC}%` }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-300 font-medium">
                Sufficient energy added to comfortably reach final destination.
              </p>
            </div>
          </div>
        )}

        {/* SCENE 06: JOURNEY READY CLIMAX & INTERACTIVE PAYOFF (9.5s - 11.0s+) */}
        {showScene6 && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-600 pointer-events-auto">
            <div className="max-w-md w-full space-y-5 bg-slate-900/90 border border-emerald-500/40 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)]">
              
              {/* Luminous Journey Ready Climax Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-extrabold uppercase tracking-widest shadow-glow-volt">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>✓ JOURNEY READY</span>
              </div>

              <div className="space-y-1.5">
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Your journey. Intelligently ready.
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  Vehicle calibrated • Route verified • Charging secured
                </p>
              </div>

              {/* Key Journey Summary Badges */}
              <div className="grid grid-cols-2 gap-2.5 text-left pt-1">
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
                  <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Available Range</div>
                  <div className="text-sm font-extrabold text-white font-mono">{rangeKm} km</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
                  <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Target Battery</div>
                  <div className="text-sm font-extrabold text-emerald-400 font-mono">100% SOC</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
                  <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Charging Stops</div>
                  <div className="text-sm font-extrabold text-white font-mono">1 Optimized</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
                  <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Safety Readiness</div>
                  <div className="text-sm font-extrabold text-teal-400 font-mono">100/100 READY</div>
                </div>
              </div>

              {/* Primary Call to Action Buttons */}
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
                  className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-body font-bold text-xs border border-slate-700 hover:border-slate-600 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Enter App</span>
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
