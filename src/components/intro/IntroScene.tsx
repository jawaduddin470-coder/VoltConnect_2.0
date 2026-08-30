import React from 'react';
import { SystemInitScene } from './SystemInitScene';
import { VoltMapReveal } from './VoltMapReveal';
import { VoltTripReveal } from './VoltTripReveal';
import { VoltHealthReveal } from './VoltHealthReveal';
import { VoltAIReveal } from './VoltAIReveal';
import { LogoConvergence } from './LogoConvergence';

interface IntroSceneProps {
  scene: number; // 0 to 8
  progress: number; // 0 to 1
}

export const IntroScene: React.FC<IntroSceneProps> = ({ scene, progress }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 text-center pointer-events-none select-none z-10 overflow-hidden">
      {scene === 0 && <SystemInitScene progress={progress} />}
      {scene === 1 && <VoltMapReveal progress={progress} />}
      {scene === 2 && <VoltTripReveal progress={progress} />}
      {scene === 3 && <VoltHealthReveal progress={progress} />}
      {scene === 4 && <VoltAIReveal progress={progress} />}
      {(scene === 7 || scene === 8) && <LogoConvergence progress={progress} />}
    </div>
  );
};
