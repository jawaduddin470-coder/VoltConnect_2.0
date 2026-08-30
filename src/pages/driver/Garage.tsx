import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AddVehicleModal } from '@/components/garage/AddVehicleModal';
import { UserVehicle } from '@/types';
import {
  Car,
  Bike,
  Truck,
  Package,
  Bus,
  Zap,
  Plus,
  CheckCircle2,
  Trash2,
  Star,
  Activity,
  BatteryCharging,
  ShieldCheck,
  Edit2,
  Navigation,
  Wrench,
  BarChart3,
  Compass,
  Cpu,
  X,
  Gauge,
  Plug,
  Sparkles,
} from 'lucide-react';

export const GaragePage: React.FC = () => {
  const { vehicles, activeVehicle, setActiveVehicle, removeVehicle, updateVehicle } = useAuth();
  const navigate = useNavigate();

  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<UserVehicle | null>(null);
  const [editNickname, setEditNickname] = useState('');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '4-wheeler': return <Car className="w-5 h-5 text-sky-400" />;
      case '2-wheeler': return <Bike className="w-5 h-5 text-teal-400" />;
      case '3-wheeler': return <Truck className="w-5 h-5 text-amber-400" />;
      case 'commercial': return <Package className="w-5 h-5 text-indigo-400" />;
      case 'heavy': return <Bus className="w-5 h-5 text-emerald-400" />;
      default: return <Zap className="w-5 h-5 text-yellow-400" />;
    }
  };

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    updateVehicle(editingVehicle.id, { nickname: editNickname });
    setEditingVehicle(null);
  };

  const handleConfirmDelete = (id: string) => {
    removeVehicle(id);
    setDeletingId(null);
  };

  return (
    <div className="space-y-10 pb-16 vc-page-enter">
      
      {/* 1. GARAGE HERO HEADER */}
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        
        {/* Background EV Grid Overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg width="100%" height="100%">
            <pattern id="garage_hero_grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#0EA5E9" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#garage_hero_grid)" />
          </svg>
        </div>

        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" /> CENTRAL VEHICLE MANAGEMENT
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-white">MY EV GARAGE</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Central management area for your electric vehicles. Manage technical parameters, battery SOC, and active mobility context.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="relative z-10 vc-btn vc-btn-teal py-3.5 px-6 text-xs font-extrabold flex items-center justify-center gap-2 shrink-0 shadow-lg hover:scale-[1.02] transition-all"
        >
          <Plus className="w-4 h-4" /> Add EV to Garage
        </button>
      </div>

      {/* 2. SUMMARY OVERVIEW METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="vc-card p-5 space-y-1 bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Registered EVs</span>
          <div className="font-heading font-extrabold text-3xl text-navy-900">{vehicles.length}</div>
          <span className="text-[11px] text-slate-500">Active Profile Fleet</span>
        </div>

        <div className="vc-card p-5 space-y-1 bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Pack Capacity</span>
          <div className="font-heading font-extrabold text-3xl text-emerald-600">
            {activeVehicle ? `${activeVehicle.batteryCapacitykWh} kWh` : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-500">Usable: {activeVehicle?.usableCapacitykWh || 0} kWh</span>
        </div>

        <div className="vc-card p-5 space-y-1 bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connector Standards</span>
          <div className="font-heading font-extrabold text-2xl text-sky-600 truncate mt-1">
            {activeVehicle ? activeVehicle.connectorTypes.join(', ') : 'None'}
          </div>
          <span className="text-[11px] text-slate-500 font-bold text-teal-600">VoltMap Auto-Matching Active</span>
        </div>
      </div>

      {/* 3. CENTRAL ACTIVE VEHICLE MANAGEMENT SPOTLIGHT */}
      {activeVehicle && (
        <section className="vc-card p-8 bg-slate-900 text-white rounded-3xl space-y-6 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="vc-badge vc-badge-teal text-[9px] uppercase font-bold">PRIMARY ACTIVE EV</span>
                <span className="text-xs text-slate-400 font-semibold">{activeVehicle.variant || 'Standard Variant'}</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
                <span>{activeVehicle.manufacturer} {activeVehicle.model}</span>
                {activeVehicle.nickname && <span className="text-slate-400 text-lg font-normal">"{activeVehicle.nickname}"</span>}
              </h2>
            </div>

            <button
              onClick={() => {
                setEditingVehicle(activeVehicle);
                setEditNickname(activeVehicle.nickname || '');
              }}
              className="vc-btn vc-btn-secondary-dark text-xs font-bold py-2 px-4 self-start sm:self-auto shrink-0 flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5 text-sky-400" /> Edit Nickname
            </button>
          </div>

          {/* Central 9-Parameter Technical Management Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            
            <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/80 space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Vehicle & Variant</span>
              <span className="font-extrabold text-white text-sm truncate block">{activeVehicle.model}</span>
              <span className="text-[10px] text-slate-400 block">{activeVehicle.variant || 'Standard'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/80 space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Battery Capacity</span>
              <span className="font-extrabold text-white text-sm">{activeVehicle.batteryCapacitykWh} kWh</span>
              <span className="text-[10px] text-slate-400 block">Gross Pack Size</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/80 space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Usable Capacity</span>
              <span className="font-extrabold text-teal-400 text-sm">{activeVehicle.usableCapacitykWh || Math.round(activeVehicle.batteryCapacitykWh * 0.95)} kWh</span>
              <span className="text-[10px] text-slate-400 block">Available Energy</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/80 space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Connectors</span>
              <span className="font-extrabold text-sky-400 text-sm truncate block">{activeVehicle.connectorTypes.join(', ')}</span>
              <span className="text-[10px] text-slate-400 block">Port Standard</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/80 space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Current SOC</span>
              <span className="font-extrabold text-emerald-400 text-sm">{activeVehicle.currentBatteryPercent || 85}%</span>
              <span className="text-[10px] text-slate-400 block">State of Charge</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/80 space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Rated Max Range</span>
              <span className="font-extrabold text-sky-400 text-sm">{activeVehicle.estimatedRangeKm} km</span>
              <span className="text-[10px] text-slate-400 block">Factory Rated</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/80 space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Current Est. Range</span>
              <span className="font-extrabold text-amber-400 text-sm">{Math.round(activeVehicle.estimatedRangeKm * ((activeVehicle.currentBatteryPercent || 85) / 100))} km</span>
              <span className="text-[10px] text-slate-400 block">SOC-Derived Range</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/80 space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Energy Efficiency</span>
              <span className="font-extrabold text-white text-sm">
                {activeVehicle.category === '2-wheeler' ? '32 Wh/km' : activeVehicle.category === 'commercial' ? '135 Wh/km' : '130 Wh/km'}
              </span>
              <span className="text-[10px] text-slate-400 block">Typical Rate</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/80 space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">DC Max Power</span>
              <span className="font-extrabold text-white text-sm">{activeVehicle.dcMaxPowerKW || 50} kW</span>
              <span className="text-[10px] text-slate-400 block">Peak Fast Charge</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/80 space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">AC Max Power</span>
              <span className="font-extrabold text-slate-200 text-sm">{activeVehicle.acMaxPowerKW || 7.2} kW</span>
              <span className="text-[10px] text-slate-400 block">AC Charger Peak</span>
            </div>

          </div>

          {/* Subsystem Shortcuts */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold">Matching Ports:</span>
              {activeVehicle.connectorTypes.map(c => (
                <span key={c} className="vc-badge vc-badge-teal text-[10px]">{c}</span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/explore" className="vc-btn vc-btn-teal py-2 px-3 text-[11px] font-bold flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> Charging
              </Link>
              <Link to="/trips" className="vc-btn vc-btn-secondary border-slate-700 py-2 px-3 text-[11px] font-bold text-white flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-sky-400" /> Trips
              </Link>
              <Link to="/health" className="vc-btn vc-btn-secondary border-slate-700 py-2 px-3 text-[11px] font-bold text-white flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> VoltHealth
              </Link>
              <Link to="/care" className="vc-btn vc-btn-secondary border-slate-700 py-2 px-3 text-[11px] font-bold text-white flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-amber-400" /> VoltCare
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 4. MULTI-VEHICLE MANAGEMENT GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-extrabold text-navy-900 uppercase tracking-wider">
            All Fleet EVs in Garage ({vehicles.length})
          </div>
          {vehicles.length > 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Another EV
            </button>
          )}
        </div>

        {/* HONEST EMPTY GARAGE STATE */}
        {vehicles.length === 0 ? (
          <div className="vc-card p-12 text-center space-y-4 max-w-lg mx-auto bg-white border border-slate-200 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-500 mx-auto flex items-center justify-center">
              <Car className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-extrabold text-xl text-navy-900">YOUR GARAGE IS EMPTY</h3>
              <p className="text-xs text-slate-500">
                Add your EV to personalize charging compatibility, trip routing, and battery intelligence.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="vc-btn vc-btn-teal py-3.5 px-6 text-xs font-extrabold shadow-md"
            >
              ADD YOUR EV
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map(veh => {
              const isPrimary = activeVehicle?.id === veh.id;

              return (
                <div
                  key={veh.id}
                  className={`vc-card p-6 space-y-5 flex flex-col justify-between transition-all bg-white border border-slate-200 shadow-xs ${
                    isPrimary ? 'ring-2 ring-emerald-500/30 border-emerald-500' : 'hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(veh.category)}
                        <span className="vc-badge vc-badge-navy uppercase text-[10px]">{veh.category}</span>
                      </div>

                      {isPrimary ? (
                        <span className="vc-badge vc-badge-green font-bold flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PRIMARY EV
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveVehicle(veh.id)}
                          className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5" /> Set Primary
                        </button>
                      )}
                    </div>

                    <div>
                      <h3 className="font-heading font-extrabold text-lg text-navy-900">
                        {veh.manufacturer} {veh.model}
                      </h3>
                      {veh.nickname && (
                        <p className="text-xs text-slate-500 font-medium">"{veh.nickname}"</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-0.5">{veh.variant || 'Standard Spec'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Capacity</span>
                        <span className="font-extrabold text-navy-900">{veh.batteryCapacitykWh} kWh</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Usable</span>
                        <span className="font-extrabold text-teal-600">{veh.usableCapacitykWh || Math.round(veh.batteryCapacitykWh * 0.95)} kWh</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Rated Range</span>
                        <span className="font-extrabold text-sky-600">{veh.estimatedRangeKm} km</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Practical Est.</span>
                        <span className="font-extrabold text-amber-600">{Math.round(veh.estimatedRangeKm * 0.82)} km</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => setDeletingId(veh.id)}
                      className="text-slate-400 hover:text-rose-600 flex items-center gap-1 font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>

                    {!isPrimary && (
                      <button
                        onClick={() => setActiveVehicle(veh.id)}
                        className="vc-btn vc-btn-secondary py-1.5 px-3 text-[11px] font-bold"
                      >
                        Switch Context
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT NICKNAME MODAL */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm vc-modal-backdrop">
          <div className="vc-card w-full max-w-sm p-6 space-y-4 shadow-2xl relative border-slate-200 vc-modal-content">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="font-heading font-extrabold text-sm text-navy-900">Edit Vehicle Nickname</div>
              <button onClick={() => setEditingVehicle(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNickname} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Vehicle Nickname</label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={e => setEditNickname(e.target.value)}
                  placeholder="e.g. White Falcon"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-navy-900 bg-slate-50"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingVehicle(null)} className="vc-btn vc-btn-ghost text-xs">
                  Cancel
                </button>
                <button type="submit" className="vc-btn vc-btn-teal py-2 px-5 text-xs font-bold">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm vc-modal-backdrop">
          <div className="vc-card w-full max-w-sm p-6 space-y-4 shadow-2xl relative border-slate-200 text-center vc-modal-content">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-heading font-extrabold text-base text-navy-900">Remove Vehicle from Garage?</h3>
              <p className="text-xs text-slate-500">This vehicle will be removed from your garage workspace.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={() => setDeletingId(null)} className="vc-btn vc-btn-ghost text-xs">
                Cancel
              </button>
              <button onClick={() => handleConfirmDelete(deletingId)} className="vc-btn bg-rose-600 text-white py-2 px-5 text-xs font-bold">
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD VEHICLE MODAL */}
      {showAddModal && <AddVehicleModal onClose={() => setShowAddModal(false)} />}

    </div>
  );
};
