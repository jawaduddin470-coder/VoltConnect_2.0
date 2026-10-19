import React from 'react';
import emblemImage from '@/assets/voltconnect-emblem.png';

export type LogoVariant =
  | 'default'
  | 'navbar'
  | 'auth'
  | 'footer'
  | 'loading'
  | 'intro'
  | 'compact'
  | 'symbol';

export interface VoltConnectLogoProps {
  variant?: LogoVariant;
  className?: string;
  size?: number | string;
  onClick?: () => void;
  showText?: boolean;
  lightBg?: boolean;
}

export const VoltConnectLogo: React.FC<VoltConnectLogoProps> = ({
  variant = 'default',
  className = '',
  size,
  onClick,
  showText = false,
  lightBg = false,
}) => {
  // Inline dimension helper when custom size is passed
  const sizeStyle = size
    ? {
        height: typeof size === 'number' ? `${size}px` : size,
        width: typeof size === 'number' ? `${size}px` : size,
      }
    : undefined;

  // 1. Cinematic Intro Variant (Hero emblem with luminous aura, 100% transparent, no white box)
  if (variant === 'intro') {
    const dim = size || 180;
    return (
      <div
        onClick={onClick}
        className={`relative flex items-center justify-center mx-auto pointer-events-none select-none transition-all ${className}`}
        style={{ width: typeof dim === 'number' ? `${dim}px` : dim }}
      >
        <img
          src={emblemImage}
          alt="VoltConnect"
          className="w-full h-auto object-contain filter drop-shadow-[0_0_35px_rgba(14,165,233,0.55)] animate-in fade-in zoom-in-[0.92] duration-700"
        />
      </div>
    );
  }

  // 2. Navbar Variant (Clean header emblem, no awkward white rectangle, consistent across Admin, Partner, and Driver)
  if (variant === 'navbar') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center p-1 cursor-pointer transition-transform hover:scale-[1.04] active:scale-[0.98] select-none ${className}`}
      >
        <img
          src={emblemImage}
          alt="VoltConnect"
          className="h-9 sm:h-10 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(14,165,233,0.25)]"
          style={size ? { height: typeof size === 'number' ? `${size}px` : size } : undefined}
        />
        {showText && (
          <span
            className={`font-heading font-extrabold text-base sm:text-lg tracking-tight ml-2 select-none ${
              lightBg ? 'text-slate-900' : 'text-white'
            }`}
          >
            Volt<span className="text-sky-400">Connect</span>
          </span>
        )}
      </div>
    );
  }

  // 3. Auth & Onboarding Variant (Centered prominent emblem, transparent, glowing)
  if (variant === 'auth') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center p-2 select-none ${className}`}
      >
        <img
          src={emblemImage}
          alt="VoltConnect"
          className="h-14 sm:h-16 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(14,165,233,0.3)]"
          style={size ? { height: typeof size === 'number' ? `${size}px` : size } : undefined}
        />
      </div>
    );
  }

  // 4. Footer Variant
  if (variant === 'footer') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-2 select-none ${className}`}
      >
        <img
          src={emblemImage}
          alt="VoltConnect"
          className="h-9 sm:h-10 w-auto object-contain filter drop-shadow-sm"
          style={size ? { height: typeof size === 'number' ? `${size}px` : size } : undefined}
        />
        {showText && (
          <span className="font-heading font-extrabold text-base text-white tracking-tight">
            Volt<span className="text-sky-400">Connect</span>
          </span>
        )}
      </div>
    );
  }

  // 5. Loading / Splash Variant
  if (variant === 'loading') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center p-2 select-none animate-pulse ${className}`}
      >
        <img
          src={emblemImage}
          alt="VoltConnect"
          className="h-12 w-auto object-contain filter drop-shadow-[0_0_20px_rgba(14,165,233,0.4)]"
          style={size ? { height: typeof size === 'number' ? `${size}px` : size } : undefined}
        />
      </div>
    );
  }

  // 6. Compact / Symbol Variant
  if (variant === 'compact' || variant === 'symbol') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center select-none ${className}`}
        style={sizeStyle || { width: '36px', height: '36px' }}
      >
        <img
          src={emblemImage}
          alt="VoltConnect"
          className="w-full h-full object-contain filter drop-shadow-sm"
        />
      </div>
    );
  }

  // 7. Default Variant (Clean emblem at requested size)
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center p-1 select-none ${className}`}
    >
      <img
        src={emblemImage}
        alt="VoltConnect"
        className="h-12 w-auto object-contain filter drop-shadow-sm"
        style={size ? { height: typeof size === 'number' ? `${size}px` : size } : undefined}
      />
      {showText && (
        <span
          className={`font-heading font-extrabold text-base tracking-tight ml-2 ${
            lightBg ? 'text-slate-900' : 'text-white'
          }`}
        >
          Volt<span className="text-sky-400">Connect</span>
        </span>
      )}
    </div>
  );
};

