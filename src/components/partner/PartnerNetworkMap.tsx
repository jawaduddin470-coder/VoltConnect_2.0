import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ChargingStation } from '@/types';
import {
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  RotateCcw,
  Eye,
  Maximize2,
  Sliders,
  Compass,
  X,
  Plus,
  Shield,
  Layers,
} from 'lucide-react';

interface PartnerNetworkMapProps {
  partnerId: string;
  stations: ChargingStation[];
  onSelectStation: (station: ChargingStation) => void;
  onEditStation: (station: ChargingStation, resubmit?: boolean) => void;
  onAddStationClick: () => void;
}

export const PartnerNetworkMap: React.FC<PartnerNetworkMapProps> = ({
  partnerId,
  stations,
  onSelectStation,
  onEditStation,
  onAddStationClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'approved' | 'pending' | 'rejected'>('ALL');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);

  // STRICT PARTNER OWNERSHIP BARRIER (PART 9, 10, 14, 18, 19)
  // Ensures ONLY the authenticated partner's stations are processed.
  // 1,766 seed stations and other partners' stations are 100% excluded.
  const myStations = stations.filter(
    s => (s.partnerId === partnerId || s.createdBy === partnerId)
  );

  const isApproved = (s: ChargingStation) =>
    (s.verificationStatus === 'approved' || s.verificationStatus === 'verified') && s.status === 'active';
  const isPending = (s: ChargingStation) =>
    s.verificationStatus === 'pending' || s.verificationStatus === 'under_review';
  const isRejected = (s: ChargingStation) =>
    s.verificationStatus === 'rejected';

  // Extract unique cities from partner-owned stations
  const partnerCities = Array.from(new Set(myStations.map(s => s.city).filter(Boolean)));

  // Filtered partner stations for map display
  const filteredStations = myStations.filter(st => {
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
    if (statusFilter === 'approved' && !isApproved(st)) return false;
    if (statusFilter === 'pending' && !isPending(st)) return false;
    if (statusFilter === 'rejected' && !isRejected(st)) return false;

    // 3. City Filter
    if (selectedCity !== 'ALL' && st.city.toLowerCase() !== selectedCity.toLowerCase()) return false;

    return true;
  });

  // Fit bounds to partner stations
  const fitMyStations = () => {
    if (!mapInstanceRef.current || filteredStations.length === 0) return;
    const validCoords = filteredStations
      .filter(s => !isNaN(s.latitude) && !isNaN(s.longitude))
      .map(s => [s.latitude, s.longitude] as [number, number]);

    if (validCoords.length === 1) {
      mapInstanceRef.current.setView(validCoords[0], 14, { animate: true });
    } else if (validCoords.length > 1) {
      const bounds = L.latLngBounds(validCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  };

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = myStations.length > 0 && !isNaN(myStations[0].latitude)
      ? [myStations[0].latitude, myStations[0].longitude]
      : [17.4385, 78.3842]; // Default to Hyderabad if no stations yet

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: myStations.length > 0 ? 12 : 5,
      zoomControl: true,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
      if (myStations.length > 0) {
        fitMyStations();
      }
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers Whenever Filtered Stations Change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    filteredStations.forEach(st => {
      if (isNaN(st.latitude) || isNaN(st.longitude)) return;

      const approved = isApproved(st);
      const pending = isPending(st);
      const rejected = isRejected(st);

      let pinColor = '#10b981'; // Emerald for Approved/Verified
      let statusLabel = 'VERIFIED & LIVE';
      if (pending) {
        pinColor = '#f59e0b'; // Amber for Pending
        statusLabel = 'PENDING APPROVAL';
      } else if (rejected) {
        pinColor = '#f43f5e'; // Rose for Rejected
        statusLabel = 'NEEDS CORRECTION';
      }

      const icon = L.divIcon({
        className: 'partner-station-marker',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${pinColor};
            color: #020617;
            border-radius: 50%;
            border: 2.5px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <svg style="width: 16px; height: 16px; stroke: #020617; stroke-width: 2.5; fill: none;" viewBox="0 0 24 24">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([st.latitude, st.longitude], { icon });

      marker.bindTooltip(`
        <div style="padding: 2px 4px; font-family: sans-serif;">
          <div style="font-weight: 800; font-size: 12px; color: #ffffff;">${st.name}</div>
          <div style="font-size: 10px; color: ${pinColor}; font-weight: 700; margin-top: 2px;">${statusLabel}</div>
          <div style="font-size: 10px; color: #94a3b8;">${st.city} • ${st.chargers[0]?.powerKW || 60} kW</div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -16],
        className: 'partner-map-tooltip',
      });

      marker.on('click', () => {
        setSelectedStation(st);
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [filteredStations]);

  return (
    <div className="space-y-4">
      {/* MAP CONTROLS & FILTER TOOLBAR */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Title & Private Network Indicator */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">My Charging Network</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  Private Partner Assets
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Displaying {filteredStations.length} of {myStations.length} registered partner hubs
              </p>
            </div>
          </div>

          {/* Quick Fit & Add Hub CTA */}
          <div className="flex items-center gap-2">
            <button
              onClick={fitMyStations}
              disabled={filteredStations.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-40"
              title="Fit map view to my stations"
            >
              <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Fit to Hubs</span>
            </button>

            <button
              onClick={onAddStationClick}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Station</span>
            </button>
          </div>
        </div>

        {/* Filter Bar: Search + Status Chips + City */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter my stations by name, city, address..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({myStations.length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'approved' ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Live ({myStations.filter(isApproved).length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'pending' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Pending ({myStations.filter(isPending).length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'rejected' ? 'bg-rose-500 text-white font-extrabold' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Needs Fix ({myStations.filter(isRejected).length})</span>
            </button>
          </div>

          {/* City Selector */}
          {partnerCities.length > 0 && (
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Cities</option>
              {partnerCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

        </div>
      </div>

      {/* MAP CANVAS CONTAINER */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 h-[520px] w-full">
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Empty State Overlay */}
        {myStations.length === 0 && (
          <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-xl">
              <Zap className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-extrabold text-white">No Registered Charging Hubs</h3>
              <p className="text-xs text-slate-400">
                You currently have no charging hubs on your private network. Submit your first station for administrator verification to view it on your asset map.
              </p>
            </div>
            <button
              onClick={onAddStationClick}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Register Charging Station
            </button>
          </div>
        )}

        {/* SELECTED STATION COMPACT DETAIL PANEL (PART 11) */}
        {selectedStation && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-3xl p-5 space-y-3 shadow-2xl animate-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-white truncate max-w-[200px]">
                    {selectedStation.name}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{selectedStation.address}, {selectedStation.city}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedStation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between">
              {isApproved(selectedStation) ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  VERIFIED & LIVE ON VOLTMAP
                </span>
              ) : isPending(selectedStation) ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Clock className="w-3 h-3" />
                  PENDING ADMIN APPROVAL
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-3 h-3" />
                  NEEDS CORRECTION
                </span>
              )}

              <span className="text-[10px] font-mono text-slate-500">
                {selectedStation.id}
              </span>
            </div>

            {/* Rejection Notice if rejected */}
            {isRejected(selectedStation) && selectedStation.rejectionReason && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1 text-rose-400">
                  <AlertTriangle className="w-3 h-3" />
                  Admin Feedback:
                </div>
                <p className="line-clamp-2 text-slate-300">{selectedStation.rejectionReason}</p>
              </div>
            )}

            {/* Hardware Specs Strip */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[9px] font-bold text-slate-500 uppercase">Power</div>
                <div className="font-extrabold text-sky-400 mt-0.5">
                  {Math.max(...selectedStation.chargers.map(c => c.powerKW), 0)} kW
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[9px] font-bold text-slate-500 uppercase">Tariff</div>
                <div className="font-extrabold text-emerald-400 mt-0.5">
                  ₹{selectedStation.chargers[0]?.pricingPerKWh || 18}/kWh
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[9px] font-bold text-slate-500 uppercase">Ports</div>
                <div className="font-extrabold text-slate-300 mt-0.5">
                  {selectedStation.chargers.length} Bays
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <button
                onClick={() => {
                  const st = selectedStation;
                  setSelectedStation(null);
                  onSelectStation(st);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                Fleet Details
              </button>

              {isRejected(selectedStation) ? (
                <button
                  onClick={() => {
                    const st = selectedStation;
                    setSelectedStation(null);
                    onEditStation(st, true);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Fix & Resubmit
                </button>
              ) : (
                <button
                  onClick={() => {
                    const st = selectedStation;
                    setSelectedStation(null);
                    onEditStation(st, false);
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-colors"
                  title="Update pricing tariff"
                >
                  Edit Tariff
                </button>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
