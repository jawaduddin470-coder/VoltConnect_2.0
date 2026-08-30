import React from 'react';

interface IntroTransitionProps {
  scene?: number;
  progress?: number;
  active?: boolean;
}

export const IntroTransition: React.FC<IntroTransitionProps> = ({ scene = 8, progress = 1, active = false }) => {
  const isTransitioning = active || scene === 8;
  const transitionOpacity = isTransitioning ? Math.max(0, 1 - (progress - 0.85) / 0.15) : 1;

  return (
    <div
      className="absolute inset-0 pointer-events-none transition-all duration-700 z-0"
      style={{
        opacity: transitionOpacity,
        backgroundColor: '#0B1329', // Deep navy near-black
      }}
    >
      {/* Dynamic Background Energy Glow */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.95) 70%)`,
          opacity: scene >= 3 ? 1 : 0.6,
        }}
      />
    </div>
  );
};
