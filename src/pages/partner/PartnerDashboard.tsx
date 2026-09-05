import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { operationsService } from '@/services/operationsService';
import { chargingDataService } from '@/services/chargingDataService';
import { ChargingStation, StationReport } from '@/types';

// Partner Modular Components
import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { PartnerHero } from '@/components/partner/PartnerHero';
import { PartnerKPIStats } from '@/components/partner/PartnerKPIStats';
import { PartnerStationList } from '@/components/partner/PartnerStationList';
import { PartnerStationDetailView } from '@/components/partner/PartnerStationDetailView';
import { PartnerAddStationModal } from '@/components/partner/PartnerAddStationModal';
import { PartnerTelemetryView } from '@/components/partner/PartnerTelemetryView';
import { PartnerReportsView } from '@/components/partner/PartnerReportsView';
import { PartnerProfileView } from '@/components/partner/PartnerProfileView';
import { PartnerNotificationsModal } from '@/components/partner/PartnerNotificationsModal';
import { PartnerLocationPickerMap } from '@/components/partner/PartnerLocationPickerMap';
import { PartnerNetworkMap } from '@/components/partner/PartnerNetworkMap';
// Partner station submissions default to verificationStatus: 'pending' and require admin approval

import {
  Building2,
  Plus,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit2,
  X,
  Radio,
  FileText,
  Shield,
  Layers,
  ChevronRight,
  TrendingUp,
  Compass,
} from 'lucide-react';

