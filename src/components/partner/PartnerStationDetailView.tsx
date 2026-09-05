import React from 'react';
import { ChargingStation } from '@/types';
import {
  ArrowLeft,
  MapPin,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Calendar,
  Compass,
  DollarSign,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface PartnerStationDetailViewProps {
  station: ChargingStation;
  onBack: () => void;
  onEdit: (station: ChargingStation, resubmit?: boolean) => void;
}

export const PartnerStationDetailView: React.FC<PartnerStationDetailViewProps> = ({
  station,
  onBack,
  onEdit,
}) => {
  const isApproved =
    (station.verificationStatus === 'verified' || station.verificationStatus === 'approved') && station.status === 'active';
  const isPending =
    station.verificationStatus === 'pending' || station.verificationStatus === 'under_review';
  const isRejected =
    station.verificationStatus === 'rejected';

  const maxPower = Math.max(...station.chargers.map(c => c.powerKW), 0);
  const tariff = station.chargers[0]?.pricingPerKWh || 18;

  // 5-Step Timeline calculation
  const timelineSteps = [
    {
      title: 'Partner Submission',
      desc: 'Hub specs & location entered by operator',
      status: 'complete',
    },
    {
      title: 'Admin Review Queue',
      desc: 'Dispatched to Network Operations team',
      status: 'complete',
    },
    {
      title: 'Technical & GPS Audit',
      desc: 'Verification of coordinates, tariff, & grid safety',
      status: isApproved || isRejected ? 'complete' : 'current',
    },
    {
      title: 'Verification Decision',
      desc: isApproved
        ? 'Verified & Approved by Admin'
        : isRejected
        ? 'Correction Requested by Admin'
        : 'Pending Administrator decision',
      status: isApproved ? 'complete' : isRejected ? 'rejected' : 'pending',
    },
    {
      title: 'Live on VoltMap',
      desc: isApproved
        ? 'Publicly discoverable by EV drivers'
        : 'Gated until verification is approved',
      status: isApproved ? 'complete' : 'pending',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Station Fleet
        </button>

        <div className="flex items-center gap-2">
          {isRejected ? (
            <button
              onClick={() => onEdit(station, true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Fix & Resubmit Station
            </button>
          ) : (
            <button
              onClick={() => onEdit(station, false)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Update Tariff / Metadata
            </button>
          )}
        </div>
      </div>

      {/* Hero Station Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-950 text-slate-400 border border-slate-800">
                {station.dataSource} Source
              </span>
              {isApproved ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  VERIFIED & ACTIVE
                </span>
              ) : isPending ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  AWAITING ADMIN APPROVAL
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  CORRECTION REQUIRED
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {station.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{station.address}, {station.city}</span>
            </div>
          </div>

          {/* Key Specs Pill */}
          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Tariff Rate</div>
              <div className="text-lg font-black text-emerald-400">₹{tariff}/kWh</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Max Power</div>
              <div className="text-lg font-black text-sky-400">{maxPower} kW</div>
            </div>
          </div>
        </div>

        {/* REJECTION REASON ALERT BANNER */}
        {isRejected && (
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm">
                <ShieldAlert className="w-5 h-5" />
                Admin Verification Feedback
              </div>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider bg-rose-500/20 px-2 py-0.5 rounded-full">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-950/60 p-3 rounded-xl border border-rose-500/20">
              "{station.rejectionReason || 'Please review your GPS coordinates and electrical connector specifications before resubmitting.'}"
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-slate-400">
                You can correct the flagged values and immediately resubmit. The Admin team will review your resubmission promptly.
              </p>
              <button
                onClick={() => onEdit(station, true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                Edit & Resubmit Now
              </button>
            </div>
          </div>
        )}

        {/* 5-STEP APPROVAL TIMELINE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Verification & Lifecycle Timeline
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              ID: {station.id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {timelineSteps.map((step, idx) => {
              const isDone = step.status === 'complete';
              const isCurrent = step.status === 'current';
              const isFailed = step.status === 'rejected';

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : isFailed
                      ? 'bg-rose-500/5 border-rose-500/30'
                      : isCurrent
                      ? 'bg-amber-500/5 border-amber-500/40 shadow-sm'
                      : 'bg-slate-950/50 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-500">
                      STEP {idx + 1}
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isFailed ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    ) : isCurrent ? (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-slate-700" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-white leading-snug">{step.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-normal">{step.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Technical & Hardware Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Installed Ports List (2 Columns) */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Installed Fast-Charging Ports ({station.chargers.length})
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              Total Output: {maxPower} kW
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {station.chargers.map((chg, idx) => (
              <div
                key={chg.id || idx}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">{chg.connectorType}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {chg.powerKW} kW
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Tariff: <span className="text-emerald-400 font-bold">₹{chg.pricingPerKWh || tariff}/kWh</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {chg.status || 'Available'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Location & Site Specifications (1 Column) */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-sky-400" />
            Location & Access Specs
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Exact GPS Coordinates</div>
              <div className="font-mono text-slate-200 mt-0.5">
                {station.latitude}, {station.longitude}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Operating Hours</div>
              <div className="font-semibold text-slate-200 mt-0.5">
                {station.operatingHours || '24/7 Open'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Amenities Provided</div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(station.amenities && station.amenities.length > 0
                  ? station.amenities
                  : ['Restroom', 'WiFi', 'EV Lounge']
                ).map(amenity => (
                  <span
                    key={amenity}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
