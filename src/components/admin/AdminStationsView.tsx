import React, { useEffect, useState } from 'react';
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
  Clock,
  Edit2,
  ShieldCheck,
  Zap,
  Sliders,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertTriangle,
  RotateCcw,
  Info,
  DollarSign,
  Compass,
} from 'lucide-react';

export const AdminStationsView: React.FC = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedOperator, setSelectedOperator] = useState('ALL');
  const [selectedConnector, setSelectedConnector] = useState('ALL');
  const [selectedPower, setSelectedPower] = useState('ALL');
  const [selectedVerification, setSelectedVerification] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Selected Station Detail & Edit Modal State
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editOperator, setEditOperator] = useState('');
  const [editTariff, setEditTariff] = useState(18);

  const fetchStationsData = () => {
    setLoading(true);
    chargingDataService.getStations().then(data => {
      setStations(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchStationsData();
  }, []);

  // Multi-Filter Logic
  const filteredStations = stations.filter(st => {
    const operator = st.operatorName || 'VoltCharge';

    // 1. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = st.name.toLowerCase().includes(q);
      const matchesCity = st.city.toLowerCase().includes(q);
      const matchesOperator = operator.toLowerCase().includes(q);
      const matchesId = st.id.toLowerCase().includes(q);
      if (!matchesName && !matchesCity && !matchesOperator && !matchesId) return false;
    }

    // 2. City Filter
    if (selectedCity !== 'ALL' && st.city.toLowerCase() !== selectedCity.toLowerCase()) return false;

    // 3. Operator Filter
    if (selectedOperator !== 'ALL' && !operator.toLowerCase().includes(selectedOperator.toLowerCase())) return false;

    // 4. Connector Filter
    if (selectedConnector !== 'ALL' && !st.chargers.some(c => c.connectorType === selectedConnector)) return false;

    // 5. Power Filter
    if (selectedPower !== 'ALL') {
      const maxPower = Math.max(...st.chargers.map(c => c.powerKW), 0);
      if (selectedPower === 'DC_FAST' && (maxPower < 50 || maxPower > 100)) return false;
      if (selectedPower === 'DC_ULTRA' && maxPower < 120) return false;
      if (selectedPower === 'AC_TYPE2' && maxPower > 22) return false;
    }

    // 6. Verification Status Filter
    if (selectedVerification !== 'ALL' && st.verificationStatus !== selectedVerification) return false;

    // 7. Source Filter
    if (selectedSource !== 'ALL' && st.dataSource !== selectedSource) return false;

    // 8. Status Filter
    if (selectedStatus !== 'ALL' && st.status !== selectedStatus) return false;

    return true;
  });

  // Pagination Calculation
  const totalPages = Math.ceil(filteredStations.length / PAGE_SIZE) || 1;
  const paginatedStations = filteredStations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Admin Actions
  const handleVerifyStation = async (station: ChargingStation, verify: boolean) => {
    if (!user) return;
    const newVerificationStatus: VerificationStatus = verify ? 'approved' : 'pending';
    const updated: ChargingStation = {
      ...station,
      verificationStatus: newVerificationStatus,
      admin_verified: verify,
      admin_modified_at: new Date().toISOString(),
      admin_modified_by: user.email,
    };

    await updateDocumentFields('stations', station.id, {
      verificationStatus: newVerificationStatus,
      admin_verified: verify,
      admin_modified_at: new Date().toISOString(),
      admin_modified_by: user.email,
    });

    operationsService.logAuditEvent(
      user.uid,
      user.email,
      user.role,
      verify ? 'ADMIN_VERIFY_STATION' : 'ADMIN_UNVERIFY_STATION',
      'stations',
      station.id,
      { stationName: station.name, newVerificationStatus }
    );

    setStations(prev => prev.map(s => (s.id === station.id ? updated : s)));
    if (selectedStation?.id === station.id) setSelectedStation(updated);
  };

  const handleToggleStationStatus = async (station: ChargingStation, disable: boolean) => {
    if (!user) return;
    const newStatus: StationStatus = disable ? 'offline' : 'active';
    const updated: ChargingStation = {
      ...station,
      status: newStatus,
      admin_modified_at: new Date().toISOString(),
      admin_modified_by: user.email,
    };

    await updateDocumentFields('stations', station.id, {
      status: newStatus,
      admin_modified_at: new Date().toISOString(),
      admin_modified_by: user.email,
    });

    operationsService.logAuditEvent(
      user.uid,
      user.email,
      user.role,
      disable ? 'ADMIN_DISABLE_STATION' : 'ADMIN_RESTORE_STATION',
      'stations',
      station.id,
      { stationName: station.name, newStatus }
    );

    setStations(prev => prev.map(s => (s.id === station.id ? updated : s)));
    if (selectedStation?.id === station.id) setSelectedStation(updated);
  };

  const handleOpenEditModal = (station: ChargingStation) => {
    setSelectedStation(station);
    setEditName(station.name);
    setEditCity(station.city);
    setEditAddress(station.address);
    setEditOperator(station.operatorName || 'VoltCharge');
    setEditTariff(station.chargers[0]?.pricingPerKWh || 18);
    setIsEditing(true);
  };

  const handleSaveStationEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation || !user) return;

    const updatedChargers = selectedStation.chargers.map(c => ({ ...c, pricingPerKWh: editTariff }));
    const updatedStation: ChargingStation = {
      ...selectedStation,
      name: editName,
      city: editCity,
      address: editAddress,
      operatorName: editOperator,
      chargers: updatedChargers,
      admin_modified_at: new Date().toISOString(),
      admin_modified_by: user.email,
    };

    await updateDocumentFields('stations', selectedStation.id, {
      name: editName,
      city: editCity,
      address: editAddress,
      operatorName: editOperator,
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
      { stationName: editName, editCity, editOperator, editTariff }
    );

    setStations(prev => prev.map(s => (s.id === selectedStation.id ? updatedStation : s)));
    setSelectedStation(updatedStation);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 vc-page-enter">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="vc-badge vc-badge-sky text-[10px] uppercase font-bold">NETWORK GOVERNANCE</span>
            <span className="text-xs text-slate-400 font-semibold">FIRESTORE COLLECTION: "stations"</span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Charging Network Management
          </h1>
          <p className="text-xs text-slate-400">
            Verify, edit, or disable stations while preserving OpenChargeMap source dataset provenance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
          <Zap className="w-4 h-4 text-sky-400" />
          <span>{filteredStations.length} of {stations.length} Hubs Loaded</span>
        </div>
      </div>

      {/* 2. SEARCH & MULTI-FILTER TOOLBAR */}
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
            placeholder="Search station by name, city, operator, or station ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
          />
        </div>

        {/* 7 Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
          
          <select
            value={selectedCity}
            onChange={e => { setSelectedCity(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">City: All</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Vijayawada">Vijayawada</option>
            <option value="Vizag">Vizag</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Chennai">Chennai</option>
          </select>

          <select
            value={selectedOperator}
            onChange={e => { setSelectedOperator(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">Operator: All</option>
            <option value="Tata">Tata Power</option>
            <option value="Zeon">Zeon Charge</option>
            <option value="Statiq">Statiq</option>
            <option value="ChargeZone">ChargeZone</option>
            <option value="Jio">Jio-bp</option>
          </select>

          <select
            value={selectedConnector}
            onChange={e => { setSelectedConnector(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">Connector: All</option>
            <option value="CCS2">CCS2</option>
            <option value="Type 2">Type 2</option>
            <option value="CHAdeMO">CHAdeMO</option>
          </select>

          <select
            value={selectedPower}
            onChange={e => { setSelectedPower(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">Power: All</option>
            <option value="DC_FAST">Fast DC (50-100kW)</option>
            <option value="DC_ULTRA">Ultra Fast (120kW+)</option>
            <option value="AC_TYPE2">AC Type 2 (Up to 22kW)</option>
          </select>

          <select
            value={selectedVerification}
            onChange={e => { setSelectedVerification(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">Verification: All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={selectedSource}
            onChange={e => { setSelectedSource(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">Source: All</option>
            <option value="partner">Partner</option>
            <option value="openchargemap">OpenChargeMap</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="active">Active</option>
            <option value="offline">Disabled / Offline</option>
            <option value="maintenance">Maintenance</option>
          </select>

        </div>

      </div>

      {/* 3. HIGH-DENSITY STATIONS TABLE (10 COLUMNS) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2 animate-pulse">
            <Zap className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
            <div>Loading charging network from Cloud Firestore...</div>
          </div>
        ) : paginatedStations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">
                  <th className="py-3 px-3">Station Name</th>
                  <th className="py-3 px-3">City</th>
                  <th className="py-3 px-3">Operator</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Chargers</th>
                  <th className="py-3 px-3">Power</th>
                  <th className="py-3 px-3">Connectors</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Verification</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {paginatedStations.map(st => {
                  const maxPower = Math.max(...st.chargers.map(c => c.powerKW), 50);
                  const connectorsList = Array.from(new Set(st.chargers.map(c => c.connectorType))).join(', ');
                  const operator = st.operatorName || 'VoltCharge';

                  return (
                    <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                      
                      {/* Station Name & ID */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setSelectedStation(st)}
                          className="font-extrabold text-white hover:text-sky-400 text-left transition-colors truncate max-w-[200px] block"
                        >
                          {st.name}
                        </button>
                        <div className="text-[10px] text-slate-500 font-mono">{st.id}</div>
                      </td>

                      {/* City */}
                      <td className="py-3 px-3 font-semibold text-slate-300">{st.city}</td>

                      {/* Operator */}
                      <td className="py-3 px-3 text-slate-300 font-semibold">{operator}</td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          st.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          st.status === 'offline' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {st.status}
                        </span>
                      </td>

                      {/* Chargers */}
                      <td className="py-3 px-3 font-bold text-slate-300">{st.chargers.length} Ports</td>

                      {/* Power */}
                      <td className="py-3 px-3 font-bold text-sky-400">{maxPower} kW</td>

                      {/* Connectors */}
                      <td className="py-3 px-3 text-slate-300 text-[11px]">{connectorsList || 'CCS2'}</td>

                      {/* Source */}
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {st.dataSource === 'partner' ? 'PARTNER' : 'OPENCHARGEMAP'}
                        </span>
                      </td>

                      {/* Verification */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          st.verificationStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          st.verificationStatus === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {st.verificationStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right space-x-1 shrink-0">
                        <button
                          onClick={() => setSelectedStation(st)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-[10px]"
                          title="View Station Details"
                        >
                          View
                        </button>

                        {st.verificationStatus !== 'approved' ? (
                          <button
                            onClick={() => handleVerifyStation(st, true)}
                            className="px-2 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-[10px]"
                            title="Verify Station"
                          >
                            Verify
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerifyStation(st, false)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-600 text-amber-300 font-bold text-[10px]"
                            title="Unverify Station"
                          >
                            Unverify
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEditModal(st)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-[10px]"
                          title="Edit Station Metadata"
                        >
                          Edit
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500 space-y-1">
            <Compass className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="font-bold text-slate-300">No stations match filters</div>
            <p className="text-[11px]">Adjust your search query or reset multi-filter dropdowns.</p>
          </div>
        )}

        {/* PAGINATION BAR */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
          <div className="text-slate-400">
            Showing Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span> ({filteredStations.length} total results)
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

      {/* 4. STATION DETAIL & EDIT MODAL */}
      {selectedStation && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl animate-in fade-in my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="vc-badge vc-badge-sky text-[9px] uppercase font-extrabold">{selectedStation.dataSource} PROVENANCE</span>
                <h3 className="font-heading font-extrabold text-xl text-white mt-1">{selectedStation.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedStation.id}</p>
              </div>

              <button onClick={() => { setSelectedStation(null); setIsEditing(false); }} className="text-slate-400 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* EDIT FORM MODE */}
            {isEditing ? (
              <form onSubmit={handleSaveStationEdit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Station Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs focus:ring-1 focus:ring-sky-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">City</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={e => setEditCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">Operator Name</label>
                    <input
                      type="text"
                      value={editOperator}
                      onChange={e => setEditOperator(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Address Location</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Charger Pricing Tariff (₹/kWh)</label>
                  <input
                    type="number"
                    value={editTariff}
                    onChange={e => setEditTariff(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-sky-400 text-xs"
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="font-bold text-slate-300">Source Preservation Notice</div>
                  <p>Original source dataset ({selectedStation.dataSource}) is preserved. Admin edits store metadata in <code className="text-sky-400">admin_modified_at</code> and log audit records.</p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-400 shadow-md"
                  >
                    Save Changes & Log Audit
                  </button>
                </div>
              </form>
            ) : (
              /* DETAIL DISPLAY MODE */
              <div className="space-y-6 text-xs">
                
                {/* Station Technical Parameters Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Coordinates</span>
                    <span className="font-bold text-white">{selectedStation.latitude}, {selectedStation.longitude}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Max Power</span>
                    <span className="font-bold text-sky-400">{Math.max(...selectedStation.chargers.map(c => c.powerKW), 50)} kW</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Tariff Rate</span>
                    <span className="font-bold text-emerald-400">₹{selectedStation.chargers[0]?.pricingPerKWh || 18}/kWh</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Verification</span>
                    <span className="font-bold text-white capitalize">{selectedStation.verificationStatus}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Data Source</span>
                    <span className="font-bold text-white capitalize">{selectedStation.dataSource}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Last Sync</span>
                    <span className="font-bold text-slate-300">{selectedStation.lastUpdated || 'Recent'}</span>
                  </div>
                </div>

                {/* Address & Operator Details */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-extrabold text-white text-sm">Location & Operator</div>
                  <div className="text-slate-300">{selectedStation.address}, {selectedStation.city}</div>
                  <div className="text-slate-400 text-[11px]">CPO Network Operator: <span className="text-white font-bold">{selectedStation.operatorName || 'VoltCharge'}</span></div>
                </div>

                {/* Chargers Ports List */}
                <div className="space-y-2">
                  <div className="font-extrabold text-white text-xs">Installed Charger Ports ({selectedStation.chargers.length})</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedStation.chargers.map((c, idx) => (
                      <div key={c.id || idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-bold text-sky-400">{c.connectorType}</span> • {c.powerKW} kW
                        </div>
                        <span className="font-extrabold text-emerald-400">{c.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Action Controls Toolbar */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  
                  <div className="flex items-center gap-2">
                    {selectedStation.verificationStatus !== 'approved' ? (
                      <button
                        onClick={() => handleVerifyStation(selectedStation, true)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <Check className="w-4 h-4" /> Verify Station
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerifyStation(selectedStation, false)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-amber-600 text-amber-300 font-bold text-xs flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-4 h-4" /> Unverify Station
                      </button>
                    )}

                    {selectedStation.status === 'active' ? (
                      <button
                        onClick={() => handleToggleStationStatus(selectedStation, true)}
                        className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <XCircle className="w-4 h-4" /> Disable Station
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStationStatus(selectedStation, false)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Restore Station
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenEditModal(selectedStation)}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Metadata
                  </button>

                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
