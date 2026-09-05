import React from 'react';
import { ChargingStation, StationReport } from '@/types';
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Check,
} from 'lucide-react';

interface PartnerNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: ChargingStation[];
  reports: StationReport[];
}

export const PartnerNotificationsModal: React.FC<PartnerNotificationsModalProps> = ({
  isOpen,
  onClose,
  stations,
  reports,
}) => {
  if (!isOpen) return null;

  // Derive notifications from real stations and reports
  const notifications: Array<{
    id: string;
    type: 'approved' | 'rejected' | 'pending' | 'report';
    title: string;
    desc: string;
    time: string;
  }> = [];

  stations.forEach(st => {
    if (st.verificationStatus === 'verified' || st.verificationStatus === 'approved') {
      notifications.push({
        id: `ntf-app-${st.id}`,
        type: 'approved',
        title: `Hub Verified & Live: ${st.name}`,
        desc: `Your station passed administrative verification and is now discoverable on the public VoltMap.`,
        time: st.reviewedAt ? new Date(st.reviewedAt).toLocaleDateString() : 'Recent',
      });
    } else if (st.verificationStatus === 'rejected') {
      notifications.push({
        id: `ntf-rej-${st.id}`,
        type: 'rejected',
        title: `Action Required: ${st.name}`,
        desc: st.rejectionReason || `Station requires revisions before it can be verified.`,
        time: st.reviewedAt ? new Date(st.reviewedAt).toLocaleDateString() : 'Recent',
      });
    } else if (st.verificationStatus === 'pending') {
      notifications.push({
        id: `ntf-pnd-${st.id}`,
        type: 'pending',
        title: `Verification Pending: ${st.name}`,
        desc: `Station is currently in the Admin review queue.`,
        time: st.lastUpdated ? new Date(st.lastUpdated).toLocaleDateString() : 'Recent',
      });
    }
  });

  reports.forEach(r => {
    notifications.push({
      id: `ntf-rep-${r.id}`,
      type: 'report',
      title: `Driver Report: ${r.reportType.replace('_', ' ').toUpperCase()}`,
      desc: r.description || `A driver flagged an issue at this location.`,
      time: new Date(r.createdAt).toLocaleDateString(),
    });
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-white text-base">Network Notifications</h3>
              <p className="text-[11px] text-slate-400">Activity stream for your charging hub fleet</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Bell className="w-6 h-6 text-slate-600 mx-auto" />
              <div className="font-bold text-slate-400">No notifications yet</div>
              <p className="text-[11px]">Updates regarding station approvals and reports will appear here.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-white text-xs">
                    {n.type === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {n.type === 'rejected' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                    {n.type === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    {n.type === 'report' && <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                    <span className="truncate">{n.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">{n.time}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{n.desc}</p>
              </div>
            ))
          )}
        </div>

        {/* Close */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
