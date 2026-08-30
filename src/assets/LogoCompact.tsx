import React from 'react';
import { VoltConnectLogo } from '@/components/common/VoltConnectLogo';

interface LogoCompactProps {
  className?: string;
  size?: number | string;
}

export const LogoCompact: React.FC<LogoCompactProps> = ({
  className = '',
  size = 36,
}) => {
  return <VoltConnectLogo variant="navbar" className={className} size={size} />;
};
