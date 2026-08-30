/**
 * VOLTCONNECT 2.0 — EV TRIP PLANNING & ROUTE-AWARE CHARGING CORRIDOR ENGINE
 * Calculates vehicle-aware usable planning range (practicalRange * (1 - safetyReserve)),
 * consumes global starting battery SOC (currentBatteryPercent), samples route corridors,
 * filters compatible chargers from the 1,771 Firestore dataset, and classifies candidates into
 * Recommended Charging Stops & Other Compatible Route Stations.
 */

import { ChargingStation, UserVehicle } from '@/types';
import { checkStationCompatibility, normalizeConnectorType } from '@/features/charging/utils/compatibility';
import { routingService, RouteResult, RouteWaypointInput } from './routingService';

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
    
    // Starting Range for Leg 1 derived directly from Starting SOC %
    const leg1UsableRangeKm = Math.max(60, Math.round(effectivePlanningRangeKm * (startingSOCPercent / 100)));

    const totalRoadDistanceKm = routeResult.distanceKm;
    const totalDrivingDurationMinutes = routeResult.durationMinutes;
    const geometry = routeResult.geometry;

    // 2. Validate coordinates in input dataset
    const validCoordStations = allStations.filter(
      st => !isNaN(st.latitude) && !isNaN(st.longitude) && st.latitude >= -90 && st.latitude <= 90
    );

    // 3. Connector Breakdown Analysis
    let ccs2Count = 0;
    let type2Count = 0;
    let chademoCount = 0;
    let gbtCount = 0;
    let otherCount = 0;
    let unknownCount = 0;

    let vehCompatibleCount = 0;
    let vehIncompatibleCount = 0;
    let vehUnknownCount = 0;

    validCoordStations.forEach(st => {
      const connTypes = st.chargers.map(c => normalizeConnectorType(c.connectorType));
      
      if (connTypes.includes('ccs2')) ccs2Count++;
      else if (connTypes.includes('type2')) type2Count++;
      else if (connTypes.includes('chademo')) chademoCount++;
      else if (connTypes.includes('gbt')) gbtCount++;
      else if (connTypes.includes('unknown')) unknownCount++;
      else otherCount++;

      if (activeVehicle) {
        const comp = checkStationCompatibility(activeVehicle, st);
        if (comp.status === 'GREEN' || comp.status === 'YELLOW') {
          vehCompatibleCount++;
        } else if (connTypes.includes('unknown')) {
          vehUnknownCount++;
        } else {
          vehIncompatibleCount++;
        }
      } else {
        vehCompatibleCount++;
      }
    });

    // 4. Strict Vehicle Compatibility Filter
    const compatibleStations = validCoordStations.filter(st => {
      if (!activeVehicle) return true;
      const comp = checkStationCompatibility(activeVehicle, st);
      return comp.status === 'GREEN' || comp.status === 'YELLOW';
    });

    // 5. Calculate Route Bounding Box (with 0.8 degree margin ~ 80 km)
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    geometry.forEach(pt => {
      if (pt[0] < minLat) minLat = pt[0];
      if (pt[0] > maxLat) maxLat = pt[0];
      if (pt[1] < minLng) minLng = pt[1];
      if (pt[1] > maxLng) maxLng = pt[1];
    });

    const bboxMargin = 0.8;
    const bboxMinLat = minLat - bboxMargin;
    const bboxMaxLat = maxLat + bboxMargin;
    const bboxMinLng = minLng - bboxMargin;
    const bboxMaxLng = maxLng + bboxMargin;

    const bboxStations = compatibleStations.filter(
      st => st.latitude >= bboxMinLat && st.latitude <= bboxMaxLat && st.longitude >= bboxMinLng && st.longitude <= bboxMaxLng
    );

    // 6. Pre-calculate progress distance along route geometry
    const geometryDistances: number[] = [0];
    let runningDist = 0;
    for (let i = 1; i < geometry.length; i++) {
      const p1 = geometry[i - 1];
      const p2 = geometry[i];
      const seg = routingService.haversineDistance(p1[0], p1[1], p2[0], p2[1]);
      runningDist += seg;
      geometryDistances.push(runningDist);
    }

    // 7. Dense corridor search (80 km search radius)
    const corridorMaxDistKm = 80.0;
    const corridorStationMap: Map<string, { station: ChargingStation; minDist: number; progressKm: number }> = new Map();

    const sampleStep = Math.max(1, Math.floor(geometry.length / 400));

    for (const st of bboxStations) {
      let minCorridorDist = 999;
      let matchedProgressKm = 0;

      for (let i = 0; i < geometry.length; i += sampleStep) {
        const pt = geometry[i];
        const dist = routingService.haversineDistance(pt[0], pt[1], st.latitude, st.longitude);
        if (dist < minCorridorDist) {
          minCorridorDist = dist;
          matchedProgressKm = geometryDistances[i] || 0;
        }
      }

      if (minCorridorDist <= corridorMaxDistKm) {
        corridorStationMap.set(st.id, {
          station: st,
          minDist: Math.round(minCorridorDist * 10) / 10,
          progressKm: Math.round(matchedProgressKm),
        });
      }
    }

    const corridorList = Array.from(corridorStationMap.values()).sort((a, b) => a.progressKm - b.progressKm);
    const recommendedStops: RecommendedChargingStop[] = [];
    const otherCompatibleStations: RecommendedChargingStop[] = [];

    // 8. Dynamic Recommended Charging Stop Calculation Loop (Responding to Starting SOC)
    const initialLegDistance = Math.min(totalRoadDistanceKm, leg1UsableRangeKm);
    const remainingDistanceAfterLeg1 = Math.max(0, totalRoadDistanceKm - initialLegDistance);

    const targetNumStops = totalRoadDistanceKm > leg1UsableRangeKm
      ? 1 + (remainingDistanceAfterLeg1 > 0 ? Math.ceil(remainingDistanceAfterLeg1 / effectivePlanningRangeKm) : 0)
      : 0;

    let lastStopProgressKm = 0;

    for (let leg = 1; leg <= targetNumStops; leg++) {
      const maxLegRange = leg === 1 ? leg1UsableRangeKm : effectivePlanningRangeKm;
      
      let bestCandidate: { station: ChargingStation; minDist: number; progressKm: number } | null = null;
      let minDiffKm = 999;

      for (const candidate of corridorList) {
        const distFromPrev = candidate.progressKm - lastStopProgressKm;
        if (distFromPrev > 0 && distFromPrev <= maxLegRange * 1.1) {
          const targetDist = lastStopProgressKm + (maxLegRange * 0.85);
          const diff = Math.abs(candidate.progressKm - targetDist);
          if (diff < minDiffKm && !recommendedStops.some(r => r.station.id === candidate.station.id)) {
            minDiffKm = diff;
            bestCandidate = candidate;
          }
        }
      }

      if (!bestCandidate) {
        for (const candidate of corridorList) {
          if (candidate.progressKm > lastStopProgressKm && candidate.progressKm - lastStopProgressKm <= maxLegRange * 1.25 && !recommendedStops.some(r => r.station.id === candidate.station.id)) {
            bestCandidate = candidate;
            break;
          }
        }
      }

      if (bestCandidate) {
        const distanceFromPrev = Math.round((bestCandidate.progressKm - lastStopProgressKm) * 10) / 10;
        const maxPowerKW = Math.max(...bestCandidate.station.chargers.map(c => c.powerKW), 50);
        const connectorType = bestCandidate.station.chargers[0]?.connectorType || 'CCS2';

        const energyAddedkWh = Math.round(usableCapacitykWh * 0.7 * 10) / 10;
        const estimatedChargeTimeMinutes = Math.round((energyAddedkWh / maxPowerKW) * 60) + 8;
        const arrivalSOC = leg === 1
          ? Math.max(8, Math.round(startingSOCPercent - ((distanceFromPrev / effectivePlanningRangeKm) * 100)))
          : 18;

        recommendedStops.push({
          station: bestCandidate.station,
          distanceFromOriginKm: bestCandidate.progressKm,
          distanceFromPreviousStopKm: distanceFromPrev,
          detourDistanceKm: bestCandidate.minDist * 2,
          estimatedArrivalSOCPercent: arrivalSOC,
          estimatedChargeTimeMinutes,
          energyAddedkWh,
          maxPowerKW,
          connectorType,
        });

        lastStopProgressKm = bestCandidate.progressKm;
      }
    }

    // 9. Populate Other Compatible Stations
    corridorList.forEach(item => {
      if (!recommendedStops.some(r => r.station.id === item.station.id)) {
        const maxPowerKW = Math.max(...item.station.chargers.map(c => c.powerKW), 50);
        const connectorType = item.station.chargers[0]?.connectorType || 'CCS2';
        const energyAddedkWh = Math.round(usableCapacitykWh * 0.7 * 10) / 10;
        const estimatedChargeTimeMinutes = Math.round((energyAddedkWh / maxPowerKW) * 60) + 8;

        otherCompatibleStations.push({
          station: item.station,
          distanceFromOriginKm: item.progressKm,
          distanceFromPreviousStopKm: item.progressKm,
          detourDistanceKm: item.minDist * 2,
          estimatedArrivalSOCPercent: 20,
          estimatedChargeTimeMinutes,
          energyAddedkWh,
          maxPowerKW,
          connectorType,
        });
      }
    });

    const totalChargingDurationMinutes = recommendedStops.reduce((sum, s) => sum + s.estimatedChargeTimeMinutes, 0);
    const totalJourneyTimeMinutes = totalDrivingDurationMinutes + totalChargingDurationMinutes;

    // Diagnostics Log Output
    console.log(`[VoltTrip Station Pipeline Diagnostics]

Test: ${routeResult.waypoints[0]?.name || 'Origin'} → ${routeResult.waypoints[routeResult.waypoints.length - 1]?.name || 'Destination'}
Vehicle: ${activeVehicle ? `${activeVehicle.manufacturer} ${activeVehicle.model}` : 'Default EV'}
Starting SOC: ${startingSOCPercent}% (Initial Reach: ${leg1UsableRangeKm} km)

Firestore total: ${allStations.length}
Retrieved: ${allStations.length}
Valid coordinates: ${validCoordStations.length}

Connector breakdown:
- CCS2: ${ccs2Count}
- Type 2: ${type2Count}
- CHAdeMO: ${chademoCount}
- GB/T: ${gbtCount}
- Other / 15A: ${otherCount}
- Unknown: ${unknownCount}

${activeVehicle ? activeVehicle.model : 'EV'} Compatibility:
- Compatible: ${vehCompatibleCount}
- Incompatible: ${vehIncompatibleCount}
- Unknown / Unverified: ${vehUnknownCount}

Inside route bounding box: ${bboxStations.length}
Within route corridor (<= 80km): ${corridorList.length}

Recommended Charging Stops: ${recommendedStops.length}
Other Compatible Stations: ${otherCompatibleStations.length}
Final Rendered on Map: ${recommendedStops.length + otherCompatibleStations.length}
    `);

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
    };
  }
}

export const tripPlanningEngine = new TripPlanningEngine();
