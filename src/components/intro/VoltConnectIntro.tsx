import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EVCinematicJourney } from './EVCinematicJourney';
import { FastForward, Play, Volume2, VolumeX } from 'lucide-react';

interface VoltConnectIntroProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export const VoltConnectIntro: React.FC<VoltConnectIntroProps> = ({
  onComplete,
  forceShow = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeVehicle } = useAuth();

  const [progress, setProgress] = useState(0); // 0.0 to 1.0
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const animFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Total cinematic timeline duration: 11.0 seconds for optimal storytelling pacing
  const TOTAL_DURATION_MS = 11000;

  // Initialize intro visibility based on first-time visit or forced replay
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !forceShow) {
      setIsVisible(false);
      if (onComplete) onComplete();
      return;
    }

    const hasSeenIntro = localStorage.getItem('vc_intro_seen') === 'true';

    // Auto-show on first visit (only on landing page /) or when explicitly requested (replay)
    if (forceShow || (!hasSeenIntro && location.pathname === '/')) {
      setIsVisible(true);
      setIsExiting(false);
      setProgress(0);
      startTimeRef.current = null;
    } else {
      setIsVisible(false);
    }
  }, [forceShow, location.pathname]);

  // Handle clean exit and transition into the real app
  const completeIntro = (targetRoute?: string) => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    
    // Begin smooth spatial blur and opacity exit transition
    setIsExiting(true);
    localStorage.setItem('vc_intro_seen', 'true');

    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      if (targetRoute) {
        navigate(targetRoute);
      }
      if (onComplete) onComplete();
    }, 450); // 450ms smooth transition window
  };

  const handleSkip = () => {
    completeIntro();
  };

  const handleStartJourney = () => {
    completeIntro('/trips');
  };

  // Keyboard shortcut listener: ESC or Space to skip intro
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  // Main 60fps cinematic animation loop
  useEffect(() => {
    if (!isVisible || isExiting) return;

    let lastStepProgress = -1;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const currentProgress = Math.min(1, elapsed / TOTAL_DURATION_MS);

      // Quantize progress slightly to maintain smooth rendering without unnecessary state thrashing
      if (Math.abs(currentProgress - lastStepProgress) > 0.002 || currentProgress >= 1) {
        lastStepProgress = currentProgress;
        setProgress(currentProgress);
      }

      if (currentProgress < 1) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        // Natural end of timeline -> auto-transition smoothly
        completeIntro();
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isVisible, isExiting]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 w-screen h-screen z-[99999] bg-[#030712] text-white flex flex-col justify-between overflow-hidden select-none transition-all duration-500 ease-out ${
        isExiting
          ? 'opacity-0 scale-[1.04] blur-sm pointer-events-none'
          : 'opacity-100 scale-100 blur-0 pointer-events-auto'
      }`}
      role="region"
      aria-label="VoltConnect Cinematic Journey Introduction"
    >
      {/* 2.5D EV Cinematic Journey Engine */}
      <EVCinematicJourney
        progress={progress}
        activeVehicle={activeVehicle}
        onStartJourney={handleStartJourney}
        onEnterApp={() => completeIntro()}
      />

      {/* Top Header: Elegant Minimal Skip & Replay Controls */}
      <div className="relative z-50 flex items-center justify-between p-6 pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-slate-400 uppercase">
            VOLTCONNECT 2.0 • MOBILITY EXPERIENCE
          </span>
        </div>

        <button
          onClick={handleSkip}
          className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center gap-2 backdrop-blur-md shadow-lg cursor-pointer hover:scale-105 active:scale-95"
          title="Skip Intro (Press Esc or Space)"
        >
          <span>Skip Experience</span>
          <FastForward className="w-3.5 h-3.5 text-sky-400" />
        </button>
      </div>

      {/* Subtle Progress Bar along very bottom */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-900/60 z-50">
        <div
          className="h-full bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 transition-all duration-100"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
};
