import React from 'react';

interface JourneyBeginsProps {
  progress: number;
}

export const JourneyBegins: React.FC<JourneyBeginsProps> = ({ progress }) => {
  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-1000">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-[10px] uppercase font-extrabold tracking-widest">
        <span className="w-2 h-2 rounded-full bg-[#29B6F6] animate-pulse" />
        VoltConnect 2.0 Platform
      </div>

      <h1 className="font-heading text-4xl sm:text-6xl font-extrabold text-[#F8FAFC] tracking-tight leading-tight">
        THE JOURNEY BEGINS
      </h1>

      <p className="text-xs sm:text-sm font-semibold text-[#94A3B8] max-w-md mx-auto tracking-wide">
        Next-generation connected EV mobility ecosystem
      </p>
    </div>
  );
};
