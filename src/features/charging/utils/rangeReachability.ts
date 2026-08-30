import { ChargingStation, ReachabilityStatus, UserVehicle } from '@/types';
import { calculateAvailableEnergy, calculateEstimatedRange } from '@/features/vehicles/utils/calculationEngine';

export interface ReachabilityResult {
  status: ReachabilityStatus;
  estimatedArrivalSOC: number;
  distanceKm: number;
  energyRequiredkWh: number;
  label: string;
  badgeClass: string;
}

/**
 * Calculates distance between two GPS coordinates using the Haversine formula (km).
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Evaluates whether a charging station is reachable based on active EV battery state.
 */
export function evaluateStationReachability(
  vehicle: UserVehicle | null,
  station: ChargingStation,
  userLat: number = 17.435,
  userLon: number = 78.385
): ReachabilityResult {
  const distanceKm = calculateDistanceKm(userLat, userLon, station.latitude, station.longitude);

  if (!vehicle) {
    return {
      status: 'WITHIN_RANGE',
      estimatedArrivalSOC: 50,
      distanceKm,
      energyRequiredkWh: 0,
      label: 'Within Practical Range',
      badgeClass: 'vc-badge-green',
    };
  }

  const currentSOC = vehicle.currentBatteryPercent;
  const totalCapacity = vehicle.usableCapacitykWh || vehicle.batteryCapacitykWh * 0.95;

  // Energy needed for trip (assume ~135 Wh/km for 4W, adjusted for 2W)
  let whPerKm = 135;
  if (vehicle.category === '2-wheeler') whPerKm = 35;
  else if (vehicle.category === 'heavy') whPerKm = 850;

  const energyRequiredkWh = Number(((distanceKm * whPerKm) / 1000).toFixed(2));
  const socUsedPercent = Math.round((energyRequiredkWh / totalCapacity) * 100);
  const estimatedArrivalSOC = Math.max(0, currentSOC - socUsedPercent);

  let status: ReachabilityStatus = 'WITHIN_RANGE';
  let label = `Reachable • Arrival SOC: ${estimatedArrivalSOC}%`;
  let badgeClass = 'vc-badge-green';

  if (estimatedArrivalSOC <= 0 || distanceKm > vehicle.estimatedRangeKm) {
    status = 'OUTSIDE_RANGE';
    label = 'Outside Practical Range';
    badgeClass = 'vc-badge-rose';
  } else if (estimatedArrivalSOC < 15) {
    status = 'NEAR_RANGE_LIMIT';
    label = `Near Range Limit • Arrival SOC: ${estimatedArrivalSOC}%`;
    badgeClass = 'vc-badge-amber';
  }

  return {
    status,
    estimatedArrivalSOC,
    distanceKm,
    energyRequiredkWh,
    label,
    badgeClass,
  };
}
