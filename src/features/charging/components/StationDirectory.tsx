import React from 'react';
import { ChargingStation, UserVehicle } from '@/types';
import { StationRankingResult } from '../utils/stationRanking';
import { checkStationCompatibility } from '../utils/compatibility';
import {
  MapPin,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Navigation,
  Star,
  Clock,
  ShieldCheck,
  Award,
  ArrowRight,
  ListFilter,
  SlidersHorizontal,
  Compass,
  Map as MapIcon,
  RefreshCw,
  ExternalLink,
  DollarSign,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StationDirectoryProps {
  rankedStations: StationRankingResult[];
  activeVehicle: UserVehicle | null;
  selectedStation: ChargingStation | null;
  sortBy: 'distance' | 'score' | 'power' | 'price';
  onSortChange: (sortBy: 'distance' | 'score' | 'power' | 'price') => void;
  onSelectStation: (station: ChargingStation) => void;
  onViewOnMap: (station: ChargingStation) => void;
  onResetFilters?: () => void;
  userLat?: number | null;
  userLng?: number | null;
}

export const StationDirectory: React.FC<StationDirectoryProps> = ({
  rankedStations,
  activeVehicle,
  selectedStation,
  sortBy,
  onSortChange,
  onSelectStation,
  onViewOnMap,
  onResetFilters,
  userLat,
  userLng,
}) => {
  const navigate = useNavigate();

  const handlePlanTrip = (st: ChargingStation, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/trips', {
      state: {
        destination: {
          name: st.name,
          lat: st.latitude,
          lng: st.longitude,
          address: st.address,
        },
      },
    });
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-100 flex flex-col overflow-hidden">
      
      {/* Directory Toolbar Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-navy-900 font-mono uppercase tracking-wider">
            Directory View
          </span>
          <span className="text-xs font-semibold text-slate-500">
            ({rankedStations.length} Hubs Listed)
          </span>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-500" />
          <span>Sort By:</span>
          <select
            value={sortBy}
            onChange={e => onSortChange(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="distance">📍 Nearest Distance</option>
            <option value="score">★ Highest VoltScore</option>
            <option value="power">⚡ Max DC Power (kW)</option>
            <option value="price">₹ Lowest Price per kWh</option>
          </select>
        </div>
      </div>

      {/* Directory List Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {rankedStations.length === 0 ? (
          /* Empty Filter Result State */
          <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto my-12 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
              <ListFilter className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-extrabold text-navy-900">
                No Matching Charging Hubs
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No charging stations match your active search or filter criteria. Try expanding your filters.
              </p>
            </div>
            {onResetFilters && (
              <button
                onClick={onResetFilters}
                className="vc-btn vc-btn-sky px-5 py-2.5 text-xs font-bold shadow-xs hover:scale-[1.02] transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
            {rankedStations.map(({ station, isBestMatch, matchReasons }, index) => {
              const isSelected = selectedStation?.id === station.id;
              const isTopRanked = index === 0 || isBestMatch;

              // Charger Details Evaluation
              const totalChargers = station.chargers.length;
              const availableChargers = station.chargers.filter(c => c.status === 'Available').length;
              const maxPowerKW = Math.max(...station.chargers.map(c => c.powerKW), 0);
              const minPricePerKWh = Math.min(...station.chargers.map(c => c.pricingPerKWh), 999);

              // Live Vehicle Compatibility Evaluation
              const compatibility = checkStationCompatibility(activeVehicle, station);
              const compStatus = compatibility?.status || 'GREEN';

              return (
                <div
                  key={station.id}
                  onClick={() => onSelectStation(station)}
                  className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between p-5 relative ${
                    isSelected
                      ? 'border-sky-500 ring-2 ring-sky-400/30 shadow-lg scale-[1.01]'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Card Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isTopRanked && (
                            <span className="px-2 py-0.5 rounded-md bg-sky-500 text-white font-mono text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                              BEST MATCH
                            </span>
                          )}
                          <span className="text-[10px] font-extrabold font-mono text-slate-400 uppercase tracking-widest">
                            {station.operatorName || 'INDEPENDENT HUB'}
                          </span>
                        </div>
                        <h3 className="font-heading text-base font-extrabold text-slate-900 leading-snug line-clamp-1">
                          {station.name}
                        </h3>
                      </div>

                      {/* VoltScore Badge */}
                      <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 text-white font-mono text-xs font-extrabold shadow-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{station.voltScore || 9.2}</span>
                      </div>
                    </div>

                    {/* Address & Distance */}
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-0.5">
                      <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{station.address}, {station.city}</span>
                      </div>
                      {typeof station.distanceKm === 'number' && (
                        <div className="font-mono text-sky-600 font-extrabold shrink-0 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                          📍 {station.distanceKm} km
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-3 border-t border-slate-100" />

                  {/* Specs & Status Row */}
                  <div className="space-y-2.5">
                    
                    {/* Compatibility Status Pill */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-slate-500 font-mono uppercase">Compatibility:</span>
                      {compStatus === 'GREEN' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% Compatible
                        </span>
                      ) : compStatus === 'YELLOW' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[11px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Adapter Req.
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[11px] flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" /> Incompatible
                        </span>
                      )}
                    </div>

                    {/* Chargers Details Pill */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-700 font-bold">
                        <span className="flex items-center gap-1 text-slate-800">
                          <Zap className="w-3.5 h-3.5 text-sky-500" /> Max Power:
                        </span>
                        <span className="text-sky-600 font-extrabold">{maxPowerKW} kW DC</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-slate-600 text-[11px]">
                        <span>Available Ports:</span>
                        <span className={`font-bold ${availableChargers > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          ● {availableChargers} / {totalChargers} Free
                        </span>
                      </div>

                      {minPricePerKWh < 999 && (
                        <div className="flex items-center justify-between text-slate-600 text-[11px] pt-0.5 border-t border-slate-200/60">
                          <span>Pricing:</span>
                          <span className="font-bold text-slate-900">₹{minPricePerKWh.toFixed(2)} / kWh</span>
                        </div>
                      )}
                    </div>

                    {/* Connectors List Badges */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {station.chargers.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold border border-slate-200"
                        >
                          {c.connectorType} ({c.powerKW} kW)
                        </span>
                      ))}
                    </div>

                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onViewOnMap(station);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MapIcon className="w-3.5 h-3.5 text-sky-600" />
                      <span>View on Map</span>
                    </button>

                    <button
                      onClick={e => handlePlanTrip(station, e)}
                      className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-sky-400" />
                      <span>Plan Trip</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
