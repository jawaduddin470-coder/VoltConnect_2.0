import React from 'react';
import { Link } from 'react-router-dom';
import { LogoFull } from '@/assets/LogoFull';
import { IntroReplay } from '@/components/intro/IntroReplay';
import { INITIAL_CHARGING_STATIONS } from '@/features/charging/data/stationsSeed';
import { calculateVoltScore } from '@/features/charging/utils/voltScore';
import {
  Zap,
  MapPin,
  Navigation,
  Activity,
  Wrench,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bot,
  BarChart3,
  Cpu,
  Radio,
  Layers,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const previewStation = INITIAL_CHARGING_STATIONS[0];
  const voltScoreObj = calculateVoltScore(previewStation);

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      
      {/* 1. HERO SECTION — EDITORIAL EV ECOSYSTEM COMPOSITION */}
      <section className="relative pt-8 pb-16 lg:pt-16 lg:pb-24 rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Subtle Background Grid Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg width="100%" height="100%">
            <pattern id="public_hero_grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#public_hero_grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Value Proposition & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  VoltConnect Platform 2.0
                </div>

                <IntroReplay onReplay={() => window.dispatchEvent(new CustomEvent('vc_replay_intro'))} />
              </div>

              <div className="space-y-3">
                <h1 className="font-heading text-4xl sm:text-6xl font-extrabold text-navy-900 tracking-tight leading-[1.1]">
                  Electric mobility, <span className="text-sky-500">connected.</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-600 max-w-xl font-medium leading-relaxed">
                  One intelligent ecosystem for EV charging, navigation, vehicle health, maintenance and intelligence.
                </p>
              </div>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/signup"
                  className="vc-btn vc-btn-teal py-4 px-8 text-sm font-extrabold shadow-md hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5"
                >
                  <span>GET STARTED</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/explore"
                  className="vc-btn vc-btn-secondary py-4 px-8 text-sm font-extrabold border-slate-300 hover:border-sky-500 transition-all flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-sky-500" />
                  <span>EXPLORE VOLTMAP</span>
                </Link>
              </div>

              {/* Ecosystem Trust Signals */}
              <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>Multi-EV Form Factors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>Verified Network Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>Contextual AI Copilot</span>
                </div>
              </div>

            </div>

            {/* Right Column: Abstract EV Ecosystem Visualization & Volt Pulse Motif */}
            <div className="lg:col-span-5 relative">
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-2xl space-y-6 relative overflow-hidden border border-slate-800">
                
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <span>Ecosystem Architecture</span>
                  </div>
                  <span className="vc-badge vc-badge-sky text-[9px]">VOLT PULSE ACTIVE</span>
                </div>

                {/* Technical Ecosystem Node Flow Visualization */}
                <div className="space-y-4 text-xs">
                  
                  {/* Node 1: Vehicle Energy State */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white">Vehicle Subsystem</div>
                        <div className="text-[10px] text-slate-400">Usable Energy: 43.2 kWh</div>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-bold text-[11px]">78% SOC</span>
                  </div>

                  {/* Pulsing Connector Path */}
                  <div className="flex justify-center my-1">
                    <div className="w-0.5 h-6 bg-gradient-to-b from-teal-500 to-sky-500 animate-pulse" />
                  </div>

                  {/* Node 2: Station Hub & VoltScore */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white">Infrastructure Node</div>
                        <div className="text-[10px] text-slate-400">150kW CCS2 Fast Ports</div>
                      </div>
                    </div>
                    <span className="vc-badge vc-badge-teal text-[10px]">VoltScore 96</span>
                  </div>

                  {/* Pulsing Connector Path */}
                  <div className="flex justify-center my-1">
                    <div className="w-0.5 h-6 bg-gradient-to-b from-sky-500 to-emerald-500 animate-pulse" />
                  </div>

                  {/* Node 3: Intelligence & Routing */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white">VoltAI & Insight Engine</div>
                        <div className="text-[10px] text-slate-400">Data-Grounded Copilot</div>
                      </div>
                    </div>
                    <span className="text-sky-400 font-bold text-[11px]">Synced</span>
                  </div>

                </div>

                <div className="pt-2 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
                  Energy &rarr; Vehicle &rarr; Charger &rarr; Network
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. VOLTMAP SHOWCASE SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="vc-card p-8 lg:p-10 bg-slate-900 text-white rounded-3xl space-y-8 shadow-xl relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-6">
            <div className="space-y-2 max-w-xl">
              <span className="vc-badge vc-badge-sky text-[10px] uppercase">Core Platform Engine</span>
              <h2 className="font-heading text-3xl font-extrabold">VoltMap Charging Network Intelligence</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Vehicle-aware charging station lookup factoring connector compatibility, tariff transparency, and VoltScore reliability.
              </p>
            </div>

            <Link
              to="/explore"
              className="vc-btn vc-btn-teal py-3 px-6 text-xs font-bold flex items-center gap-2 self-start md:self-auto shrink-0"
            >
              <span>Explore Full Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Interactive Station Preview Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Verified Station Preview</div>
                  <h3 className="font-heading font-extrabold text-lg text-white mt-0.5">{previewStation.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{previewStation.address}</p>
                </div>

                {/* Signature VoltScore Ring */}
                <div className="vc-voltscore-ring w-12 h-12 border-emerald-500 text-emerald-400 bg-emerald-950/60 text-xs shrink-0 font-extrabold">
                  {voltScoreObj.score}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="font-bold text-emerald-400">Available</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Ports Open</span>
                  <span className="font-bold text-white">3 of 4 Open</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Tariff</span>
                  <span className="font-bold text-sky-400">₹21.0 / kWh</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">VoltScore Rating Engine</div>
                  <p className="text-slate-400 text-[11px] mt-0.5">Evaluates charger uptime, pricing accuracy, data freshness, and user report history.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Connector Filter Matching</div>
                  <p className="text-slate-400 text-[11px] mt-0.5">Filters stations matching your active EV's connector standard (CCS2, Type2, CHAdeMO).</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. EDITORIAL ECOSYSTEM FEATURE PRESENTATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="vc-badge vc-badge-teal">Integrated Platform Capabilities</span>
          <h2 className="font-heading text-3xl font-extrabold text-navy-900">
            Engineered for every dimension of EV mobility.
          </h2>
        </div>

        {/* Feature Split 1: Smart Trips & Energy Routing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-bold shadow-sm">
              <Navigation className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-2xl font-extrabold text-navy-900">
              Smart Journey & Energy Planner
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Calculates route distance against your active battery capacity, terrain factors, and required intermediate fast-charging waypoints with target arrival SOC buffers.
            </p>
            <Link to="/explore" className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:underline pt-1">
              <span>View Route Intelligence</span> <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="lg:col-span-6 vc-card p-6 bg-slate-50 border-slate-200 space-y-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Route Energy Calculation Showcase</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Distance</span>
                <span className="font-extrabold text-navy-900 text-sm">275 km</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Arrival SOC</span>
                <span className="font-extrabold text-emerald-600 text-sm">45% Target</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Split 2: VoltHealth & VoltCare */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center lg:flex-row-reverse">
          <div className="lg:col-span-6 lg:order-2 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-2xl font-extrabold text-navy-900">
              VoltHealth & VoltCare Maintenance
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Track battery SOH degradation profiles and initiate progressive service request setup connected to assigned field technicians and certified service partners.
            </p>
            <Link to="/explore" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline pt-1">
              <span>Explore Vehicle Care</span> <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="lg:col-span-6 lg:order-1 vc-card p-6 bg-slate-50 border-slate-200 space-y-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Battery SOH & Maintenance Pipeline</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Modelled SOH</span>
                <span className="font-extrabold text-emerald-600 text-sm">98% Rating</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Service Lifecycle</span>
                <span className="font-extrabold text-navy-900 text-sm">State Machine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Split 3: VoltAI & VoltInsight */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-navy-900 text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5 text-sky-400" />
            </div>
            <h3 className="font-heading text-2xl font-extrabold text-navy-900">
              VoltAI Copilot & VoltInsight Analytics
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Context-aware assistant aware of your vehicle specs, SOC %, and real-time charging network, paired with transparent Wh/km efficiency and VoltScore composite breakdowns.
            </p>
          </div>

          <div className="lg:col-span-6 vc-card p-6 bg-slate-900 text-white space-y-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data-Grounded Copilot Response</div>
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs space-y-1">
              <div className="font-bold text-sky-400 flex items-center gap-1.5">
                <Bot className="w-4 h-4" /> VoltAI Response
              </div>
              <p className="text-slate-300 text-[11px]">
                Recommended station: VoltConnect Hub Gachibowli (2.4 km away, ₹18/kWh). 3 CCS2 ports open.
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* 4. FINAL PUBLIC CALL-TO-ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="vc-card p-10 lg:p-14 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 text-white rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Ready to experience connected electric mobility?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Join VoltConnect today to discover charging, plan energy-aware journeys, and manage your complete EV experience.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/signup"
              className="vc-btn vc-btn-teal py-3.5 px-8 text-sm font-extrabold shadow-md hover:scale-[1.02] transition-all w-full sm:w-auto"
            >
              GET STARTED NOW
            </Link>
            <Link
              to="/login"
              className="vc-btn vc-btn-secondary-dark py-3.5 px-8 text-sm font-extrabold w-full sm:w-auto"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
