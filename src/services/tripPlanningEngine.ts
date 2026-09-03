/**
 * VOLTCONNECT 2.0 — EV TRIP PLANNING & ROUTE-AWARE CHARGING CORRIDOR ENGINE
 * Calculates vehicle-aware usable planning range (practicalRange * (1 - safetyReserve)),
 * consumes global starting battery SOC (currentBatteryPercent), samples route corridors,
 * filters compatible chargers from the 1,771 Firestore dataset, integrates Toll Intelligence,
 * computes Journey Cost Analytics, Readiness Scores, and Plan B Alternate Charging Recovery.
 */

import { ChargingStation, UserVehicle } from '@/types';
import { checkStationCompatibility, normalizeConnectorType } from '@/features/charging/utils/compatibility';
import { routingService, RouteResult, RouteWaypointInput } from './routingService';
import { tollService, RouteTollSummary } from './tollService';
import { journeyAnalyticsService, JourneyCostBreakdown, JourneyReadinessResult } from './journeyAnalyticsService';

export interface RecommendedChargingStop {
  station: ChargingStation;
  distanceFromOriginKm: number;
  distanceFromPreviousStopKm: number;
  detourDistanceKm: number;
  estimatedArrivalSOCPercent: number;
  estimatedChargeTimeMinutes: number;
  energyAddedkWh: number;
  maxPowerKW: number;
  connectorType: string;
}

export interface EVTripPlan {
  totalRoadDistanceKm: number;
  totalDrivingDurationMinutes: number;
  totalChargingDurationMinutes: number;
  totalJourneyTimeMinutes: number;
  nominalRangeKm: number;
  startingSOCPercent: number;
  safetyReservePercent: number;
  effectivePlanningRangeKm: number;
  recommendedStops: RecommendedChargingStop[];
  otherCompatibleStations: RecommendedChargingStop[];
  routeGeometry: [number, number][];
  waypoints: RouteWaypointInput[];
  tollSummary: RouteTollSummary;
  costSummary: JourneyCostBreakdown;
  readinessScore: JourneyReadinessResult;
}

export interface PlanBRecoveryResult {
  success: boolean;
  alternateStops: RecommendedChargingStop[];
  reason?: string;
}

