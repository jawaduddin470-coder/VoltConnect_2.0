import { Charger, ChargingStation, UserVehicle } from '@/types';

export interface CompatibilityResult {
  status: 'GREEN' | 'YELLOW' | 'RED';
  label: 'Fully Compatible' | 'Compatible with Limits' | 'Not Compatible';
  reason: string;
}

/**
 * Normalizes connector type strings across CPOs & datasets into canonical standards.
 * Unspecified, empty or 'unknown' connectors map to 'unknown'.
 */
export function normalizeConnectorType(connector: string): string {
  if (!connector || connector.trim() === '' || connector.toLowerCase() === 'unknown') {
    return 'unknown';
  }
  const c = connector.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (c.includes('ccs') || c.includes('combo')) return 'ccs2';
  if (c.includes('type2') || c.includes('iec62196')) return 'type2';
  if (c.includes('gbt')) return 'gbt';
  if (c.includes('chademo')) return 'chademo';
  if (c.includes('15a') || c.includes('16a') || c.includes('socket') || c.includes('3pin') || c.includes('plug')) return '15a';
  return 'unknown';
}

export function checkVehicleChargerCompatibility(
  vehicle: UserVehicle | null,
  charger: Charger
): CompatibilityResult {
  if (!vehicle) {
    return {
      status: 'GREEN',
      label: 'Fully Compatible',
      reason: 'No vehicle selected in Garage. Displaying default charger compatibility.',
    };
  }

  const rawVehicleConnectors = vehicle.connectorTypes || [];
  const normalizedVehicleConnectors = rawVehicleConnectors.map(normalizeConnectorType);
  const chargerConnNorm = normalizeConnectorType(charger.connectorType);

  // Requirement 2: Unknown or missing connectors MUST NOT automatically become compatible
  if (chargerConnNorm === 'unknown') {
    return {
      status: 'RED',
      label: 'Not Compatible',
      reason: 'Station connector type is unverified or unknown.',
    };
  }

  // Strict check: Vehicle normalized connectors MUST explicitly include the charger's normalized connector
  const hasMatchingConnector = normalizedVehicleConnectors.includes(chargerConnNorm);

  // Category restriction: 2-Wheelers cannot plug into high-voltage DC chargers (>25kW) unless explicitly matching
  if (vehicle.category === '2-wheeler' && charger.powerKW > 25 && chargerConnNorm !== '15a' && !hasMatchingConnector) {
    return {
      status: 'RED',
      label: 'Not Compatible',
      reason: `2-Wheeler (${vehicle.model}) cannot plug into High-Voltage DC ${charger.powerKW}kW ${charger.connectorType} chargers.`,
    };
  }

  // Light EVs (E-Cycles) require low power socket
  if (vehicle.category === 'light' && charger.powerKW > 10) {
    return {
      status: 'RED',
      label: 'Not Compatible',
      reason: 'E-Cycle / Light EV requires 15A socket.',
    };
  }

  if (hasMatchingConnector) {
    if (charger.status === 'Available') {
      return {
        status: 'GREEN',
        label: 'Fully Compatible',
        reason: `Matches ${vehicle.model} connector (${charger.connectorType}) and ${charger.powerKW}kW speed.`,
      };
    } else {
      return {
        status: 'YELLOW',
        label: 'Compatible with Limits',
        reason: `Connector matched (${charger.connectorType}), but status is ${charger.status}.`,
      };
    }
  }

  return {
    status: 'RED',
    label: 'Not Compatible',
    reason: `Station connector (${charger.connectorType}) does not match active vehicle connectors (${rawVehicleConnectors.join(', ')}).`,
  };
}

export function checkStationCompatibility(
  vehicle: UserVehicle | null,
  station: ChargingStation
): CompatibilityResult {
  if (!station.chargers || station.chargers.length === 0) {
    return {
      status: 'RED',
      label: 'Not Compatible',
      reason: 'No active chargers installed at this station.',
    };
  }

  const results = station.chargers.map(c => checkVehicleChargerCompatibility(vehicle, c));
  const hasGreen = results.some(r => r.status === 'GREEN');
  const hasYellow = results.some(r => r.status === 'YELLOW');

  if (hasGreen) {
    return {
      status: 'GREEN',
      label: 'Fully Compatible',
      reason: `Station has compatible active chargers for ${vehicle?.model || 'your EV'}.`,
    };
  } else if (hasYellow) {
    return {
      status: 'YELLOW',
      label: 'Compatible with Limits',
      reason: `Station has chargers compatible with adapter / limits.`,
    };
  }

  return {
    status: 'RED',
    label: 'Not Compatible',
    reason: `Station chargers do not match ${vehicle?.model || 'your EV'}.`,
  };
}
