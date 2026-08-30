import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { chargingDataService } from '@/services/chargingDataService';
import { calculateVoltScore } from '@/features/charging/utils/voltScore';
import { ChargingStation } from '@/types';
import {
  Zap,
  MapPin,
  Navigation,
  Activity,
  Wrench,
  Sparkles,
  ArrowRight,
  BatteryCharging,
  Car,
  ShieldCheck,
  Bot,
  BarChart3,
  AlertCircle,
  Plus,
  ChevronRight,
  Cpu,
  Compass,
  Sliders,
  DollarSign,
  Clock,
  Battery,
  ShieldAlert,
} from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { user, activeVehicle, updateActiveVehicleSOC } = useAuth();
  const [stations, setStations] = useState<ChargingStation[]>([]);

  // Fetch Firestore Stations for Nearby Charging Module
  useEffect(() => {
    chargingDataService.getStations().then(data => {
      setStations(data);
    });
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  // Dynamic User & Vehicle Derived Energy Metrics
  const userName = user?.name ? user.name.split(' ')[0].toUpperCase() : 'DRIVER';
  const batteryPercent = activeVehicle?.currentBatteryPercent ?? 85;
  const nominalRangeKm = activeVehicle?.estimatedRangeKm ?? 450;
  const batteryCapacitykWh = activeVehicle?.batteryCapacitykWh ?? 105.0;
  const usableCapacitykWh = activeVehicle?.usableCapacitykWh ?? Math.round(batteryCapacitykWh * 0.95);

  // Calculated Remaining Usable Energy = usableCapacitykWh * SOC / 100
  const remainingEnergykWh = Math.round((usableCapacitykWh * (batteryPercent / 100)) * 10) / 10;
  
  // Dynamic Estimated Practical Range = nominalRangeKm * (SOC / 100)
  const practicalRangeKm = Math.round(nominalRangeKm * (batteryPercent / 100));

  // Requirement 5: Driving Readiness Status Logic
  const getDrivingReadiness = (soc: number) => {
    if (soc > 60) return { label: 'READY FOR JOURNEY', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-extrabold' };
    if (soc >= 30) return { label: 'JOURNEY READY • CHARGING MAY BE REQUIRED', bg: 'bg-sky-500/20 text-sky-400 border-sky-500/30 font-extrabold' };
    if (soc >= 15) return { label: 'LOW SOC • PLAN A CHARGE STOP', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-extrabold' };
    return { label: 'CRITICAL SOC • CHARGE BEFORE JOURNEY', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-extrabold' };
  };

  const readiness = getDrivingReadiness(batteryPercent);

  // Requirement 20: Development Diagnostic Logging
  useEffect(() => {
    if (activeVehicle) {
      console.log(`[VoltConnect SOC]
Vehicle: ${activeVehicle.manufacturer} ${activeVehicle.model}
SOC: ${batteryPercent}%
Usable Battery: ${usableCapacitykWh} kWh
Remaining Energy: ${remainingEnergykWh} kWh
Estimated Range: ~${practicalRangeKm} km
      `);
    }
  }, [activeVehicle?.id, batteryPercent]);

  const previewStation = stations.length > 0 ? stations[0] : null;
  const voltScoreObj = previewStation ? calculateVoltScore(previewStation) : null;
  const openPortsCount = previewStation ? previewStation.chargers.filter(c => c.status === 'Available').length : 0;

  return (
    <div className="space-y-10 pb-16 vc-page-enter">
      
      {/* 1. PRIMARY HERO SURFACE — CENTRAL DIGITAL COCKPIT */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 sm:p-12 text-white shadow-2xl border border-slate-800">
        
        {/* Background EV Grid Overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg width="100%" height="100%">
            <pattern id="cockpit_hero_grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38BDF8" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#cockpit_hero_grid)" />
          </svg>
        </div>

        <div className="relative z-10 space-y-8">
          
          {/* Dynamic Greeting Header & Readiness Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-extrabold text-sky-400 uppercase tracking-widest">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>VOLTCONNECT DIGITAL COCKPIT</span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {getGreeting()}, <span className="text-teal-400">{userName}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                {activeVehicle
                  ? `Your ${activeVehicle.manufacturer} ${activeVehicle.model} is ready for today's journey.`
                  : 'Welcome to your EV workspace.'}
              </p>
            </div>

            {/* Requirement 5: Driving Readiness Badge */}
            <div className={`px-4 py-2 rounded-full border text-xs tracking-wider flex items-center gap-2 shrink-0 ${readiness.bg}`}>
              <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
              <span>{readiness.label}</span>
            </div>
          </div>

          {/* Focal Hero Display: Active EV, Current SOC, Practical Range & Energy Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            <div className="md:col-span-7 space-y-4">
              {activeVehicle ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="vc-badge vc-badge-teal text-[10px] uppercase font-extrabold">{activeVehicle.category}</span>
                    <span className="text-xs font-extrabold text-slate-400">{activeVehicle.variant || 'Standard Spec'}</span>
                    <span className="vc-badge vc-badge-navy text-[10px] uppercase text-sky-400 font-extrabold border-sky-500/30">
                      {usableCapacitykWh} kWh Usable Energy
                    </span>
                  </div>

                  <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                    {activeVehicle.manufacturer} {activeVehicle.model}
                    {activeVehicle.nickname && <span className="text-slate-400 text-lg font-normal ml-2">"{activeVehicle.nickname}"</span>}
                  </h2>

                  <div className="space-y-4 pt-1">
                    <div className="flex items-baseline gap-6 flex-wrap">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Battery SOC</span>
                        <span className="font-heading font-extrabold text-4xl sm:text-5xl text-emerald-400 flex items-center gap-2">
                          {batteryPercent}%
                          <BatteryCharging className="w-8 h-8 text-emerald-400 animate-pulse" />
                        </span>
                      </div>

                      <div className="space-y-0.5 border-l border-slate-800 pl-5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Remaining Energy</span>
                        <div className="text-2xl sm:text-3xl font-extrabold text-teal-300">
                          {remainingEnergykWh} <span className="text-sm font-normal text-slate-400">kWh</span>
                        </div>
                      </div>

                      <div className="space-y-0.5 border-l border-slate-800 pl-5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Practical Est. Range</span>
                        <div className="text-2xl sm:text-3xl font-extrabold text-sky-300">
                          ~{practicalRangeKm} <span className="text-sm font-normal text-slate-400">km</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Automotive Battery Bar */}
                    <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-700 max-w-lg shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                        style={{ width: `${batteryPercent}%` }}
                      />
                    </div>

                    {/* Requirement 14: Dynamic Charge Controller Slider */}
                    <div className="space-y-1.5 max-w-lg pt-1 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Battery className="w-3.5 h-3.5 text-emerald-400" /> DYNAMIC SOC CONTROLLER:
                        </span>
                        <span className="font-extrabold text-emerald-400">{batteryPercent}% SOC</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={batteryPercent}
                        onChange={e => updateActiveVehicleSOC(Number(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-0.5">
                        <span>0% (Empty)</span>
                        <span>50% (Mid)</span>
                        <span>85% (Daily)</span>
                        <span>100% (Full)</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">No Active Vehicle Configured</div>
                  <h2 className="font-heading text-2xl font-extrabold text-white">Add Your EV to Unlock Digital Cockpit</h2>
                  <p className="text-xs text-slate-400">
                    Connect your EV to calculate real-time range, filter compatible chargers, and track battery health.
                  </p>
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-col gap-3 justify-center">
              <Link
                to="/explore"
                className="vc-btn vc-btn-teal py-4 px-6 text-sm font-extrabold shadow-md hover:scale-[1.02] transition-all flex items-center justify-center gap-2.5 w-full"
              >
                <Zap className="w-4.5 h-4.5 fill-current text-white" />
                <span>FIND A CHARGER</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/trips"
                className="vc-btn vc-btn-secondary-dark py-3.5 px-6 text-sm font-extrabold transition-all flex items-center justify-center gap-2 w-full"
              >
                <Navigation className="w-4.5 h-4.5 text-sky-400" />
                <span>PLAN A TRIP</span>
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 2. SECONDARY MODULE 1: NEARBY CHARGING PREVIEW & VEHICLE SNAPSHOT */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Nearby Charging Preview Module */}
        <div className="lg:col-span-7 vc-card p-6 sm:p-8 bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Network Discovery</span>
              <h2 className="font-heading text-lg font-extrabold text-navy-900">Nearby Charging Preview</h2>
            </div>
            <Link to="/explore" className="text-xs font-extrabold text-sky-600 hover:underline flex items-center gap-1">
              <span>EXPLORE VOLTMAP</span> <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {previewStation ? (
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-md border border-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-sky-400 tracking-wider">
                    {previewStation.operatorName}
                  </span>
                  <h3 className="font-heading text-base font-extrabold text-white">{previewStation.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{previewStation.address}</span>
                  </p>
                </div>

                {voltScoreObj && (
                  <div className="text-center px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">VoltScore</span>
                    <span className="font-heading text-lg font-extrabold text-teal-400">{voltScoreObj.score}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
                <div className="p-2.5 rounded-xl bg-slate-800/80">
                  <span className="text-[9px] text-slate-400 block">OPEN PORTS</span>
                  <span className="font-extrabold text-emerald-400">{openPortsCount} Available</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/80">
                  <span className="text-[9px] text-slate-400 block">MAX SPEED</span>
                  <span className="font-extrabold text-sky-400">
                    {Math.max(...previewStation.chargers.map(c => c.powerKW), 50)} kW
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/80">
                  <span className="text-[9px] text-slate-400 block">TARIFF</span>
                  <span className="font-extrabold text-amber-400">
                    ₹{previewStation.chargers[0]?.pricingPerKWh || 18}/kWh
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">Loading charging hubs...</div>
          )}
        </div>

        {/* Vehicle Snapshot Card (Requirement 13: My EV Synchronization) */}
        <div className="lg:col-span-5 vc-card p-6 sm:p-8 bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-heading text-base font-extrabold text-navy-900 flex items-center gap-2">
              <Car className="w-4.5 h-4.5 text-sky-500" /> My EV Snapshot
            </h2>
            <Link to="/garage" className="text-xs font-bold text-sky-600 hover:underline">
              Manage EV
            </Link>
          </div>

          {activeVehicle ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="text-navy-900">{activeVehicle.manufacturer} {activeVehicle.model}</span>
                  <span className="text-emerald-600 font-mono">{batteryPercent}% SOC</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 pt-1">
                  <div>Remaining Energy: <strong className="text-slate-900">{remainingEnergykWh} kWh</strong></div>
                  <div>Practical Range: <strong className="text-sky-600">~{practicalRangeKm} km</strong></div>
                </div>
              </div>

              <Link
                to="/trips"
                className="w-full vc-btn vc-btn-teal py-3 text-xs font-extrabold flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" /> Launch Trip Planner
              </Link>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">No vehicle selected</div>
          )}
        </div>

      </section>

    </div>
  );
};