class TripPlanningEngine {
  /**
   * Plans EV journey using road routing, vehicle specifications, global starting SOC, safety reserve, and Firestore stations.
   */
  public planEVJourney(
    routeResult: RouteResult,
    activeVehicle: UserVehicle | null,
    allStations: ChargingStation[],
    safetyReservePercent: number = 15
  ): EVTripPlan {
    // 1. Vehicle Specifications & Usable Planning Range Calculation
    const nominalRangeKm = activeVehicle?.estimatedRangeKm || 450;
    const batteryCapacitykWh = activeVehicle?.batteryCapacitykWh || 105.0;
    const usableCapacitykWh = activeVehicle?.usableCapacitykWh || batteryCapacitykWh * 0.95;
    const startingSOCPercent = activeVehicle?.currentBatteryPercent ?? 85;

    // Effective Usable Planning Range = practicalRange * (1 - safetyReserve)
    const effectivePlanningRangeKm = Math.max(120, Math.round(nominalRangeKm * (1 - safetyReservePercent / 100)));
    
    const totalRoadDistanceKm = routeResult.distanceKm;
    const totalDrivingDurationMinutes = routeResult.durationMinutes;
    const geometry = routeResult.geometry;

    // 2. Validate coordinates in input dataset
    const validCoordStations = allStations.filter(
      st => !isNaN(st.latitude) && !isNaN(st.longitude) && st.latitude >= -90 && st.latitude <= 90
    );

    // 3. Strict Vehicle Compatibility Filter
    const compatibleStations = validCoordStations.filter(st => {
      if (!activeVehicle) return true;
      const comp = checkStationCompatibility(activeVehicle, st);
      return comp.status === 'GREEN' || comp.status === 'YELLOW';
    });

    // 4. Calculate Route Bounding Box (with 0.8 degree margin ~ 80 km)
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    geometry.forEach(pt => {
      if (pt[0] < minLat) minLat = pt[0];
      if (pt[0] > maxLat) maxLat = pt[0];
      if (pt[1] < minLng) minLng = pt[1];
      if (pt[1] > maxLng) maxLng = pt[1];
    });

    const latMargin = 0.8;
    const lngMargin = 0.8;

    const bboxStations = compatibleStations.filter(st => {
      return (
        st.latitude >= minLat - latMargin &&
        st.latitude <= maxLat + latMargin &&
        st.longitude >= minLng - lngMargin &&
        st.longitude <= maxLng + lngMargin
      );
    });

    // 5. Pre-calculate closest route distance for each station in bounding box
    const corridorStations = bboxStations.map(st => {
      let minDistanceToRouteKm = 999;
      let closestPtIndex = 0;

      for (let i = 0; i < geometry.length; i++) {
        const pt = geometry[i];
        const distKm = routingService.haversineDistance(st.latitude, st.longitude, pt[0], pt[1]);
        if (distKm < minDistanceToRouteKm) {
          minDistanceToRouteKm = distKm;
          closestPtIndex = i;
        }
      }

      const approxDistFromOriginKm = Math.round((closestPtIndex / geometry.length) * totalRoadDistanceKm);

      return {
        station: st,
        minDistanceToRouteKm,
        approxDistFromOriginKm,
        closestPtIndex,
      };
    });

    // Filter stations strictly within 80km corridor of route geometry
    const corridorList = corridorStations.filter(cs => cs.minDistanceToRouteKm <= 80);
    corridorList.sort((a, b) => a.approxDistFromOriginKm - b.approxDistFromOriginKm);

    // 6. Primary Route Charging Algorithm — Safe Sequential Route Selection
    const recommendedStops = this.generateSafeSequentialStops(
      corridorList,
      totalRoadDistanceKm,
      nominalRangeKm,
      usableCapacitykWh,
      startingSOCPercent,
      safetyReservePercent,
      0.88 // Standard 88% spacing target
    );

    // 7. Classify remaining corridor stations
    const recIds = new Set(recommendedStops.map(r => r.station.id));
    const otherCompatibleStations: RecommendedChargingStop[] = corridorList
      .filter(cs => !recIds.has(cs.station.id))
      .slice(0, 120)
      .map(cs => {
        const maxKw = Math.max(...cs.station.chargers.map(c => c.powerKW), 22);
        return {
          station: cs.station,
          distanceFromOriginKm: cs.approxDistFromOriginKm,
          distanceFromPreviousStopKm: 0,
          detourDistanceKm: Math.round(cs.minDistanceToRouteKm * 10) / 10,
          estimatedArrivalSOCPercent: 20,
          estimatedChargeTimeMinutes: 30,
          energyAddedkWh: 25,
          maxPowerKW: maxKw,
          connectorType: cs.station.chargers[0]?.connectorType || 'CCS2',
        };
      });

    const totalChargingDurationMinutes = recommendedStops.reduce((sum, s) => sum + s.estimatedChargeTimeMinutes, 0);
    const totalJourneyTimeMinutes = totalDrivingDurationMinutes + totalChargingDurationMinutes;

    // 8. Compute Nationwide Toll Intelligence & Journey Analytics
    const tollSummary = tollService.calculateRouteTolls(geometry, totalRoadDistanceKm);
    const costSummary = journeyAnalyticsService.computeJourneyCosts(
      recommendedStops,
      tollSummary.totalTollCostINR,
      totalRoadDistanceKm,
      activeVehicle,
      tollSummary.matchedPlazas
    );
    const readinessScore = journeyAnalyticsService.computeJourneyReadiness(
      startingSOCPercent,
      safetyReservePercent,
      totalRoadDistanceKm,
      effectivePlanningRangeKm,
      recommendedStops,
      activeVehicle,
      otherCompatibleStations.length,
      costSummary.dataConfidence
    );

    return {
      totalRoadDistanceKm,
      totalDrivingDurationMinutes,
      totalChargingDurationMinutes,
      totalJourneyTimeMinutes,
      nominalRangeKm,
      startingSOCPercent,
      safetyReservePercent,
      effectivePlanningRangeKm,
      recommendedStops,
      otherCompatibleStations,
      routeGeometry: geometry,
      waypoints: routeResult.waypoints,
      tollSummary,
      costSummary,
      readinessScore,
    };
  }

