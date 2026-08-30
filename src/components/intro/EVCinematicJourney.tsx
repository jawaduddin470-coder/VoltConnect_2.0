import React from 'react';
import { VoltConnectLogo } from '@/components/common/VoltConnectLogo';
import { MapPin, Navigation, Activity, Zap, CheckCircle2, ShieldCheck, Cpu, Battery } from 'lucide-react';

interface EVCinematicJourneyProps {
  progress: number; // 0.0 to 1.0 across 13.5s total timeline
}

export const EVCinematicJourney: React.FC<EVCinematicJourneyProps> = ({ progress }) => {
  // TIMELINE & MILESTONE MAP (Total 13.5s)
  // Phase 1 (0.0s - 1.0s | 0.00 - 0.07): DRIVE (Night road, vehicle enters left -> right, no cards)
  // Phase 2 (1.0s - 2.5s | 0.07 - 0.18): FIND (FIND card appears while driving; exits by 2.3s)
  // Phase 3 (2.5s - 4.0s | 0.18 - 0.30): CONNECT (CONNECT card appears while approaching charger; exits by 3.8s)
  // Phase 4 (4.0s - 5.5s | 0.30 - 0.41): OPTIMIZE BEFORE ARRIVAL (OPTIMIZE card appears BEFORE arrival; exits by 5.4s)
  // Phase 5 (5.5s - 6.4s | 0.41 - 0.47): ARRIVAL (Car enters bay & settles into position at 6.0s; charger STANDBY)
  // Phase 6 (6.4s - 7.0s | 0.47 - 0.52): CONNECT TO CHARGER (Charger STANDBY -> CONNECTED; CONNECTED badge)
  // Phase 7 (7.0s - 9.2s | 0.52 - 0.68): CHARGING HERO MOMENT (150 kW DC FAST -> Smooth progress 85% -> 92% -> 100% COMPLETE)
  // Phase 8 (9.2s - 11.5s | 0.68 - 0.85): BREATHING PAUSE & JOURNEY READY CONFIRMATION (9.8s - 11.5s: JOURNEY READY confirmation)
  // Phase 9 (11.5s - 12.5s | 0.85 - 0.92): BRAND SUMMARY (DRIVE -> FIND -> CONNECT -> OPTIMIZE -> CHARGE -> JOURNEY READY)
  // Phase 10 (12.5s - 13.5s | 0.92 - 1.00): FINAL BRAND REVEAL (Approved VOLTCONNECT 2.0 Logo & Tagline)

  // 1. Vehicle Physical X Position & Movement State
  let carXPercent = 0;
  let isBraking = false;

  if (progress < 0.07) {
    // 0.0s - 1.0s: Vehicle enters scene
    const p = progress / 0.07;
    carXPercent = -10 + p * 20; // -10% -> 10%
  } else if (progress < 0.41) {
    // 1.0s - 5.5s: Continuous forward drive towards charger (Driving during FIND, CONNECT, OPTIMIZE)
    const p = (progress - 0.07) / (0.41 - 0.07);
    carXPercent = 10 + p * 58; // 10% -> 68%
  } else if (progress < 0.47) {
    // 5.5s - 6.4s: Deceleration into charging bay & settling at parking position (6.0s)
    isBraking = true;
    const p = (progress - 0.41) / (0.47 - 0.41);
    const easeOut = 1 - Math.pow(1 - p, 2);
    carXPercent = 68 + easeOut * 8; // 68% -> 76% (Parks at charger)
  } else {
    // 6.4s+: VEHICLE IS FULLY PARKED & STATIONARY AT CHARGER
    carXPercent = 76;
  }

  // 2. Camera Viewport Scale & Tracking Offset
  let cameraZoom = 1.0;
  let cameraXOffset = 0;

  if (progress >= 0.47 && progress < 0.68) {
    const p = (progress - 0.47) / (0.68 - 0.47);
    cameraZoom = 1.0 + Math.sin(p * Math.PI) * 0.05;
    cameraXOffset = -(p * 2.5);
  } else if (progress >= 0.68 && progress < 0.72) {
    const p = (progress - 0.68) / (0.72 - 0.68);
    cameraZoom = 1.05 - p * 0.05;
  }

  // 3. STRICT NON-OVERLAPPING TEMPORAL CARD & STATE TRIGGERS
  const showFindCard = progress >= 0.07 && progress < 0.18;       // 1.0s - 2.5s (Phase 2: FIND)
  const showConnectCard = progress >= 0.18 && progress < 0.30;    // 2.5s - 4.0s (Phase 3: CONNECT)
  const showOptimizeCard = progress >= 0.30 && progress < 0.41;   // 4.0s - 5.5s (Phase 4: OPTIMIZE BEFORE ARRIVAL)
  const isChargingConnected = progress >= 0.47;                    // 6.4s+: Connected at charger
  const showConnectedBadge = progress >= 0.47 && progress < 0.52;   // 6.4s - 7.0s (Phase 6: CONNECTED BADGE)
  const isChargingActive = progress >= 0.52 && progress < 0.68;   // 7.0s - 9.2s (Phase 7: CHARGING HERO MOMENT)
  const isChargeComplete = progress >= 0.68;                       // 9.2s+: 100% Charge Complete State
  const showChargeCard = progress >= 0.52 && progress < 0.68;     // 7.0s - 9.2s (Phase 7: CHARGE CARD)
  
  // Phase 8: Journey Ready Confirmation Card (9.8s - 11.5s)
  const showJourneyReadyCard = progress >= 0.72 && progress < 0.85; 

  const showBrandSummary = progress >= 0.85 && progress < 0.92;   // 11.5s - 12.5s (Phase 9: BRAND SUMMARY)
  const showLogoReveal = progress >= 0.92;                         // 12.5s - 13.5s (Phase 10: LOGO REVEAL)

  // Environmental parallax speed
  const roadDashOffset = (progress * 1600) % 60;

  // Dynamic Battery charging percentage calculation (Smooth progression 85% -> 92% -> 100%)
  let chargingPercent = 85;
  if (progress >= 0.52 && progress < 0.68) {
    const p = (progress - 0.52) / (0.68 - 0.52);
    chargingPercent = Math.min(100, Math.floor(85 + p * 15));
  } else if (progress >= 0.68) {
    chargingPercent = 100;
  }

  return (
    <div className="absolute inset-0 w-full h-full bg-[#02050E] overflow-hidden select-none font-sans">
      
      {/* GLOBAL SCENE WRAPPER WITH SMOOTH CAMERA TRACKING */}
      <div
        className="relative w-full h-full transition-transform duration-300 ease-out"
        style={{
          transform: `scale(${cameraZoom}) translateX(${cameraXOffset}%)`,
        }}
      >
        
        {/* 1. REALISTIC DUSK ENVIRONMENT & HORIZON */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Real Dusk Twilight Sky Gradient */}
          <div className="absolute top-0 inset-x-0 h-[62vh] bg-gradient-to-b from-[#02040A] via-[#081022] via-45% to-[#0E1E3B]" />
          
          {/* Soft Horizon Ambient Line */}
          <div className="absolute top-[42%] inset-x-0 h-16 bg-gradient-to-b from-sky-500/10 via-amber-500/5 to-transparent blur-md" />

          {/* Distant Realistic City & Mountain Silhouette */}
          <div className="absolute top-[38%] inset-x-0 h-[24vh] opacity-35">
            <svg width="1920" height="200" viewBox="0 0 1920 200" fill="none" className="w-full h-full object-cover">
              <path d="M0 200 L0 140 L80 140 L80 100 L140 100 L140 160 L240 160 L240 90 L320 90 L320 200 Z" fill="#0A1428" />
              <path d="M320 200 L320 110 L400 110 L400 70 L480 70 L480 130 L580 130 L580 200 Z" fill="#0D1A33" />
              <path d="M600 200 L600 120 L680 120 L680 85 L760 85 L760 200 Z" fill="#0A1428" />
              <path d="M800 200 L800 80 L900 80 L900 150 L980 150 L980 200 Z" fill="#0D1A33" />
              <path d="M1020 200 L1020 100 L1100 100 L1100 60 L1180 60 L1180 140 L1280 140 L1280 200 Z" fill="#0A1428" />
              <path d="M1320 200 L1320 90 L1420 90 L1420 160 L1520 160 L1520 200 Z" fill="#0D1A33" />
              <path d="M1560 200 L1560 75 L1660 75 L1660 120 L1760 120 L1760 200 Z" fill="#0A1428" />
              <path d="M1800 200 L1800 110 L1920 110 L1920 200 Z" fill="#0D1A33" />
            </svg>
          </div>

          {/* Roadside Streetlights with Soft Cones */}
          <div className="absolute top-[38%] left-[25%] w-1.5 h-36 bg-slate-800/80 rounded-full">
            <div className="absolute -top-1 -left-2 w-5 h-2 bg-slate-700 rounded-full" />
            <div className="absolute top-0 -left-6 w-14 h-48 bg-gradient-to-b from-amber-200/15 via-amber-200/5 to-transparent blur-md pointer-events-none clip-triangle" />
          </div>
          <div className="absolute top-[38%] left-[62%] w-1.5 h-36 bg-slate-800/80 rounded-full">
            <div className="absolute -top-1 -left-2 w-5 h-2 bg-slate-700 rounded-full" />
            <div className="absolute top-0 -left-6 w-14 h-48 bg-gradient-to-b from-amber-200/15 via-amber-200/5 to-transparent blur-md pointer-events-none clip-triangle" />
          </div>

          {/* Horizon Divider */}
          <div className="absolute top-[60%] inset-x-0 h-px bg-gradient-to-r from-transparent via-[#38BDF8]/25 to-transparent" />
        </div>

        {/* 2. REALISTIC ASPHALT ROAD & LANE MARKINGS */}
        <div className="absolute top-[60%] inset-x-0 h-40 bg-gradient-to-b from-[#0B1220] via-[#070D18] to-[#03060D] border-y border-slate-800/80 flex flex-col justify-center overflow-hidden">
          
          {/* Fine Asphalt Grain Overlay */}
          <div className="absolute inset-0 bg-slate-950/20" />

          {/* Road Reflection Lane */}
          <div className="absolute inset-x-0 h-12 top-6 bg-gradient-to-r from-transparent via-sky-500/5 to-transparent blur-sm" />

          {/* White Lane Dashes */}
          <div className="relative w-full h-2 my-auto opacity-75">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: 'linear-gradient(to right, #94A3B8 60%, transparent 40%)',
                backgroundSize: '60px 100%',
                transform: `translateX(-${roadDashOffset}px)`,
              }}
            />
          </div>

          {/* Road Edge Lines */}
          <div className="absolute top-3 inset-x-0 h-px bg-slate-700/60" />
          <div className="absolute bottom-3 inset-x-0 h-px bg-slate-700/60" />
        </div>

        {/* 3. CHARGING HUB PEDESTAL & CONNECTOR CABLE */}
        <div className="absolute top-[44%] right-[12%] -translate-y-1/2 z-10 flex flex-col items-center">
          
          {/* Parking Bay Markings */}
          <div className="absolute bottom-[-95px] right-[-30px] w-64 h-16 border-2 border-dashed border-emerald-500/30 rounded-xl pointer-events-none transform -skew-x-12" />

          {/* Photorealistic Industrial Charging Station Pedestal */}
          <svg width="90" height="150" viewBox="0 0 90 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_16px_32px_rgba(0,0,0,0.9)]">
            <rect x="18" y="16" width="54" height="124" rx="12" fill="url(#pedestalBody)" stroke="#334155" strokeWidth="2" />
            <rect x="24" y="26" width="42" height="34" rx="8" fill="#020617" stroke="#1E293B" strokeWidth="1.5" />

            {/* Pedestal Digital Status Screen (STANDBY -> CONNECTED -> 150 kW -> COMPLETE) */}
            <text x="45" y="44" fill="#38BDF8" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {isChargeComplete ? 'COMPLETE' : isChargingActive ? '150 kW' : isChargingConnected ? 'CONNECTED' : 'STANDBY'}
            </text>
            <text x="45" y="54" fill="#94A3B8" fontSize="7" fontFamily="monospace" textAnchor="middle">
              {isChargeComplete ? '100% READY' : isChargingActive ? 'DC FAST' : 'READY'}
            </text>

            {/* LED Status Indicator Bar */}
            <rect x="30" y="68" width="30" height="6" rx="3" fill={isChargeComplete ? '#10B981' : isChargingActive ? '#38BDF8' : isChargingConnected ? '#0EA5E9' : '#334155'} className={isChargingActive ? 'animate-pulse' : ''} />

            {/* Cable Dock */}
            <rect x="10" y="85" width="10" height="28" rx="4" fill="#1E293B" stroke="#334155" />
            <path d="M15 113 Q15 138, 5 145" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" fill="none" />

            <defs>
              <linearGradient id="pedestalBody" x1="0" y1="0" x2="90" y2="150" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="50%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </defs>
          </svg>

          {/* Heavy-Duty Physical Charging Cable (Attaches at 6.4s) */}
          {isChargingConnected && (
            <svg className="absolute top-[85px] right-[54px] w-36 h-12 overflow-visible pointer-events-none z-20">
              <path
                d="M 140 10 Q 70 35, 0 12"
                fill="none"
                stroke="#1E293B"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M 140 10 Q 70 35, 0 12"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className={isChargingActive ? 'animate-pulse' : ''}
              />
            </svg>
          )}
        </div>

        {/* 4. REAL-WORLD AUTOMOTIVE EV VEHICLE */}
        <div
          className="absolute top-[52%] -translate-y-1/2 transition-all duration-75 ease-linear z-20"
          style={{ left: `${carXPercent}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="relative">
            
            {/* Ground Shadow */}
            <div className="absolute bottom-[-8px] left-4 right-4 h-5 bg-black/90 blur-md rounded-full" />

            {/* Front LED Headlight Beam Projection */}
            <div className="absolute top-[42px] left-[175px] w-72 h-24 bg-gradient-to-r from-sky-400/25 via-sky-400/5 to-transparent clip-triangle blur-xs pointer-events-none transform -rotate-1" />

            {/* Chassis Underglow Reflection */}
            <div className="absolute bottom-0 left-10 right-10 h-2 bg-sky-400/30 blur-sm rounded-full" />

            {/* Premium Metallic EV Vector Rendering */}
            <svg width="210" height="92" viewBox="0 0 210 92" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_16px_28px_rgba(0,0,0,0.85)]">
              <path
                d="M18 68 L40 35 C52 22, 85 16, 130 16 C160 16, 182 26, 198 46 L206 60 C210 65, 210 74, 204 76 L18 76 Z"
                fill="url(#realCarBody)"
              />

              <path d="M42 34 C54 22, 85 17, 128 17" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.8" />

              <path
                d="M56 32 C66 22, 92 20, 126 20 C146 20, 162 27, 172 37 L135 37 L68 37 Z"
                fill="#040914"
                stroke="#1E293B"
                strokeWidth="1.2"
              />
              <path d="M78 22 L120 22 L105 37 L68 37 Z" fill="white" fillOpacity="0.12" />

              <path d="M28 58 L198 58" stroke="#0F172A" strokeWidth="1.5" />
              <path d="M80 58 L135 58" stroke="#38BDF8" strokeWidth="2" strokeOpacity="0.7" />

              <path d="M192 48 L208 58" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" className="drop-shadow-[0_0_10px_#38BDF8]" />

              <path
                d="M16 58 L24 66"
                stroke={isBraking ? '#EF4444' : '#991B1B'}
                strokeWidth={isBraking ? '6' : '3.5'}
                strokeLinecap="round"
                className={isBraking ? 'drop-shadow-[0_0_12px_#EF4444]' : ''}
              />

              {/* Wheels (Spin during movement < 5.5s, stationary when parked >= 5.5s) */}
              <g transform="translate(162, 68)">
                <circle r="15" fill="#040812" stroke="#334155" strokeWidth="2.5" />
                <circle r="8" fill="#1E293B" stroke="#0EA5E9" strokeWidth="1.5" />
                <line x1="-11" y1="0" x2="11" y2="0" stroke="#38BDF8" strokeWidth="1.5" style={{ animation: progress < 0.47 ? 'wheelSpin 0.3s linear infinite' : 'none' }} />
                <line x1="0" y1="-11" x2="0" y2="11" stroke="#38BDF8" strokeWidth="1.5" style={{ animation: progress < 0.47 ? 'wheelSpin 0.3s linear infinite' : 'none' }} />
              </g>

              <g transform="translate(50, 68)">
                <circle r="15" fill="#040812" stroke="#334155" strokeWidth="2.5" />
                <circle r="8" fill="#1E293B" stroke="#0EA5E9" strokeWidth="1.5" />
                <line x1="-11" y1="0" x2="11" y2="0" stroke="#38BDF8" strokeWidth="1.5" style={{ animation: progress < 0.47 ? 'wheelSpin 0.3s linear infinite' : 'none' }} />
                <line x1="0" y1="-11" x2="0" y2="11" stroke="#38BDF8" strokeWidth="1.5" style={{ animation: progress < 0.47 ? 'wheelSpin 0.3s linear infinite' : 'none' }} />
              </g>

              <circle cx="34" cy="56" r="3.5" fill={isChargingConnected ? '#10B981' : '#1E293B'} stroke="#38BDF8" strokeWidth="1" />

              <defs>
                <linearGradient id="realCarBody" x1="0" y1="0" x2="210" y2="92" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0B132B" />
                  <stop offset="45%" stopColor="#1C2D4A" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
              </defs>
            </svg>

          </div>
        </div>

        {/* 5. PHASE 2: FIND • VOLTMAP (1.0s - 2.5s | Appears while driving; exits before CONNECT) */}
        <div
          className={`absolute top-[26%] left-[28%] -translate-x-1/2 transition-all duration-350 ease-out z-30 pointer-events-none ${
            showFindCard ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
          }`}
        >
          <div className="bg-slate-950/85 border border-sky-500/30 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl space-y-1 max-w-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400" />
              <span className="text-[10px] font-extrabold uppercase text-sky-400 font-mono tracking-widest">FIND • VOLTMAP</span>
            </div>
            <div className="text-xs font-bold text-white">
              1,771+ Charging Hubs • 703 Cities
            </div>
          </div>
        </div>

        {/* 6. PHASE 3: CONNECT • VOLTTRIP (2.5s - 4.0s | Appears while STILL approaching charger; exits before OPTIMIZE) */}
        <div
          className={`absolute top-[26%] left-[46%] -translate-x-1/2 transition-all duration-350 ease-out z-30 pointer-events-none ${
            showConnectCard ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
          }`}
        >
          <div className="bg-slate-950/85 border border-teal-500/30 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl space-y-1 max-w-xs">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-teal-400" />
              <span className="text-[10px] font-extrabold uppercase text-teal-400 font-mono tracking-widest">CONNECT • VOLTTRIP</span>
            </div>
            <div className="text-xs font-bold text-white">
              Route-Aware Journey Planning
            </div>
          </div>
        </div>

        {/* 7. PHASE 4: OPTIMIZE • VOLT AI + VOLT HEALTH (4.0s - 5.5s | Appears BEFORE arrival while car still driving & charger STANDBY; exits completely by 5.4s) */}
        <div
          className={`absolute top-[22%] left-[58%] -translate-x-1/2 transition-all duration-350 ease-out z-30 pointer-events-none ${
            showOptimizeCard ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
          }`}
        >
          <div className="bg-slate-950/90 border border-sky-500/30 backdrop-blur-md p-4 rounded-3xl shadow-2xl space-y-2 max-w-xs text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-mono font-extrabold uppercase">
              <Cpu className="w-3.5 h-3.5" /> OPTIMIZE
            </div>
            <div className="text-xs font-extrabold text-white">
              VOLT AI + VOLT HEALTH
            </div>
            <div className="text-[11px] font-mono text-slate-300 flex items-center justify-center gap-2 pt-0.5">
              <span>VEHICLE</span> • <span>BATTERY</span> • <span>ROUTE</span> • <span>CHARGER</span>
            </div>
          </div>
        </div>

        {/* 8. PHASE 6: CONNECTED BADGE (6.4s - 7.0s | Activates when plug attaches at charger) */}
        <div
          className={`absolute top-[26%] left-[72%] -translate-x-1/2 transition-all duration-350 ease-out z-30 pointer-events-none ${
            showConnectedBadge ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
          }`}
        >
          <div className="bg-slate-950/90 border border-emerald-500/40 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-extrabold text-emerald-400 font-mono tracking-wider uppercase">CONNECTED</span>
          </div>
        </div>

        {/* 9. PHASE 7: CHARGING HERO MOMENT & 100% PROGRESS (7.0s - 9.2s | Pure isolated physical charging action — smooth progression to 100%) */}
        <div
          className={`absolute top-[26%] left-[70%] -translate-x-1/2 transition-all duration-350 ease-out z-30 pointer-events-none ${
            showChargeCard ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
          }`}
        >
          <div className="bg-slate-950/85 border border-emerald-500/30 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl space-y-1.5 max-w-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 font-mono tracking-widest flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-current" /> CHARGE
              </span>
              <span className="text-xs font-extrabold text-emerald-400 font-mono">{chargingPercent}%</span>
            </div>
            <div className="w-36 bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${chargingPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 10. PHASE 8: JOURNEY READY CONFIRMATION MESSAGE (9.8s - 11.5s | Centered, polished success state) */}
        <div
          className={`absolute top-[24%] left-[50%] -translate-x-1/2 transition-all duration-500 ease-out z-30 pointer-events-none ${
            showJourneyReadyCard ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
          }`}
        >
          <div className="bg-slate-950/90 border border-emerald-500/40 backdrop-blur-xl p-5 sm:p-6 rounded-3xl shadow-2xl space-y-2.5 text-center max-w-xs sm:max-w-sm">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-extrabold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>✓ JOURNEY READY</span>
            </div>
            <h2 className="font-heading text-lg sm:text-xl font-extrabold text-white tracking-tight">
              READY FOR THE ROAD.
            </h2>
            <div className="text-xs font-mono text-slate-300 font-bold flex items-center justify-center gap-2 pt-1 border-t border-slate-800">
              <span className="text-emerald-400">Charged</span> • <span className="text-sky-400">Connected</span> • <span className="text-teal-400">Optimized</span>
            </div>
          </div>
        </div>

      </div>

      {/* 11. PHASE 9: BRAND SUMMARY (11.5s - 12.5s) */}
      {showBrandSummary && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="text-center space-y-3 font-mono">
            <div className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-extrabold text-slate-300 tracking-[0.18em] flex-wrap px-4">
              <span className="text-sky-400">DRIVE</span>
              <span>↓</span>
              <span className="text-teal-400">FIND</span>
              <span>↓</span>
              <span className="text-emerald-400">CONNECT</span>
              <span>↓</span>
              <span className="text-sky-300">OPTIMIZE</span>
              <span>↓</span>
              <span className="text-amber-400">CHARGE</span>
              <span>↓</span>
              <span className="text-emerald-400">JOURNEY READY</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-white tracking-wider">
              VOLTCONNECT 2.0
            </div>
          </div>
        </div>
      )}

      {/* 12. PHASE 10: FINAL APPROVED LOGO REVEAL (12.5s - 13.5s) */}
      {showLogoReveal && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#02050E] animate-in fade-in duration-700">
          <div className="relative z-10 text-center space-y-4 max-w-sm px-4">
            
            {/* Approved VoltConnect Logo Component */}
            <div className="transform transition-transform duration-700 hover:scale-[1.01]">
              <VoltConnectLogo variant="intro" />
            </div>

            <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
              <div className="text-[11px] font-extrabold font-mono uppercase tracking-[0.2em] text-sky-400">
                VOLTCONNECT 2.0
              </div>
              <p className="text-xs text-slate-400 font-medium">
                ELECTRIC MOBILITY, CONNECTED.
              </p>
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
