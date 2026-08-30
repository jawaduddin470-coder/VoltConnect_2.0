import React from 'react';
import { RotateCcw } from 'lucide-react';

interface IntroReplayProps {
  onReplay: () => void;
  compact?: boolean;
}

export const IntroReplay: React.FC<IntroReplayProps> = ({ onReplay, compact = false }) => {
  if (compact) {
    return (
      <button
        onClick={onReplay}
        className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-sky-400 border border-slate-800 transition-colors"
        title="Replay Experience"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={onReplay}
      className="px-3.5 py-1.5 rounded-full bg-sky-50/80 hover:bg-sky-100 text-xs font-bold text-sky-700 border border-sky-200 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      <span>Replay Experience</span>
    </button>
  );
};
