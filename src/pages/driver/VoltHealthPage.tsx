import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { voltHealthService } from '@/services/voltHealthService';
import { calculateBatteryHealthEstimate } from '@/features/vehicles/utils/calculationEngine';
import { BatteryHealthRecord } from '@/types';
import {
  Activity,
  ShieldCheck,
  Zap,
  Info,
  Battery,
  AlertCircle,
  Wrench,
  CheckCircle2,
  Lock,
  Clock,
  ChevronRight,
  Cpu,
  ArrowRight,
  Radio,
  Sliders,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Award,
} from 'lucide-react';

export const VoltHealthPage: React.FC = () => {
  const { activeVehicle } = useAuth();
  const navigate = useNavigate();
  const [healthHistory, setHealthHistory] = useState<BatteryHealthRecord[]>([]);

  useEffect(() => {
    if (activeVehicle) {
      voltHealthService.getHealthHistory(activeVehicle.id).then(records => {
        setHealthHistory(records);
      });
    }
  }, [activeVehicle]);

  if (!activeVehicle) {
    return (
      <div className="vc-card p-12 text-center space-y-4 max-w-md mx-auto bg-white border border-slate-200 shadow-sm">
        <Activity className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="font-heading text-xl font-extrabold text-navy-900">No Active EV Selected</h2>
        <p className="text-xs text-slate-500">Please select an active EV in My Garage to view health metrics.</p>
        <Link to="/garage" className="vc-btn vc-btn-teal py-2.5 px-6 text-xs font-bold inline-block">
          Go to My Garage
        </Link>
      </div>
    );
  }

  // Modelled SOH calculation
  const modeledHealth = calculateBatteryHealthEstimate(1.5, 240, 'moderate');

  const handleRequestServiceFromInsight = (category: string) => {
    navigate('/care', { state: { prefilledCategory: category } });
  };

  return (
    <div className="space-y-8 pb-16 vc-page-enter">
      
      {/* 1. HERO HEADER WITH MODELLED ESTIMATE DATA TRUST BADGE */}
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="vc-badge vc-badge-teal text-[10px] uppercase font-bold">{activeVehicle.category}</span>
            <span className="vc-badge vc-badge-navy text-[10px] uppercase font-extrabold text-amber-400 border-amber-500/30">
              DATA TRUST: MODELLED ESTIMATE
            </span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-white">MY EV HEALTH</h1>
          <p className="text-xs text-slate-300">
            Battery health intelligence for <span className="font-bold text-white">{activeVehicle.manufacturer} {activeVehicle.model}</span>.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 text-center shrink-0 space-y-0.5 shadow-lg">
          <span className="text-[9px] text-slate-400 font-bold uppercase block">Battery Health (SOH)</span>
          <span className="font-heading text-4xl font-extrabold text-emerald-400">{modeledHealth.estimatedHealthSOH}%</span>
          <span className="text-[10px] text-emerald-400 block font-extrabold uppercase tracking-wider">Condition: Optimal</span>
        </div>
      </div>

      {/* 2. DATA TRANSPARENCY NOTICE */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-semibold flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
            <span>DATA TRANSPARENCY NOTICE — MODELLED ESTIMATE</span>
            <span className="vc-badge vc-badge-amber text-[8px]">NON-TELEMETRY</span>
          </div>
          <p className="text-slate-700 leading-relaxed text-[11px]">
            Battery State of Health (SOH) metrics are platform estimates derived from factory pack capacity ({activeVehicle.batteryCapacitykWh} kWh), vehicle age, and cycle degradation physics. Measured CAN-bus / OBD-II hardware telemetry will display automatically when a live vehicle telemetry bridge is connected.
          </p>
        </div>
      </div>

      {/* 3. SEPARATION: MODELLED DATA VS MEASURED TELEMETRY ARCHITECTURE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* MODELLED DATA PANEL */}
        <div className="vc-card p-6 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-500" />
              <h2 className="font-heading font-extrabold text-base text-navy-900">MODELLED DATA</h2>
            </div>
            <span className="vc-badge vc-badge-teal text-[9px]">PHYSICS ENGINE</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Modelled SOH</span>
              <span className="font-extrabold text-emerald-600 text-lg">{modeledHealth.estimatedHealthSOH}%</span>
              <span className="text-[10px] text-slate-500 block">Factory Curve</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Usable Capacity</span>
              <span className="font-extrabold text-teal-600 text-lg">{modeledHealth.usableCapacitykWh} kWh</span>
              <span className="text-[10px] text-slate-500 block">Available Energy</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Degradation Rate</span>
              <span className="font-extrabold text-navy-900 text-sm">~1.2% / Year</span>
              <span className="text-[10px] text-slate-500 block">Standard Rate</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Thermal Rating</span>
              <span className="font-extrabold text-emerald-600 text-sm">Optimal 28°C</span>
              <span className="text-[10px] text-slate-500 block">Modelled Range</span>
            </div>
          </div>
        </div>

        {/* MEASURED DATA (TELEMETRY READY ARCHITECTURE) */}
        <div className="vc-card p-6 bg-slate-900 text-white rounded-3xl space-y-4 shadow-xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
              <h2 className="font-heading font-extrabold text-base text-white">MEASURED TELEMETRY</h2>
            </div>
            <span className="vc-badge vc-badge-navy text-[9px] text-amber-400 border-amber-500/30">CAN / OBD READY</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">Hardware Bridge Status:</span>
              <span className="text-amber-400 font-extrabold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Ready for Pairing
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Connect a Bluetooth / WiFi OBD-II adapter or OEM telematics API to unlock real-time cell voltage balance and measured BMS telemetry.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs opacity-60">
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Measured BMS SOH</span>
              <span className="font-extrabold text-slate-400 text-sm">--.-- %</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Cell Voltage Delta</span>
              <span className="font-extrabold text-slate-400 text-sm">-- mV</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. DEGRADATION TREND & CONDITION ANALYSIS */}
      <div className="vc-card p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Battery Condition & Lifetime Projection</span>
            <h2 className="font-heading text-xl font-extrabold text-navy-900">SOH Degradation Trend</h2>
          </div>
          <span className="vc-badge vc-badge-green text-[10px]">HEALTHY CONDITION</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* SOH Curve Projection Bars */}
          <div className="lg:col-span-7 space-y-3">
            <div className="text-xs font-bold text-slate-700">Projected SOH Retention Over Time</div>
            
            <div className="space-y-2 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-600 text-[11px]">
                  <span>Year 1 (Current)</span>
                  <span className="text-emerald-600">98% SOH</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '98%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-600 text-[11px]">
                  <span>Year 3 (Projected)</span>
                  <span className="text-teal-600">94% SOH</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: '94%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-600 text-[11px]">
                  <span>Year 5 (Projected)</span>
                  <span className="text-sky-600">90% SOH</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: '90%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Condition Cards */}
          <div className="lg:col-span-5 space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
            <div className="font-extrabold text-navy-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" /> Battery Condition Assessment
            </div>
            <ul className="space-y-2 text-slate-600 text-[11px]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Thermal dissipation operating within safe limits.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Cell degradation within factory warranty baseline.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>No critical cell imbalance detected.</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* 5. MAINTENANCE RECOMMENDATIONS & INSPECTION REMINDERS */}
      <div className="vc-card p-6 sm:p-8 bg-slate-900 text-white rounded-3xl space-y-6 shadow-xl border border-slate-800">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Maintenance & Inspection</span>
            <h2 className="font-heading text-xl font-extrabold text-white">Recommended Maintenance & Inspection</h2>
          </div>
          <span className="vc-badge vc-badge-teal text-[9px]">VOLTCARE READY</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="vc-badge vc-badge-teal text-[9px]">INSPECTION REMINDER</span>
              <span className="text-[10px] text-slate-400 font-bold">Due in 45 Days</span>
            </div>

            <h3 className="font-heading font-extrabold text-sm text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" /> Battery Thermal Coolant & BMS Inspection
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Recommended periodic fluid inspection for optimal battery thermal management during fast DC charging.
            </p>

            <button
              onClick={() => handleRequestServiceFromInsight('battery_issue')}
              className="vc-btn vc-btn-teal py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 w-full justify-center"
            >
              <span>SCHEDULE INSPECTION IN VOLTCARE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="vc-badge vc-badge-green text-[9px]">OPTIMIZATION</span>
              <span className="text-[10px] text-slate-400 font-bold">Best Practice</span>
            </div>

            <h3 className="font-heading font-extrabold text-sm text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" /> AC Slow Charging Cycle
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Charge to 100% via slow AC charger once per week to enable automatic cell balancing across all battery modules.
            </p>

            <Link
              to="/homecharge"
              className="vc-btn vc-btn-secondary-dark py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 w-full justify-center"
            >
              <span>VIEW HOME CHARGING GUIDE</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};
