import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserLocation } from '@/hooks/useUserLocation';
import { chargingDataService } from '@/services/chargingDataService';
import { geocodingService, GeocodedLocation, CURATED_INDIAN_DESTINATIONS } from '@/services/geocodingService';
import { routingService, RouteWaypointInput, RouteResult } from '@/services/routingService';
import { tripPlanningEngine, EVTripPlan, RecommendedChargingStop, PlanBRecoveryResult } from '@/services/tripPlanningEngine';
import { journeyAnalyticsService } from '@/services/journeyAnalyticsService';
import { voiceContextStore } from '@/services/voiceActionEngine';
import { checkStationCompatibility } from '@/features/charging/utils/compatibility';
import { EVVehicleSelector } from '@/components/common/EVVehicleSelector';
import { TripMap } from '@/features/charging/components/TripMap';
import { TollAnalyticsModal } from '@/features/charging/components/TollAnalyticsModal';
import { ReadinessDetailsModal } from '@/features/charging/components/ReadinessDetailsModal';
import { PlanBRecoveryCard } from '@/features/charging/components/PlanBRecoveryCard';
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
  ChevronRight,
  Receipt,
  Layers,
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

  // Helper to resolve string or object into a RouteWaypointInput
  const resolveNamedLocation = (raw: any): RouteWaypointInput | null => {
    if (!raw) return null;
    if (typeof raw === 'object') {
      const lat = Number(raw.lat ?? raw.latitude);
      const lng = Number(raw.lng ?? raw.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0) {
        return {
          name: raw.name || raw.address || 'Selected Charging Hub',
          latitude: lat,
          longitude: lng,
        };
      }
      if (raw.name && typeof raw.name === 'string') {
        return resolveNamedLocation(raw.name);
      }
    }

    if (typeof raw === 'string') {
      const clean = raw.trim().toLowerCase();
      if (!clean) return null;

      // Match against curated Indian EV corridors
      const curated = CURATED_INDIAN_DESTINATIONS.find(
        c =>
          c.name.toLowerCase() === clean ||
          (c.city && c.city.toLowerCase() === clean) ||
          clean.includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(clean)
      );

      if (curated) {
        return {
          name: curated.name,
          latitude: curated.latitude,
          longitude: curated.longitude,
        };
      }
    }
    return null;
  };

  // Helper to extract destination from incoming location state or URL params (from VoltMap / Explore / Voice)
  const getIncomingDestination = (): RouteWaypointInput | null => {
    const state = location.state as any;
    if (state?.destination) {
      const resolved = resolveNamedLocation(state.destination);
      if (resolved) return resolved;
    }

    if (location.search) {
      const params = new URLSearchParams(location.search);
      const qLat = params.get('destLat') || params.get('lat');
      const qLng = params.get('destLng') || params.get('lng');
      const qName = params.get('destName') || params.get('destination') || params.get('name') || params.get('q');

      if (qLat && qLng) {
        const lat = parseFloat(qLat);
        const lng = parseFloat(qLng);
        if (!isNaN(lat) && !isNaN(lng)) {
          let name = 'Selected Charging Hub';
          if (qName) {
            try {
              name = decodeURIComponent(qName);
            } catch {
              name = qName;
            }
          }
          return { name, latitude: lat, longitude: lng };
        }
      }

      if (qName) {
        let name = qName;
        try {
          name = decodeURIComponent(qName);
        } catch {
          name = qName;
        }
        const resolved = resolveNamedLocation(name);
        if (resolved) return resolved;
      }
    }
    return null;
  };

  // Helper to extract origin from incoming location state or URL params
  const getIncomingOrigin = (): RouteWaypointInput | null => {
    const state = location.state as any;
    if (state?.origin) {
      const resolved = resolveNamedLocation(state.origin);
      if (resolved) return resolved;
    }

    if (location.search) {
      const params = new URLSearchParams(location.search);
      const qOrigin = params.get('origName') || params.get('origin') || params.get('from');
      if (qOrigin) {
        let name = qOrigin;
        try {
          name = decodeURIComponent(qOrigin);
        } catch {
          name = qOrigin;
        }
        const resolved = resolveNamedLocation(name);
        if (resolved) return resolved;
      }
    }
    return null;
  };

  // Waypoints State
  const [waypoints, setWaypoints] = useState<RouteWaypointInput[]>(() => {
    const incomingDest = getIncomingDestination();
    const incomingOrig = getIncomingOrigin();
    const defaultOrig = { name: 'Hyderabad (Gachibowli)', latitude: 17.435, longitude: 78.385 };
    if (incomingDest) {
      return [incomingOrig || defaultOrig, incomingDest];
    }
    return [
      incomingOrig || defaultOrig,
      { name: 'Srinagar (Kashmir)', latitude: 34.0837, longitude: 74.7973 },
    ];
  });

  // Re-sync waypoints & auto-plan when user navigates into /trips from VoltMap or Voice AI
  useEffect(() => {
    const incomingDest = getIncomingDestination();
    const incomingOrig = getIncomingOrigin();
    const state = location.state as any;
    const params = new URLSearchParams(location.search);

    const shouldAutoPlan =
      state?.autoPlan === true ||
      params.get('autoPlan') === 'true' ||
      Boolean(state?.destination) ||
      Boolean(params.get('destLat')) ||
      Boolean(params.get('destination'));

    let activeReserve = 15;
    if (state?.safetyReserve) {
      activeReserve = Number(state.safetyReserve);
      setSafetyReservePercent(activeReserve);
    } else if (params.get('reserve') || params.get('safetyReserve')) {
      activeReserve = Number(params.get('reserve') || params.get('safetyReserve'));
      setSafetyReservePercent(activeReserve);
    }

    if (incomingDest) {
      const orig =
        incomingOrig ||
        (waypoints.length > 0
          ? waypoints[0]
          : { name: 'Hyderabad (Gachibowli)', latitude: 17.435, longitude: 78.385 });

      const newWaypoints = [orig, incomingDest];
      setWaypoints(newWaypoints);
      setPlanError(null);

      if (shouldAutoPlan) {
        handlePlanJourney(newWaypoints, activeReserve);
      }
    }
  }, [location.state, location.search]);

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

  // Progressive Disclosure Modal States
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showReadinessModal, setShowReadinessModal] = useState(false);

  // Phase 4: Plan B Recovery State
  const [isAnalyzingPlanB, setIsAnalyzingPlanB] = useState(false);
  const [planBResult, setPlanBResult] = useState<PlanBRecoveryResult | null>(null);

  // Score Count-Up Animation State
  const [animatedScore, setAnimatedScore] = useState(0);

  // Map Layer Controls (Charging Stations & Toll Plazas Toggles)
  const [showChargersOnMap, setShowChargersOnMap] = useState(true);
  const [showTollsOnMap, setShowTollsOnMap] = useState(true);

  // Live Route Tracking State (Honest Labeling - NO fake turn-by-turn navigation)
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [followMe, setFollowMe] = useState(true);
  const [routeDeviated, setRouteDeviated] = useState(false);

  // Vehicle Selection Modal State
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  // Core EV Trip Planning Handler (TRIP PLAN & MAP REVEAL TRIGGER)
  const handlePlanJourney = async (customWaypoints?: RouteWaypointInput[], customReserve?: number) => {
    const activeWaypoints = customWaypoints || waypoints;
    const reserve = customReserve ?? safetyReservePercent;
    if (activeWaypoints.length < 2) return;
    setIsPlanning(true);
    setPlanError(null);
    setPlanBResult(null);

    try {
      // Always retrieve authoritative dataset directly from chargingDataService
      const dataset = await chargingDataService.getStations();
      setStations(dataset);

      const dataInfo = chargingDataService.getDataSourceInfo();
      console.info(`[PLANNER INPUT] source=${dataInfo.source}, stationCount=${dataset.length}, vehicle=${activeVehicle?.manufacturer || 'BMW'} ${activeVehicle?.model || 'iX'}, SOC=${activeVehicle?.currentBatteryPercent ?? 100}, reserve=${reserve}`);

      // 1. Calculate Real Road Route geometry & road distance via OSRM Driving Engine
      const routeResult = await routingService.calculateRoadRoute(activeWaypoints);

      // 2. Compute Usable Planning Range, Starting SOC & Corridor Charging Candidates from Firestore + Tolls
      const plan = tripPlanningEngine.planEVJourney(
        routeResult,
        activeVehicle,
        dataset,
        reserve
      );

      console.info(`[PLANNER OUTPUT] recommendedStops=${plan.recommendedStops.length}, readiness=${plan.readinessScore.score}, status=${plan.readinessScore.status}`);

      setTripPlan(plan);
      setShowModifyForm(false);

      if (plan.recommendedStops.length > 0) {
        setSelectedStop(plan.recommendedStops[0]);
      }

      // Synchronize calculated financial costs & readiness to Voice AI Context Memory
      voiceContextStore.updateState({
        lastCalculatedCost: {
          chargingCostINR: plan.costSummary.estimatedChargingCostINR,
          tollCostINR: plan.costSummary.estimatedTollCostINR,
          totalCostINR: plan.costSummary.totalJourneyCostINR,
          stopsCount: plan.costSummary.chargingStopsCount,
          readinessScore: plan.readinessScore.score,
          distanceKm: plan.totalRoadDistanceKm,
        },
        lastDestination: activeWaypoints[activeWaypoints.length - 1].name,
        lastOrigin: activeWaypoints[0].name,
      });
    } catch (err: any) {
      console.error('[VoltTrip] Route planning error:', err);
      setPlanError(err.message || 'Unable to calculate road route. Please verify your waypoints.');
    } finally {
      setIsPlanning(false);
    }
  };

  // Phase 4: Handle Plan B Alternate Charging Recovery Analysis
  const handleAnalyzePlanB = () => {
    if (!tripPlan) return;
    setIsAnalyzingPlanB(true);

    setTimeout(() => {
      const res = tripPlanningEngine.calculatePlanBAlternateStops(tripPlan, activeVehicle, stations);
      setPlanBResult(res);
      setIsAnalyzingPlanB(false);
    }, 300);
  };

  // Phase 4: Apply Validated Plan B Alternate Charging Plan
  const handleApplyPlanB = () => {
    if (!tripPlan || !planBResult || !planBResult.success) return;

    const alternateStops = planBResult.alternateStops;
    const startingSOCPercent = activeVehicle?.currentBatteryPercent ?? 85;

    // Recalculate financial costs & readiness using Plan B stops
    const costSummary = journeyAnalyticsService.computeJourneyCosts(
      alternateStops,
      tripPlan.tollSummary.totalTollCostINR,
      tripPlan.totalRoadDistanceKm,
      activeVehicle,
      tripPlan.tollSummary.matchedPlazas
    );

    const readinessScore = journeyAnalyticsService.computeJourneyReadiness(
      startingSOCPercent,
      safetyReservePercent,
      tripPlan.totalRoadDistanceKm,
      tripPlan.effectivePlanningRangeKm,
      alternateStops,
      activeVehicle,
      tripPlan.otherCompatibleStations.length,
      costSummary.dataConfidence
    );

    setTripPlan({
      ...tripPlan,
      recommendedStops: alternateStops,
      costSummary,
      readinessScore,
    });

    if (alternateStops.length > 0) {
      setSelectedStop(alternateStops[0]);
    }

    setPlanBResult(null);
  };

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

  // Re-run planning if activeVehicle, starting SOC, or safetyReserve changes while map is revealed
  useEffect(() => {
    if (tripPlan && waypoints.length >= 2) {
      handlePlanJourney();
    }
  }, [activeVehicle?.id, activeVehicle?.currentBatteryPercent, safetyReservePercent]);

  // Smooth Count-Up Animation Effect for Journey Readiness Score (600–900ms)
  useEffect(() => {
    if (!tripPlan?.readinessScore) return;
    const target = tripPlan.readinessScore.score;

    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setAnimatedScore(target);
      return;
    }

    const duration = 750; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - (1 - progress) * (1 - progress);
      setAnimatedScore(Math.round(easeOut * target));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [tripPlan?.readinessScore?.score]);

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
              Vehicle-aware highway journey routing, toll intelligence & corridor charger discovery
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
                  onClick={() => handlePlanJourney()}
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
              Enter your origin and destination. VoltTrip calculates your exact road distance, safe planning range, compatible charging stops, and FASTag toll intelligence along the route.
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
              onClick={() => handlePlanJourney()}
              disabled={isPlanning}
              className="w-full vc-btn vc-btn-teal py-4 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-all cursor-pointer"
            >
              {isPlanning ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Calculating Road Route, Tolls & Chargers...
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
                <div className="text-[10px] font-mono text-slate-400">~2,300 km • NH 44 Corridor</div>
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
                <div className="text-[10px] font-mono text-slate-400">~570 km • Express Route</div>
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
                <div className="text-[10px] font-mono text-slate-400">~590 km • Coastal NH 66</div>
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
                <div className="text-[10px] font-mono text-slate-400">~530 km • Mountain NH 21</div>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 3. MAP REVEAL VIEWPORT (SHOWN ONLY AFTER DESTINATION SUBMITTED & ROUTE CALCULATED) */}
      {tripPlan && (
        <div className="flex-1 relative w-full h-[calc(100vh-160px)] min-h-[550px] overflow-hidden">
          
          {/* Interactive Dedicated Leaflet Map Component */}
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
            showChargers={showChargersOnMap}
            showTolls={showTollsOnMap}
          />

          {/* Route Deviation Warning Banner */}
          {routeDeviated && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-full bg-amber-500 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between text-xs font-extrabold animate-bounce">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Route Deviation Detected</span>
              </div>
              <button
                onClick={() => handlePlanJourney()}
                className="px-3 py-1 bg-slate-900 text-white rounded-xl text-[11px]"
              >
                Recalculate Route
              </button>
            </div>
          )}

          {/* Top-Right Floating Controls (Map Layer Toggles & Live Tracking) */}
          <div className="absolute top-4 right-14 z-20 flex flex-col items-end gap-2">
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

            {/* Map Layer Toggle Toolbar: Chargers & Tolls */}
            <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-1 text-xs font-extrabold">
              <button
                onClick={() => setShowChargersOnMap(!showChargersOnMap)}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  showChargersOnMap
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>⚡ Chargers</span>
              </button>

              <button
                onClick={() => setShowTollsOnMap(!showTollsOnMap)}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  showTollsOnMap
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🛣️ Tolls ({tripPlan.tollSummary.tollPlazaCount})</span>
              </button>
            </div>
          </div>

          {/* Left Floating Trip Plan Summary Drawer */}
          <div className="absolute top-4 left-4 z-20 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-2xl p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto font-sans">
            
            {/* Header: EV Journey Summary */}
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

            {/* Compact Journey Cost Breakdown & Split Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-wider">
                  ESTIMATED JOURNEY COST
                </span>
                <div className="font-mono font-black text-slate-900 text-base flex items-baseline gap-1.5">
                  <span>₹{tripPlan.costSummary.totalJourneyCostINR.toLocaleString('en-IN')}</span>
                  {tripPlan.costSummary.costPerKmINR > 0 && (
                    <span className="text-[10px] text-sky-600 font-extrabold">
                      (₹{tripPlan.costSummary.costPerKmINR}/km)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
                <span>⚡ Charging ₹{tripPlan.costSummary.estimatedChargingCostINR.toLocaleString('en-IN')}</span>
                <span>🛣️ Tolls ₹{tripPlan.costSummary.estimatedTollCostINR.toLocaleString('en-IN')}</span>
              </div>

              {/* Simple Proportional Split Bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${tripPlan.costSummary.chargingCostPercent}%` }}
                  className="h-full bg-sky-500"
                />
                <div
                  style={{ width: `${tripPlan.costSummary.tollCostPercent}%` }}
                  className="h-full bg-amber-500"
                />
              </div>

              {/* Progressive Disclosure Trigger Button */}
              <button
                onClick={() => setShowAnalyticsModal(true)}
                className="w-full mt-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-800 flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-sky-600" />
                  <span>View Journey Breakdown</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
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

            {/* Compact Phase 3B Journey Readiness Section */}
            {tripPlan.readinessScore && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 font-sans shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-wider">
                    JOURNEY READINESS
                  </span>
                  <span className="text-[9px] font-mono font-extrabold text-slate-500">
                    CONFIDENCE · {tripPlan.readinessScore.confidence}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border ${
                      tripPlan.readinessScore.status === 'READY'
                        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
                        : tripPlan.readinessScore.status === 'READY_WITH_ATTENTION'
                        ? 'bg-amber-500/10 text-amber-700 border-amber-300'
                        : tripPlan.readinessScore.status === 'REVIEW'
                        ? 'bg-amber-500/10 text-amber-700 border-amber-300'
                        : 'bg-rose-500/10 text-rose-700 border-rose-300'
                    }`}>
                      {tripPlan.readinessScore.status === 'READY'
                        ? '✓ JOURNEY READY'
                        : tripPlan.readinessScore.status === 'READY_WITH_ATTENTION'
                        ? '✓ READY WITH ATTENTION'
                        : tripPlan.readinessScore.status === 'REVIEW'
                        ? '⚠ PLAN NEEDS REVIEW'
                        : '✕ NOT READY'}
                    </span>
                  </div>

                  <div className="font-mono font-black text-slate-900 text-lg">
                    {animatedScore} <span className="text-xs font-bold text-slate-400">/ 100</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  {tripPlan.readinessScore.warnings.length > 0
                    ? tripPlan.readinessScore.warnings[0]
                    : tripPlan.readinessScore.strengths[0] || 'Planned strategy provides sufficient route coverage.'}
                </p>

                <button
                  onClick={() => setShowReadinessModal(true)}
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-800 flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View Readiness Details</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}

            {/* Phase 4: Plan B Alternate Charging Recovery Card */}
            <PlanBRecoveryCard
              isAnalyzing={isAnalyzingPlanB}
              recoveryResult={planBResult}
              onAnalyze={handleAnalyzePlanB}
              onApplyPlanB={handleApplyPlanB}
              onKeepCurrentPlan={() => setPlanBResult(null)}
              primaryPlanHasGap={tripPlan.readinessScore?.status !== 'READY'}
            />

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
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
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
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
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
      )}

      {/* Progressive Disclosure Toll & Cost Analytics Modal */}
      {tripPlan && showAnalyticsModal && (
        <TollAnalyticsModal
          tripPlan={tripPlan}
          onClose={() => setShowAnalyticsModal(false)}
        />
      )}

      {/* Phase 3B Progressive Disclosure Journey Readiness Details Modal */}
      {tripPlan && showReadinessModal && (
        <ReadinessDetailsModal
          tripPlan={tripPlan}
          onClose={() => setShowReadinessModal(false)}
        />
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
