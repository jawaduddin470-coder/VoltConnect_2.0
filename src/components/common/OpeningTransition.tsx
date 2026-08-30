import React, { useEffect, useState } from 'react';
import { LogoFull } from '@/assets/LogoFull';
import { LogoCompact } from '@/assets/LogoCompact';
import { Zap, FastForward } from 'lucide-react';

interface OpeningTransitionProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export const OpeningTransition: React.FC<OpeningTransitionProps> = ({
  onComplete,
  forceShow = false,
}) => {
  // 7-Phase Cinematic Sequence State
  const [phase, setPhase] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);

  const handleSkip = () => {
    setPhase(8);
    sessionStorage.setItem('vc_intro_seen', 'true');
    if (onComplete) onComplete();
  };

  useEffect(() => {
    // Session check for returning users unless forced
    const hasSeenIntro = sessionStorage.getItem('vc_intro_seen');
    if (hasSeenIntro && !forceShow) {
      setPhase(8);
      if (onComplete) onComplete();
      return;
    }

    // 7-Phase Timings (Total ~3.2 Seconds)
    const t1 = setTimeout(() => setPhase(2), 400);   // Energy lines connect
    const t2 = setTimeout(() => setPhase(3), 900);   // Logo 1 emerges
    const t3 = setTimeout(() => setPhase(4), 1500);  // Controlled energy pulse
    const t4 = setTimeout(() => setPhase(5), 2100);  // "2.0" brand tag appears
    const t5 = setTimeout(() => setPhase(6), 2600);  // Ecosystem backdrop emerges
    const t6 = setTimeout(() => setPhase(7), 3000);  // Fade out
    const t7 = setTimeout(() => {
      setPhase(8);
      sessionStorage.setItem('vc_intro_seen', 'true');
      if (onComplete) onComplete();
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
    };
  }, [onComplete, forceShow]);

  if (phase === 8) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
        phase === 7 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#F8FAFC',
      }}
    >
      {/* Top-Right Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-500 hover:text-slate-900 text-xs font-bold shadow-xs transition-all hover:bg-white"
        title="Skip Opening Transition"
      >
        <span>Skip Intro</span>
        <FastForward className="w-3.5 h-3.5" />
      </button>

      {/* PHASE 1 & 2: Soft Environment & Energy Network Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            phase >= 2 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.08) 0%, transparent 65%),
              linear-gradient(to right, rgba(226, 232, 240, 0.5) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(226, 232, 240, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          }}
        />

        {/* Phase 2: Connecting Energy Nodes */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
            phase >= 2 && phase <= 6 ? 'scale-100 opacity-80' : 'scale-95 opacity-0'
          }`}
        >
          <svg width="440" height="440" viewBox="0 0 440 440" fill="none">
            <circle
              cx="220"
              cy="220"
              r="170"
              stroke="#0EA5E9"
              strokeWidth="1.5"
              strokeDasharray="6 10"
              opacity="0.3"
              className="animate-spin-slow"
            />
            <circle cx="220" cy="220" r="110" stroke="#10B981" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.4" />
            <line x1="40" y1="220" x2="170" y2="220" stroke="#0EA5E9" strokeWidth="2" opacity="0.5" />
            <line x1="400" y1="220" x2="270" y2="220" stroke="#0EA5E9" strokeWidth="2" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* PHASE 3 - 6: Brand Emergence, Controlled Pulse, & Tagline */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 space-y-4">
        
        {/* Compact Logo Symbol Emergence */}
        <div
          className={`transition-all duration-500 transform ${
            phase === 2
              ? 'scale-110 opacity-100'
              : phase >= 3
              ? 'scale-90 opacity-0 hidden'
              : 'scale-75 opacity-0'
          }`}
        >
          <LogoCompact size={64} />
        </div>

        {/* PHASE 3 & 4: Logo 1 Full Reveal with Controlled Pulse */}
        <div
          className={`transition-all duration-700 ease-out transform ${
            phase >= 3 && phase <= 6
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-95 opacity-0 translate-y-4'
          } ${phase === 4 ? 'scale-105 filter drop-shadow-lg' : ''}`}
        >
          <LogoFull height={56} />
        </div>

        {/* PHASE 5: Brand Concept & Subtle "2.0" Tag */}
        <div
          className={`flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase transition-all duration-500 ${
            phase >= 5 && phase <= 6
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2'
          }`}
        >
          <span>ENERGY</span>
          <span className="w-1 h-1 rounded-full bg-sky-500" />
          <span>CONNECTION</span>
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          <span>MOBILITY</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-emerald-600 font-extrabold">2.0</span>
        </div>
      </div>
    </div>
  );
};
