import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  Truck,
  BatteryWarning,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const VoltSOSPage: React.FC = () => {
  const { activeVehicle } = useAuth();
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'requesting' | 'dispatched'>('idle');

  const handleRequestSOS = () => {
    setDispatchStatus('requesting');
    setTimeout(() => {
      setDispatchStatus('dispatched');
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      
      {/* High-Visibility Emergency Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-heading font-extrabold text-xs uppercase tracking-widest bg-white/20 px-3.5 py-1 rounded-full text-white">
            <ShieldAlert className="w-4 h-4 animate-pulse text-white" /> Emergency Response System
          </div>
          <span className="text-xs font-bold bg-black/30 px-3 py-1 rounded-full">24/7 Live Support</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold">
          VoltSOS Emergency Dispatch
        </h1>

        <p className="text-sm text-rose-100 max-w-2xl leading-relaxed">
          Critical low-battery emergency assistance, roadside recovery dispatch, and emergency mobile charging unit pairing for <span className="font-bold text-white">{activeVehicle?.manufacturer} {activeVehicle?.model}</span>.
        </p>
      </div>

      {/* Dispatch Action Panel */}
      <div className="vc-card p-8 bg-white border border-rose-200 space-y-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Active Incident Protocol</span>
            <h2 className="font-heading text-xl font-extrabold text-navy-900">Request Emergency Mobile Support</h2>
          </div>

          <a
            href="tel:18005558658"
            className="vc-btn vc-btn-amber py-3 px-6 text-xs font-extrabold flex items-center gap-2 shrink-0"
          >
            <PhoneCall className="w-4 h-4" /> Call Hotline: 1800-555-VOLT
          </a>
        </div>

        {dispatchStatus === 'idle' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-lg">
              <BatteryWarning className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="font-heading font-extrabold text-lg text-navy-900">
                Stranded or Low Battery (&lt;10%)?
              </h3>
              <p className="text-xs text-slate-500">
                Click below to broadcast your live GPS coordinates to the nearest mobile charging van & technician.
              </p>
            </div>

            <button
              onClick={handleRequestSOS}
              className="vc-btn bg-rose-600 text-white hover:bg-rose-700 py-4 px-10 text-base font-extrabold shadow-lg hover:scale-105 transition-all"
            >
              DISPATCH VOLTSOS MOBILE UNIT NOW
            </button>
          </div>
        )}

        {dispatchStatus === 'requesting' && (
          <div className="text-center py-10 space-y-4">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="font-bold text-sm text-navy-900">Locating Nearest Mobile Charging Unit...</div>
          </div>
        )}

        {dispatchStatus === 'dispatched' && (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-extrabold text-lg text-emerald-900">Mobile Charging Unit Dispatched</h3>
              <p className="text-xs text-emerald-700">Estimated Arrival: 18 minutes • Fleet Vehicle #VC-SOS-04</p>
            </div>

            <button
              onClick={() => setDispatchStatus('idle')}
              className="vc-btn vc-btn-secondary py-2 px-4 text-xs font-bold"
            >
              Reset Emergency State
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
