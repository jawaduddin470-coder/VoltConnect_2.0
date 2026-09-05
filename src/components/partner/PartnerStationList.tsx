import React, { useState } from 'react';
import { ChargingStation } from '@/types';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  MapPin,
  ExternalLink,
  Edit2,
  RotateCcw,
  Sliders,
  DollarSign,
  ChevronRight,
  Eye,
  Layers,
  LayoutGrid,
  List as ListIcon,
  ShieldCheck,
} from 'lucide-react';

interface PartnerStationListProps {
  stations: ChargingStation[];
  onSelectStation: (station: ChargingStation) => void;
  onEditStation: (station: ChargingStation, resubmit?: boolean) => void;
  onAddStationClick: () => void;
}

export const PartnerStationList: React.FC<PartnerStationListProps> = ({
  stations,
  onSelectStation,
  onEditStation,
  onAddStationClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'REJECTED'>('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Status helper predicates
  const isApproved = (s: ChargingStation) =>
    (s.verificationStatus === 'verified' || s.verificationStatus === 'approved') && s.status === 'active';
  const isPending = (s: ChargingStation) =>
    s.verificationStatus === 'pending' || s.verificationStatus === 'under_review';
  const isRejected = (s: ChargingStation) =>
    s.verificationStatus === 'rejected';

  // Extract unique cities
  const cities = Array.from(new Set(stations.map(s => s.city).filter(Boolean)));

  const filteredStations = stations.filter(st => {
    // 1. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchName = st.name.toLowerCase().includes(q);
      const matchCity = st.city.toLowerCase().includes(q);
      const matchAddress = st.address.toLowerCase().includes(q);
      const matchId = st.id.toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchAddress && !matchId) return false;
    }

    // 2. Status Filter
    if (statusFilter === 'VERIFIED' && !isApproved(st)) return false;
    if (statusFilter === 'PENDING' && !isPending(st)) return false;
    if (statusFilter === 'REJECTED' && !isRejected(st)) return false;

    // 3. City Filter
    if (cityFilter !== 'ALL' && st.city.toLowerCase() !== cityFilter.toLowerCase()) return false;

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search stations by name, city, address, or ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        {/* Filter Pills & City Dropdown */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({stations.length})
            </button>
            <button
              onClick={() => setStatusFilter('VERIFIED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'VERIFIED'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Live ({stations.filter(isApproved).length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending ({stations.filter(isPending).length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Needs Fix ({stations.filter(isRejected).length})</span>
            </button>
          </div>

          {cities.length > 0 && (
            <select
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Cities</option>
              {cities.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* View Toggle */}
          <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`p-1.5 rounded-lg ${viewMode === 'CARDS' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg ${viewMode === 'TABLE' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stations Content */}
      {filteredStations.length === 0 ? (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Zap className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No charging stations found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {stations.length === 0
                ? "You haven't submitted any charging hubs yet. Register your first fast-charging asset to start expanding the network."
                : 'No stations match your selected status or search filter.'}
            </p>
          </div>
          {stations.length === 0 && (
            <button
              onClick={onAddStationClick}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs hover:bg-emerald-400 transition-all shadow-md inline-flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              Register Charging Station
            </button>
          )}
        </div>
      ) : viewMode === 'CARDS' ? (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStations.map(station => {
            const maxPower = Math.max(...station.chargers.map(c => c.powerKW), 0);
            const tariff = station.chargers[0]?.pricingPerKWh || 18;
            const connectorSummary = Array.from(new Set(station.chargers.map(c => c.connectorType))).join(', ');
            const approved = isApproved(station);
            const pending = isPending(station);
            const rejected = isRejected(station);

            return (
              <div
                key={station.id}
                className="group rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 space-y-4 transition-all hover:shadow-xl flex flex-col justify-between"
              >
                {/* Top: Status Badges & Name */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {approved ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        VERIFIED & LIVE
                      </span>
                    ) : pending ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <Clock className="w-3 h-3" />
                        PENDING APPROVAL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        NEEDS CORRECTION
                      </span>
                    )}

                    <span className="text-[10px] font-mono text-slate-500 truncate max-w-[100px]">
                      {station.id}
                    </span>
                  </div>

                  <div>
                    <h4
                      onClick={() => onSelectStation(station)}
                      className="text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1"
                    >
                      {station.name}
                    </h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {station.address}, {station.city}
                    </p>
                  </div>

                  {/* Rejection Notice Banner */}
                  {rejected && station.rejectionReason && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1 text-[11px] text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Admin Feedback:
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2">
                        {station.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Metrics Specs Pill Matrix */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                      <div className="text-[9px] font-bold text-slate-500 uppercase">Power</div>
                      <div className="text-xs font-extrabold text-sky-400 mt-0.5">{maxPower} kW</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                      <div className="text-[9px] font-bold text-slate-500 uppercase">Tariff</div>
                      <div className="text-xs font-extrabold text-emerald-400 mt-0.5">₹{tariff}/kWh</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                      <div className="text-[9px] font-bold text-slate-500 uppercase">Ports</div>
                      <div className="text-xs font-extrabold text-slate-300 mt-0.5">{station.chargers.length} Bays</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Toolbar */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectStation(station)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    View Details
                  </button>

                  {rejected ? (
                    <button
                      onClick={() => onEditStation(station, true)}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Edit & Resubmit
                    </button>
                  ) : (
                    <button
                      onClick={() => onEditStation(station, false)}
                      className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs transition-colors flex items-center gap-1"
                      title="Adjust Pricing Tariff"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Tariff
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Station Details</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Max Output</th>
                  <th className="py-3 px-4">Tariff</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStations.map(st => {
                  const maxPower = Math.max(...st.chargers.map(c => c.powerKW), 0);
                  const tariff = st.chargers[0]?.pricingPerKWh || 18;
                  const approved = isApproved(st);
                  const pending = isPending(st);
                  const rejected = isRejected(st);

                  return (
                    <tr key={st.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => onSelectStation(st)}
                          className="font-bold text-white hover:text-emerald-400 cursor-pointer"
                        >
                          {st.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{st.address}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-300">{st.city}</td>
                      <td className="py-3.5 px-4 font-bold text-sky-400">{maxPower} kW</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">₹{tariff}/kWh</td>
                      <td className="py-3.5 px-4">
                        {approved ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            LIVE & VERIFIED
                          </span>
                        ) : pending ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            PENDING AUDIT
                          </span>
                        ) : (
                          <div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              NEEDS CORRECTION
                            </span>
                            {st.rejectionReason && (
                              <div className="text-[10px] text-rose-400/80 truncate max-w-[150px] mt-1">
                                {st.rejectionReason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => onSelectStation(st)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs"
                        >
                          View
                        </button>
                        {rejected ? (
                          <button
                            onClick={() => onEditStation(st, true)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                          >
                            Resubmit
                          </button>
                        ) : (
                          <button
                            onClick={() => onEditStation(st, false)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
