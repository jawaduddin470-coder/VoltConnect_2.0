import { Charger, EVCategory, UserVehicle } from '@/types';

export interface RangeEstimateResult {
  estimatedRangeKm: number;
  availableEnergykWh: number;
  efficiencyWhPerKm: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}

export interface ChargingRequirementResult {
  energyRequiredkWh: number;
  estimatedTimeMins: number;
  estimatedCostINR: number;
}

export interface BatteryHealthResult {
  estimatedHealthSOH: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  usableCapacitykWh: number;
  explanation: string;
}

/**
 * Validates State of Charge (SOC) to remain strictly between 0 and 100%.
 */
export function validateSOC(soc: number): number {
  if (isNaN(soc)) return 50;
  return Math.min(100, Math.max(0, soc));
}

/**
 * Calculates net available usable battery energy (kWh) factoring in current SOC and SOH health.
 */
export function calculateAvailableEnergy(
  batteryCapacitykWh: number,
  usableCapacitykWh: number,
  currentSOC: number,
  estimatedHealthSOH: number = 98
): number {
  const safeCapacity = usableCapacitykWh > 0 ? usableCapacitykWh : batteryCapacitykWh * 0.95;
  const safeSOC = validateSOC(currentSOC);
  const healthFactor = Math.min(100, Math.max(50, estimatedHealthSOH)) / 100;
  
  return Number(((safeCapacity * (safeSOC / 100)) * healthFactor).toFixed(2));
}

/**
 * Calculates estimated practical range (km) based on EV form factor, energy available, and environmental factors.
 */
export function calculateEstimatedRange(
  category: EVCategory,
  availableEnergykWh: number,
  baseEfficiencyWhPerKm: number = 135,
  temperatureC: number = 30,
  climateLoadPercent: number = 8
): RangeEstimateResult {
  // Efficiency adjustments per category
  let defaultWhPerKm = baseEfficiencyWhPerKm;
  if (category === '2-wheeler' || category === 'light') defaultWhPerKm = 35;
  else if (category === '3-wheeler') defaultWhPerKm = 55;
  else if (category === 'commercial') defaultWhPerKm = 180;
  else if (category === 'heavy') defaultWhPerKm = 850;

  // Temperature & Climate Load multiplier
  let tempMultiplier = 1.0;
  if (temperatureC > 38 || temperatureC < 10) tempMultiplier = 1.12;

  const climateMultiplier = 1 + climateLoadPercent / 100;
  const effectiveWhPerKm = defaultWhPerKm * tempMultiplier * climateMultiplier;

  const estimatedRangeKm = Math.round((availableEnergykWh * 1000) / effectiveWhPerKm);

  return {
    estimatedRangeKm,
    availableEnergykWh,
    efficiencyWhPerKm: Math.round(effectiveWhPerKm),
    confidence: 'MEDIUM',
    explanation: 'Estimated practical range calculated from net available battery energy, vehicle efficiency profile, and 8% climate safety margin.',
  };
}

/**
 * Calculates energy required (kWh) to charge from current SOC to target SOC.
 */
export function calculateEnergyRequired(
  batteryCapacitykWh: number,
  targetSOC: number,
  currentSOC: number
): number {
  const safeTarget = validateSOC(targetSOC);
  const safeCurrent = validateSOC(currentSOC);
  
  if (safeTarget <= safeCurrent) return 0;

  const deltaSOC = (safeTarget - safeCurrent) / 100;
  return Number((batteryCapacitykWh * deltaSOC).toFixed(2));
}

/**
 * Calculates estimated charging time (minutes) and cost (INR).
 */
export function calculateChargingRequirement(
  energyRequiredkWh: number,
  chargerPowerKW: number,
  pricingPerKWh: number,
  efficiencyPercent: number = 90
): ChargingRequirementResult {
  if (energyRequiredkWh <= 0 || chargerPowerKW <= 0) {
    return { energyRequiredkWh: 0, estimatedTimeMins: 0, estimatedCostINR: 0 };
  }

  const effectivePowerKW = chargerPowerKW * (efficiencyPercent / 100);
  const hours = energyRequiredkWh / effectivePowerKW;
  const estimatedTimeMins = Math.round(hours * 60) + 5; // 5m session start buffer
  const estimatedCostINR = Math.round(energyRequiredkWh * pricingPerKWh);

  return {
    energyRequiredkWh,
    estimatedTimeMins,
    estimatedCostINR,
  };
}

/**
 * Models estimated battery State of Health (SOH %) based on age, cycles, and fast-charging frequency.
 */
export function calculateBatteryHealthEstimate(
  vehicleAgeYears: number = 1.5,
  approxChargeCycles: number = 240,
  fastChargingFrequency: 'low' | 'moderate' | 'high' = 'moderate'
): BatteryHealthResult {
  const ageDegradation = Math.min(15, vehicleAgeYears * 1.8);
  const cycleDegradation = Math.min(15, (approxChargeCycles / 1000) * 8);
  
  let fastChargePenalty = 1.5;
  if (fastChargingFrequency === 'high') fastChargePenalty = 3.5;
  else if (fastChargingFrequency === 'low') fastChargePenalty = 0.5;

  const totalDegradation = ageDegradation + cycleDegradation + fastChargePenalty;
  const estimatedHealthSOH = Math.max(70, Math.min(100, Math.round(100 - totalDegradation)));

  return {
    estimatedHealthSOH,
    confidence: 'MEDIUM',
    usableCapacitykWh: Number((40.5 * (estimatedHealthSOH / 100)).toFixed(1)),
    explanation: 'Estimated SOH modeled from battery age, charge cycle count, and fast-charging frequency. Not direct OBD telemetry.',
  };
}

/**
 * Checks detailed charger compatibility with user vehicle.
 */
export function checkChargerCompatibility(
  vehicle: UserVehicle | null,
  charger: Charger
): { isCompatible: boolean; reason: string } {
  if (!vehicle) return { isCompatible: true, reason: 'No active EV selected' };

  const matchesConnector = vehicle.connectorTypes.includes(charger.connectorType);
  if (!matchesConnector) {
    return {
      isCompatible: false,
      reason: `Vehicle requires ${vehicle.connectorTypes.join('/')}, charger provides ${charger.connectorType}`,
    };
  }

  if (charger.status !== 'Available') {
    return {
      isCompatible: false,
      reason: `Charger connector is currently ${charger.status}`,
    };
  }

  return {
    isCompatible: true,
    reason: `Compatible ${charger.connectorType} port delivering up to ${charger.powerKW} kW`,
  };
}
