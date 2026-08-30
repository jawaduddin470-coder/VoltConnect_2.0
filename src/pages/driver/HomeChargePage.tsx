import React, { useState } from 'react';
import { Home, Zap, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const HomeChargePage: React.FC = () => {
  const [residenceType, setResidenceType] = useState('apartment');
  const [hasDedicatedParking, setHasDedicatedParking] = useState(true);
  const [electricalLoadkW, setElectricalLoadkW] = useState('7.2');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Home className="w-6 h-6 text-teal-500" />
          HomeCharge Residential Installation
        </h1>
        <p className="text-xs text-slate-500">
          Home charging readiness assessment, electrical load evaluation, and certified installer connection.
        </p>
      </div>

      {!submitted ? (
        <div className="max-w-2xl vc-card p-8 space-y-6 bg-white">
          <div className="space-y-1">
            <span className="vc-badge vc-badge-teal">Installation Wizard</span>
            <h3 className="font-heading font-extrabold text-xl text-slate-900">
              Check Home Charger Feasibility
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Residence Type</label>
              <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setResidenceType('apartment')}
                  className={`p-3 rounded-xl border transition-all ${
                    residenceType === 'apartment' ? 'border-sky-500 bg-sky-50 text-sky-900' : 'border-slate-200'
                  }`}
                >
                  Apartment Complex / Gated Community
                </button>
                <button
                  type="button"
                  onClick={() => setResidenceType('independent')}
                  className={`p-3 rounded-xl border transition-all ${
                    residenceType === 'independent' ? 'border-sky-500 bg-sky-50 text-sky-900' : 'border-slate-200'
                  }`}
                >
                  Independent Villa / House
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Dedicated Parking Spot</label>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="parking"
                    checked={hasDedicatedParking}
                    onChange={() => setHasDedicatedParking(true)}
                  />
                  Yes, allocated parking available
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="parking"
                    checked={!hasDedicatedParking}
                    onChange={() => setHasDedicatedParking(false)}
                  />
                  Shared / Open parking
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Target Charger Speed</label>
              <select
                value={electricalLoadkW}
                onChange={e => setElectricalLoadkW(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
              >
                <option value="3.3">3.3 kW AC Slow Charger (15A Socket)</option>
                <option value="7.2">7.2 kW AC Smart Wallbox (Single/3-Phase)</option>
                <option value="11">11.0 kW AC Fast Wallbox (Commercial/Villa 3-Phase)</option>
              </select>
            </div>

            <button type="submit" className="vc-btn vc-btn-teal w-full py-3.5 font-bold text-sm">
              Generate HomeCharge Feasibility Report
            </button>
          </form>
        </div>
      ) : (
        <div className="max-w-2xl vc-card p-8 space-y-6 bg-white animate-in fade-in">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="font-heading text-2xl font-extrabold text-slate-900">
              HomeCharge Readiness: HIGH
            </h3>
            <p className="text-xs text-slate-500">
              Based on your selection ({residenceType === 'apartment' ? 'Apartment Complex' : 'Villa'} with {electricalLoadkW} kW target charger), your residence is suitable for AC smart charger installation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-900">Recommended Steps & Partner Pairing:</div>
            <ul className="list-disc list-inside text-slate-600 space-y-1">
              <li>Assigned Partner: <span className="font-bold text-slate-900">VoltConnect Certified Home Installer</span></li>
              <li>Apartment NOC / Permission Template pre-generated.</li>
              <li>Dedicated 3-phase meter upgrade assessment requested.</li>
            </ul>
          </div>

          <button onClick={() => setSubmitted(false)} className="vc-btn vc-btn-secondary text-xs">
            Modify Assessment
          </button>
        </div>
      )}
    </div>
  );
};
