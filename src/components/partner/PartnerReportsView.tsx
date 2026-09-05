import React, { useState } from 'react';
import { StationReport, ChargingStation } from '@/types';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Check,
  MapPin,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { updateDocumentFields } from '@/services/firebase/firestore';

interface PartnerReportsViewProps {
  reports: StationReport[];
  stations: ChargingStation[];
  onReportUpdated?: (updatedReport: StationReport) => void;
}

export const PartnerReportsView: React.FC<PartnerReportsViewProps> = ({
  reports,
  stations,
  onReportUpdated,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const stationsMap = new Map(stations.map(s => [s.id, s]));

  const filteredReports = reports.filter(r => {
    if (filter === 'PENDING' && r.status === 'resolved') return false;
    if (filter === 'RESOLVED' && r.status !== 'resolved') return false;
    return true;
  });

  const handleResolveReport = async (report: StationReport) => {
    setResolvingId(report.id);
    try {
      await updateDocumentFields('reports', report.id, {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      });
      if (onReportUpdated) {
        onReportUpdated({
          ...report,
          status: 'resolved',
        });
      }
    } catch (err) {
      console.error('Failed to resolve report:', err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Community & Driver Reports</h2>
              <p className="text-xs text-slate-400">Driver submitted station feedback, blocked bays, and hardware alerts</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({reports.length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'PENDING' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              Pending ({reports.filter(r => r.status !== 'resolved').length})
            </button>
            <button
              onClick={() => setFilter('RESOLVED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'RESOLVED' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Resolved ({reports.filter(r => r.status === 'resolved').length})
            </button>
          </div>
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="font-bold text-white text-sm">All Clear! No Open Issues</div>
            <p className="text-slate-400 max-w-sm mx-auto">
              No unresolved driver reports or hardware issue tickets on your station network.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map(report => {
              const station = stationsMap.get(report.stationId);
              const isResolved = report.status === 'resolved';

              return (
                <div
                  key={report.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isResolved
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {report.status}
                      </span>
                      <span className="text-xs font-extrabold text-white">
                        {report.reportType.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-medium">
                      {report.description || 'Driver reported an issue at this charging location.'}
                    </div>

                    {station && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{station.name} ({station.city})</span>
                      </div>
                    )}
                  </div>

                  {!isResolved && (
                    <button
                      onClick={() => handleResolveReport(report)}
                      disabled={resolvingId === report.id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Mark as Resolved
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
