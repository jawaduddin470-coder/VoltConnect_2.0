import React, { useState, useRef, useEffect } from 'react';
import { useVoiceNavigation, VoiceNavigationStatus } from '@/hooks/useVoiceNavigation';
import { VOICE_ROUTES } from '@/services/voiceNavigationService';
import {
  Mic,
  MicOff,
  Navigation,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Sparkles,
  ArrowRight,
  Compass,
} from 'lucide-react';

interface VoiceNavigationControlProps {
  compact?: boolean;
}

export const VoiceNavigationControl: React.FC<VoiceNavigationControlProps> = ({
  compact = false,
}) => {
  const {
    isSupported,
    status,
    transcript,
    interimTranscript,
    lastMatch,
    errorMessage,
    toggleListening,
    resetState,
  } = useVoiceNavigation();

  const [showHelp, setShowHelp] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  // Close help popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setShowHelp(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeTranscript = interimTranscript || transcript;

  return (
    <div className="relative inline-flex items-center" ref={helpRef}>
      
      {/* 1. MAIN VOICE MICROPHONE CONTROL BUTTON */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleListening}
          className={`relative group inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-sans text-xs font-bold transition-all duration-200 cursor-pointer select-none border focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 shadow-xs ${
            status === 'LISTENING'
              ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white border-sky-400 shadow-[0_0_16px_rgba(14,165,233,0.4)] scale-105'
              : status === 'PROCESSING' || status === 'INTENT_DETECTED' || status === 'EXECUTING' || status === 'NAVIGATING'
              ? 'bg-sky-50 text-sky-700 border-sky-300 animate-pulse'
              : status === 'SUCCESS'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : status === 'ERROR'
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
          title={
            status === 'LISTENING'
              ? 'Listening... Click to stop'
              : !isSupported
              ? 'Speech recognition not supported in this browser'
              : 'Voice AI Copilot (Speak "Plan a trip to Kolkata" or "Find chargers near me")'
          }
        >
          {/* Animated Status Icon */}
          <div className="relative flex items-center justify-center">
            {status === 'LISTENING' ? (
              <div className="flex items-center gap-0.5 h-4 px-0.5">
                <span className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-0.5 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce" />
              </div>
            ) : status === 'INTENT_DETECTED' || status === 'PROCESSING' ? (
              <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-spin" />
            ) : status === 'EXECUTING' || status === 'NAVIGATING' ? (
              <Navigation className="w-3.5 h-3.5 text-teal-600 animate-spin" />
            ) : status === 'SUCCESS' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : status === 'ERROR' ? (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Mic className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
            )}
          </div>

          {/* Button Text Label */}
          {!compact && (
            <span className="hidden sm:inline font-mono text-[11px] tracking-tight">
              {status === 'LISTENING'
                ? 'Listening...'
                : status === 'PROCESSING'
                ? 'Understanding...'
                : status === 'INTENT_DETECTED'
                ? (lastMatch?.feedbackTitle || 'Intent Found')
                : status === 'EXECUTING' || status === 'NAVIGATING'
                ? (lastMatch?.parameters?.destination ? `Route: ${lastMatch.parameters.destination}` : 'Executing...')
                : status === 'SUCCESS'
                ? 'Action Executed'
                : status === 'ERROR'
                ? 'Retry Voice'
                : 'Voice AI'}
            </span>
          )}
        </button>

        {/* Quick Help Popover Toggle */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Voice Commands Guide"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. REAL-TIME LIVE TRANSCRIPT & FEEDBACK HUD OVERLAY */}
      {(status === 'LISTENING' || status === 'PROCESSING' || status === 'INTENT_DETECTED' || status === 'EXECUTING' || status === 'NAVIGATING' || status === 'ERROR') && (
        <div className="absolute top-full right-0 mt-2 z-50 w-72 sm:w-84 bg-slate-950/95 border border-slate-700/80 rounded-2xl shadow-2xl p-3.5 text-white backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                status === 'LISTENING' ? 'bg-sky-400 animate-ping' : status === 'EXECUTING' || status === 'NAVIGATING' ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                {status === 'LISTENING'
                  ? 'Listening for speech...'
                  : status === 'INTENT_DETECTED'
                  ? 'Intent Recognized'
                  : status === 'EXECUTING' || status === 'NAVIGATING'
                  ? 'Executing Action'
                  : 'Voice Assistant'}
              </span>
            </div>
            <button onClick={resetState} className="text-slate-400 hover:text-white p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Recognized Speech Display */}
          <div className="py-2.5">
            {activeTranscript ? (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-slate-400 uppercase">You said:</div>
                <div className="text-xs font-bold text-sky-300 font-mono bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                  "{activeTranscript}"
                </div>

                {/* Intent & Extracted Parameters Display */}
                {lastMatch?.feedbackTitle && (
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-teal-800/40 text-[11px] space-y-1 font-mono">
                    <div className="text-teal-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-400" />
                      <span>{lastMatch.feedbackTitle}</span>
                    </div>
                    {lastMatch.feedbackMessage && (
                      <div className="text-slate-300 text-[10px]">{lastMatch.feedbackMessage}</div>
                    )}
                    {lastMatch.parameters?.destination && (
                      <div className="text-sky-300 text-[10px]">
                        📍 Destination: <span className="font-bold">{lastMatch.parameters.destination}</span>
                        {lastMatch.parameters.origin ? ` (from ${lastMatch.parameters.origin})` : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : status === 'LISTENING' ? (
              <div className="text-xs text-slate-300 font-medium italic">
                Speak naturally... e.g. <span className="text-sky-400 font-bold">"Plan a trip to Kolkata"</span> or <span className="text-sky-400 font-bold">"Find fast chargers"</span>
              </div>
            ) : null}

            {/* Error Message Display */}
            {errorMessage && (
              <div className="mt-2 text-xs text-amber-300 bg-amber-950/50 border border-amber-800/60 p-2 rounded-xl">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Quick Voice Hints */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Natural EV Copilot active</span>
          </div>

        </div>
      )}

      {/* 3. VOICE COMMANDS CHEAT SHEET / HELP MODAL POPOVER */}
      {showHelp && (
        <div className="absolute top-full right-0 mt-2 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-card-hover border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 text-left">
          
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-heading text-xs font-bold text-navy-900">Voice Navigation Commands</h4>
                <p className="text-[10px] text-slate-500">Speak naturally to navigate any page</p>
              </div>
            </div>
            <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Commands List */}
          <div className="py-2.5 space-y-2 max-h-64 overflow-y-auto pr-1">
            {VOICE_ROUTES.map((r) => (
              <div
                key={r.id}
                className="flex items-start justify-between gap-2 p-2 rounded-xl bg-slate-50 hover:bg-sky-50/50 border border-slate-100 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-navy-900">{r.label}</div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Try: <span className="text-sky-600 font-semibold">"{r.aliases[0]}"</span> or <span className="text-sky-600 font-semibold">"{r.keywords[0]}"</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shrink-0">
                  {r.path}
                </span>
              </div>
            ))}

            {/* Go Back Command */}
            <div className="flex items-start justify-between gap-2 p-2 rounded-xl bg-slate-50 hover:bg-sky-50/50 border border-slate-100 transition-colors">
              <div>
                <div className="text-xs font-bold text-navy-900">Previous Page</div>
                <div className="text-[10px] font-mono text-slate-500">
                  Try: <span className="text-sky-600 font-semibold">"Go back"</span> or <span className="text-sky-600 font-semibold">"Back"</span>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shrink-0">
                History
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Powered by Web Speech API</span>
            <span className="font-mono text-emerald-600 font-bold">Safari & Chrome</span>
          </div>

        </div>
      )}

    </div>
  );
};
