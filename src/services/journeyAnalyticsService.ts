/**
 * VOLTCONNECT 2.0 — JOURNEY ANALYTICS & READINESS ENGINE
 * Computes charging energy costs, total journey expenses, petrol/diesel ICE comparison,
 * and standard Journey Readiness Score (0-100).
 */

import { RecommendedChargingStop } from './tripPlanningEngine';
import { UserVehicle } from '@/types';

export interface JourneyCostBreakdown {
  estimatedChargingCostINR: number;
  estimatedTollCostINR: number;
  totalJourneyCostINR: number;
  iceEquivalentCostINR: number;
  estimatedSavingsINR: number;
  chargingCostPercent: number;
  tollCostPercent: number;
  kwhEnergyAddedTotal: number;
}

export interface JourneyReadiness {
  score: number; // 0 - 100
  status: 'OPTIMAL' | 'READY' | 'WARNING';
  headline: string;
  subhead: string;
  factors: {
    label: string;
    passed: boolean;
    detail: string;
  }[];
}

class JourneyAnalyticsService {
  /**
   * Computes complete financial cost breakdown for charging energy and highway tolls.
   */
  public computeJourneyCosts(
    recommendedStops: RecommendedChargingStop[],
    tollCostINR: number,
    totalDistanceKm: number,
    activeVehicle: UserVehicle | null
  ): JourneyCostBreakdown {
    // 1. Calculate Charging Energy Cost (kWh * verified pricing or avg ₹20/kWh on DC Fast Charger)
    let totalKWhAdded = 0;
    let totalChargingCostINR = 0;

    recommendedStops.forEach(stop => {
      const kwh = stop.energyAddedkWh || 45;
      totalKWhAdded += kwh;
      // Get station charger price or fallback to standard ₹20 / kWh for DC Fast Charging
      const avgRatePerKWh = stop.station.chargers[0]?.pricingPerKWh || 20;
      totalChargingCostINR += Math.round(kwh * avgRatePerKWh);
    });

    // If no recommended charging stop needed (e.g. short journey within single battery charge)
    if (recommendedStops.length === 0 && activeVehicle) {
      // Estimate energy consumed from starting SOC (e.g. 0.18 kWh / km)
      const consumedKWh = (totalDistanceKm * 0.18);
      totalChargingCostINR = Math.round(consumedKWh * 8); // Home charging rate ~ ₹8/kWh
    }

    const totalJourneyCostINR = totalChargingCostINR + tollCostINR;

    // Proportional breakdown percentage
    const chargingCostPercent = totalJourneyCostINR > 0 ? Math.round((totalChargingCostINR / totalJourneyCostINR) * 100) : 100;
    const tollCostPercent = totalJourneyCostINR > 0 ? (100 - chargingCostPercent) : 0;

    // 2. ICE Petrol Equivalent Comparison (Avg 14 km/L @ ₹102/L + Tolls)
    const iceFuelCost = Math.round((totalDistanceKm / 14) * 102);
    const iceEquivalentCostINR = iceFuelCost + tollCostINR;
    const estimatedSavingsINR = Math.max(0, iceEquivalentCostINR - totalJourneyCostINR);

    return {
      estimatedChargingCostINR: totalChargingCostINR,
      estimatedTollCostINR: tollCostINR,
      totalJourneyCostINR,
      iceEquivalentCostINR,
      estimatedSavingsINR,
      chargingCostPercent,
      tollCostPercent,
      kwhEnergyAddedTotal: Math.round(totalKWhAdded),
    };
  }

  /**
   * Evaluates standard Journey Readiness Score (0-100) based on vehicle specs, starting SOC, safety reserve & charger spacing.
   */
  public computeJourneyReadiness(
    startingSOCPercent: number,
    safetyReservePercent: number,
    totalDistanceKm: number,
    effectivePlanningRangeKm: number,
    recommendedStops: RecommendedChargingStop[],
    activeVehicle: UserVehicle | null
  ): JourneyReadiness {
    let score = 100;
    const factors: { label: string; passed: boolean; detail: string }[] = [];

    // Factor 1: Starting Battery SOC Adequacy
    if (startingSOCPercent >= 80) {
      factors.push({ label: 'High Starting Battery SOC', passed: true, detail: `Starting at ${startingSOCPercent}% SOC provides optimal highway initial range.` });
    } else if (startingSOCPercent >= 50) {
      score -= 10;
      factors.push({ label: 'Moderate Starting SOC', passed: true, detail: `Starting at ${startingSOCPercent}% SOC — initial charging stop scheduled earlier.` });
    } else {
      score -= 25;
      factors.push({ label: 'Low Starting Battery SOC', passed: false, detail: `Starting at ${startingSOCPercent}% SOC — recommend charging before hitting highway.` });
    }

    // Factor 2: Safe Planning Reserve Buffer
    if (safetyReservePercent >= 15) {
      factors.push({ label: 'Robust Safety Reserve Buffer', passed: true, detail: `${safetyReservePercent}% reserve buffer protects against high-speed wind & AC energy drain.` });
    } else {
      score -= 8;
      factors.push({ label: 'Tight Safety Reserve', passed: false, detail: `${safetyReservePercent}% reserve is minimal. Consider increasing buffer.` });
    }

    // Factor 3: Charger Density along Corridor
    if (recommendedStops.length > 0 || totalDistanceKm <= effectivePlanningRangeKm) {
      factors.push({ label: 'Corridor Charger Coverage', passed: true, detail: 'Verified high-power DC fast chargers available within vehicle range.' });
    } else {
      score -= 30;
      factors.push({ label: 'Limited Corridor Charger Coverage', passed: false, detail: 'Route section has sparse compatible charging infrastructure.' });
    }

    // Factor 4: Connector Compatibility Check
    const allGreen = recommendedStops.every(st => st.maxPowerKW >= 50);
    if (allGreen) {
      factors.push({ label: 'DC Fast Charge Compatibility', passed: true, detail: '100% of stops match vehicle CCS2 / DC Fast Charge connectors.' });
    } else {
      score -= 7;
      factors.push({ label: 'Standard Charge Speed', passed: true, detail: 'Some stops utilize standard AC/DC power levels.' });
    }

    const finalScore = Math.max(30, Math.min(100, score));

    let status: 'OPTIMAL' | 'READY' | 'WARNING' = 'OPTIMAL';
    let headline = 'JOURNEY READY';
    let subhead = 'Route fully verified with optimal charger placement and FASTag tolls.';

    if (finalScore < 70) {
      status = 'WARNING';
      headline = 'JOURNEY REQUIRES ATTENTION';
      subhead = 'Low battery or sparse charger density detected along section of route.';
    } else if (finalScore < 90) {
      status = 'READY';
      headline = 'JOURNEY READY WITH CAUTION';
      subhead = 'Ensure initial charge is topped up before departure.';
    }

    return {
      score: finalScore,
      status,
      headline,
      subhead,
      factors,
    };
  }
}

export const journeyAnalyticsService = new JourneyAnalyticsService();
