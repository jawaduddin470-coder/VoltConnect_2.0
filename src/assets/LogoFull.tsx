import React from 'react';
import { VoltConnectLogo } from '@/components/common/VoltConnectLogo';

interface LogoFullProps {
  className?: string;
  height?: number | string;
  lightBg?: boolean;
}

export const LogoFull: React.FC<LogoFullProps> = ({
  className = '',
  height,
}) => {
  return <VoltConnectLogo variant="default" className={className} size={height} />;
};
