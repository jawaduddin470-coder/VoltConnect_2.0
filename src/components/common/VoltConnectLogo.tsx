import React, { useEffect, useRef, useState } from 'react';
import newLogoImage from '@/assets/voltconnect-logo-new.png';

export type LogoVariant = 'default' | 'navbar' | 'auth' | 'footer' | 'loading' | 'intro' | 'compact' | 'symbol';

interface VoltConnectLogoProps {
  variant?: LogoVariant;
  className?: string;
  size?: number | string;
  onClick?: () => void;
}

export const VoltConnectLogo: React.FC<VoltConnectLogoProps> = ({
  variant = 'default',
  className = '',
  size,
  onClick,
}) => {
  const [transparentDataUrl, setTransparentDataUrl] = useState<string | null>(null);

  // Process white background removal for intro variant
  useEffect(() => {
    if (variant !== 'intro') return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = newLogoImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Background transparency threshold for white/near-white pixels
        if (r > 230 && g > 230 && b > 230) {
          data[i + 3] = 0; // Make transparent
        } else if (r > 200 && g > 200 && b > 200) {
          const avg = (r + g + b) / 3;
          data[i + 3] = Math.max(0, Math.min(255, 255 - (avg - 200) * 4.5));
        }

        // Adjust dark navy "Volt" text slightly for crisp contrast against dark space
        if (r < 40 && g < 50 && b < 80 && data[i + 3] > 0) {
          data[i] = Math.min(255, r + 210);
          data[i + 1] = Math.min(255, g + 230);
          data[i + 2] = Math.min(255, b + 250);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setTransparentDataUrl(canvas.toDataURL('image/png'));
    };
  }, [variant]);

  // Variant A: Cinematic Intro Logo (COMPACT 280–360px WIDTH, 100% TRANSPARENT, NO WHITE BOX)
  if (variant === 'intro') {
    return (
      <div
        onClick={onClick}
        className={`relative flex items-center justify-center w-[250px] sm:w-[320px] lg:w-[350px] max-w-[360px] mx-auto pointer-events-none select-none transition-all ${className}`}
      >
        <img
          src={transparentDataUrl || newLogoImage}
          alt="VoltConnect 2.0 Official Logo Reveal"
          className="w-full h-auto object-contain filter drop-shadow-[0_0_20px_rgba(41,182,246,0.45)] animate-in fade-in zoom-in-[0.92] duration-800"
        />
      </div>
    );
  }

  // Variant B: Navbar Logo (DEDICATED BRAND CONTAINER, 125–155px WIDTH)
  if (variant === 'navbar') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center bg-white px-2.5 py-1 rounded-xl shadow-xs border border-slate-200/80 cursor-pointer transition-transform hover:scale-[1.02] w-[115px] sm:w-[145px] ${className}`}
      >
        <img
          src={newLogoImage}
          alt="VoltConnect 2.0 Official Logo"
          className="w-full h-auto max-h-[42px] object-contain"
        />
      </div>
    );
  }

  // Variant: Auth / Onboarding
  if (variant === 'auth') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center bg-white p-3 rounded-2xl shadow-sm border border-slate-200/90 ${className}`}
      >
        <img
          src={newLogoImage}
          alt="VoltConnect 2.0 Official Logo"
          className="h-12 sm:h-16 w-auto object-contain"
        />
      </div>
    );
  }

  // Variant: Footer
  if (variant === 'footer') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-xs w-[130px] sm:w-[155px] ${className}`}
      >
        <img
          src={newLogoImage}
          alt="VoltConnect 2.0 Official Logo"
          className="w-full h-auto max-h-[44px] object-contain"
        />
      </div>
    );
  }

  // Variant: Loading / Splash
  if (variant === 'loading') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center bg-white p-3 rounded-2xl shadow-md border border-sky-300/60 animate-pulse ${className}`}
      >
        <img
          src={newLogoImage}
          alt="VoltConnect 2.0 Official Logo"
          className="h-10 sm:h-12 w-auto object-contain"
        />
      </div>
    );
  }

  // Variant: Compact / Symbol
  if (variant === 'compact' || variant === 'symbol') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs ${className}`}
        style={{ width: size ? `${size}px` : '36px', height: size ? `${size}px` : '36px' }}
      >
        <img
          src={newLogoImage}
          alt="VoltConnect 2.0 Logo Mark"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Default Variant
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs ${className}`}
    >
      <img
        src={newLogoImage}
        alt="VoltConnect 2.0 Official Logo"
        className="h-12 w-auto object-contain"
        style={size ? { height: `${size}px` } : undefined}
      />
    </div>
  );
};
