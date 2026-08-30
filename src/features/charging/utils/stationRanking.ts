import { ChargingStation, UserVehicle } from '@/types';
import { checkStationCompatibility } from './compatibility';
import { calculateVoltScore } from './voltScore';
import { evaluateStationReachability } from './rangeReachability';

export interface StationRankingResult {
  station: ChargingStation;
  rankingScore: number;
  isBestMatch: boolean;
  matchReasons: string[];
}

/**
 * Evaluates and ranks stations for the active EV, returning sorted results with BEST MATCH tags.
 */
export function rankStationsForVehicle(
  stations: ChargingStation[],
  vehicle: UserVehicle | null,
  userLat: number = 17.435,
  userLon: number = 78.385
): StationRankingResult[] {
  const ranked = stations.map(station => {
    const compatibility = checkStationCompatibility(vehicle, station);
    const voltScoreRes = calculateVoltScore(station);
    const reachability = evaluateStationReachability(vehicle, station, userLat, userLon);

    let compatibilityScore = 100;
    if (compatibility.status === 'YELLOW') compatibilityScore = 60;
    if (compatibility.status === 'RED') compatibilityScore = 0;

    const availablePorts = station.chargers.filter(c => c.status === 'Available').length;
    const availabilityScore = Math.min(100, Math.round((availablePorts / station.chargers.length) * 100));

    // Distance Score (closer = higher score up to 30km)
    const distanceScore = Math.max(0, Math.round(100 - (reachability.distanceKm / 30) * 100));

    // Tariff Score (lower ₹/kWh = higher score)
    const lowestTariff = Math.min(...station.chargers.map(c => c.pricingPerKWh || 18));
    const tariffScore = Math.max(0, Math.round(100 - (lowestTariff / 30) * 50));

    // Weighted composite score
    const rankingScore = Math.round(
      compatibilityScore * 0.30 +
      availabilityScore * 0.25 +
      distanceScore * 0.20 +
      voltScoreRes.score * 0.15 +
      tariffScore * 0.10
    );

    const matchReasons: string[] = [];
    if (compatibility.status === 'GREEN') matchReasons.push('100% Compatible with active EV');
    if (availablePorts > 0) matchReasons.push(`${availablePorts} Open Fast Ports`);
    if (voltScoreRes.score >= 90) matchReasons.push(`VoltScore ${voltScoreRes.score} Excellent Uptime`);
    if (reachability.status === 'WITHIN_RANGE') matchReasons.push(`Reachable (${reachability.distanceKm} km away)`);

    return {
      station: {
        ...station,
        distanceKm: reachability.distanceKm,
        reachabilityStatus: reachability.status,
        estimatedArrivalSOC: reachability.estimatedArrivalSOC,
      },
      rankingScore,
      isBestMatch: false,
      matchReasons,
    };
  });

  // Sort descending by rankingScore
  ranked.sort((a, b) => b.rankingScore - a.rankingScore);

  // Tag top eligible result as BEST MATCH
  if (ranked.length > 0 && ranked[0].rankingScore > 50) {
    ranked[0].isBestMatch = true;
  }

  return ranked;
}
