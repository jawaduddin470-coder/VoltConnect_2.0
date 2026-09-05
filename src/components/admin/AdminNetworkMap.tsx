import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useAuth } from '@/contexts/AuthContext';
import { chargingDataService } from '@/services/chargingDataService';
import { operationsService } from '@/services/operationsService';
import { updateDocumentFields } from '@/services/firebase/firestore';
import { ChargingStation, VerificationStatus, StationStatus } from '@/types';
import {
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Edit2,
  Trash2,
  X,
  Check,
  Zap,
  Sliders,
  Compass,
  Building2,
  Move,
  ShieldCheck,
  Power,
  RotateCcw,
} from 'lucide-react';

interface AdminNetworkMapProps {
  stations: ChargingStation[];
  onStationUpdated: (updated: ChargingStation) => void;
  onStationDeleted?: (stationId: string) => void;
}

interface SpatialCluster {
  id: string;
  lat: number;
  lng: number;
  stations: ChargingStation[];
  bounds: L.LatLngBounds;
}

function computeSpatialClusters(stations: ChargingStation[], zoom: number): SpatialCluster[] {
  const validStations = stations.filter(
    s => !isNaN(Number(s.latitude)) && !isNaN(Number(s.longitude)) &&
         s.latitude >= -90 && s.latitude <= 90 &&
         s.longitude >= -180 && s.longitude <= 180
  );

  // Zoom >= 8: Render 100% individual station markers with zero aggregation
  if (zoom >= 8) {
    return validStations.map(s => ({
      id: `st-${s.id}`,
      lat: s.latitude,
      lng: s.longitude,
      stations: [s],
      bounds: L.latLngBounds([s.latitude, s.longitude], [s.latitude, s.longitude]),
    }));
  }

  // Adaptive fine-grained spatial clustering for zoom < 8
  // Produces 40-80 regional hub clusters across India rather than over-aggregating into 5 nodes
  const gridSize = 10 / Math.pow(2, zoom - 2);
  const clustersMap = new Map<string, SpatialCluster>();

  for (const station of validStations) {
    const lat = Number(station.latitude);
    const lng = Number(station.longitude);

    const cellX = Math.floor((lng + 180) / gridSize);
    const cellY = Math.floor((lat + 90) / gridSize);
    const cellKey = `${cellX}_${cellY}`;

    const existing = clustersMap.get(cellKey);
    if (existing) {
      existing.stations.push(station);
      const count = existing.stations.length;
      existing.lat = (existing.lat * (count - 1) + lat) / count;
      existing.lng = (existing.lng * (count - 1) + lng) / count;
      existing.bounds.extend([lat, lng]);
    } else {
      clustersMap.set(cellKey, {
        id: `cluster-${cellKey}`,
        lat,
        lng,
        stations: [station],
        bounds: L.latLngBounds([lat, lng], [lat, lng]),
      });
    }
  }

  return Array.from(clustersMap.values());
}

