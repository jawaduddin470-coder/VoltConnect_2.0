import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserLocation } from '@/hooks/useUserLocation';
import { chargingDataService } from '@/services/chargingDataService';
import { rankStationsForVehicle } from '@/features/charging/utils/stationRanking';
import { checkStationCompatibility } from '@/features/charging/utils/compatibility';
import { VoltMap } from '@/features/charging/components/VoltMap';
import { StationDirectory } from '@/features/charging/components/StationDirectory';
import { EVVehicleSelector } from '@/components/common/EVVehicleSelector';
import { ChargingStation, StationReport } from '@/types';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Zap,
  MapPin,
  Clock,
  Navigation,
  X,
  List,
  Map as MapIcon,
  Car,
  RefreshCw,
  LocateFixed,
  Plug,
  Compass,
  Radio,
  Eye,
  Battery,
} from 'lucide-react';

// Distance calculation helper (Haversine formula in KM - Preserving Full Coordinate Precision)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const ExplorePage: React.FC = () => {
  const { user, activeVehicle, addVehicle } = useAuth();
  const navigate = useNavigate();

  // Consuming Global Live Location Hook
  const {
    latitude: userLat,
    longitude: userLng,
    accuracy,
    trackingState,
    permissionState,
    errorMessage: locationErrorMsg,
    requestLocation,
    isLive,
  } = useUserLocation();

  const [followMe, setFollowMe] = useState(false);

  // Firestore Station Dataset State
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter States
  const [filterCompatible, setFilterCompatible] = useState(false);
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterFastCharging, setFilterFastCharging] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterWithinRange, setFilterWithinRange] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('ALL');

  // Active Vehicle SOC & Dynamic Range Reach
  const activeSOC = activeVehicle?.currentBatteryPercent ?? 85;
  const activeRangeReachKm = Math.round((activeVehicle?.estimatedRangeKm || 450) * (activeSOC / 100));

  // Sort State: Distance | VoltScore | Charging Power | Price
  const [sortBy, setSortBy] = useState<'distance' | 'score' | 'power' | 'price'>('distance');

  // Mode State: Map View | Directory View
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  // Primary Station Fetching Function from Firestore
  const loadStationsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chargingDataService.getStations();
      setStations(data);
      if (data.length > 0 && !selectedStation) {
        setSelectedStation(data[0]);
      }
    } catch (err: any) {
      console.error('[ExplorePage] Failed to fetch stations:', err);
      setError('Unable to load charging stations dataset. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStationsData();
  }, []);

  // Handle Geolocation Request for Live Location
  const handleUseMyLocation = () => {
    requestLocation();
    setFollowMe(true);
  };

  // Extract Available Cities for Filter Dropdown
  const availableCities = React.useMemo(() => {
    const set = new Set<string>();
    stations.forEach(s => {
      if (s.city) set.add(s.city);
    });
    return Array.from(set).sort();
  }, [stations]);

  // Compute Distance preserving full coordinate precision
  const processedStations = React.useMemo(() => {
    const centerLat = userLat || 17.435;
    const centerLng = userLng || 78.385;

    return stations.map(st => {
      const lat = Number(st.latitude);
      const lng = Number(st.longitude);
      const distance = calculateDistanceKm(centerLat, centerLng, lat, lng);
      return {
        ...st,
        latitude: lat,
        longitude: lng,
        distanceKm: distance,
      };
    });
  }, [stations, userLat, userLng]);

  const rankedResults = rankStationsForVehicle(processedStations, activeVehicle);

  // Search across: station name, city, address, operator, station ID
  const filteredRanked = rankedResults.filter(r => {
    const s = r.station;
    const queryLower = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !queryLower ||
      s.name.toLowerCase().includes(queryLower) ||
      s.address.toLowerCase().includes(queryLower) ||
      s.city.toLowerCase().includes(queryLower) ||
      (s.operatorName || '').toLowerCase().includes(queryLower) ||
      String(s.id).toLowerCase().includes(queryLower);

    if (!matchesSearch) return false;
    if (selectedCity !== 'ALL' && s.city.toLowerCase() !== selectedCity.toLowerCase()) return false;
    if (filterCompatible && checkStationCompatibility(activeVehicle, s).status === 'RED') return false;
    if (filterAvailable && !s.chargers.some(c => c.status === 'Available')) return false;
    if (filterFastCharging && !s.chargers.some(c => c.powerKW >= 50)) return false;
    if (filterVerifiedOnly && s.verificationStatus !== 'approved') return false;
    if (filterWithinRange && s.distanceKm && s.distanceKm > activeRangeReachKm) return false;

    return true;
  });

  // Sort Logic
  const sortedRanked = [...filteredRanked].sort((a, b) => {
    if (sortBy === 'distance') {
      return (a.station.distanceKm ?? 9999) - (b.station.distanceKm ?? 9999);
    }
    if (sortBy === 'score') {
      return b.station.voltScore - a.station.voltScore;
    }
    if (sortBy === 'power') {
      const maxPowerA = Math.max(...a.station.chargers.map(c => c.powerKW), 0);
      const maxPowerB = Math.max(...b.station.chargers.map(c => c.powerKW), 0);
      return maxPowerB - maxPowerA;
    }
    if (sortBy === 'price') {
      const minPriceA = Math.min(...a.station.chargers.map(c => c.pricingPerKWh), 999);
      const minPriceB = Math.min(...b.station.chargers.map(c => c.pricingPerKWh), 999);
      return minPriceA - minPriceB;
    }
    return 0;
  });

  const activeStationList = sortedRanked.map(r => r.station);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Controls Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
          
          {/* Location Error Alert Toast if permission denied */}
          {locationErrorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{locationErrorMsg}</span>
              </div>
            </div>
          )}

          {/* Row 1: Search, City Filter, Live Location & Active Vehicle / SOC Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search station name, city, operator, ID (e.g. 103603)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* City Dropdown Filter */}
            <div className="shrink-0">
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">All Cities ({availableCities.length})</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Geolocation Button */}
            <button
              onClick={handleUseMyLocation}
              disabled={trackingState === 'locating'}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isLive
                  ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                  : trackingState === 'locating'
                  ? 'bg-slate-100 text-slate-500 border-slate-300'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLive ? 'text-white animate-pulse' : 'text-sky-500'}`} />
              <span>
                {trackingState === 'locating'
                  ? 'Locating...'
                  : isLive
                  ? `Live GPS (±${accuracy}m)`
                  : '📍 Use My Location'}
              </span>
            </button>

            {/* Active Vehicle & Starting Battery SOC Badge */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVehicleModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-extrabold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Car className="w-3.5 h-3.5 text-sky-400" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {activeVehicle ? `${activeVehicle.manufacturer} ${activeVehicle.model}` : 'Select Vehicle'}
                </span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold border border-slate-800">
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
                <span>{activeSOC}% SOC</span>
                <span className="text-sky-400 font-extrabold">({activeRangeReachKm} km Reach)</span>
              </div>
            </div>

            {/* View Mode Toggle Button */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'map' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5 text-sky-500" /> Map
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5 text-sky-500" /> Directory
              </button>
            </div>

          </div>

          {/* Row 2: Quick Filter Chips & Dataset Counts */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilterWithinRange(!filterWithinRange)}
                className={`px-3 py-1 rounded-lg border font-bold transition-all ${
                  filterWithinRange
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                ⚡ Within Range (~{activeRangeReachKm} km)
              </button>

              <button
                onClick={() => setFilterCompatible(!filterCompatible)}
                className={`px-3 py-1 rounded-lg border font-bold transition-all ${
                  filterCompatible
                    ? 'bg-sky-50 text-sky-700 border-sky-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                ✓ Compatible Connectors
              </button>
              <button
                onClick={() => setFilterAvailable(!filterAvailable)}
                className={`px-3 py-1 rounded-lg border font-bold transition-all ${
                  filterAvailable
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                ⚡ Available Ports Only
              </button>
              <button
                onClick={() => setFilterFastCharging(!filterFastCharging)}
                className={`px-3 py-1 rounded-lg border font-bold transition-all ${
                  filterFastCharging
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                🔥 DC Fast Charging (≥50 kW)
              </button>
              <button
                onClick={() => setFilterVerifiedOnly(!filterVerifiedOnly)}
                className={`px-3 py-1 rounded-lg border font-bold transition-all ${
                  filterVerifiedOnly
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                🛡️ Verified Hubs Only
              </button>
            </div>

            <div className="font-mono text-slate-500 font-bold">
              Showing <span className="text-sky-600 font-extrabold">{sortedRanked.length}</span> of {stations.length} Hubs
            </div>
          </div>

        </div>
      </div>

      {/* Main View Container: Map or Directory */}
      <div className="flex-1 relative w-full h-[calc(100vh-140px)] min-h-[550px]">
        {loading ? (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 text-white font-extrabold text-sm gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
            <span>Loading 1,771 Charging Hubs...</span>
          </div>
        ) : viewMode === 'map' ? (
          <VoltMap
            stations={activeStationList}
            activeVehicle={activeVehicle}
            selectedStation={selectedStation}
            userLat={userLat}
            userLng={userLng}
            accuracy={accuracy}
            onSelectStation={st => setSelectedStation(st)}
          />
        ) : (
          <StationDirectory
            rankedStations={sortedRanked}
            activeVehicle={activeVehicle}
            selectedStation={selectedStation}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onSelectStation={st => setSelectedStation(st)}
            onViewOnMap={st => {
              setSelectedStation(st);
              setViewMode('map');
            }}
            onResetFilters={() => {
              setSearchQuery('');
              setSelectedCity('ALL');
              setFilterCompatible(false);
              setFilterAvailable(false);
              setFilterFastCharging(false);
              setFilterVerifiedOnly(false);
              setFilterWithinRange(false);
            }}
            userLat={userLat}
            userLng={userLng}
          />
        )}
      </div>

      {/* Vehicle Selector Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-end pb-2">
              <button
                onClick={() => setShowVehicleModal(false)}
                className="p-2 rounded-full bg-white text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <EVVehicleSelector
              selectedVehicle={null}
              onSelectVehicle={veh => {
                addVehicle({
                  category: veh.category,
                  manufacturer: veh.manufacturer,
                  model: veh.model,
                  variant: veh.variant,
                  batteryCapacitykWh: veh.batteryCapacitykWh,
                  usableCapacitykWh: veh.usableCapacitykWh,
                  estimatedRangeKm: veh.estimatedRangeKm,
                  currentBatteryPercent: 85,
                  estimatedHealthSOH: 98,
                  connectorTypes: veh.connectorTypes,
                  acMaxPowerKW: veh.acMaxPowerKW,
                  dcMaxPowerKW: veh.dcMaxPowerKW,
                  isDefault: true,
                  dataSource: 'VERIFIED',
                });
                setShowVehicleModal(false);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
