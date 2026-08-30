import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { operationsService } from '@/services/operationsService';
import { chargingDataService } from '@/services/chargingDataService';
import { getCollectionDocs, updateDocumentFields } from '@/services/firebase/firestore';
import { ServiceRequest, ServiceRequestStatus, StationReport } from '@/types';
import {
  Activity,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Wrench,
  AlertTriangle,
  Zap,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  RotateCcw,
  Sliders,
  Filter,
  ShieldCheck,
  Compass,
  Radio,
  FileText,
} from 'lucide-react';

export const AdminOperationsView: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [stationReports, setStationReports] = useState<StationReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Sub-Tab: 'service' | 'maintenance' | 'reports' | 'queues'
  const [activeSubTab, setActiveSubTab] = useState<'service' | 'maintenance' | 'reports' | 'queues'>('service');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadOperationsData = async () => {
    setLoading(true);

    // 1. Fetch Service Requests from Firestore
    try {
      const requests = await getCollectionDocs<ServiceRequest>('service_requests');
      if (requests && requests.length > 0) {
        setServiceRequests(requests);
      } else {
        // Fallback Seed List
        const seedRequests: ServiceRequest[] = [
          {
            id: 'req-srv-201',
            userId: 'usr-002',
            vehicleId: 'mod-tata-nexon-ev',
            category: 'battery_diagnostics',
            description: 'Routine SOH diagnostics & coolant loop pressure check for Tata Nexon EV.',
            preferredLocationType: 'workshop_visit',
            priority: 'medium',
            status: 'Requested',
            createdAt: '2026-08-20T10:00:00Z',
            updatedAt: '2026-08-20T10:00:00Z',
          },
          {
            id: 'req-srv-202',
            userId: 'usr-003',
            vehicleId: 'mod-byd-seal',
            category: 'charger_installation',
            description: 'Home 7.4kW AC Type 2 Smart Wallbox installation in Gachibowli.',
            preferredLocationType: 'home_service',
            priority: 'high',
            status: 'Confirmed',
            createdAt: '2026-08-19T14:30:00Z',
            updatedAt: '2026-08-19T15:00:00Z',
          },
          {
            id: 'req-srv-203',
            userId: 'usr-004',
            vehicleId: 'mod-mg-zs-ev',
            category: 'general_maintenance',
            description: 'Thermal management flushing and brake pad inspection.',
            preferredLocationType: 'workshop_visit',
            priority: 'low',
            status: 'In Progress',
            createdAt: '2026-08-18T09:00:00Z',
            updatedAt: '2026-08-21T11:00:00Z',
          },
        ];
        setServiceRequests(seedRequests);
      }
    } catch {
      setServiceRequests([]);
    }

    // 2. Fetch Station Reports
    try {
      const reports = await chargingDataService.getAllReports();
      setStationReports(reports);
    } catch {
      setStationReports([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadOperationsData();
  }, []);

  // Workflow Status Update Action (Requested -> Confirmed -> Assigned -> In Progress -> Completed -> Cancelled)
  const handleUpdateServiceStatus = async (request: ServiceRequest, newStatus: ServiceRequestStatus) => {
    if (!currentAdmin) return;

    await updateDocumentFields('service_requests', request.id, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    operationsService.logAuditEvent(
      currentAdmin.uid,
      currentAdmin.email,
      currentAdmin.role,
      `SERVICE_STATUS_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
      'service_requests',
      request.id,
      { previousStatus: request.status, newStatus }
    );

    setServiceRequests(prev =>
      prev.map(r => (r.id === request.id ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r))
    );
  };

  // Filter & Search Logic
  const filteredServiceRequests = serviceRequests.filter(r => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchId = r.id.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchCat = r.category.toLowerCase().includes(q);
      if (!matchId && !matchDesc && !matchCat) return false;
    }

    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredServiceRequests.length / PAGE_SIZE) || 1;
  const paginatedRequests = filteredServiceRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6 vc-page-enter">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="vc-badge vc-badge-sky text-[10px] uppercase font-bold">OPERATIONS CONTROL</span>
            <span className="text-xs text-slate-400 font-semibold">FIRESTORE SERVICE WORKFLOWS</span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Operations & Service Ticket Control
          </h1>
          <p className="text-xs text-slate-400">
            Track service requests, maintenance workflows, reported station issues, and active charging queues.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-800 shrink-0">
          <Activity className="w-4 h-4 text-sky-400" />
          <span>{serviceRequests.length} Service Tickets</span>
        </div>
      </div>

      {/* SUB-TABS: SERVICE REQUESTS | MAINTENANCE | REPORTED ISSUES | CHARGING QUEUES */}
      <div className="flex border-b border-slate-800 space-x-4 text-xs font-extrabold overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('service')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeSubTab === 'service' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="w-4 h-4" /> VoltCare Service Requests ({serviceRequests.length})
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeSubTab === 'reports' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Reported Station Issues ({stationReports.length})
        </button>

        <button
          onClick={() => setActiveSubTab('queues')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeSubTab === 'queues' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" /> Active Charging Queues
        </button>
      </div>

      {activeSubTab === 'service' && (
        <>
          {/* SEARCH & FILTERS */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search service ticket ID, description, or category..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <select
                value={selectedStatus}
                onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
              >
                <option value="ALL">Workflow Status: All</option>
                <option value="Requested">Requested</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Technician Assigned">Technician Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* SERVICE REQUESTS WORKFLOW TABLE */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2 animate-pulse">
                <Wrench className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
                <div>Loading service tickets from Cloud Firestore...</div>
              </div>
            ) : paginatedRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">
                      <th className="py-3 px-3">Ticket ID</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Description</th>
                      <th className="py-3 px-3">Service Location</th>
                      <th className="py-3 px-3">Priority</th>
                      <th className="py-3 px-3">Workflow Status</th>
                      <th className="py-3 px-3 text-right">Update Workflow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {paginatedRequests.map(r => (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-sky-400">{r.id}</td>

                        <td className="py-3 px-3 capitalize font-bold text-white text-[11px]">{r.category}</td>

                        <td className="py-3 px-3 text-slate-300 truncate max-w-[220px]">{r.description}</td>

                        <td className="py-3 px-3 text-slate-400 text-[11px] capitalize">
                          {r.preferredLocationType === 'home_service' ? 'Home Doorstep Service' : 'Workshop Visit'}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            r.priority === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            r.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {r.priority}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            r.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            r.status === 'In Progress' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                            r.status === 'Cancelled' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {r.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right space-x-1 shrink-0">
                          <select
                            value={r.status}
                            onChange={e => handleUpdateServiceStatus(r, e.target.value as ServiceRequestStatus)}
                            className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-extrabold text-[10px] focus:outline-none"
                          >
                            <option value="Requested">Requested</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Technician Assigned">Technician Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 space-y-1">
                <Wrench className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="font-bold text-slate-300">No service requests match criteria</div>
              </div>
            )}
          </div>
        </>
      )}

      {activeSubTab === 'reports' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="font-extrabold text-white text-sm border-b border-slate-800 pb-3">Driver Reported Station Issues ({stationReports.length})</div>
          {stationReports.length > 0 ? (
            <div className="space-y-3 text-xs">
              {stationReports.map(rep => (
                <div key={rep.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Station ID: {rep.stationId}</div>
                    <div className="text-slate-300 mt-0.5">{rep.description}</div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">Report Type: {rep.reportType} • Submitted: {new Date(rep.createdAt).toLocaleDateString()}</div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    rep.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {rep.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">No open station issues reported.</div>
          )}
        </div>
      )}

      {activeSubTab === 'queues' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-extrabold text-amber-400 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-5 h-5" /> Live Charging Queues Telemetry Notice
            </div>
            <div className="text-slate-300 text-xs">
              Real-time OCPP WebSockets gateway telemetry is disconnected. Data is marked as <strong>"Data unavailable"</strong> to preserve honest data trust.
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Prerequisite: OCPP 2.0.1 Charging Station WebSockets Gateway.
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
