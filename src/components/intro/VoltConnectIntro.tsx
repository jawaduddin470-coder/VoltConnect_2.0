import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EVCinematicJourney } from './EVCinematicJourney';
import { FastForward, Play, Pause, RotateCcw, Bug } from 'lucide-react';

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

  // Query parameter detection: ?intro=1, ?intro=true, ?intro=debug, ?replay=1
  const searchParams = new URLSearchParams(location.search);
  const introParam = searchParams.get('intro');
  const isDebugMode = introParam === 'debug';
  const isForcedByQuery = introParam === '1' || introParam === 'true' || searchParams.get('replay') === '1' || isDebugMode;

  const [progress, setProgress] = useState(0); // 0.0 to 1.0
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const animFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);

  // Total cinematic timeline duration: 12.0 seconds for optimal storytelling pacing
  const TOTAL_DURATION_MS = 12000;

  // Initialize intro visibility based on first-time visit, URL debug params, or forced replay
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !forceShow && !isForcedByQuery) {
      console.log('[CINEMATIC INTRO] skipped (prefers-reduced-motion)');
      setIsVisible(false);
      if (onComplete) onComplete();
      return;
    }

    // Clear any legacy permanent localStorage flag that prevented first-visit entry
    if (localStorage.getItem('vc_intro_seen')) {
      localStorage.removeItem('vc_intro_seen');
    }

    const hasSeenIntro = sessionStorage.getItem('vc_intro_seen') === 'true';

    // Auto-show conditions:
    // 1. Forced via prop (replay)
    // 2. Forced via URL query param (?intro=1, ?intro=debug, ?replay=1)
    // 3. First visit in browser session (hasSeenIntro === false) on root route "/"
    if (forceShow || isForcedByQuery || (!hasSeenIntro && location.pathname === '/')) {
      console.log('[CINEMATIC INTRO] mounted & starting', {
        forceShow,
        isForcedByQuery,
        isDebugMode,
        hasSeenIntro,
        pathname: location.pathname,
      });
      setIsVisible(true);
      setIsExiting(false);
      setIsPaused(false);
      setProgress(0);
      startTimeRef.current = null;
      pausedTimeRef.current = 0;
    } else {
      console.log('[CINEMATIC INTRO] skipped (already seen in session)', {
        hasSeenIntro,
        pathname: location.pathname,
      });
      setIsVisible(false);
    }
  }, [forceShow, isForcedByQuery, isDebugMode, location.pathname, location.search]);

  // Handle clean exit and transition into the real app
  const completeIntro = (targetRoute?: string) => {
    console.log('[CINEMATIC INTRO] completed', { targetRoute });
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    
    // Begin smooth spatial blur and opacity exit transition
    setIsExiting(true);
    if (!isDebugMode) {
      sessionStorage.setItem('vc_intro_seen', 'true');
    }

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
    console.log('[CINEMATIC INTRO] skipped by user');
    completeIntro();
  };

  const handleStartJourney = () => {
    console.log('[CINEMATIC INTRO] start journey clicked');
    completeIntro('/trips');
  };

  const handleRestart = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setProgress(0);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    setIsPaused(false);
    setIsExiting(false);
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
    if (!isVisible || isExiting || isPaused) return;

    let lastStepProgress = -1;

    const animate = (timestamp: number) => {
      lastTimestampRef.current = timestamp;
      if (!startTimeRef.current) startTimeRef.current = timestamp - pausedTimeRef.current;
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
        // In debug mode, hold on the climax screen without auto-dismissing so developers can inspect
        if (isDebugMode) {
          console.log('[CINEMATIC INTRO] timeline finished — holding in debug mode');
          setIsPaused(true);
        } else {
          // Natural end of timeline in production -> auto-transition smoothly
          completeIntro();
        }
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isVisible, isExiting, isPaused, isDebugMode]);

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

        {/* Actions & Skip Controls */}
        <div className="flex items-center gap-3">
          {isDebugMode && (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 px-3 py-1.5 rounded-xl backdrop-blur-md">
              <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-bold">
                <Bug className="w-3.5 h-3.5" />
                <span>DEBUG: {Math.round(progress * 100)}%</span>
              </div>

              <button
                onClick={() => {
                  if (isPaused) {
                    setIsPaused(false);
                  } else {
                    if (lastTimestampRef.current && startTimeRef.current) {
                      pausedTimeRef.current = lastTimestampRef.current - startTimeRef.current;
                    }
                    setIsPaused(true);
                  }
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition-all"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
              </button>

              <button
                onClick={handleRestart}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition-all"
                title="Restart Intro"
              >
                <RotateCcw className="w-3 h-3 text-sky-400" />
              </button>
            </div>
          )}

          <button
            onClick={handleSkip}
            className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center gap-2 backdrop-blur-md shadow-lg cursor-pointer hover:scale-105 active:scale-95"
            title="Skip Intro (Press Esc or Space)"
          >
            <span>Skip Experience</span>
            <FastForward className="w-3.5 h-3.5 text-sky-400" />
          </button>
        </div>
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
