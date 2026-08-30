import React from 'react';
import { VoltConnectLogo } from '@/components/common/VoltConnectLogo';

interface LogoConvergenceProps {
  progress: number;
}

export const LogoConvergence: React.FC<LogoConvergenceProps> = ({ progress }) => {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-1000 text-center flex flex-col items-center">
      <VoltConnectLogo variant="intro" />
    </div>
  );
};
