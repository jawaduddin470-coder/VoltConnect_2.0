/**
 * VOLTCONNECT 2.0 — NATIONWIDE TOLL INTELLIGENCE SERVICE
 * Performs spatial corridor matching across route geometry coordinates against the nationwide
 * FASTag toll plaza dataset to calculate route-specific toll count and total toll charges (INR).
 */

import { NATIONWIDE_TOLL_PLAZAS, TollPlazaRecord } from '@/features/charging/data/tollPlazaSeed';
import { routingService } from './routingService';

export interface RouteTollMatch {
  plaza: TollPlazaRecord;
  distanceFromOriginKm: number;
  sequenceIndex: number;
}

export interface RouteTollSummary {
  totalTollCostINR: number;
  tollPlazaCount: number;
  matchedPlazas: RouteTollMatch[];
  confidenceStatus: 'VERIFIED_FASTAG' | 'ESTIMATED_HIGHWAY' | 'UNAVAILABLE';
  dataAttributionMessage: string;
}

class TollService {
  /**
   * Computes route-specific toll plazas along the highway corridor for ANY origin -> destination route.
   */
  public calculateRouteTolls(routeGeometry: [number, number][], totalDistanceKm: number): RouteTollSummary {
    if (!routeGeometry || routeGeometry.length < 2) {
      return {
        totalTollCostINR: 0,
        tollPlazaCount: 0,
        matchedPlazas: [],
        confidenceStatus: 'UNAVAILABLE',
        dataAttributionMessage: 'Toll estimate unavailable for this route segment.',
      };
    }

    // 1. Calculate Route Bounding Box with 0.15 degree (~ 15-20 km) safety buffer
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    routeGeometry.forEach(([lat, lng]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    const buffer = 0.15;
    const bboxMinLat = minLat - buffer;
    const bboxMaxLat = maxLat + buffer;
    const bboxMinLng = minLng - buffer;
    const bboxMaxLng = maxLng + buffer;

    // 2. Filter Nationwide Toll Plazas down to candidates within route bounding box
    const candidatePlazas = NATIONWIDE_TOLL_PLAZAS.filter(plaza => {
      return (
        plaza.latitude >= bboxMinLat &&
        plaza.latitude <= bboxMaxLat &&
        plaza.longitude >= bboxMinLng &&
        plaza.longitude <= bboxMaxLng
      );
    });

    // 3. Perform Corridor Proximity Check (Perpendicular Haversine distance <= 3.5 km to polyline)
    const matchedPlazas: RouteTollMatch[] = [];

    candidatePlazas.forEach(plaza => {
      let minDistanceToRouteKm = 999;
      let closestPtIndex = 0;

      // Sample route geometry points
      for (let i = 0; i < routeGeometry.length; i++) {
        const pt = routeGeometry[i];
        const distKm = routingService.haversineDistance(pt[0], pt[1], plaza.latitude, plaza.longitude);
        if (distKm < minDistanceToRouteKm) {
          minDistanceToRouteKm = distKm;
          closestPtIndex = i;
        }
      }

      // If toll plaza is within 3.5 km corridor of the calculated highway route
      if (minDistanceToRouteKm <= 3.5) {
        const approxDistFromOrigin = Math.round((closestPtIndex / routeGeometry.length) * totalDistanceKm);
        matchedPlazas.push({
          plaza,
          distanceFromOriginKm: approxDistFromOrigin,
          sequenceIndex: closestPtIndex,
        });
      }
    });

    // 4. Sort Matched Plazas in strict route sequence from Origin -> Destination
    matchedPlazas.sort((a, b) => a.sequenceIndex - b.sequenceIndex);

    // Deduplicate any plaza matched twice
    const uniqueMatchedPlazas: RouteTollMatch[] = [];
    const seenIds = new Set<string>();

    matchedPlazas.forEach(m => {
      if (!seenIds.has(m.plaza.id)) {
        seenIds.add(m.plaza.id);
        uniqueMatchedPlazas.push(m);
      }
    });

    const totalTollCostINR = uniqueMatchedPlazas.reduce((acc, m) => acc + m.plaza.carTollFeeINR, 0);
    const tollPlazaCount = uniqueMatchedPlazas.length;

    if (tollPlazaCount === 0) {
      return {
        totalTollCostINR: 0,
        tollPlazaCount: 0,
        matchedPlazas: [],
        confidenceStatus: 'UNAVAILABLE',
        dataAttributionMessage: totalDistanceKm > 80
          ? 'No FASTag toll plazas detected on this highway corridor.'
          : 'Local city route — No highway toll plazas required.',
      };
    }

    return {
      totalTollCostINR,
      tollPlazaCount,
      matchedPlazas: uniqueMatchedPlazas,
      confidenceStatus: 'VERIFIED_FASTAG',
      dataAttributionMessage: `Calculated across ${tollPlazaCount} FASTag toll gates on National Highway network`,
    };
  }
}

export const tollService = new TollService();