export const AdminNetworkMap: React.FC<AdminNetworkMapProps> = ({
  stations,
  onStationUpdated,
  onStationDeleted,
}) => {
  const { user } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const editMarkerRef = useRef<L.Marker | null>(null);

  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'approved' | 'pending' | 'rejected' | 'inactive'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Location Change Mode State
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [pendingLat, setPendingLat] = useState<number>(0);
  const [pendingLng, setPendingLng] = useState<number>(0);

  // Edit Modal State
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTariff, setEditTariff] = useState(18);
  const [editPower, setEditPower] = useState(60);
  const [editHours, setEditHours] = useState('24/7 Open');

  // Rejection Dialog State
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Inadequate physical access or unverified electrical capacity.');

  // Deactivation Confirmation State
  const [isConfirmingDeactivation, setIsConfirmingDeactivation] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter stations for map rendering
  const filtered = stations.filter(st => {
    const matchesFilter =
      filterStatus === 'ALL' ||
      (filterStatus === 'inactive' ? st.status === 'inactive' : st.verificationStatus === filterStatus);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      st.name.toLowerCase().includes(q) ||
      st.city.toLowerCase().includes(q) ||
      st.id.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // Center of India
      zoom: 5,
      zoomControl: true,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    map.on('moveend zoomend', () => {
      renderMapMarkers();
    });

    // Handle map click when changing station location
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isChangingLocation && editMarkerRef.current) {
        const lat = Number(e.latlng.lat.toFixed(6));
        const lng = Number(e.latlng.lng.toFixed(6));
        setPendingLat(lat);
        setPendingLng(lng);
        editMarkerRef.current.setLatLng([lat, lng]);
      }
    });

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Map Markers with Spatial Clustering & Status Colors
  const renderMapMarkers = () => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();

    const zoom = mapInstanceRef.current.getZoom();
    const clusters = computeSpatialClusters(filtered, zoom);

    clusters.forEach(cluster => {
      if (cluster.stations.length === 1) {
        const st = cluster.stations[0];
        const isPending = st.verificationStatus === 'pending';
        const isRejected = st.verificationStatus === 'rejected';
        const isInactive = st.status === 'inactive';

        let color = '#10b981'; // Approved Emerald
        if (isInactive) color = '#64748b'; // Inactive Slate
        else if (isRejected) color = '#f43f5e'; // Rejected Rose
        else if (isPending) color = '#f59e0b'; // Pending Amber

        const icon = L.divIcon({
          className: 'admin-marker-pin',
          html: `
            <div style="
              width: 28px;
              height: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: ${color};
              color: white;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.5);
              cursor: pointer;
            ">
              <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const m = L.marker([st.latitude, st.longitude], { icon });
        m.bindTooltip(`<b>${st.name}</b><br/><span style="color:#94a3b8">${st.city} • ${st.chargers?.[0]?.powerKW || 60} kW</span>`, {
          direction: 'top',
          offset: [0, -14],
        });
        m.on('click', () => {
          setSelectedStation(st);
          setIsChangingLocation(false);
          if (editMarkerRef.current) {
            editMarkerRef.current.remove();
            editMarkerRef.current = null;
          }
        });
        m.addTo(markersGroupRef.current!);
      } else {
        // Multi-station cluster badge
        const hasPending = cluster.stations.some(s => s.verificationStatus === 'pending');
        const clusterBg = hasPending ? 'rgba(245, 158, 11, 0.9)' : 'rgba(14, 165, 233, 0.9)';

        const clusterIcon = L.divIcon({
          className: 'admin-cluster-badge',
          html: `
            <div style="
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: ${clusterBg};
              color: white;
              font-weight: 800;
              font-size: 11px;
              font-family: monospace;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 3px 10px rgba(0,0,0,0.4);
            ">
              ${cluster.stations.length}
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const cm = L.marker([cluster.lat, cluster.lng], { icon: clusterIcon });
        cm.bindTooltip(`<b>${cluster.stations.length} Charging Hubs</b><br/><span style="color:#94a3b8">Click to zoom in</span>`, {
          direction: 'top',
          offset: [0, -18],
        });
        cm.on('click', () => {
          mapInstanceRef.current?.fitBounds(cluster.bounds.pad(0.3), { maxZoom: 14 });
        });
        cm.addTo(markersGroupRef.current!);
      }
    });
  };

  useEffect(() => {
    renderMapMarkers();
  }, [filtered]);

  // Start Location Change Mode
  const handleStartLocationChange = () => {
    if (!selectedStation || !mapInstanceRef.current) return;
    setIsChangingLocation(true);
    setPendingLat(selectedStation.latitude);
    setPendingLng(selectedStation.longitude);

    if (editMarkerRef.current) editMarkerRef.current.remove();

    const draggableIcon = L.divIcon({
      className: 'admin-reposition-pin',
      html: `
        <div style="
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f59e0b;
          color: white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.8);
        ">
          <svg style="transform: rotate(45deg); width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="5 9 2 12 5 15"></polyline>
            <polyline points="9 5 12 2 15 5"></polyline>
            <polyline points="15 19 12 22 9 19"></polyline>
            <polyline points="19 9 22 12 19 15"></polyline>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="12" y1="2" x2="12" y2="22"></line>
          </svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
    });

    const m = L.marker([selectedStation.latitude, selectedStation.longitude], {
      icon: draggableIcon,
      draggable: true,
    }).addTo(mapInstanceRef.current);

    m.on('dragend', () => {
      const pos = m.getLatLng();
      setPendingLat(Number(pos.lat.toFixed(6)));
      setPendingLng(Number(pos.lng.toFixed(6)));
    });

    editMarkerRef.current = m;
    mapInstanceRef.current.setView([selectedStation.latitude, selectedStation.longitude], 15);
  };

  // Confirm Location Change
  const handleConfirmLocationChange = async () => {
    if (!selectedStation || !user) return;
    setActionLoading(true);

    const oldLat = selectedStation.latitude;
    const oldLng = selectedStation.longitude;

    const updated: ChargingStation = {
      ...selectedStation,
      latitude: pendingLat,
      longitude: pendingLng,
      admin_modified_at: new Date().toISOString(),
      admin_modified_by: user.email,
    };

    try {
      await updateDocumentFields('stations', selectedStation.id, {
        latitude: pendingLat,
        longitude: pendingLng,
        admin_modified_at: new Date().toISOString(),
        admin_modified_by: user.email,
      });

      operationsService.logAuditEvent(
        user.uid,
        user.email,
        user.role,
        'ADMIN_CHANGE_STATION_LOCATION',
        'stations',
        selectedStation.id,
        {
          stationName: selectedStation.name,
          oldCoords: [oldLat, oldLng],
          newCoords: [pendingLat, pendingLng],
        }
      );

      chargingDataService.clearCache();
      onStationUpdated(updated);
      setSelectedStation(updated);
      setIsChangingLocation(false);
      if (editMarkerRef.current) {
        editMarkerRef.current.remove();
        editMarkerRef.current = null;
      }
    } catch (err) {
      console.error('Failed to change station coordinates:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Metadata Modal
  const handleOpenEditMetadata = () => {
    if (!selectedStation) return;
    setEditName(selectedStation.name);
    setEditTariff(selectedStation.chargers[0]?.pricingPerKWh || 18);
    setEditPower(selectedStation.chargers[0]?.powerKW || 60);
    setEditHours(selectedStation.operatingHours || '24/7 Open');
    setIsEditingMetadata(true);
  };

  // Save Station Metadata Edit
  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation || !user) return;
    setActionLoading(true);

    const updatedChargers = selectedStation.chargers.map(c => ({
      ...c,
      pricingPerKWh: editTariff,
      powerKW: editPower,
    }));

    const updated: ChargingStation = {
      ...selectedStation,
      name: editName,
      operatingHours: editHours,
      chargers: updatedChargers,
      admin_modified_at: new Date().toISOString(),
      admin_modified_by: user.email,
    };

    try {
      await updateDocumentFields('stations', selectedStation.id, {
        name: editName,
        operatingHours: editHours,
        chargers: updatedChargers,
        admin_modified_at: new Date().toISOString(),
        admin_modified_by: user.email,
      });

      operationsService.logAuditEvent(
        user.uid,
        user.email,
        user.role,
        'ADMIN_EDIT_STATION',
        'stations',
        selectedStation.id,
        { stationName: editName, tariff: editTariff, powerKW: editPower }
      );

      chargingDataService.clearCache();
      onStationUpdated(updated);
      setSelectedStation(updated);
      setIsEditingMetadata(false);
    } catch (err) {
      console.error('Failed to update station metadata:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Station Handler
  const handleApproveStation = async () => {
    if (!selectedStation || !user) return;
    setActionLoading(true);

    try {
      await operationsService.reviewStation(selectedStation.id, 'approved', user.uid, user.email);
      const updated: ChargingStation = {
        ...selectedStation,
        verificationStatus: 'approved',
        admin_verified: true,
        reviewedBy: user.uid,
        reviewedAt: new Date().toISOString(),
      };
      chargingDataService.clearCache();
      onStationUpdated(updated);
      setSelectedStation(updated);
    } catch (err) {
      console.error('Failed to approve station:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Station Handler (Requires Reason)
  const handleRejectStation = async () => {
    if (!selectedStation || !user) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      alert('Specific rejection reason required (min 5 characters).');
      return;
    }
    setActionLoading(true);

    try {
      await operationsService.reviewStation(selectedStation.id, 'rejected', user.uid, user.email, rejectionReason.trim());
      const updated: ChargingStation = {
        ...selectedStation,
        verificationStatus: 'rejected',
        admin_verified: false,
        rejectionReason: rejectionReason.trim(),
        reviewedBy: user.uid,
        reviewedAt: new Date().toISOString(),
      };
      chargingDataService.clearCache();
      onStationUpdated(updated);
      setSelectedStation(updated);
      setIsRejecting(false);
    } catch (err) {
      console.error('Failed to reject station:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Governed Soft-Delete (Condition 7: Deactivate station)
  const handleDeactivateStation = async () => {
    if (!selectedStation || !user) return;
    setActionLoading(true);

    const newStatus: StationStatus = selectedStation.status === 'inactive' ? 'active' : 'inactive';
    const isDeactivating = newStatus === 'inactive';

    const updated: ChargingStation = {
      ...selectedStation,
      status: newStatus,
      admin_modified_at: new Date().toISOString(),
      admin_modified_by: user.email,
    };

    try {
      await updateDocumentFields('stations', selectedStation.id, {
        status: newStatus,
        admin_modified_at: new Date().toISOString(),
        admin_modified_by: user.email,
      });

      operationsService.logAuditEvent(
        user.uid,
        user.email,
        user.role,
        isDeactivating ? 'ADMIN_DEACTIVATE_STATION' : 'ADMIN_ACTIVATE_STATION',
        'stations',
        selectedStation.id,
        { stationName: selectedStation.name, status: newStatus }
      );

      chargingDataService.clearCache();
      onStationUpdated(updated);
      setSelectedStation(updated);
      setIsConfirmingDeactivation(false);
    } catch (err) {
      console.error('Failed to toggle station active status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Map Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto">
          {(['ALL', 'pending', 'approved', 'rejected', 'inactive'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterStatus === st
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'ALL' ? 'All Pins' : st.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0 w-full sm:w-auto justify-center">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span>{filtered.length} of {stations.length} Station Pins on Canvas</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search map stations..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Main Map + Side Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[520px]">
        {/* Map Container */}
        <div className="lg:col-span-2 relative rounded-3xl overflow-hidden border border-slate-800 shadow-xl h-[480px] lg:h-[580px] w-full">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Map Legend */}
          <div className="absolute bottom-3 left-3 z-[400] p-2.5 rounded-xl bg-slate-950/90 backdrop-blur-xs border border-slate-800 flex items-center gap-3 text-[10px] font-bold">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-slate-300">Approved</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="text-slate-300">Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="text-slate-300">Rejected</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
              <span className="text-slate-300">Inactive</span>
            </div>
          </div>

          {/* Location Mode Active Floating Alert */}
          {isChangingLocation && (
            <div className="absolute top-3 left-3 right-3 z-[400] p-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4 animate-bounce" />
                <span>Move the amber pin or click anywhere on the map to set new coordinates.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsChangingLocation(false);
                    editMarkerRef.current?.remove();
                    editMarkerRef.current = null;
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 text-white text-[11px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLocationChange}
                  disabled={actionLoading}
                  className="px-3 py-1 rounded-lg bg-slate-950 text-amber-400 font-extrabold text-[11px] hover:bg-slate-900"
                >
                  Confirm Coordinates
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Station Management Drawer */}
        <div className="lg:col-span-1">
          {selectedStation ? (
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-sky-400">{selectedStation.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      selectedStation.verificationStatus === 'approved'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        : selectedStation.verificationStatus === 'pending'
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    }`}>
                      {selectedStation.verificationStatus}
                    </span>
                  </div>
                  <button onClick={() => setSelectedStation(null)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="font-heading font-extrabold text-base text-white">{selectedStation.name}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">{selectedStation.address}, {selectedStation.city}</div>
                </div>

                {/* Technical Specs Card */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Max Power</div>
                    <div className="font-bold text-white font-mono mt-0.5">
                      {Math.max(...selectedStation.chargers.map(c => c.powerKW), 50)} kW
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Tariff</div>
                    <div className="font-bold text-emerald-400 font-mono mt-0.5">
                      ₹{selectedStation.chargers[0]?.pricingPerKWh || 18} / kWh
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Latitude</div>
                    <div className="font-mono text-sky-400 font-semibold mt-0.5">{selectedStation.latitude.toFixed(6)}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Longitude</div>
                    <div className="font-mono text-sky-400 font-semibold mt-0.5">{selectedStation.longitude.toFixed(6)}</div>
                  </div>
                </div>

                {selectedStation.rejectionReason && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    <div className="font-bold text-[10px] uppercase">Rejection Reason:</div>
                    <div className="mt-0.5">{selectedStation.rejectionReason}</div>
                  </div>
                )}
              </div>

              {/* Action Buttons Grid */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Operational Actions</div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleStartLocationChange}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                  >
                    <Move className="w-3.5 h-3.5 text-amber-400" />
                    <span>Change Pin</span>
                  </button>
                  <button
                    onClick={handleOpenEditMetadata}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Edit Specs</span>
                  </button>
                </div>

                {/* Verification Actions */}
                {selectedStation.verificationStatus === 'pending' ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleApproveStation}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Hub</span>
                    </button>
                    <button
                      onClick={() => setIsRejecting(true)}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Hub</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleDeactivateStation}
                    disabled={actionLoading}
                    className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedStation.status === 'inactive'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{selectedStation.status === 'inactive' ? 'Re-activate on Network' : 'Soft-Deactivate from Network'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/80 text-center text-slate-500 text-xs h-full flex flex-col items-center justify-center space-y-2">
              <MapPin className="w-8 h-8 text-slate-600 animate-pulse" />
              <div className="font-bold text-slate-400">Select Any Station Pin</div>
              <p className="max-w-xs text-[11px]">
                Click any single pin on the map to inspect charging hardware, change GPS coordinates, or manage public verification status.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Station Metadata Modal */}
      {isEditingMetadata && selectedStation && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-heading font-extrabold text-sm text-white">Edit Station Specs</h3>
              <button onClick={() => setIsEditingMetadata(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMetadata} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Station Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Tariff Rate (₹/kWh)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editTariff}
                    onChange={e => setEditTariff(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Max Power (kW)</label>
                  <input
                    type="number"
                    value={editPower}
                    onChange={e => setEditPower(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingMetadata(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-400 shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal with Mandatory Rationale */}
      {isRejecting && selectedStation && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-heading font-extrabold text-sm border-b border-slate-800 pb-3">
              <XCircle className="w-5 h-5" />
              <span>Reject Station Submission</span>
            </div>

            <p className="text-xs text-slate-300">
              Provide an explicit operational reason for rejecting <span className="font-bold text-white">"{selectedStation.name}"</span>. The partner will see this reason in their portal to correct and resubmit.
            </p>

            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Enter rejection reason (min 5 characters)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsRejecting(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectStation}
                disabled={actionLoading || rejectionReason.trim().length < 5}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-400 shadow-md disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