  /**
   * Generates safe sequential charging stops given corridor stations and range parameters.
   */
  private generateSafeSequentialStops(
    corridorList: any[],
    totalRoadDistanceKm: number,
    nominalRangeKm: number,
    usableCapacitykWh: number,
    startingSOCPercent: number,
    safetyReservePercent: number,
    spacingTargetFactor: number = 0.88,
    preferUltraFast: boolean = false,
    excludedStationIds: Set<string> = new Set()
  ): RecommendedChargingStop[] {
    const recommendedStops: RecommendedChargingStop[] = [];
    let currentDistKm = 0;
    let prevStopDistKm = 0;
    let stopIndex = 0;

    const leg1MaxSafeKm = Math.round(nominalRangeKm * ((startingSOCPercent - safetyReservePercent) / 100));
    const subsequentMaxSafeKm = Math.round(nominalRangeKm * ((85 - safetyReservePercent) / 100));

    while (true) {
      const currentDepSOC = stopIndex === 0 ? startingSOCPercent : 85;
      const currentMaxSafeKm = stopIndex === 0 ? leg1MaxSafeKm : subsequentMaxSafeKm;
      const remainingDistKm = totalRoadDistanceKm - currentDistKm;

      if (remainingDistKm <= currentMaxSafeKm) break;

      const targetDistFromOriginKm = currentDistKm + currentMaxSafeKm * spacingTargetFactor;

      let candidates = corridorList.filter(
        cs => cs.approxDistFromOriginKm > currentDistKm + 10 && cs.approxDistFromOriginKm <= currentDistKm + currentMaxSafeKm
      );

      if (excludedStationIds.size > 0) {
        const nonExcluded = candidates.filter(cs => !excludedStationIds.has(cs.station.id));
        if (nonExcluded.length > 0) candidates = nonExcluded;
      }

      if (candidates.length === 0) {
        candidates = corridorList.filter(
          cs => cs.approxDistFromOriginKm > currentDistKm + 5 && cs.approxDistFromOriginKm <= currentDistKm + currentMaxSafeKm + 30
        );
        if (candidates.length === 0) break;
      }

      candidates.sort((a, b) => {
        const aMaxKw = Math.max(...a.station.chargers.map((c: any) => c.powerKW), 0);
        const bMaxKw = Math.max(...b.station.chargers.map((c: any) => c.powerKW), 0);

        const aDistScore = 100 - Math.abs(a.approxDistFromOriginKm - targetDistFromOriginKm);
        const bDistScore = 100 - Math.abs(b.approxDistFromOriginKm - targetDistFromOriginKm);

        const powerWeight = preferUltraFast ? 4 : 2;
        const aScore = aMaxKw * powerWeight + aDistScore - a.minDistanceToRouteKm * 3;
        const bScore = bMaxKw * powerWeight + bDistScore - b.minDistanceToRouteKm * 3;

        return bScore - aScore;
      });

      const selected = candidates[0];
      const maxKw = Math.max(...selected.station.chargers.map((c: any) => c.powerKW), 50);
      const connType = selected.station.chargers[0]?.connectorType || 'CCS2';

      const segDistKm = selected.approxDistFromOriginKm - prevStopDistKm;
      const consumedRatio = segDistKm / nominalRangeKm;
      const arrivalSOC = Math.max(10, Math.round(currentDepSOC - consumedRatio * 100));

      const chargeTimeMinutes = Math.round(((85 - arrivalSOC) / 100 * usableCapacitykWh) / (maxKw / 60));
      const energyAdded = Math.round(((85 - arrivalSOC) / 100) * usableCapacitykWh);

      recommendedStops.push({
        station: selected.station,
        distanceFromOriginKm: selected.approxDistFromOriginKm,
        distanceFromPreviousStopKm: segDistKm,
        detourDistanceKm: Math.round(selected.minDistanceToRouteKm * 10) / 10,
        estimatedArrivalSOCPercent: arrivalSOC,
        estimatedChargeTimeMinutes: Math.max(15, chargeTimeMinutes),
        energyAddedkWh: Math.max(15, energyAdded),
        maxPowerKW: maxKw,
        connectorType: connType,
      });

      prevStopDistKm = selected.approxDistFromOriginKm;
      currentDistKm = selected.approxDistFromOriginKm;
      stopIndex++;

      if (stopIndex > 25) break;
    }

    return recommendedStops;
  }

