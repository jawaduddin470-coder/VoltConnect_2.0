import React from 'react';
import { Link } from 'react-router-dom';
import { VoltConnectLogo } from '@/components/common/VoltConnectLogo';
import { ShieldCheck, Lock, Zap, Sliders, BatteryCharging, Navigation, ArrowRight } from 'lucide-react';

export const AuthGateView: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="vc-card max-w-2xl w-full p-8 sm:p-12 bg-slate-900 text-white rounded-3xl space-y-8 shadow-2xl border border-slate-800 relative overflow-hidden">
        
        {/* Subtle Background EV Network Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%">
            <pattern id="auth_gate_grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#0EA5E9" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#auth_gate_grid)" />
          </svg>
        </div>

        {/* Header Branding & Lock Badge */}
        <div className="relative z-10 space-y-4 text-center">
          <div className="flex justify-center">
            <VoltConnectLogo variant="auth" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-extrabold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" /> PERSONALIZED EV WORKSPACE
          </div>

          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            VoltMap is part of your personalized EV workspace.
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Sign in to unlock personalized charging station discovery, vehicle connector matching, and real-time range estimation tailored specifically to your EV.
          </p>
        </div>

        {/* Value Proposition Feature Checklist */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-teal-400">
              <Zap className="w-4 h-4 shrink-0" />
              <span>Identify Your EV Specs</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Connect your specific EV make and model to calculate exact battery capacity and charging curves.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-sky-400">
              <Sliders className="w-4 h-4 shrink-0" />
              <span>Filter Compatible Chargers</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Filter public fast chargers matching your port standard (CCS2, Type2, CHAdeMO, Ather).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400">
              <BatteryCharging className="w-4 h-4 shrink-0" />
              <span>Calculate Reachable Range</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Visualize reachable stations based on your vehicle's real-time state of charge (SOC %).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400">
              <Navigation className="w-4 h-4 shrink-0" />
              <span>Charging-Aware Journeys</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Plan highway trips with automated fast-charging stop recommendations and target SOC buffers.
            </p>
          </div>

        </div>

        {/* Action CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 border-t border-slate-800">
          <Link
            to="/login"
            className="vc-btn vc-btn-teal py-3.5 px-8 text-xs font-extrabold shadow-md hover:scale-[1.02] transition-all w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <span>Sign In to Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/signup"
            className="vc-btn vc-btn-secondary-dark py-3.5 px-8 text-xs font-extrabold w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <span>Get Started</span>
          </Link>
        </div>

        {/* Footnote Guarantee */}
        <div className="relative z-10 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 pt-1">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <span>VoltConnect 2.0 Secure Mobility Platform</span>
        </div>

      </div>
    </div>
  );
};
