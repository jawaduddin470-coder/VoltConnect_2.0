import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { operationsService } from '@/services/operationsService';
import { getCollectionDocs, updateDocumentFields } from '@/services/firebase/firestore';
import { ServiceRequest } from '@/types';
import {
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  MapPin,
  Calendar,
  User,
  Zap,
  Check,
  X,
  FileText,
} from 'lucide-react';

export const AdminServiceView: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [technicianNote, setTechnicianNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const defaultTickets: ServiceRequest[] = [
    {
      id: 'srv-101',
      userId: 'usr-driver-01',
      userEmail: 'priya@gmail.com',
      serviceType: 'Charger Connector Jammed',
      category: 'emergency',
      status: 'pending',
      preferredLocationType: 'workshop_visit',
      description: 'CCS2 connector handle lock will not release automatically on gun #2.',
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: '14:30',
      stationId: 'st-hyd-01',
      notes: 'CCS2 connector handle lock will not release automatically on gun #2.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'srv-102',
      userId: 'usr-partner-01',
      userEmail: 'alex@voltcharge.com',
      serviceType: 'Routine Transformer Calibration',
      category: 'routine',
      status: 'in_progress',
      preferredLocationType: 'workshop_visit',
      description: 'Quarterly load bank testing and cooling fan inspection.',
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: '10:00',
      stationId: 'st-hyd-02',
      notes: 'Quarterly load bank testing and cooling fan inspection.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'srv-103',
      userId: 'usr-driver-02',
      userEmail: 'karan@evdriver.in',
      serviceType: 'Display Screen Offline',
      category: 'repair',
      status: 'completed',
      preferredLocationType: 'workshop_visit',
      description: 'Touchscreen rebooted and firmware updated to v2.4.1.',
      preferredDate: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      preferredTime: '16:00',
      stationId: 'st-hyd-03',
      notes: 'Touchscreen rebooted and firmware updated to v2.4.1.',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const docs = await getCollectionDocs<ServiceRequest>('service_requests');
      if (docs && docs.length > 0) {
        setRequests(docs);
      } else {
        setRequests(defaultTickets);
      }
    } catch {
      setRequests(defaultTickets);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateStatus = async (ticketId: string, newStatus: ServiceRequest['status']) => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await updateDocumentFields('service_requests', ticketId, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        reviewedBy: user.email,
        adminNotes: technicianNote.trim() || undefined,
      });

      operationsService.logAuditEvent(
        user.uid,
        user.email,
        user.role,
        'SERVICE_TICKET_STATUS_UPDATE',
        'service_requests',
        ticketId,
        { newStatus, notes: technicianNote }
      );

      setRequests(prev =>
        prev.map(r => (r.id === ticketId ? { ...r, status: newStatus, notes: technicianNote ? `${r.notes}\n[Admin]: ${technicianNote}` : r.notes } : r))
      );

      if (selectedRequest?.id === ticketId) {
        setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null);
      }
      setTechnicianNote('');
    } catch (err) {
      console.error('Failed to update service ticket:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = requests.filter(r => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      (r.serviceType && r.serviceType.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.userEmail && r.userEmail.toLowerCase().includes(q)) ||
      (r.stationId && r.stationId.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 vc-page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="vc-badge vc-badge-sky text-[10px] uppercase font-bold">OPERATIONS & DISPATCH</span>
            <span className="text-xs text-slate-400 font-semibold">MAINTENANCE TICKETS</span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Service & Maintenance Hub
          </h1>
          <p className="text-xs text-slate-400">
            Dispatch technicians, track hardware maintenance, and resolve station/vehicle incident tickets.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
          <Wrench className="w-4 h-4 text-sky-400" />
          <span>{filtered.length} Active Tickets</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Total Tickets</div>
          <div className="text-xl font-extrabold text-white">{requests.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[10px] font-bold text-amber-400 uppercase">Pending Action</div>
          <div className="text-xl font-extrabold text-amber-400">{requests.filter(r => r.status === 'pending').length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[10px] font-bold text-sky-400 uppercase">In Progress</div>
          <div className="text-xl font-extrabold text-sky-400">{requests.filter(r => r.status === 'in_progress').length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[10px] font-bold text-emerald-400 uppercase">Resolved</div>
          <div className="text-xl font-extrabold text-emerald-400">{requests.filter(r => r.status === 'completed').length}</div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search ticket ID, station, email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'pending', 'in_progress', 'completed'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'ALL' ? 'All Tickets' : st.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading operational service tickets...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-slate-900/50 rounded-2xl border border-slate-800">
              No service tickets found matching current filters.
            </div>
          ) : (
            filtered.map(ticket => {
              const isSelected = selectedRequest?.id === ticket.id;
              const statusColor =
                ticket.status === 'completed'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  : ticket.status === 'in_progress'
                  ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedRequest(ticket)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-sky-500 shadow-lg'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-sky-400">{ticket.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColor}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-heading font-extrabold text-sm text-white mt-2">
                    {ticket.serviceType}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {ticket.notes}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{ticket.userEmail}</span>
                    </div>
                    {ticket.stationId && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-sky-400" />
                        <span>Station: {ticket.stationId}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="lg:col-span-1">
          {selectedRequest ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 sticky top-20 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-heading font-extrabold text-sm text-white">Ticket Details</span>
                <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Issue</div>
                  <div className="font-extrabold text-white text-sm mt-0.5">{selectedRequest.serviceType}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Requester</div>
                  <div className="text-slate-300 font-medium">{selectedRequest.userEmail}</div>
                </div>

                {selectedRequest.stationId && (
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Associated Station</div>
                    <div className="text-sky-400 font-mono font-bold">{selectedRequest.stationId}</div>
                  </div>
                )}

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Driver / CPO Notes</div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs mt-1">
                    {selectedRequest.notes}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="text-[11px] font-bold text-slate-300">Dispatch / Resolution Note</label>
                <textarea
                  value={technicianNote}
                  onChange={e => setTechnicianNote(e.target.value)}
                  placeholder="Enter dispatch assignment, replacement parts, or resolution note..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Update Lifecycle Status</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'pending')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                      selectedRequest.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'in_progress')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                      selectedRequest.status === 'in_progress'
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'completed')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                      selectedRequest.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Resolved
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center text-slate-500 text-xs">
              Select a service request on the left to inspect details, dispatch field agents, or record resolution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