  /**
   * Phase 4: Plan B Alternate Charging Recovery Search Engine.
   * Reuses existing corridor station data and safe sequential reachability rules.
   */
  public calculatePlanBAlternateStops(
    tripPlan: EVTripPlan,
    activeVehicle: UserVehicle | null,
    allStations: ChargingStation[]
  ): PlanBRecoveryResult {
    const { totalRoadDistanceKm, startingSOCPercent, safetyReservePercent, nominalRangeKm } = tripPlan;
    const usableCapacitykWh = activeVehicle?.usableCapacitykWh || 105.0;

    // Filter compatible stations
    const validCoordStations = allStations.filter(
      st => !isNaN(st.latitude) && !isNaN(st.longitude) && st.latitude >= -90 && st.latitude <= 90
    );

    const compatibleStations = validCoordStations.filter(st => {
      if (!activeVehicle) return true;
      const comp = checkStationCompatibility(activeVehicle, st);
      return comp.status === 'GREEN' || comp.status === 'YELLOW';
    });

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    tripPlan.routeGeometry.forEach(pt => {
      if (pt[0] < minLat) minLat = pt[0];
      if (pt[0] > maxLat) maxLat = pt[0];
      if (pt[1] < minLng) minLng = pt[1];
      if (pt[1] > maxLng) maxLng = pt[1];
    });

    const bboxStations = compatibleStations.filter(st => {
      return (
        st.latitude >= minLat - 0.8 &&
        st.latitude <= maxLat + 0.8 &&
        st.longitude >= minLng - 0.8 &&
        st.longitude <= maxLng + 0.8
      );
    });

    const corridorStations = bboxStations.map(st => {
      let minDistanceToRouteKm = 999;
      let closestPtIndex = 0;

      for (let i = 0; i < tripPlan.routeGeometry.length; i++) {
        const pt = tripPlan.routeGeometry[i];
        const distKm = routingService.haversineDistance(st.latitude, st.longitude, pt[0], pt[1]);
        if (distKm < minDistanceToRouteKm) {
          minDistanceToRouteKm = distKm;
          closestPtIndex = i;
        }
      }

      const approxDistFromOriginKm = Math.round((closestPtIndex / tripPlan.routeGeometry.length) * totalRoadDistanceKm);

      return {
        station: st,
        minDistanceToRouteKm,
        approxDistFromOriginKm,
      };
    });

    const corridorList = corridorStations.filter(cs => cs.minDistanceToRouteKm <= 80);
    corridorList.sort((a, b) => a.approxDistFromOriginKm - b.approxDistFromOriginKm);

    // Primary plan stop IDs to avoid where possible
    const primaryStopIds = new Set(tripPlan.recommendedStops.map(s => s.station.id));

    // Strategy 1: Ultra-fast charging hubs focus with tighter spacing factor (0.75)
    let altStops = this.generateSafeSequentialStops(
      corridorList,
      totalRoadDistanceKm,
      nominalRangeKm,
      usableCapacitykWh,
      startingSOCPercent,
      safetyReservePercent,
      0.75, // Conservative 75% spacing factor for intermediate buffer
      true, // Prefer ultra-fast chargers
      primaryStopIds
    );

    // Strategy 2: Fallback if Strategy 1 produces empty plan
    if (altStops.length === 0) {
      altStops = this.generateSafeSequentialStops(
        corridorList,
        totalRoadDistanceKm,
        nominalRangeKm,
        usableCapacitykWh,
        startingSOCPercent,
        safetyReservePercent,
        0.80,
        false,
        new Set()
      );
    }

    // Validate alternate plan reachability
    const leg1MaxSafeKm = Math.round(nominalRangeKm * ((startingSOCPercent - safetyReservePercent) / 100));
    const subsequentMaxSafeKm = Math.round(nominalRangeKm * ((85 - safetyReservePercent) / 100));

    let prevPos = 0;
    let currentSOC = startingSOCPercent;
    let allValid = true;

    for (let i = 0; i < altStops.length; i++) {
      const stop = altStops[i];
      const segDist = stop.distanceFromOriginKm - prevPos;
      const maxSafe = i === 0 ? leg1MaxSafeKm : subsequentMaxSafeKm;
      const consumedRatio = segDist / nominalRangeKm;
      const arrSOC = Math.round(currentSOC - consumedRatio * 100);

      if (segDist > maxSafe || arrSOC < safetyReservePercent) {
        allValid = false;
        break;
      }

      prevPos = stop.distanceFromOriginKm;
      currentSOC = 85;
    }

    // Validate final leg to destination
    const finalSegDist = totalRoadDistanceKm - prevPos;
    const finalConsumedRatio = finalSegDist / nominalRangeKm;
    const finalArrSOC = Math.round(currentSOC - finalConsumedRatio * 100);

    if (finalSegDist > subsequentMaxSafeKm || finalArrSOC < safetyReservePercent) {
      allValid = false;
    }

    if (!allValid || altStops.length === 0) {
      return {
        success: false,
        alternateStops: [],
        reason: 'VoltTrip could not identify a compatible charging sequence that maintains the configured safety reserve.',
      };
    }

    return {
      success: true,
      alternateStops: altStops,
    };
  }
}

export const tripPlanningEngine = new TripPlanningEngine();
