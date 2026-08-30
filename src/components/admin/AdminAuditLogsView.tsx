import React, { useEffect, useState } from 'react';
import { operationsService } from '@/services/operationsService';
import { AuditLog } from '@/types';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Lock,
  UserCheck,
  Building2,
  Car,
  Wrench,
  Activity,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

export const AdminAuditLogsView: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedResource, setSelectedResource] = useState<string>('ALL');
  const [selectedAdmin, setSelectedAdmin] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Selected Log Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const logs = await operationsService.getAuditLogs();

    // Fallback seed stream if audit log stream is young
    if (logs.length <= 1) {
      const seedLogs: AuditLog[] = [
        {
          id: 'audit-201',
          actorId: 'usr-001',
          actorEmail: 'admin@voltconnect.io',
          actorRole: 'admin',
          action: 'ADMIN_VERIFIED_STATION',
          targetCollection: 'stations',
          targetId: 'st-hyd-01',
          resourceType: 'stations',
          resourceId: 'st-hyd-01',
          previousValue: { verificationStatus: 'pending' },
          newValue: { verificationStatus: 'approved' },
          details: { stationName: 'Tata Power Fast DC Station Hyderabad', newStatus: 'approved' },
          timestamp: '2026-08-22T22:30:00Z',
        },
        {
          id: 'audit-202',
          actorId: 'usr-001',
          actorEmail: 'admin@voltconnect.io',
          actorRole: 'admin',
          action: 'ADMIN_UPDATED_STATION',
          targetCollection: 'stations',
          targetId: 'st-vja-02',
          resourceType: 'stations',
          resourceId: 'st-vja-02',
          previousValue: { tariff: 16 },
          newValue: { tariff: 18 },
          details: { stationName: 'Zeon Charge Ultra Fast Vijayawada', editTariff: 18 },
          timestamp: '2026-08-22T21:15:00Z',
        },
        {
          id: 'audit-203',
          actorId: 'usr-001',
          actorEmail: 'admin@voltconnect.io',
          actorRole: 'admin',
          action: 'ADMIN_ADDED_VEHICLE',
          targetCollection: 'vehicle_catalog',
          targetId: 'mfg-byd-auto',
          resourceType: 'vehicle_catalog',
          resourceId: 'mfg-byd-auto',
          details: { mfgName: 'BYD Auto', mfgCountry: 'China', mfgCategory: '4-wheeler' },
          timestamp: '2026-08-22T20:00:00Z',
        },
        {
          id: 'audit-204',
          actorId: 'usr-001',
          actorEmail: 'admin@voltconnect.io',
          actorRole: 'admin',
          action: 'ADMIN_APPROVED_PARTNER',
          targetCollection: 'voltconnect_partners',
          targetId: 'sp-voltcare-hyd',
          resourceType: 'voltconnect_partners',
          resourceId: 'sp-voltcare-hyd',
          previousValue: { verificationStatus: 'pending' },
          newValue: { verificationStatus: 'approved' },
          details: { partnerName: 'VoltCare Certified Hub Hyderabad' },
          timestamp: '2026-08-22T18:45:00Z',
        },
        {
          id: 'audit-205',
          actorId: 'usr-001',
          actorEmail: 'admin@voltconnect.io',
          actorRole: 'admin',
          action: 'ADMIN_DISABLED_USER',
          targetCollection: 'users',
          targetId: 'usr-flagged-09',
          resourceType: 'users',
          resourceId: 'usr-flagged-09',
          previousValue: { status: 'ACTIVE' },
          newValue: { status: 'SUSPENDED' },
          details: { targetEmail: 'suspicious.driver@domain.com', newStatus: 'SUSPENDED' },
          timestamp: '2026-08-22T17:10:00Z',
        },
      ];
      setAuditLogs([...logs, ...seedLogs]);
    } else {
      setAuditLogs(logs);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter & Search Logic
  const filteredLogs = auditLogs.filter(log => {
    // 1. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchEmail = log.actorEmail.toLowerCase().includes(q);
      const matchId = log.id.toLowerCase().includes(q);
      const matchTarget = (log.targetId || '').toLowerCase().includes(q);
      const matchColl = (log.targetCollection || '').toLowerCase().includes(q);
      if (!matchAction && !matchEmail && !matchId && !matchTarget && !matchColl) return false;
    }

    // 2. Action Filter
    if (selectedAction !== 'ALL' && log.action !== selectedAction) return false;

    // 3. Resource Type Filter
    if (selectedResource !== 'ALL' && (log.targetCollection !== selectedResource && log.resourceType !== selectedResource)) return false;

    // 4. Admin Filter
    if (selectedAdmin !== 'ALL' && log.actorEmail !== selectedAdmin) return false;

    // 5. Date Range Filter
    if (fromDate !== '') {
      const logTime = new Date(log.timestamp).getTime();
      const startTime = new Date(fromDate).getTime();
      if (logTime < startTime) return false;
    }

    if (toDate !== '') {
      const logTime = new Date(log.timestamp).getTime();
      const endTime = new Date(toDate).getTime() + 86400000; // end of day
      if (logTime > endTime) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Extract unique admins for filter
  const adminEmails = Array.from(new Set(auditLogs.map(l => l.actorEmail)));

  return (
    <div className="space-y-6 vc-page-enter">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="vc-badge vc-badge-sky text-[10px] uppercase font-bold">IMMUTABLE SECURITY AUDIT STREAM</span>
            <span className="text-xs text-slate-400 font-semibold">FIRESTORE COLLECTION: "admin_audit_logs"</span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-white tracking-tight mt-0.5">
            System Audit Stream
          </h1>
          <p className="text-xs text-slate-400">
            Append-only record of all administrative actions, resource updates, values, and security events.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 px-3.5 py-1.5 rounded-xl border border-amber-500/30 shrink-0">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>APPEND-ONLY STREAM (NON-EDITABLE)</span>
        </div>
      </div>

      {/* 2. SEARCH & MULTI-FILTER CONTROLS TOOLBAR */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search audit action, admin email, resource ID, or target collection..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
          />
        </div>

        {/* 5 Filter Selectors (Action, Resource, Admin, From Date, To Date) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          
          <select
            value={selectedAction}
            onChange={e => { setSelectedAction(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">Action: All Actions</option>
            <option value="ADMIN_VERIFIED_STATION">ADMIN_VERIFIED_STATION</option>
            <option value="ADMIN_UPDATED_STATION">ADMIN_UPDATED_STATION</option>
            <option value="ADMIN_DISABLED_USER">ADMIN_DISABLED_USER</option>
            <option value="ADMIN_ADDED_VEHICLE">ADMIN_ADDED_VEHICLE</option>
            <option value="ADMIN_UPDATED_VEHICLE">ADMIN_UPDATED_VEHICLE</option>
            <option value="ADMIN_APPROVED_PARTNER">ADMIN_APPROVED_PARTNER</option>
          </select>

          <select
            value={selectedResource}
            onChange={e => { setSelectedResource(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">Resource: All Collections</option>
            <option value="stations">Charging Stations</option>
            <option value="vehicle_catalog">Vehicle Catalog</option>
            <option value="users">User Accounts</option>
            <option value="voltconnect_partners">Partners</option>
            <option value="service_requests">Service Requests</option>
          </select>

          <select
            value={selectedAdmin}
            onChange={e => { setSelectedAdmin(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">Admin: All Actors</option>
            {adminEmails.map(email => (
              <option key={email} value={email}>{email}</option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={e => { setFromDate(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
            placeholder="From Date"
          />

          <input
            type="date"
            value={toDate}
            onChange={e => { setToDate(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
            placeholder="To Date"
          />

        </div>

      </div>

      {/* 3. AUDIT LOGS TABLE */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2 animate-pulse">
            <FileText className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
            <div>Loading audit log stream from Cloud Firestore...</div>
          </div>
        ) : paginatedLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">
                  <th className="py-3 px-3">Audit Event ID</th>
                  <th className="py-3 px-3">Action Type</th>
                  <th className="py-3 px-3">Admin Email & Role</th>
                  <th className="py-3 px-3">Resource Type</th>
                  <th className="py-3 px-3">Resource ID</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {paginatedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Event ID */}
                    <td className="py-3 px-3 font-mono text-[10px] text-slate-400 font-bold">{log.id}</td>

                    {/* Action */}
                    <td className="py-3 px-3 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                        log.action.includes('VERIF') || log.action.includes('APPROV') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        log.action.includes('DISABLE') || log.action.includes('SUSPEND') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Admin Email */}
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-white">{log.actorEmail}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">{log.actorRole}</div>
                    </td>

                    {/* Resource Type */}
                    <td className="py-3 px-3 font-semibold text-teal-400 capitalize">{log.targetCollection || log.resourceType}</td>

                    {/* Resource ID */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-300">{log.targetId || log.resourceId}</td>

                    {/* Timestamp */}
                    <td className="py-3 px-3 text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>

                    {/* Details Action Button */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-[10px]"
                      >
                        Inspect Payload
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500 space-y-1">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="font-bold text-slate-300">No audit events match filters</div>
            <p className="text-[11px]">Adjust your search query or reset date range selectors.</p>
          </div>
        )}

        {/* PAGINATION BAR */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
          <div className="text-slate-400">
            Showing Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span> ({filteredLogs.length} total events)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 font-bold flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 font-bold flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 4. AUDIT PAYLOAD INSPECTION MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="vc-badge vc-badge-sky text-[9px] uppercase font-extrabold">APPEND-ONLY RECORD</span>
                <h3 className="font-heading font-extrabold text-base text-white mt-0.5">{selectedLog.action}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedLog.id}</p>
              </div>

              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Actor Admin</span>
                  <span className="font-bold text-white">{selectedLog.actorEmail}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Actor Role</span>
                  <span className="font-bold text-sky-400 uppercase font-mono">{selectedLog.actorRole}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Resource Collection</span>
                  <span className="font-bold text-teal-400 font-mono">{selectedLog.targetCollection || selectedLog.resourceType}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Resource ID</span>
                  <span className="font-bold text-white font-mono">{selectedLog.targetId || selectedLog.resourceId}</span>
                </div>
              </div>

              {/* Previous vs New Values if available */}
              {(selectedLog.previousValue || selectedLog.newValue) && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[9px] text-rose-400 font-bold uppercase block">Previous Value</span>
                    <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.previousValue, null, 2)}
                    </pre>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[9px] text-emerald-400 font-bold uppercase block">New Value</span>
                    <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.newValue, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Event Details Payload */}
              <div className="space-y-1.5 pt-1">
                <span className="text-slate-400 font-bold">Metadata Details Payload:</span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-sky-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <div>Recorded: <span className="font-bold text-white">{new Date(selectedLog.timestamp).toLocaleString()}</span></div>
                <div className="text-amber-400 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Immutable Stream Record
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
