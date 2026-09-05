import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { operationsService } from '@/services/operationsService';
import { chargingDataService } from '@/services/chargingDataService';
import { PartnerLocationPickerMap } from '@/components/partner/PartnerLocationPickerMap';
import { ChargingStation, StationReport } from '@/types';
import {
  Building2,
  Plus,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  MapPin,
  Edit2,
  Flag,
  Check,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Shield,
  User,
  AlertTriangle,
  RotateCcw,
  Layers,
} from 'lucide-react';

type SubmissionState = 'IDLE' | 'VALIDATING' | 'SUBMITTING' | 'SUCCESS' | 'ERROR';

export const PartnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'stations' | 'add_hub' | 'reports' | 'feeds' | 'profile'>('overview');

  // Real Operational Data State
  const [partnerStations, setPartnerStations] = useState<ChargingStation[]>([]);
  const [partnerReports, setPartnerReports] = useState<StationReport[]>([]);

  // Add Station Modal & Wizard State
  const [showAddModal, setShowAddModal] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [lat, setLat] = useState(17.4385);
  const [lng, setLng] = useState(78.3842);
  const [powerKW, setPowerKW] = useState(60);
  const [pricePerKWh, setPricePerKWh] = useState(18);
  const [connectorType, setConnectorType] = useState<'CCS2' | 'Type2' | 'GB/T' | 'CHAdeMO'>('CCS2');
  const [operatingHours, setOperatingHours] = useState('24/7 Open');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState>('IDLE');

  // Editing Station State
  const [editingStation, setEditingStation] = useState<ChargingStation | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editTariff, setEditTariff] = useState(18);
  const [editPower, setEditPower] = useState(60);
  const [editHours, setEditHours] = useState('24/7 Open');

  const handleOpenEdit = (st: ChargingStation, resubmit = false) => {
    setEditingStation(st);
    setIsResubmitting(resubmit);
    setEditName(st.name);
    setEditAddress(st.address);
    setEditTariff(st.chargers[0]?.pricingPerKWh || 18);
    setEditPower(st.chargers[0]?.powerKW || 60);
    setEditHours(st.operatingHours || '24/7 Open');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation || !user) return;

    const prevTariff = editingStation.chargers[0]?.pricingPerKWh || 18;
    setIsSubmitting(true);

    try {
      if (isResubmitting) {
        // Re-submitting rejected station resets status to 'pending' and clears rejectionReason
        const resubmitted = await operationsService.submitStationForApproval({
          ...editingStation,
          name: editName,
          address: editAddress,
          operatingHours: editHours,
          is24x7: editHours.includes('24/7'),
          verificationStatus: 'pending',
          rejectionReason: undefined,
          chargers: editingStation.chargers.map(c => ({
            ...c,
            pricingPerKWh: editTariff,
            powerKW: editPower,
            pricingDisplay: `₹${editTariff} / kWh`,
          })),
        });

        chargingDataService.clearCache();
        setPartnerStations(prev => prev.map(s => (s.id === resubmitted.id ? resubmitted : s)));
        operationsService.logAuditEvent(
          user.uid,
          user.email,
          'partner',
          'PARTNER_STATION_RESUBMITTED',
          'stations',
          editingStation.id,
          { previousReason: editingStation.rejectionReason, stationName: editName }
        );
        setEditingStation(null);
        setIsResubmitting(false);
        return;
      }

      await chargingDataService.updateStationTariff(editingStation.id, editTariff, editPower);
      const updatedStation = await chargingDataService.updateStation(editingStation.id, {
        name: editName,
        address: editAddress,
        operatingHours: editHours,
        is24x7: editHours.includes('24/7'),
      });

      if (updatedStation) {
        setPartnerStations(prev => prev.map(s => (s.id === updatedStation.id ? updatedStation : s)));
      }

      operationsService.logAuditEvent(
        user.uid,
        user.email,
        'partner',
        'PARTNER_TARIFF_UPDATE',
        'stations',
        editingStation.id,
        {
          stationName: editName,
          oldTariff: prevTariff,
          newTariff: editTariff,
          powerKW: editPower,
        },
        prevTariff,
        editTariff
      );

      setEditingStation(null);
    } catch (err) {
      console.error('Failed to save station edit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadPartnerData = async () => {
    if (!user) return;
    try {
      const stations = await chargingDataService.getStationsByPartner(user.uid);
      setPartnerStations(stations);

      const allReports = await chargingDataService.getAllReports();
      const ownedIds = new Set(stations.map(s => s.id));
      setPartnerReports(allReports.filter(r => ownedIds.has(r.stationId)));
    } catch (err) {
      console.warn('[PartnerDashboard] Error loading partner data:', err);
    }
  };

  useEffect(() => {
    loadPartnerData();
  }, [user]);

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmissionState('VALIDATING');
    setFormError(null);
    setFormSuccess(null);

    // Explicit Validation Checkpoints
    if (!name.trim() || name.trim().length < 3) {
      setFormError('Station Name must be at least 3 characters.');
      setSubmissionState('ERROR');
      return;
    }
    if (!address.trim() || address.trim().length < 5) {
      setFormError('Street Address must be at least 5 characters.');
      setSubmissionState('ERROR');
      return;
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError('Latitude must be a valid coordinate between -90 and 90.');
      setSubmissionState('ERROR');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setFormError('Longitude must be a valid coordinate between -180 and 180.');
      setSubmissionState('ERROR');
      return;
    }
    if (isNaN(powerKW) || powerKW <= 0 || powerKW > 360) {
      setFormError('Max DC Power must be between 1 kW and 360 kW.');
      setSubmissionState('ERROR');
      return;
    }
    if (isNaN(pricePerKWh) || pricePerKWh <= 0 || pricePerKWh > 150) {
      setFormError('Tariff rate must be between ₹1 and ₹150 / kWh.');
      setSubmissionState('ERROR');
      return;
    }

    setSubmissionState('SUBMITTING');
    setIsSubmitting(true);

    try {
      const newStation = await operationsService.submitStationForApproval({
        partnerId: user.uid,
        name: name.trim(),
        operatorName: user.name || 'CPO Partner',
        description: 'CPO Charging Hub',
        address: address.trim(),
        city: city.trim() || 'Hyderabad',
        latitude: Number(lat),
        longitude: Number(lng),
        operatingHours: operatingHours.trim() || '24/7 Open',
        is24x7: operatingHours.includes('24/7'),
        amenities: ['Restroom', 'WiFi', 'EV Lounge'],
        voltScore: 92,
        status: 'active',
        verificationStatus: 'pending',
        dataSource: 'partner',
        pricingModel: 'per_kwh',
        chargers: [
          {
            id: `chg-${Date.now()}`,
            stationId: '',
            connectorType,
            powerKW: Number(powerKW),
            pricingPerKWh: Number(pricePerKWh),
            hasVerifiedPricing: true,
            pricingDisplay: `₹${pricePerKWh} / kWh`,
            status: 'Available',
            lastUpdated: new Date().toISOString(),
          },
        ],
        createdBy: user.uid,
      });

      chargingDataService.clearCache();
      setPartnerStations(prev => [newStation, ...prev.filter(s => s.id !== newStation.id)]);
      setSubmissionState('SUCCESS');
      setFormSuccess('✓ Station Submitted — Awaiting Administrator Verification');

      setTimeout(() => {
        setShowAddModal(false);
        setActiveTab('stations');
        setStep(1);
        setName('');
        setAddress('');
        setFormSuccess(null);
        setFormError(null);
        setSubmissionState('IDLE');
      }, 1600);
    } catch (err: any) {
      setSubmissionState('ERROR');
      setFormError(err?.message || 'Failed to submit station for review. Please verify connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, newStatus: StationReport['status']) => {
    await chargingDataService.updateReportStatus(reportId, newStatus);
    loadPartnerData();
  };

  useEffect(() => {
    const adminEl = document.querySelector('[data-portal="admin"]');
    if (adminEl) {
      console.error('[P0 PORTAL VIOLATION] Admin portal detected inside Partner portal.');
    }
    const stored = localStorage.getItem('vc_user');
    const storedRole = stored ? JSON.parse(stored)?.role : 'none';
    console.log(`[PORTAL_FORENSIC]
pathname=${window.location.pathname}
firebaseUid=${user?.uid || 'anon'}
firebaseEmail=${user?.email || 'none'}
firestoreRole=${user?.role || 'none'}
authContextRole=${user?.role || 'none'}
storedRole=${storedRole}
portal=partner
expectedPortal=partner`);
  }, [user?.role, user?.uid, user?.email]);

  return (
    <div data-portal="partner" className="space-y-8 pb-16 vc-page-enter">
      
      {/* 1. B2B PARTNER COMMAND HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="vc-badge vc-badge-sky text-[10px] uppercase font-bold tracking-widest">CPO NETWORK CONTROL</span>
            <span className="text-xs text-slate-400 font-medium">Partner: {user?.email}</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">CPO PARTNER CONTROL CENTER</h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Manage charging hub submissions, monitor live charger telemetry feeds, and resolve user-filed station reports.
            All hub creations require explicit Administrator verification prior to public VoltMap indexing.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveTab('add_hub');
            setStep(1);
            setShowAddModal(true);
          }}
          className="px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-extrabold flex items-center gap-2 shrink-0 shadow-lg hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Charging Hub
        </button>
      </div>

      {/* 2. 6-SECTION NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-bold overflow-x-auto no-scrollbar flex-nowrap">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'overview' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('stations')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'stations' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          My Infrastructure ({partnerStations.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('add_hub');
            setStep(1);
            setShowAddModal(true);
          }}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 font-extrabold ${
            activeTab === 'add_hub' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-900 text-teal-400 hover:text-white border border-slate-800'
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> Add Charging Hub
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'reports' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          Station Reports
          {partnerReports.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-extrabold">
              {partnerReports.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('feeds')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'feeds' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Radio className="w-3.5 h-3.5" /> Telemetry Feeds
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'profile' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <User className="w-3.5 h-3.5" /> CPO Profile
        </button>
      </div>

      {/* 3. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 space-y-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Managed Hubs</span>
              <div className="font-heading font-extrabold text-3xl text-white">{partnerStations.length}</div>
              <span className="text-[10px] text-slate-500 font-bold">Total Partner Infrastructure</span>
            </div>

            <div className="p-5 space-y-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Public Hubs</span>
              <div className="font-heading font-extrabold text-3xl text-emerald-400">
                {partnerStations.filter(s => s.verificationStatus === 'approved').length}
              </div>
              <span className="text-[10px] text-slate-500 font-bold">Live on VoltMap & Routing</span>
            </div>

            <div className="p-5 space-y-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Review</span>
              <div className="font-heading font-extrabold text-3xl text-amber-400">
                {partnerStations.filter(s => s.verificationStatus === 'pending').length}
              </div>
              <span className="text-[10px] text-slate-500 font-bold">Awaiting Admin Verification</span>
            </div>

            <div className="p-5 space-y-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rejected / Needs Review</span>
              <div className="font-heading font-extrabold text-3xl text-rose-400">
                {partnerStations.filter(s => s.verificationStatus === 'rejected').length}
              </div>
              <span className="text-[10px] text-slate-500 font-bold">Requires Resubmission</span>
            </div>
          </div>

          {/* Verification Policy Alert */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Mandatory Admin Verification Policy</div>
              <p className="mt-0.5 text-amber-200/80">
                In accordance with VoltConnect safety and data integrity policies, no partner station is automatically approved.
                Every submission enters the Admin Command Center queue for coordinate verification, physical access audit, and power rating confirmation before being exposed to EV drivers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. MY INFRASTRUCTURE TAB */}
      {activeTab === 'stations' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner Infrastructure</span>
              <h2 className="font-heading text-xl font-extrabold text-white">Station Inventory</h2>
            </div>
            <span className="text-xs font-bold text-sky-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
              {partnerStations.length} Hubs Registered
            </span>
          </div>

          {partnerStations.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-slate-950 rounded-2xl border border-slate-800">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="font-heading font-extrabold text-base text-white">No Stations Registered Yet</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click "Add Charging Hub" to submit your EV charging station for Admin verification and public VoltMap indexing.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-300">
                <thead className="border-b border-slate-800 font-bold text-[10px] text-slate-400 uppercase tracking-wider bg-slate-950/50">
                  <tr>
                    <th className="py-3 px-4">Station Name</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Connectors & Power</th>
                    <th className="py-3 px-4">Tariff</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {partnerStations.map(st => {
                    const isRejected = st.verificationStatus === 'rejected';
                    const isApproved = st.verificationStatus === 'approved';

                    return (
                      <React.Fragment key={st.id}>
                        <tr className={`transition-colors ${isRejected ? 'bg-rose-500/10' : 'hover:bg-slate-800/40'}`}>
                          <td className="py-3.5 px-4 font-bold text-white">
                            <div>{st.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {st.id}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            <div>{st.address}</div>
                            <div className="text-[10px] text-slate-500">{st.city} ({st.latitude?.toFixed(4)}, {st.longitude?.toFixed(4)})</div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-sky-400">
                            {st.chargers[0]?.powerKW || 60} kW ({st.chargers[0]?.connectorType || 'CCS2'})
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-200">
                            ₹{st.chargers[0]?.pricingPerKWh || 18} / kWh
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] uppercase font-extrabold ${
                                isApproved
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : isRejected
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {st.verificationStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isRejected ? (
                              <button
                                onClick={() => handleOpenEdit(st, true)}
                                className="px-3 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center gap-1 ml-auto shadow-md"
                              >
                                <RotateCcw className="w-3 h-3" /> Review & Resubmit
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenEdit(st, false)}
                                className="px-3 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg"
                              >
                                Edit Details
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Rejection Details Row */}
                        {isRejected && (
                          <tr className="bg-rose-500/10 border-b border-rose-500/20">
                            <td colSpan={6} className="py-2.5 px-4">
                              <div className="flex items-center gap-2 text-rose-300 text-xs">
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                <div>
                                  <strong className="font-bold">Rejection Reason from Administrator: </strong>
                                  <span>{st.rejectionReason || 'Inadequate physical access or unverified electrical capacity. Please correct location or power rating.'}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. ADD CHARGING HUB TAB (OR MODAL TRIGGER) */}
      {activeTab === 'add_hub' && !showAddModal && (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-center">
          <Building2 className="w-12 h-12 text-sky-400 mx-auto" />
          <h2 className="font-heading text-xl font-extrabold text-white">Register a New EV Charging Hub</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Launch the interactive 5-step onboarding wizard to pinpoint your station coordinates on the map, configure chargers, and submit for Administrator verification.
          </p>
          <button
            onClick={() => {
              setStep(1);
              setShowAddModal(true);
            }}
            className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg"
          >
            Launch Add Hub Wizard
          </button>
        </div>
      )}

      {/* 6. STATION REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Driver Issue Reports for Partner Stations</div>

          {partnerReports.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-3xl">
              <Flag className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="font-heading font-extrabold text-base text-white">No Station Reports Filed</div>
              <p className="text-xs text-slate-400">Driver feedback and maintenance issues filed for your stations will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {partnerReports.map(report => (
                <div key={report.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="vc-badge vc-badge-rose text-[9px] uppercase font-bold">
                          {report.reportType.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Status: <strong className="uppercase text-slate-300">{report.status}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 font-medium">{report.description}</p>
                    </div>

                    {report.status !== 'resolved' && (
                      <button
                        onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" /> Acknowledge & Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. TELEMETRY FEEDS TAB */}
      {activeTab === 'feeds' && (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Telemetry & WebSockets Gateway</div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span className="text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-sky-400" /> Operational Feed Gateway
              </span>
              <span className="vc-badge vc-badge-sky text-[9px] font-bold">PARTNER PROVIDED</span>
            </div>
            <p className="text-slate-400">
              Live hardware feeds provide verified availability data to VoltMap. All hubs submitted through this portal maintain real-time status synchronization.
            </p>
          </div>
        </div>
      )}

      {/* 8. PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CPO Credential Card</span>
            <h2 className="font-heading text-xl font-extrabold text-white">Partner Organization Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Partner UID</span>
              <div className="font-mono text-xs text-white font-bold">{user?.uid}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Contact Email</span>
              <div className="text-white font-bold">{user?.email}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Assigned Role</span>
              <div className="text-sky-400 font-extrabold uppercase tracking-wide">{user?.role}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">SLA Level</span>
              <div className="text-emerald-400 font-extrabold">Enterprise CPO (Tier 1 Verified)</div>
            </div>
          </div>
        </div>
      )}

      {/* 5-STEP ADD STATION WIZARD MODAL WITH INTEGRATED LOCATION PICKER MAP */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Step {step} of 5</span>
                <h3 className="font-heading font-extrabold text-lg text-white">Add Charging Hub</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSubmissionState('IDLE');
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStation} className="space-y-4 text-xs font-bold">
              {step === 1 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-slate-300">Station Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Financial District EV Charging Hub"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-medium focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300">City Location</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-medium focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-sky-400" /> Pinpoint Location on Map (Duplicate-Protected)
                    </label>
                    <p className="text-[11px] text-slate-400 font-normal">
                      Drag the marker to your precise charging station entrance. The map automatically tests for duplicate hubs within 50 meters and fetches the street address.
                    </p>
                    
                    <PartnerLocationPickerMap
                      initialLat={lat}
                      initialLng={lng}
                      onLocationSelect={({ lat: newLat, lng: newLng, addressSuggestion, citySuggestion }) => {
                        setLat(newLat);
                        setLng(newLng);
                        if (addressSuggestion && (!address || address.length < 5)) {
                          setAddress(addressSuggestion);
                        }
                        if (citySuggestion) {
                          setCity(citySuggestion);
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300">Street Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="e.g. Nanakramguda Financial District"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-medium focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={lat}
                        onChange={e => setLat(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-300">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={lng}
                        onChange={e => setLng(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300">Connector Type</label>
                      <select
                        value={connectorType}
                        onChange={e => setConnectorType(e.target.value as any)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-sky-500"
                      >
                        <option value="CCS2">CCS2 Fast DC</option>
                        <option value="Type2">Type 2 AC</option>
                        <option value="GB/T">GB/T Standard</option>
                        <option value="CHAdeMO">CHAdeMO</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-300">Max DC Power (kW)</label>
                      <input
                        type="number"
                        value={powerKW}
                        onChange={e => setPowerKW(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300">Tariff Rate (₹ / kWh)</label>
                    <input
                      type="number"
                      value={pricePerKWh}
                      onChange={e => setPricePerKWh(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-slate-300">Operating Schedule</label>
                    <input
                      type="text"
                      value={operatingHours}
                      onChange={e => setOperatingHours(e.target.value)}
                      placeholder="e.g. 24/7 Open"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="font-extrabold text-white">Review Submission</div>
                  <div>Name: <span className="font-bold text-slate-200">{name}</span></div>
                  <div>Address: <span className="text-slate-400">{address}, {city}</span></div>
                  <div>GPS: <span className="font-mono text-slate-400">{lat.toFixed(6)}, {lng.toFixed(6)}</span></div>
                  <div>Charger: <span className="font-bold text-sky-400">{powerKW} kW {connectorType} (₹{pricePerKWh}/kWh)</span></div>
                  <span className="vc-badge vc-badge-amber text-[9px] uppercase font-bold block mt-2">
                    STATUS UPON SUBMISSION: PENDING ADMIN VERIFICATION
                  </span>
                </div>
              )}

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((step - 1) as any)}
                    className="px-4 py-2 rounded-xl bg-slate-950 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold"
                  >
                    Back
                  </button>
                ) : <div />}

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      if (step === 1 && (!name.trim() || name.trim().length < 3)) {
                        setFormError('Please provide a station name (min 3 characters).');
                        return;
                      }
                      if (step === 2 && (!address.trim() || address.trim().length < 5)) {
                        setFormError('Please provide a valid street address (min 5 characters).');
                        return;
                      }
                      if (step === 3 && (pricePerKWh <= 0 || pricePerKWh > 150)) {
                        setFormError('Tariff must be between ₹1 and ₹150 / kWh.');
                        return;
                      }
                      setStep((step + 1) as any);
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-1 shadow-md"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || submissionState === 'SUBMITTING' || submissionState === 'VALIDATING'}
                    className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-md"
                  >
                    {isSubmitting || submissionState === 'SUBMITTING' ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Submitting to Verification Queue...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit for Admin Verification</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT & RESUBMIT STATION MODAL */}
      {editingStation && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  {isResubmitting ? 'Rejection Correction & Resubmission' : 'CPO Station Configuration'}
                </span>
                <h3 className="font-heading font-extrabold text-lg text-white">
                  {isResubmitting ? 'Review & Resubmit Station' : 'Edit Station & Tariff'}
                </h3>
              </div>
              <button onClick={() => setEditingStation(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isResubmitting && editingStation.rejectionReason && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> Administrator Feedback:
                </div>
                <div className="text-rose-200 font-medium">{editingStation.rejectionReason}</div>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-300">Station Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">Street Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300">Tariff (₹/kWh)</label>
                  <input
                    type="number"
                    value={editTariff}
                    onChange={e => setEditTariff(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300">Max DC Power (kW)</label>
                  <input
                    type="number"
                    value={editPower}
                    onChange={e => setEditPower(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">Operating Schedule</label>
                <input
                  type="text"
                  value={editHours}
                  onChange={e => setEditHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStation(null)}
                  className="px-4 py-2 rounded-xl bg-slate-950 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1 disabled:opacity-50 ${
                    isResubmitting ? 'bg-rose-600 hover:bg-rose-500' : 'bg-sky-500 hover:bg-sky-400'
                  }`}
                >
                  {isSubmitting ? (
                    'Saving...'
                  ) : isResubmitting ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" /> Submit Correction
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
