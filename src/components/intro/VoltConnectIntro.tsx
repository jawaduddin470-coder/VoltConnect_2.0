import React, { useEffect, useState, useRef } from 'react';
import { EVCinematicJourney } from './EVCinematicJourney';
import { FastForward } from 'lucide-react';

interface VoltConnectIntroProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export const VoltConnectIntro: React.FC<VoltConnectIntroProps> = ({
  onComplete,
  forceShow = false,
}) => {
  const [progress, setProgress] = useState(0); // 0.0 to 1.0
  const [isCompleted, setIsCompleted] = useState(false);
  const animFrameIdRef = useRef<number | null>(null);

  // Skip Action with clean frame cancellation
  const handleSkip = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    setIsCompleted(true);
    if (onComplete) onComplete();
  };

  useEffect(() => {
    // Accessibility check: prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches && !forceShow) {
      setIsCompleted(true);
      if (onComplete) onComplete();
      return;
    }

    // Reset progress and start smooth requestAnimationFrame-based 13.5s cinematic timeline
    setProgress(0);
    setIsCompleted(false);

    const totalDuration = 13500; // 13.5 seconds complete product journey timeline
    let startTime: number | null = null;
    let lastStepProgress = -1;

    const animateStep = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const currentProgress = Math.min(1, elapsed / totalDuration);

      // Quantize progress updates slightly to avoid unnecessary micro-rerenders while maintaining 60fps smoothness
      if (Math.abs(currentProgress - lastStepProgress) > 0.003 || currentProgress >= 1) {
        lastStepProgress = currentProgress;
        setProgress(currentProgress);
      }

      if (currentProgress < 1) {
        animFrameIdRef.current = requestAnimationFrame(animateStep);
      } else {
        setTimeout(() => {
          setIsCompleted(true);
          if (onComplete) onComplete();
        }, 150);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animateStep);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [forceShow, onComplete]);

  if (isCompleted) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen z-[99999] bg-[#02050E] text-white flex flex-col justify-between overflow-hidden pointer-events-auto select-none">
      
      {/* 2.5D EV Cinematic Journey Engine */}
      <EVCinematicJourney progress={progress} />

      {/* Top Header: Clean Subtle Skip Intro Control */}
      <div className="relative z-50 flex items-center justify-end p-6 pointer-events-auto">
        <button
          onClick={handleSkip}
          className="px-4 py-2 rounded-xl bg-slate-900/70 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-700/50 transition-colors flex items-center gap-2 backdrop-blur-md shadow-lg cursor-pointer"
        >
          <span>Skip Intro</span>
          <FastForward className="w-3.5 h-3.5 text-[#38BDF8]" />
        </button>
      </div>

    </div>
  );
};
