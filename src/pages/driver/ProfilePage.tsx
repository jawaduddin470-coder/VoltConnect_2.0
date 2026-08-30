import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  calculateAvailableEnergy,
  calculateEstimatedRange,
  calculateBatteryHealthEstimate,
} from '@/features/vehicles/utils/calculationEngine';
import {
  Car,
  Zap,
  Battery,
  ShieldCheck,
  Activity,
  Sliders,
  CheckCircle2,
  Clock,
  Info,
  TrendingUp,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, activeVehicle, updateVehicle } = useAuth();
  const [socInput, setSocInput] = useState(activeVehicle?.currentBatteryPercent || 78);
  const [nicknameInput, setNicknameInput] = useState(activeVehicle?.nickname || '');

  if (!activeVehicle) {
    return (
      <div className="vc-card p-12 text-center space-y-4 max-w-md mx-auto">
        <Car className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="font-heading text-xl font-extrabold text-navy-900">No Active EV Selected</h2>
        <p className="text-xs text-slate-500">Please add or select an active EV in My Garage.</p>
      </div>
    );
  }

  const availEnergy = calculateAvailableEnergy(
    activeVehicle.batteryCapacitykWh,
    activeVehicle.usableCapacitykWh,
    socInput,
    activeVehicle.estimatedHealthSOH || 98
  );

  const rangeRes = calculateEstimatedRange(activeVehicle.category, availEnergy);
  const healthRes = calculateBatteryHealthEstimate(1.5, 240, 'moderate');

  const handleSavePreferences = () => {
    updateVehicle(activeVehicle.id, {
      currentBatteryPercent: socInput,
      nickname: nicknameInput || undefined,
    });
    alert('Vehicle preferences saved successfully.');
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. VEHICLE IDENTITY HERO */}
      <div className="vc-card p-8 bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="vc-badge vc-badge-teal text-[10px]">{activeVehicle.category}</span>
            <span className="vc-badge vc-badge-green font-bold text-[10px]">Active EV Profile</span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold">
            {activeVehicle.manufacturer} {activeVehicle.model}
          </h1>
          <p className="text-xs text-slate-300">
            {activeVehicle.nickname ? `"${activeVehicle.nickname}" • ` : ''}{activeVehicle.variant || 'Standard Pack'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/20 text-center">
            <div className="text-[10px] text-slate-300 font-bold uppercase">Battery SOH</div>
            <div className="font-heading text-2xl font-extrabold text-emerald-400">{activeVehicle.estimatedHealthSOH || 98}%</div>
          </div>
        </div>
      </div>

      {/* 2. CURRENT ENERGY & RANGE INTELLIGENCE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* State of Charge Card */}
        <div className="vc-card p-6 space-y-4 bg-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">State of Charge</span>
          <div className="font-heading text-4xl font-extrabold text-navy-900 flex items-center gap-2">
            {socInput}%
            <Zap className="w-7 h-7 text-emerald-500 fill-current" />
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" style={{ width: `${socInput}%` }} />
          </div>
          <div className="text-xs text-slate-500">
            Available Net Usable Energy: <span className="font-bold text-slate-900">{availEnergy} kWh</span>
          </div>
        </div>

        {/* Practical Range Estimate */}
        <div className="vc-card p-6 space-y-4 bg-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Practical Range Estimate</span>
          <div className="font-heading text-4xl font-extrabold text-teal-600">{rangeRes.estimatedRangeKm} km</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Factoring {rangeRes.efficiencyWhPerKm} Wh/km efficiency & 8% climate safety margin.
          </p>
        </div>

        {/* Charging Capabilities */}
        <div className="vc-card p-6 space-y-4 bg-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Charging Parameters</span>
          <div className="text-xs space-y-2 text-slate-600">
            <div>AC Max Power: <span className="font-bold text-slate-900">{activeVehicle.acMaxPowerKW} kW</span></div>
            <div>DC Fast Power: <span className="font-bold text-emerald-600">{activeVehicle.dcMaxPowerKW} kW</span></div>
            <div className="flex flex-wrap gap-1 pt-1">
              {activeVehicle.connectorTypes.map(c => (
                <span key={c} className="vc-badge vc-badge-teal text-[10px]">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 3. VEHICLE PREFERENCES & SOC CALIBRATION */}
      <div className="vc-card p-8 bg-white space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telemetry Calibration</span>
          <h2 className="font-heading text-xl font-extrabold text-navy-900">Vehicle Preferences & SOC Manual Update</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold">
          <div className="space-y-1.5">
            <label className="text-slate-700">Update Current SOC (% Battery)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={socInput}
              onChange={e => setSocInput(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-navy-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700">Vehicle Nickname</label>
            <input
              type="text"
              value={nicknameInput}
              onChange={e => setNicknameInput(e.target.value)}
              placeholder="e.g. Primary Nexon"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-navy-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSavePreferences} className="vc-btn vc-btn-teal py-2.5 px-6 text-xs font-bold shadow-md">
            Save Preferences
          </button>
        </div>
      </div>

    </div>
  );
};
