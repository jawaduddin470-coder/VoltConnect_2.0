import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserLocation } from '@/hooks/useUserLocation';
import { chargingDataService } from '@/services/chargingDataService';
import { geocodingService, GeocodedLocation } from '@/services/geocodingService';
import { routingService, RouteWaypointInput, RouteResult } from '@/services/routingService';
import { tripPlanningEngine, EVTripPlan, RecommendedChargingStop } from '@/services/tripPlanningEngine';
import { checkStationCompatibility } from '@/features/charging/utils/compatibility';
import { EVVehicleSelector } from '@/components/common/EVVehicleSelector';
import { TripMap } from '@/features/charging/components/TripMap';
import { ChargingStation } from '@/types';
import {
  Navigation,
  MapPin,
  Zap,
  Clock,
  ShieldCheck,
  ArrowRight,
  Car,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Gauge,
  LocateFixed,
  Plus,
  Trash2,
  Radio,
  RefreshCw,
  Edit2,
  Compass,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Battery,
} from 'lucide-react';

export const SmartTripPlanner: React.FC = () => {
  const { activeVehicle, addVehicle, updateActiveVehicleSOC } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Global Live Location Hook (Real Browser Geolocation API)
  const {
    latitude: userLat,
    longitude: userLng,
    accuracy,
    requestLocation,
  } = useUserLocation();

  // Location parameters passed from VoltMap
  const passedDestLat = location.search ? new URLSearchParams(location.search).get('destLat') : null;
  const passedDestLng = location.search ? new URLSearchParams(location.search).get('destLng') : null;
  const passedDestName = location.search ? new URLSearchParams(location.search).get('destName') : null;

  // Waypoints State
  const [waypoints, setWaypoints] = useState<RouteWaypointInput[]>(() => {
    if (passedDestLat && passedDestLng && passedDestName) {
      return [
        { name: 'Hyderabad (Gachibowli)', latitude: 17.435, longitude: 78.385 },
        { name: decodeURIComponent(passedDestName), latitude: parseFloat(passedDestLat), longitude: parseFloat(passedDestLng) },
      ];
    }
    return [
      { name: 'Hyderabad (Gachibowli)', latitude: 17.435, longitude: 78.385 },
      { name: 'Srinagar (Kashmir)', latitude: 34.0837, longitude: 74.7973 },
    ];
  });

  // Autocomplete State
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);

  // Safety Reserve Settings
  const [safetyReservePercent, setSafetyReservePercent] = useState<number>(15);

  // Firestore Stations Dataset State
  const [stations, setStations] = useState<ChargingStation[]>([]);

  // Calculation & Trip Plan State (MAP SHOWN ONLY WHEN tripPlan IS NON-NULL)
  const [isPlanning, setIsPlanning] = useState(false);
  const [tripPlan, setTripPlan] = useState<EVTripPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<RecommendedChargingStop | null>(null);
  const [activeTab, setActiveTab] = useState<'recommended' | 'other'>('recommended');
  
  // Controls whether the planning form is open in header overlay when tripPlan is revealed
  const [showModifyForm, setShowModifyForm] = useState(false);

  // Live Route Tracking State (Honest Labeling - NO fake turn-by-turn navigation)
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [followMe, setFollowMe] = useState(true);
  const [routeDeviated, setRouteDeviated] = useState(false);

  // Vehicle Selection Modal State
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  // Fetch Firestore Charging Station Dataset on mount
  useEffect(() => {
    chargingDataService.getStations().then(data => {
      setStations(data);
    });
  }, []);

  // Handle Autocomplete Search Debounce
  useEffect(() => {
    if (activeSearchIndex === null || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      geocodingService.searchLocations(searchQuery).then(res => {
        setSearchResults(res);
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, activeSearchIndex]);

  // Real Browser Geolocation Handler for Origin (Waypoint 0)
  const handleUseCurrentLocation = async () => {
    requestLocation();
    if (userLat !== null && userLng !== null) {
      const localityName = await geocodingService.reverseGeocode(userLat, userLng);
      const updated = [...waypoints];
      updated[0] = {
        name: localityName,
        latitude: userLat,
        longitude: userLng,
      };
      setWaypoints(updated);
    } else {
      const updated = [...waypoints];
      updated[0] = {
        name: '📍 Locating GPS Position...',
        latitude: 17.435,
        longitude: 78.385,
      };
      setWaypoints(updated);
    }
  };

  // Sync GPS updates to Waypoint 0 if locating
  useEffect(() => {
    if (userLat !== null && userLng !== null && waypoints[0]?.name.includes('Locating GPS')) {
      geocodingService.reverseGeocode(userLat, userLng).then(localityName => {
        const updated = [...waypoints];
        updated[0] = {
          name: localityName,
          latitude: userLat,
          longitude: userLng,
        };
        setWaypoints(updated);
      });
    }
  }, [userLat, userLng]);

  // Core EV Trip Planning Handler (TRIP PLAN & MAP REVEAL TRIGGER)
  const handlePlanJourney = async () => {
    if (waypoints.length < 2) return;
    setIsPlanning(true);
    setPlanError(null);

    try {
      // Always ensure full station dataset is loaded
      let dataset = stations;
      if (dataset.length === 0) {
        dataset = await chargingDataService.getStations();
        setStations(dataset);
      }

      // 1. Calculate Real Road Route geometry & road distance via OSRM Driving Engine
      const routeResult = await routingService.calculateRoadRoute(waypoints);

      // 2. Compute Usable Planning Range, Starting SOC & Corridor Charging Candidates from Firestore
      const plan = tripPlanningEngine.planEVJourney(
        routeResult,
        activeVehicle,
        dataset,
        safetyReservePercent
      );

      setTripPlan(plan);
      setShowModifyForm(false);

      if (plan.recommendedStops.length > 0) {
        setSelectedStop(plan.recommendedStops[0]);
      }
    } catch (err: any) {
      console.error('[VoltTrip] Route planning error:', err);
      setPlanError(err.message || 'Unable to calculate road route. Please verify your waypoints.');
    } finally {
      setIsPlanning(false);
    }
  };

  // Re-run planning if activeVehicle, starting SOC, or safetyReserve changes while map is revealed
  useEffect(() => {
    if (tripPlan && waypoints.length >= 2) {
      handlePlanJourney();
    }
  }, [activeVehicle?.id, activeVehicle?.currentBatteryPercent, safetyReservePercent]);

  // Live GPS Route Deviation Check (> 2.0 km)
  useEffect(() => {
    if (userLat !== null && userLng !== null && isLiveTracking && tripPlan && tripPlan.routeGeometry.length > 0) {
      let minDevDistKm = 999;
      for (const pt of tripPlan.routeGeometry) {
        const d = routingService.haversineDistance(userLat, userLng, pt[0], pt[1]);
        if (d < minDevDistKm) minDevDistKm = d;
      }
      setRouteDeviated(minDevDistKm > 2.0);
    }
  }, [userLat, userLng, isLiveTracking, tripPlan]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. TOP HEADER & ACTIVE VEHICLE / STARTING SOC CONTROL BADGE */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-sky-500" /> VoltTrip EV Route Planning Engine
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Vehicle-aware highway journey routing & corridor charger discovery
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVehicleModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-extrabold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Car className="w-3.5 h-3.5 text-sky-400" />
              <span>{activeVehicle ? `${activeVehicle.manufacturer} ${activeVehicle.model}` : 'Select Vehicle'}</span>
            </button>

            {/* Authoritative Global Starting Battery SOC Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold shadow-xs">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              <span>Starting SOC:</span>
              <select
                value={activeVehicle?.currentBatteryPercent || 85}
                onChange={e => updateActiveVehicleSOC(Number(e.target.value))}
                className="bg-transparent font-extrabold text-emerald-400 focus:outline-none cursor-pointer"
              >
                <option value={100} className="bg-slate-900 text-white">100% (Full)</option>
                <option value={85} className="bg-slate-900 text-white">85% (Optimal)</option>
                <option value={60} className="bg-slate-900 text-white">60% (Mid)</option>
                <option value={40} className="bg-slate-900 text-white">40% (Low-Mid)</option>
                <option value={25} className="bg-slate-900 text-white">25% (Low)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
              <span>Safety Reserve:</span>
              <select
                value={safetyReservePercent}
                onChange={e => setSafetyReservePercent(Number(e.target.value))}
                className="bg-transparent font-extrabold text-sky-600 focus:outline-none cursor-pointer"
              >
                <option value={10}>10% Buffer</option>
                <option value={15}>15% Buffer</option>
                <option value={20}>20% Buffer</option>
                <option value={25}>25% Buffer</option>
              </select>
            </div>

            {tripPlan && (
              <button
                onClick={() => setShowModifyForm(!showModifyForm)}
                className="px-3.5 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-extrabold flex items-center gap-1.5 border border-sky-200 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-sky-600" />
                <span>{showModifyForm ? 'Close Form' : 'MODIFY DESTINATIONS'}</span>
                {showModifyForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Expandable Destination Modification Drawer (When tripPlan is active & Modify clicked) */}
        {tripPlan && showModifyForm && (
          <div className="border-t border-slate-200 bg-slate-50 p-4 animate-in slide-in-from-top duration-300">
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase font-mono">
                  MODIFY ROUTE WAYPOINTS
                </span>
                <button
                  onClick={() => setShowModifyForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-2">
                {waypoints.map((wp, idx) => (
                  <div key={idx} className="relative flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase font-mono w-16 text-slate-500 shrink-0">
                      {idx === 0 ? 'ORIGIN' : idx === waypoints.length - 1 ? 'DEST' : `STOP ${idx}`}
                    </span>

                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search location..."
                        value={activeSearchIndex === idx ? searchQuery : wp.name}
                        onFocus={() => {
                          setActiveSearchIndex(idx);
                          setSearchQuery(wp.name);
                        }}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />

                      {activeSearchIndex === idx && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                          {searchResults.map(res => (
                            <button
                              key={res.id}
                              type="button"
                              onClick={() => {
                                const updated = [...waypoints];
                                updated[idx] = {
                                  name: `${res.name}${res.state ? `, ${res.state}` : ''}`,
                                  latitude: res.latitude,
                                  longitude: res.longitude,
                                };
                                setWaypoints(updated);
                                setActiveSearchIndex(null);
                                setSearchQuery('');
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-sky-50 border-b border-slate-100 flex items-center justify-between text-xs transition-colors cursor-pointer"
                            >
                              <span className="font-bold text-slate-900">{res.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {res.state || res.country}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {idx > 0 && waypoints.length > 2 && (
                      <button
                        onClick={() => setWaypoints(waypoints.filter((_, i) => i !== idx))}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    const updated = [...waypoints];
                    updated.splice(waypoints.length - 1, 0, {
                      name: 'Nagpur, Maharashtra',
                      latitude: 21.1458,
                      longitude: 79.0882,
                    });
                    setWaypoints(updated);
                  }}
                  className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Intermediate Stop
                </button>

                <button
                  onClick={handlePlanJourney}
                  disabled={isPlanning}
                  className="vc-btn vc-btn-teal px-5 py-2 text-xs font-extrabold flex items-center gap-2 cursor-pointer"
                >
                  {isPlanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>RECALCULATE JOURNEY</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. INITIAL EMPTY DESTINATION PLANNING STATE */}
      {!tripPlan && (
        <div className="max-w-3xl mx-auto w-full my-auto py-10 px-4 space-y-8 animate-in fade-in zoom-in-95">
          
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-sky-500/10 text-sky-600 flex items-center justify-center mx-auto border border-sky-200 shadow-inner">
              <Navigation className="w-8 h-8" />
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-900">
              Where are you traveling with your EV?
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Enter your origin and destination. VoltTrip calculates your exact road distance, safe planning range, and compatible charging stops along the route.
            </p>
          </div>

          {/* Clean Destination Entry Form Container */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5">
            
            {planError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{planError}</span>
              </div>
            )}

            <div className="space-y-3">
              {waypoints.map((wp, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                      {idx === 0 ? 'ORIGIN' : idx === waypoints.length - 1 ? 'DESTINATION' : `INTERMEDIATE STOP ${idx}`}
                    </label>
                    {idx === 0 && (
                      <button
                        onClick={handleUseCurrentLocation}
                        className="text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <LocateFixed className="w-3.5 h-3.5" /> Use My Current Location
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder={idx === 0 ? 'Enter starting origin city...' : 'Where are you going? (e.g. Srinagar, Goa, Bangalore, Mumbai)...'}
                      value={activeSearchIndex === idx ? searchQuery : wp.name}
                      onFocus={() => {
                        setActiveSearchIndex(idx);
                        setSearchQuery(wp.name);
                      }}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 bg-slate-50 text-xs font-extrabold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                    />

                    {/* Autocomplete Suggestions Dropdown */}
                    {activeSearchIndex === idx && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                        {searchResults.map(res => (
                          <button
                            key={res.id}
                            type="button"
                            onClick={() => {
                              const updated = [...waypoints];
                              updated[idx] = {
                                name: `${res.name}${res.state ? `, ${res.state}` : ''}`,
                                latitude: res.latitude,
                                longitude: res.longitude,
                              };
                              setWaypoints(updated);
                              setActiveSearchIndex(null);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-sky-50 border-b border-slate-100 flex items-center justify-between text-xs transition-colors cursor-pointer"
                          >
                            <span className="font-bold text-slate-900">{res.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {res.state || res.country}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {idx > 0 && waypoints.length > 2 && (
                    <button
                      onClick={() => setWaypoints(waypoints.filter((_, i) => i !== idx))}
                      className="absolute right-3 top-8 text-rose-500 hover:bg-rose-50 p-1.5 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  const updated = [...waypoints];
                  updated.splice(waypoints.length - 1, 0, {
                    name: 'Nagpur, Maharashtra',
                    latitude: 21.1458,
                    longitude: 79.0882,
                  });
                  setWaypoints(updated);
                }}
                className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Intermediate Stop
              </button>
            </div>

            {/* Primary Journey Plan Action Button */}
            <button
              onClick={handlePlanJourney}
              disabled={isPlanning}
              className="w-full vc-btn vc-btn-teal py-4 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-all cursor-pointer"
            >
              {isPlanning ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Calculating Road Route & Chargers...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" /> PLAN JOURNEY
                </>
              )}
            </button>
          </div>

          {/* Popular EV Corridor Shortcuts */}
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-wider block text-center">
              POPULAR EV CORRIDOR SHORTCUTS
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  setWaypoints([
                    { name: 'Hyderabad, Telangana', latitude: 17.385, longitude: 78.4867 },
                    { name: 'Srinagar, Jammu & Kashmir', latitude: 34.0837, longitude: 74.7973 },
                  ]);
                }}
                className="p-3 rounded-2xl bg-white border border-slate-200 text-left hover:border-sky-400 transition-all space-y-1 shadow-xs cursor-pointer"
              >
                <div className="font-extrabold text-xs text-slate-900">Hyderabad ➔ Srinagar</div>
                <div className="text-[10px] font-mono text-slate-400">~2,300 km • Long Haul</div>
              </button>

              <button
                onClick={() => {
                  setWaypoints([
                    { name: 'Hyderabad, Telangana', latitude: 17.385, longitude: 78.4867 },
                    { name: 'Bangalore, Karnataka', latitude: 12.9716, longitude: 77.5946 },
                  ]);
                }}
                className="p-3 rounded-2xl bg-white border border-slate-200 text-left hover:border-sky-400 transition-all space-y-1 shadow-xs cursor-pointer"
              >
                <div className="font-extrabold text-xs text-slate-900">Hyderabad ➔ Bangalore</div>
                <div className="text-[10px] font-mono text-slate-400">~570 km • Express</div>
              </button>

              <button
                onClick={() => {
                  setWaypoints([
                    { name: 'Mumbai, Maharashtra', latitude: 19.076, longitude: 72.8777 },
                    { name: 'Goa (Panaji)', latitude: 15.4909, longitude: 73.8278 },
                  ]);
                }}
                className="p-3 rounded-2xl bg-white border border-slate-200 text-left hover:border-sky-400 transition-all space-y-1 shadow-xs cursor-pointer"
              >
                <div className="font-extrabold text-xs text-slate-900">Mumbai ➔ Goa</div>
                <div className="text-[10px] font-mono text-slate-400">~590 km • Coastal</div>
              </button>

              <button
                onClick={() => {
                  setWaypoints([
                    { name: 'New Delhi', latitude: 28.6139, longitude: 77.209 },
                    { name: 'Manali, Himachal Pradesh', latitude: 32.2432, longitude: 77.1892 },
                  ]);
                }}
                className="p-3 rounded-2xl bg-white border border-slate-200 text-left hover:border-sky-400 transition-all space-y-1 shadow-xs cursor-pointer"
              >
                <div className="font-extrabold text-xs text-slate-900">Delhi ➔ Manali</div>
                <div className="text-[10px] font-mono text-slate-400">~530 km • Mountain</div>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 3. MAP REVEAL VIEWPORT (SHOWN ONLY AFTER DESTINATION SUBMITTED & ROUTE CALCULATED) */}
      {tripPlan && (
        <div className="flex-1 relative w-full h-[calc(100vh-160px)] min-h-[550px] flex overflow-hidden">
          
          {/* Interactive Dedicated Leaflet Map Component */}
          <div className="w-full h-full relative overflow-hidden">
            <TripMap
              tripPlan={tripPlan}
              selectedStop={selectedStop}
              onSelectStop={st => setSelectedStop(st)}
              isLiveTracking={isLiveTracking}
              userLat={userLat}
              userLng={userLng}
              accuracy={accuracy}
              followMe={followMe}
              onDisableFollowMe={() => setFollowMe(false)}
            />

            {/* Route Deviation Warning Banner */}
            {routeDeviated && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-full bg-amber-500 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between text-xs font-extrabold animate-bounce">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Route Deviation Detected</span>
                </div>
                <button
                  onClick={handlePlanJourney}
                  className="px-3 py-1 bg-slate-900 text-white rounded-xl text-[11px]"
                >
                  Recalculate Route
                </button>
              </div>
            )}

            {/* Floating Action Controls */}
            <div className="absolute top-4 right-14 z-20 flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsLiveTracking(!isLiveTracking);
                  if (!isLiveTracking) requestLocation();
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-xl border transition-all cursor-pointer ${
                  isLiveTracking
                    ? 'bg-sky-500 text-white border-sky-600 ring-2 ring-sky-300'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Radio className={`w-4 h-4 ${isLiveTracking ? 'animate-pulse' : ''}`} />
                <span>{isLiveTracking ? 'LIVE ROUTE TRACKING ACTIVE' : 'Start Live Route Tracking'}</span>
              </button>
            </div>

            {/* Left Floating Trip Plan Summary Drawer */}
            <div className="absolute top-4 left-4 z-20 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-sky-600 font-mono tracking-wider">
                    EV JOURNEY SUMMARY
                  </span>
                  <h3 className="font-heading text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
                    {tripPlan.waypoints[0].name.split(',')[0]} → {tripPlan.waypoints[tripPlan.waypoints.length - 1].name.split(',')[0]}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModifyForm(true)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">ROAD DISTANCE</span>
                  <span className="font-extrabold text-slate-900 text-sm">{tripPlan.totalRoadDistanceKm} km</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">STARTING SOC</span>
                  <span className="font-extrabold text-emerald-600 text-sm">{tripPlan.startingSOCPercent}% Battery</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">DRIVING TIME</span>
                  <span className="font-extrabold text-slate-700">
                    {Math.floor(tripPlan.totalDrivingDurationMinutes / 60)}h {tripPlan.totalDrivingDurationMinutes % 60}m
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">CHARGING STOPS</span>
                  <span className="font-extrabold text-emerald-600">{tripPlan.recommendedStops.length} Stops</span>
                </div>
              </div>

              {/* Tab Selector: Recommended vs Other Compatible Route Chargers */}
              <div className="space-y-2">
                <div className="flex border-b border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('recommended')}
                    className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'recommended'
                        ? 'border-sky-500 text-sky-600 font-extrabold'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Recommended ({tripPlan.recommendedStops.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('other')}
                    className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'other'
                        ? 'border-sky-500 text-sky-600 font-extrabold'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Other Compatible ({tripPlan.otherCompatibleStations.length})
                  </button>
                </div>

                {activeTab === 'recommended' ? (
                  tripPlan.recommendedStops.length === 0 ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>No charging stops required for this route distance!</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {tripPlan.recommendedStops.map((stop, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedStop(stop)}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                            selectedStop?.station.id === stop.station.id
                              ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-xs truncate max-w-[180px]">
                              ⚡{idx + 1}. {stop.station.name}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-sky-600">
                              {stop.maxPowerKW} kW
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{stop.station.address}</p>
                          <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-200/60 text-[10px] font-mono text-slate-600">
                            <span>Arrival: {stop.estimatedArrivalSOCPercent}% SOC</span>
                            <span className="font-bold text-emerald-600">~{stop.estimatedChargeTimeMinutes} min charge</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {tripPlan.otherCompatibleStations.map((stop, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedStop(stop)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                          selectedStop?.station.id === stop.station.id
                            ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 text-xs truncate max-w-[180px]">
                            ⚡ {stop.station.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            {stop.maxPowerKW} kW
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{stop.station.address}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Vehicle Selector Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-end pb-2">
              <button
                onClick={() => setShowVehicleModal(false)}
                className="p-2 rounded-full bg-white text-slate-500 hover:text-slate-900 cursor-pointer"
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