export const PartnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'stations' | 'map' | 'add_hub' | 'reports' | 'feeds' | 'profile'>('overview');

  // Real Operational Data State
  const [partnerStations, setPartnerStations] = useState<ChargingStation[]>([]);
  const [partnerReports, setPartnerReports] = useState<StationReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Station for Full Detail View
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Edit / Resubmit Modal State
  const [editingStation, setEditingStation] = useState<ChargingStation | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editTariff, setEditTariff] = useState(18);
  const [editPower, setEditPower] = useState(60);
  const [editHours, setEditHours] = useState('24/7 Open');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Load Partner Stations & Reports + Real-Time Sync Subscription
  const loadPartnerData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const stations = await chargingDataService.getStationsByPartner(user.uid);
      setPartnerStations(stations);

      const allReports = await chargingDataService.getAllReports();
      const ownedIds = new Set(stations.map(s => s.id));
      setPartnerReports(allReports.filter(r => ownedIds.has(r.stationId)));
    } catch (err) {
      console.warn('[PartnerDashboard] Error loading partner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartnerData();

    // REAL-TIME FIRESTORE SYNCHRONIZATION
    const unsubscribe = chargingDataService.subscribeToStations((allStations) => {
      if (!user) return;
      const mine = allStations.filter(s => s.partnerId === user.uid || s.createdBy === user.uid);
      setPartnerStations(mine);

      // If user is currently viewing a detail card that updated in Firestore, sync it immediately
      setSelectedStation(prev => {
        if (!prev) return null;
        const updated = mine.find(s => s.id === prev.id);
        return updated || prev;
      });
    });

    return () => unsubscribe();
  }, [user]);

  // Handle Opening Edit Modal
  const handleOpenEdit = (station: ChargingStation, resubmit = false) => {
    setEditingStation(station);
    setIsResubmitting(resubmit);
    setEditName(station.name);
    setEditAddress(station.address);
    setEditTariff(station.chargers[0]?.pricingPerKWh || 18);
    setEditPower(station.chargers[0]?.powerKW || 60);
    setEditHours(station.operatingHours || '24/7 Open');
  };

  // Handle Saving Edit / Resubmission
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation || !user) return;
    setIsSubmittingEdit(true);

    try {
      if (isResubmitting) {
        // Resubmitting a rejected station resets status to 'pending' and clears rejectionReason
        const updated = await operationsService.resubmitStation(
          editingStation.id,
          {
            name: editName,
            address: editAddress,
            operatingHours: editHours,
            is24x7: editHours.includes('24/7'),
            chargers: editingStation.chargers.map(c => ({
              ...c,
              pricingPerKWh: editTariff,
              powerKW: editPower,
              pricingDisplay: `₹${editTariff} / kWh`,
            })),
          },
          user.uid,
          user.email
        );

        if (updated) {
          setPartnerStations(prev => prev.map(s => (s.id === updated.id ? updated : s)));
          if (selectedStation?.id === updated.id) setSelectedStation(updated);
        }
      } else {
        await chargingDataService.updateStationTariff(editingStation.id, editTariff, editPower);
        const updated = await chargingDataService.updateStation(editingStation.id, {
          name: editName,
          address: editAddress,
          operatingHours: editHours,
          is24x7: editHours.includes('24/7'),
        });

        if (updated) {
          setPartnerStations(prev => prev.map(s => (s.id === updated.id ? updated : s)));
          if (selectedStation?.id === updated.id) setSelectedStation(updated);
        }
      }

      setEditingStation(null);
      setIsResubmitting(false);
    } catch (err) {
      console.error('Failed to save station edit:', err);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Status Aggregates for Hero & KPI Stats
  const isApproved = (s: ChargingStation) =>
    (s.verificationStatus === 'verified' || s.verificationStatus === 'approved') && s.status === 'active';
  const isPending = (s: ChargingStation) =>
    s.verificationStatus === 'pending' || s.verificationStatus === 'under_review';
  const isRejected = (s: ChargingStation) =>
    s.verificationStatus === 'rejected';

  const liveCount = partnerStations.filter(isApproved).length;
  const pendingCount = partnerStations.filter(isPending).length;
  const rejectedCount = partnerStations.filter(isRejected).length;

  const totalCapacityKW = partnerStations.reduce(
    (sum, s) => sum + s.chargers.reduce((p, c) => p + (c.powerKW || 0), 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      {/* TOP STICKY ENTERPRISE HEADER */}
      <PartnerHeader
        onAddStationClick={() => setShowAddModal(true)}
        onNotificationsClick={() => setShowNotificationsModal(true)}
        onProfileClick={() => { setActiveTab('profile'); setSelectedStation(null); }}
        unreadNotificationsCount={rejectedCount + partnerReports.filter(r => r.status !== 'resolved').length}
        liveStationsCount={liveCount}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 w-full">
        {/* HERO BANNER & NAVIGATION BAR */}
        <PartnerHero
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedStation(null);
          }}
          liveCount={liveCount}
          pendingCount={pendingCount}
          needsAttentionCount={rejectedCount}
          totalCapacityKW={totalCapacityKW}
        />

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && !selectedStation && (
          <div className="space-y-6">
            <PartnerKPIStats
              stations={partnerStations}
              reports={partnerReports}
              onFilterClick={() => setActiveTab('stations')}
            />

            {/* Quick Fleet Highlights & Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Fleet Quick Access */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    Charging Assets Fleet
                  </h3>
                  <button
                    onClick={() => setActiveTab('stations')}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    View All Fleet <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <PartnerStationList
                  stations={partnerStations}
                  onSelectStation={(st) => setSelectedStation(st)}
                  onEditStation={(st, resubmit) => handleOpenEdit(st, resubmit)}
                  onAddStationClick={() => setShowAddModal(true)}
                />
              </div>

              {/* Right 1 Col: Operational Status & Shortcuts */}
              <div className="space-y-6">
                {/* Admin Verification Advisory */}
                <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-white font-extrabold text-xs">
                    <Shield className="w-4 h-4 text-sky-400" />
                    Verification SLA Guarantee
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    New station submissions and revisions are reviewed by our operations engineers within 4-12 hours. Ensure accurate GPS coordinates to expedite verification.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    Register New Station
                  </button>
                </div>

                {/* Quick Diagnostics Strip */}
                <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white">Driver Feedback</span>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="text-[11px] font-bold text-sky-400 hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="text-xs text-slate-400">
                    {partnerReports.filter(r => r.status !== 'resolved').length === 0 ? (
                      <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-semibold text-center">
                        ✓ All driver tickets resolved
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {partnerReports.slice(0, 2).map(r => (
                          <div key={r.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                            <span className="font-bold text-white capitalize">{r.reportType.replace('_', ' ')}</span>
                            <p className="text-slate-400 truncate mt-0.5">{r.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FLEET STATIONS VIEW */}
        {activeTab === 'stations' && !selectedStation && (
          <div className="space-y-6">
            <PartnerKPIStats
              stations={partnerStations}
              reports={partnerReports}
            />
            <PartnerStationList
              stations={partnerStations}
              onSelectStation={(st) => setSelectedStation(st)}
              onEditStation={(st, resubmit) => handleOpenEdit(st, resubmit)}
              onAddStationClick={() => setShowAddModal(true)}
            />
          </div>
        )}

        {/* TAB: PRIVATE PARTNER-ONLY NETWORK MAP */}
        {activeTab === 'map' && !selectedStation && (
          <div className="space-y-6">
            <PartnerNetworkMap
              partnerId={user?.uid || ''}
              stations={partnerStations}
              onSelectStation={(st) => setSelectedStation(st)}
              onEditStation={(st, resubmit) => handleOpenEdit(st, resubmit)}
              onAddStationClick={() => setShowAddModal(true)}
            />
          </div>
        )}

        {/* STATION FULL DETAIL VIEW */}
        {selectedStation && (
          <PartnerStationDetailView
            station={selectedStation}
            onBack={() => setSelectedStation(null)}
            onEdit={(st, resubmit) => handleOpenEdit(st, resubmit)}
          />
        )}

        {/* TAB 3: TELEMETRY & FEEDS */}
        {activeTab === 'feeds' && (
          <PartnerTelemetryView stations={partnerStations} />
        )}

        {/* TAB 4: COMMUNITY & DRIVER REPORTS */}
        {activeTab === 'reports' && (
          <PartnerReportsView
            reports={partnerReports}
            stations={partnerStations}
            onReportUpdated={(updated) => {
              setPartnerReports(prev => prev.map(r => (r.id === updated.id ? updated : r)));
            }}
          />
        )}

        {/* TAB 5: CPO Profile & Settings */}
        {activeTab === 'profile' && (
          <PartnerProfileView
            stationsCount={partnerStations.length}
            liveCount={liveCount}
            totalCapacityKW={totalCapacityKW}
          />
        )}
      </main>

      {/* 5-STEP ADD CHARGING HUB MODAL WIZARD */}
      <PartnerAddStationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onStationCreated={(newStation) => {
          setPartnerStations(prev => [newStation, ...prev.filter(s => s.id !== newStation.id)]);
          setActiveTab('stations');
        }}
      />

      {/* NOTIFICATIONS DRAWER / MODAL */}
      <PartnerNotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        stations={partnerStations}
        reports={partnerReports}
      />

      {/* EDIT / RESUBMIT METADATA MODAL */}
      {editingStation && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                {isResubmitting ? (
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                    <Edit2 className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-heading font-extrabold text-base text-white">
                    {isResubmitting ? 'Correct & Resubmit Station' : 'Edit Station Metadata'}
                  </h3>
                  <p className="text-xs text-slate-400">{editingStation.name}</p>
                </div>
              </div>

              <button
                onClick={() => setEditingStation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isResubmitting && editingStation.rejectionReason && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                <div className="font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Admin Rejection Reason:
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {editingStation.rejectionReason}
                </p>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Hub Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Street Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Tariff (₹/kWh)</label>
                  <input
                    type="number"
                    value={editTariff}
                    onChange={e => setEditTariff(Number(e.target.value))}
                    min={1}
                    max={100}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-emerald-400 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Max Power (kW)</label>
                  <input
                    type="number"
                    value={editPower}
                    onChange={e => setEditPower(Number(e.target.value))}
                    min={3.3}
                    max={360}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-sky-400 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Operating Hours</label>
                <input
                  type="text"
                  value={editHours}
                  onChange={e => setEditHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStation(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className={`px-5 py-2 rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5 ${
                    isResubmitting
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  {isSubmittingEdit ? (
                    'Saving...'
                  ) : isResubmitting ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      Review & Resubmit
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-1.5 py-2 flex items-center justify-around text-[9px] font-bold text-slate-400">
        <button
          onClick={() => { setActiveTab('overview'); setSelectedStation(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'overview' && !selectedStation ? 'text-emerald-400' : 'hover:text-slate-200'}`}
        >
          <Building2 className="w-4 h-4" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => { setActiveTab('stations'); setSelectedStation(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'stations' ? 'text-emerald-400' : 'hover:text-slate-200'}`}
        >
          <Zap className="w-4 h-4" />
          <span>Fleet</span>
        </button>
        <button
          onClick={() => { setActiveTab('map'); setSelectedStation(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'map' ? 'text-emerald-400' : 'hover:text-slate-200'}`}
        >
          <Compass className="w-4 h-4" />
          <span>Map</span>
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex flex-col items-center -mt-4"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Plus className="w-5 h-5 stroke-[3]" />
          </div>
          <span className="text-[8px] text-emerald-400 font-extrabold mt-0.5">Add</span>
        </button>
        <button
          onClick={() => { setActiveTab('feeds'); setSelectedStation(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'feeds' ? 'text-emerald-400' : 'hover:text-slate-200'}`}
        >
          <Radio className="w-4 h-4" />
          <span>Feeds</span>
        </button>
        <button
          onClick={() => { setActiveTab('profile'); setSelectedStation(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-emerald-400' : 'hover:text-slate-200'}`}
        >
          <Shield className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};
