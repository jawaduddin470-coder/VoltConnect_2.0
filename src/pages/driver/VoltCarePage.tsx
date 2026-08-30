import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { voltHealthService } from '@/services/voltHealthService';
import { voltCareService } from '@/services/voltCareService';
import { MaintenanceRecord, ServiceRequest, ServicePartner, ServiceCategory, ServicePriority, ServiceRequestStatus } from '@/types';
import {
  Wrench,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  Send,
  AlertTriangle,
  FileText,
  MapPin,
  ChevronRight,
  UserCheck,
  Building2,
  Cpu,
  Info,
  Radio,
  Ban,
  CheckCircle,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';

export const VoltCarePage: React.FC = () => {
  const { activeVehicle, user } = useAuth();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'requests' | 'history' | 'partners'>('requests');
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [partners, setPartners] = useState<ServicePartner[]>([]);
  
  // Request Modal State
  const prefilledCategory = location.state?.prefilledCategory as ServiceCategory | undefined;
  const [showRequestModal, setShowRequestModal] = useState(Boolean(prefilledCategory));
  const [requestStep, setRequestStep] = useState(1);

  // Request Form Data
  const [category, setCategory] = useState<ServiceCategory>(prefilledCategory || 'charging_issue');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ServicePriority>('NORMAL');
  const [preferredLocationType, setPreferredLocationType] = useState<'home_service' | 'workshop_visit'>('home_service');
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().slice(0, 10));

  // Add Maintenance Record Modal State
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [serviceType, setServiceType] = useState<MaintenanceRecord['serviceType']>('periodic_inspection');
  const [odometerKm, setOdometerKm] = useState(15000);
  const [serviceProvider, setServiceProvider] = useState('');
  const [costINR, setCostINR] = useState(2500);
  const [notes, setNotes] = useState('');

  // Fetch Firestore Service Requests & History Logs
  useEffect(() => {
    if (user) {
      voltCareService.getUserServiceRequests(user.uid).then(setServiceRequests);
      voltCareService.getVerifiedPartners().then(setPartners);
    }
    if (activeVehicle) {
      voltHealthService.getMaintenanceRecords(activeVehicle.id).then(setRecords);
    }
  }, [activeVehicle, user]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVehicle || !user) return;

    const newReq = await voltCareService.createServiceRequest({
      userId: user.uid,
      vehicleId: activeVehicle.id,
      category,
      description,
      priority,
      preferredLocationType,
      preferredDate,
    });

    setServiceRequests(prev => [newReq, ...prev]);
    setShowRequestModal(false);
    setRequestStep(1);
    setDescription('');
  };

  const handleCancelRequest = async (requestId: string) => {
    await voltCareService.cancelServiceRequest(requestId);
    if (user) {
      const updated = await voltCareService.getUserServiceRequests(user.uid);
      setServiceRequests(updated);
    }
  };

  const handleAddRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVehicle || !user) return;

    const newRec = await voltHealthService.addMaintenanceRecord({
      userId: user.uid,
      vehicleId: activeVehicle.id,
      serviceDate,
      serviceType,
      odometerKm,
      serviceProvider: serviceProvider || 'Authorized Service Hub',
      costINR,
      notes,
    });

    setRecords(prev => [newRec, ...prev]);
    setShowAddRecordModal(false);
    setNotes('');
  };

  // Status mapping helper for the 6 standardized statuses:
  // Requested | Confirmed | Technician Assigned | In Progress | Completed | Cancelled
  const formatStatusDisplay = (status: ServiceRequestStatus): { label: string; badgeClass: string } => {
    switch (status) {
      case 'SUBMITTED':
        return { label: 'Requested', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'UNDER_REVIEW':
      case 'MATCHING':
        return { label: 'Confirmed', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'ASSIGNED':
      case 'SCHEDULED':
        return { label: 'Technician Assigned', badgeClass: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'COMPLETED':
        return { label: 'Completed', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'CANCELLED':
      case 'REJECTED':
        return { label: 'Cancelled', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: 'Requested', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-8 pb-16 vc-page-enter">
      
      {/* 1. HERO HEADER */}
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
            <Wrench className="w-3.5 h-3.5" /> SERVICE MANAGEMENT MODULE
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-white">VoltCare Service</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Official EV service management, technician status tracking, and maintenance logs for <span className="font-bold text-white">{activeVehicle?.manufacturer} {activeVehicle?.model}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowAddRecordModal(true)}
            className="vc-btn vc-btn-secondary-dark text-xs font-bold py-3 px-4 border border-slate-700"
          >
            + Log History Record
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            className="vc-btn vc-btn-amber py-3.5 px-6 text-xs font-extrabold flex items-center gap-2 shadow-lg hover:scale-[1.02] transition-all"
          >
            <Wrench className="w-4 h-4" /> Request EV Service
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
            activeTab === 'requests' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Service Requests ({serviceRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
            activeTab === 'history' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Maintenance Log ({records.length})
        </button>
        <button
          onClick={() => setActiveTab('partners')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
            activeTab === 'partners' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Verified Partners ({partners.length})
        </button>
      </div>

      {/* TAB 1: SERVICE REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {serviceRequests.length === 0 ? (
            <div className="vc-card p-12 text-center space-y-4 bg-white border border-slate-200 shadow-xs">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-heading font-extrabold text-lg text-navy-900">No Active Service Requests</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Need a technician for charging issues, periodic maintenance, or battery inspection? Click "Request EV Service" to submit a request to Firestore.
              </p>
              <button
                onClick={() => setShowRequestModal(true)}
                className="vc-btn vc-btn-amber py-2.5 px-6 text-xs font-bold shadow-md"
              >
                Request Service Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {serviceRequests.map(req => {
                const statusInfo = formatStatusDisplay(req.status);

                return (
                  <div key={req.id} className="vc-card p-6 bg-white border border-slate-200 rounded-3xl space-y-5 shadow-xs">
                    
                    {/* Header with Category, Priority & 6-State Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="vc-badge vc-badge-amber text-[9px] uppercase font-bold">{req.category.replace('_', ' ')}</span>
                          <span className="vc-badge vc-badge-navy text-[9px] font-bold">{req.priority} PRIORITY</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{req.preferredLocationType.replace('_', ' ')}</span>
                        </div>
                        <h3 className="font-heading font-extrabold text-base text-navy-900 mt-1">{req.description}</h3>
                      </div>

                      <div className={`px-3 py-1 rounded-full text-xs font-extrabold border shrink-0 ${statusInfo.badgeClass}`}>
                        Status: {statusInfo.label}
                      </div>
                    </div>

                    {/* 6-State Service Workflow Timeline Progress */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[10px] text-center font-bold">
                      <div className={`p-2 rounded-xl border ${req.status === 'SUBMITTED' ? 'bg-sky-50 border-sky-400 text-sky-700 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        1. Requested
                      </div>
                      <div className={`p-2 rounded-xl border ${req.status === 'UNDER_REVIEW' || req.status === 'MATCHING' ? 'bg-amber-50 border-amber-400 text-amber-700 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        2. Confirmed
                      </div>
                      <div className={`p-2 rounded-xl border ${req.status === 'ASSIGNED' || req.status === 'SCHEDULED' ? 'bg-teal-50 border-teal-400 text-teal-700 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        3. Tech Assigned
                      </div>
                      <div className={`p-2 rounded-xl border ${req.status === 'IN_PROGRESS' ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        4. In Progress
                      </div>
                      <div className={`p-2 rounded-xl border ${req.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        5. Completed
                      </div>
                      <div className={`p-2 rounded-xl border ${req.status === 'CANCELLED' ? 'bg-rose-50 border-rose-400 text-rose-700 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        6. Cancelled
                      </div>
                    </div>

                    {/* Technician Status & Simulated Demo Transparency Label */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-sky-600" />
                          <span className="font-extrabold text-navy-900">
                            {req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS'
                              ? 'Technician Assigned: Ramesh Kumar (Senior EV Specialist)'
                              : req.status === 'COMPLETED'
                              ? 'Serviced by Authorized EV Mobility Hub'
                              : 'Technician Assignment Pending Dispatch'}
                          </span>
                        </div>
                        <span className="vc-badge vc-badge-amber text-[9px]">Demo / Simulated Status</span>
                      </div>

                      {/* Explicit Demo Transparency Notice */}
                      <p className="text-[11px] text-slate-500 font-medium">
                        <strong className="text-slate-700">Notice:</strong> Technician dispatch updates in this view are presented as a <span className="font-bold text-navy-900">Demo / Simulated Status</span>. Real-time GPS tracking requires direct partner CPO gateway integration.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs font-bold">
                      <span className="text-slate-400">Created: {req.createdAt.slice(0, 10)}</span>
                      {req.status !== 'COMPLETED' && req.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          className="text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" /> Cancel Request
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MAINTENANCE LOG */}
      {activeTab === 'history' && (
        <div className="vc-card p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Service Log</span>
              <h2 className="font-heading text-xl font-extrabold text-navy-900">Maintenance History</h2>
            </div>
            <span className="vc-badge vc-badge-navy text-[10px] font-bold">{records.length} Stored Records</span>
          </div>

          {records.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
              <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="font-heading font-extrabold text-base text-navy-900">No Maintenance History Records</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Record your periodic inspections, brake fluid replacements, or tire rotations to maintain verified history.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map(rec => (
                <div key={rec.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="vc-badge vc-badge-teal text-[9px] uppercase font-bold">{rec.serviceType.replace('_', ' ')}</span>
                      <h3 className="font-heading font-extrabold text-base text-navy-900 mt-1">{rec.serviceProvider}</h3>
                    </div>
                    <div className="text-right">
                      <span className="font-heading font-extrabold text-emerald-600 text-sm">₹{rec.costINR}</span>
                      <div className="text-[10px] text-slate-400 font-semibold">{rec.serviceDate} • Odometer: {rec.odometerKm} km</div>
                    </div>
                  </div>
                  {rec.notes && <p className="text-xs text-slate-600 border-t border-slate-200/60 pt-2">{rec.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VERIFIED PARTNERS (HONEST EMPTY STATE) */}
      {activeTab === 'partners' && (
        <div className="vc-card p-12 text-center space-y-4 bg-white border border-slate-200 shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-heading font-extrabold text-lg text-navy-900">No Verified Service Partners Available</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No verified CPO or third-party service workshops are currently connected in your area. As authorized service providers complete verification, they will appear here.
          </p>
        </div>
      )}

      {/* SERVICE REQUEST MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 vc-modal-backdrop">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 animate-in zoom-in-95 shadow-2xl border border-slate-200 vc-modal-content">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-amber-600 uppercase">Step {requestStep} of 3</span>
                <h3 className="font-heading font-extrabold text-lg text-navy-900">Request EV Service</h3>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs font-bold">
              
              {requestStep === 1 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-slate-700 uppercase">Service Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 bg-slate-50"
                    >
                      <option value="charging_issue">Charging Port / Speed Issue</option>
                      <option value="battery_issue">Battery Thermal / Health Issue</option>
                      <option value="software_glitch">Infotainment / Software Glitch</option>
                      <option value="drivetrain">Motor / Drivetrain Sound</option>
                      <option value="periodic_inspection">Periodic EV Inspection</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 uppercase">Issue Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Describe what you are experiencing with your EV..."
                      rows={3}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-navy-900 bg-slate-50"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setRequestStep(2)}
                    disabled={!description.trim()}
                    className="w-full vc-btn vc-btn-amber py-3 text-xs font-extrabold mt-2"
                  >
                    Next: Location & Urgency &rarr;
                  </button>
                </div>
              )}

              {requestStep === 2 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-slate-700 uppercase">Preferred Service Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPreferredLocationType('home_service')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          preferredLocationType === 'home_service'
                            ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="font-extrabold">Home Service</div>
                        <div className="text-[10px] text-slate-500 font-normal">Technician visits your location</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreferredLocationType('workshop_visit')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          preferredLocationType === 'workshop_visit'
                            ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="font-extrabold">Workshop Visit</div>
                        <div className="text-[10px] text-slate-500 font-normal">Drive to service center</div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 uppercase">Priority Level</label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 bg-slate-50"
                    >
                      <option value="NORMAL">Normal Priority</option>
                      <option value="HIGH">High Priority (Vehicle Operating Affected)</option>
                      <option value="URGENT">Urgent (Vehicle Breakdown / Immobile)</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRequestStep(1)}
                      className="vc-btn vc-btn-ghost text-xs flex-1"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestStep(3)}
                      className="vc-btn vc-btn-amber py-3 text-xs font-extrabold flex-1"
                    >
                      Next: Preferred Date &rarr;
                    </button>
                  </div>
                </div>
              )}

              {requestStep === 3 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-slate-700 uppercase">Preferred Service Date</label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={e => setPreferredDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 bg-slate-50"
                      required
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] text-slate-600 font-medium">
                    <div className="font-extrabold text-navy-900">Summary:</div>
                    <div>Category: <span className="font-bold text-slate-800">{category.replace('_', ' ')}</span></div>
                    <div>Priority: <span className="font-bold text-slate-800">{priority}</span></div>
                    <div>Location: <span className="font-bold text-slate-800">{preferredLocationType.replace('_', ' ')}</span></div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRequestStep(2)}
                      className="vc-btn vc-btn-ghost text-xs flex-1"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="submit"
                      className="vc-btn vc-btn-amber py-3 text-xs font-extrabold flex-1 flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit to Firestore
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      )}

      {/* ADD MAINTENANCE RECORD MODAL */}
      {showAddRecordModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 vc-modal-backdrop">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 animate-in zoom-in-95 shadow-2xl border border-slate-200 vc-modal-content">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading font-extrabold text-lg text-navy-900">Log Maintenance Record</h3>
              <button onClick={() => setShowAddRecordModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRecordSubmit} className="space-y-3 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-700 uppercase">Service Date</label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={e => setServiceDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 bg-slate-50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 uppercase">Service Type</label>
                <select
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 bg-slate-50"
                >
                  <option value="periodic_inspection">Periodic EV Inspection</option>
                  <option value="tire_rotation">Tire Rotation / Replacement</option>
                  <option value="brake_service">Brake Fluid / Pad Service</option>
                  <option value="coolant_flush">Battery Thermal Coolant Flush</option>
                  <option value="battery_replacement">Battery Module Service</option>
                  <option value="software_update">BMS Firmware Update</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 uppercase">Odometer (km)</label>
                  <input
                    type="number"
                    value={odometerKm}
                    onChange={e => setOdometerKm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 bg-slate-50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 uppercase">Cost (₹ INR)</label>
                  <input
                    type="number"
                    value={costINR}
                    onChange={e => setCostINR(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-navy-900 bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 uppercase">Service Provider</label>
                <input
                  type="text"
                  value={serviceProvider}
                  onChange={e => setServiceProvider(e.target.value)}
                  placeholder="e.g. Tata Motors Authorized Service Center"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-navy-900 bg-slate-50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 uppercase">Notes / Details</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optional service notes or invoice reference..."
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-navy-900 bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddRecordModal(false)} className="vc-btn vc-btn-ghost text-xs">
                  Cancel
                </button>
                <button type="submit" className="vc-btn vc-btn-amber py-2 px-5 text-xs font-extrabold shadow-md">
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
