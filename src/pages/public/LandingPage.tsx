import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useVoiceNavigation } from '@/hooks/useVoiceNavigation';
import { resolveVoiceCommand } from '@/services/voiceNavigationService';
import { IntroReplay } from '@/components/intro/IntroReplay';
import { INITIAL_CHARGING_STATIONS } from '@/features/charging/data/stationsSeed';
import {
  Mic,
  MicOff,
  Navigation,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Compass,
  MapPin,
  Battery,
  Zap,
  Activity,
  Wrench,
  BarChart3,
  Car,
  Layers,
  Cpu,
  Radio,
  Clock,
  ChevronRight,
  Play,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isSupported,
    status: voiceStatus,
    transcript,
    interimTranscript,
    lastMatch,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
    resetState,
  } = useVoiceNavigation();

  // Interactive Voice Demo Simulation State
  const [demoStep, setDemoStep] = useState<'IDLE' | 'LISTENING' | 'UNDERSTANDING' | 'EXECUTING' | 'SUCCESS'>('IDLE');
  const [demoPrompt, setDemoPrompt] = useState('Open Smart Trip Planner');
  const [demoRoute, setDemoRoute] = useState('/trips');
  const [demoLabel, setDemoLabel] = useState('Smart Trip Planner');

  const samplePrompts = [
    { text: 'Open Dashboard', route: '/dashboard', label: 'Home Dashboard', icon: Compass },
    { text: 'Find chargers on VoltMap', route: '/explore', label: 'VoltMap Charging Network', icon: MapPin },
    { text: 'Plan journey to Srinagar', route: '/trips', label: 'Smart Trip Planner', icon: Navigation },
    { text: 'Check battery health SOH', route: '/health', label: 'VoltHealth SOH', icon: Activity },
    { text: 'Book service at nearest hub', route: '/care', label: 'VoltCare Service', icon: Wrench },
  ];

  const handleRunDemo = (promptText: string, route: string, label: string) => {
    setDemoPrompt(promptText);
    setDemoRoute(route);
    setDemoLabel(label);
    setDemoStep('LISTENING');

    setTimeout(() => {
      setDemoStep('UNDERSTANDING');
    }, 900);

    setTimeout(() => {
      setDemoStep('EXECUTING');
    }, 1800);

    setTimeout(() => {
      setDemoStep('SUCCESS');
    }, 2700);
  };

  const isRealListening = voiceStatus === 'LISTENING';
  const displayTranscript = interimTranscript || transcript;

  return (
    <div className="space-y-28 pb-28 overflow-hidden font-sans">
      
      {/* =========================================================================
          1. BRAND NEW HERO SECTION: "VOICE ➔ INTELLIGENCE ➔ ACTION"
          ========================================================================= */}
      <section className="relative pt-6 pb-16 lg:pt-12 lg:pb-24 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Subtle Ambient Night Sky & Energy Grid Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-sky-500/20 via-teal-500/5 to-transparent blur-3xl" />
          <svg width="100%" height="100%">
            <pattern id="hero_dark_grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#1E293B" strokeWidth="0.8" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#hero_dark_grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Top Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              VOLTCONNECT 2.0 • VOICE-ENABLED MOBILITY INTELLIGENCE
            </div>

            <div className="flex items-center gap-2">
              <IntroReplay onReplay={() => window.dispatchEvent(new CustomEvent('vc_replay_intro'))} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Bold Value Proposition & Actions */}
            <div className="lg:col-span-6 space-y-6 text-left">
              
              <div className="space-y-4">
                <h1 className="font-heading text-4xl sm:text-6xl lg:text-[62px] font-extrabold text-white tracking-tight leading-[1.08]">
                  Speak Naturally. <br />
                  <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                    Let Your EV Mobility Take Action.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-300 max-w-xl font-medium leading-relaxed">
                  Experience hands-free EV navigation, real-time charging corridor matching, instant battery health diagnostics, and contextual AI copilot — powered by natural voice interaction.
                </p>
              </div>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <Link
                  to="/signup"
                  className="px-7 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-slate-950 font-heading font-extrabold text-sm tracking-wide shadow-lg hover:shadow-[0_0_24px_rgba(14,165,233,0.4)] transition-all flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>GET STARTED FREE</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/explore"
                  className="px-7 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-heading font-bold text-sm border border-slate-700 hover:border-sky-500/80 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <MapPin className="w-4 h-4 text-sky-400" />
                  <span>EXPLORE VOLTMAP</span>
                </Link>
              </div>

              {/* Verified Trust Metrics */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs font-semibold text-slate-400">
                <div className="space-y-0.5">
                  <div className="text-white font-extrabold font-mono text-base">1,771+</div>
                  <div className="text-[11px] text-slate-400">Fast Charging Hubs</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-white font-extrabold font-mono text-base">100%</div>
                  <div className="text-[11px] text-slate-400">Voice Zero-Click</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-white font-extrabold font-mono text-base">703</div>
                  <div className="text-[11px] text-slate-400">Indian Cities</div>
                </div>
              </div>

            </div>

            {/* Right Column: CENTRAL INTERACTIVE VOICE CONSOLE */}
            <div className="lg:col-span-6 relative">
              <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(14,165,233,0.12)] space-y-6 relative overflow-hidden">
                
                {/* Console Header Bar */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-extrabold text-white uppercase tracking-wider">
                      VOICE COMMAND CONSOLE
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-[10px] font-mono font-bold text-sky-400 uppercase">
                    {isRealListening ? 'LIVE AUDIO' : 'INTERACTIVE DEMO'}
                  </span>
                </div>

                {/* Central Acoustic Waveform & Microphone Hub */}
                <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
                  
                  {/* Dynamic Glowing Mic Button */}
                  <div className="relative">
                    {/* Pulsing Acoustic Rings */}
                    {(isRealListening || demoStep === 'LISTENING' || demoStep === 'UNDERSTANDING') && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-sky-500/20 animate-ping" />
                        <div className="absolute -inset-3 rounded-full bg-teal-500/15 animate-pulse" />
                      </>
                    )}

                    <button
                      onClick={toggleListening}
                      className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 border-2 ${
                        isRealListening
                          ? 'bg-gradient-to-r from-sky-500 to-teal-400 text-slate-950 border-white shadow-[0_0_30px_#38BDF8]'
                          : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-600 hover:border-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.2)]'
                      }`}
                      title="Click to Speak a Command"
                    >
                      <Mic className="w-8 h-8" />
                    </button>
                  </div>

                  {/* Dynamic Acoustic Spectrum Frequency Bars */}
                  <div className="flex items-center justify-center gap-1 h-8">
                    {[40, 75, 95, 60, 100, 80, 50, 90, 65, 85, 45, 70].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full transition-all duration-150 ${
                          isRealListening || demoStep === 'LISTENING'
                            ? 'bg-gradient-to-t from-sky-500 to-teal-400 animate-pulse'
                            : 'bg-slate-800'
                        }`}
                        style={{
                          height: isRealListening || demoStep === 'LISTENING' ? `${h}%` : '15%',
                          animationDelay: `${i * 0.08}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Status Indicator & Live Transcript Display */}
                  <div className="space-y-1.5 max-w-sm">
                    <div className="text-xs font-mono font-extrabold uppercase tracking-widest text-slate-400">
                      {isRealListening
                        ? 'LISTENING TO MICROPHONE...'
                        : demoStep === 'LISTENING'
                        ? '1. LISTENING TO SPOKEN INPUT...'
                        : demoStep === 'UNDERSTANDING'
                        ? '2. UNDERSTANDING INTENT VIA AI...'
                        : demoStep === 'EXECUTING'
                        ? '3. EXECUTING NAVIGATION ACTION...'
                        : demoStep === 'SUCCESS'
                        ? '✓ COMMAND EXECUTED SUCCESSFULLY'
                        : 'TAP MICROPHONE OR TRY PROMPTS BELOW'}
                    </div>

                    <div className="text-sm font-extrabold text-white font-mono bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-inner">
                      {displayTranscript ? (
                        <span className="text-sky-300">"{displayTranscript}"</span>
                      ) : demoStep !== 'IDLE' ? (
                        <span className="text-sky-300">"{demoPrompt}"</span>
                      ) : (
                        <span className="text-slate-500">"Speak any command e.g. Open Map, Dashboard..."</span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Navigation on Match */}
                  {demoStep === 'SUCCESS' && (
                    <div className="pt-1 animate-in fade-in zoom-in-95 duration-300">
                      <button
                        onClick={() => navigate(demoRoute)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all"
                      >
                        <span>Open {demoLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                </div>

                {/* Sample Voice Prompt Chips */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Interactive Voice Shortcuts:
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {samplePrompts.map((p, idx) => {
                      const Icon = p.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleRunDemo(p.text, p.route, p.label)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 hover:border-sky-500 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                        >
                          <Icon className="w-3.5 h-3.5 text-sky-400" />
                          <span>"{p.text}"</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          2. CONNECTED "HOW IT WORKS" FLOW: SPEAK ➔ UNDERSTAND ➔ ACT
          ========================================================================= */}
      <section className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> THE INTELLIGENT WORKFLOW
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-navy-900 tracking-tight">
            How Voice Intelligence Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            A seamless three-step pipeline converting your spoken words into verified EV routing, telemetry, and actions.
          </p>
        </div>

        {/* 3-Step Connected Flow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* STEP 01 — SPEAK */}
          <div className="vc-card p-6 sm:p-8 bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-4 relative group">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-extrabold text-sky-600 uppercase tracking-widest">
                STEP 01
              </div>
              <h3 className="font-heading text-xl font-extrabold text-navy-900">
                Speak Naturally
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Tap the microphone and tell VoltConnect what you need in plain language without rigid keywords or memorized commands.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
              e.g. <span className="text-sky-600 font-bold">"Where is the nearest fast charger?"</span>
            </div>
          </div>

          {/* STEP 02 — UNDERSTAND */}
          <div className="vc-card p-6 sm:p-8 bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-4 relative group">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-extrabold text-teal-600 uppercase tracking-widest">
                STEP 02
              </div>
              <h3 className="font-heading text-xl font-extrabold text-navy-900">
                AI Intent Analysis
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Contextual EV AI cross-references your active vehicle specs, battery SOC, live charger availability, and corridor safety.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
              <span>Context: </span>
              <span className="text-teal-600 font-bold">Battery SOC + Nominal Range</span>
            </div>
          </div>

          {/* STEP 03 — ACT */}
          <div className="vc-card p-6 sm:p-8 bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-4 relative group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Navigation className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-extrabold text-emerald-600 uppercase tracking-widest">
                STEP 03
              </div>
              <h3 className="font-heading text-xl font-extrabold text-navy-900">
                Instant Execution
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Zero-click navigation instantly loads optimal charging stops, triggers battery health diagnostics, or opens your dashboard.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
              <span>Result: </span>
              <span className="text-emerald-600 font-bold">100/100 Safe Journey Readiness</span>
            </div>
          </div>

        </div>

      </section>

      {/* =========================================================================
          3. FULL ECOSYSTEM CAPABILITY SHOWCASE (4 CORE PILLARS)
          ========================================================================= */}
      <section className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/90 pb-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-extrabold text-sky-600 uppercase tracking-widest">
              NATIONWIDE EV PLATFORM
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              One Unified EV Ecosystem
            </h2>
          </div>

          <Link
            to="/explore"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1.5 group"
          >
            <span>Explore all subsystems</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Pillar 1: VoltMap */}
          <Link
            to="/explore"
            className="vc-card p-6 bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover hover:border-sky-500/80 transition-all space-y-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-extrabold text-navy-900 group-hover:text-sky-600 transition-colors">
                VoltMap Network
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Live interactive radar covering 1,771+ high-power DC fast charging hubs across 703 Indian cities.
              </p>
            </div>
            <div className="text-xs font-bold text-sky-600 flex items-center gap-1 pt-2">
              <span>View Map</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Pillar 2: VoltTrip */}
          <Link
            to="/trips"
            className="vc-card p-6 bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover hover:border-teal-500/80 transition-all space-y-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
              <Navigation className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-extrabold text-navy-900 group-hover:text-teal-600 transition-colors">
                Smart Trip Planner
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Corridor charging intelligence, sequential reachability analysis, and FASTag toll expense estimation.
              </p>
            </div>
            <div className="text-xs font-bold text-teal-600 flex items-center gap-1 pt-2">
              <span>Plan Journey</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Pillar 3: VoltHealth */}
          <Link
            to="/health"
            className="vc-card p-6 bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover hover:border-emerald-500/80 transition-all space-y-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-extrabold text-navy-900 group-hover:text-emerald-600 transition-colors">
                VoltHealth SOH
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Real-time battery State of Health diagnostics, cell degradation tracking, and range efficiency telemetry.
              </p>
            </div>
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 pt-2">
              <span>Run Diagnostics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Pillar 4: VoltAI */}
          <Link
            to="/volt-ai"
            className="vc-card p-6 bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover hover:border-sky-500/80 transition-all space-y-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-extrabold text-navy-900 group-hover:text-sky-600 transition-colors">
                VoltAI Copilot
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Contextual EV assistant answering real-time questions about your vehicle, tariffs, and route planning.
              </p>
            </div>
            <div className="text-xs font-bold text-sky-600 flex items-center gap-1 pt-2">
              <span>Ask VoltAI</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

        </div>

      </section>

      {/* =========================================================================
          4. FINAL CONVERGENCE CALL TO ACTION
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-slate-900 via-navy-900 to-slate-950 text-white border border-slate-800 shadow-2xl relative overflow-hidden text-center space-y-6">
          
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>READY FOR THE ROAD</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Start Your Intelligent EV Journey Today
            </h2>

            <p className="text-sm sm:text-base text-slate-300 font-medium">
              Join thousands of electric vehicle drivers navigating India with zero range anxiety and full voice automation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-heading font-extrabold text-sm tracking-wide shadow-lg hover:shadow-glow-volt transition-all flex items-center justify-center gap-2"
            >
              <span>CREATE DRIVER ACCOUNT</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-heading font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <span>SIGN IN TO DASHBOARD</span>
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
};
