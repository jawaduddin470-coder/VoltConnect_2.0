/**
 * VOLTCONNECT 2.0 — JOURNEY COST INTELLIGENCE & READINESS ENGINE
 * Computes traceable charging energy costs, highway tolls, cost per km,
 * proportional expense distribution, dynamic cost insights, and petrol ICE comparison.
 */

import { RecommendedChargingStop } from './tripPlanningEngine';
import { UserVehicle } from '@/types';

export interface StopCostDetail {
  stationId: string;
  stationName: string;
  connectorType: string;
  energyAddedKWh: number;
  pricePerKWh: number;
  isVerifiedPrice: boolean;
  costINR: number;
}

export interface JourneyCostBreakdown {
  estimatedChargingCostINR: number;
  estimatedTollCostINR: number;
  totalJourneyCostINR: number;
  costPerKmINR: number;
  chargingCostPercent: number;
  tollCostPercent: number;
  kwhEnergyAddedTotal: number;
  iceEquivalentCostINR: number;
  estimatedSavingsINR: number;
  chargingStopsCount: number;
  tollPlazaCount: number;
  pricedTollsCount: number;
  unpricedTollsCount: number;
  dataConfidence: 'HIGH_CONFIDENCE' | 'PARTIAL_ESTIMATED' | 'ESTIMATED' | 'UNAVAILABLE';
  dataConfidenceMessage: string;
  costInsight: string;
  stopCostDetails: StopCostDetail[];
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
   * Prevents double-counting starting battery energy by charging ONLY for energy purchased at stops.
   */
  public computeJourneyCosts(
    recommendedStops: RecommendedChargingStop[],
    tollCostINR: number,
    totalDistanceKm: number,
    activeVehicle: UserVehicle | null,
    matchedTolls: any[] = []
  ): JourneyCostBreakdown {
    let totalKWhAdded = 0;
    let totalChargingCostINR = 0;
    let hasUnverifiedPricing = false;
    const stopCostDetails: StopCostDetail[] = [];

    // Calculate energy purchased & tariff cost for each planned charging stop
    recommendedStops.forEach((stop, idx) => {
      const kwh = stop.energyAddedkWh || 40;
      totalKWhAdded += kwh;

      // Extract verified pricing from station chargers or use standard public DC fast charger rate (₹18/kWh)
      const primaryCharger = stop.station.chargers[0];
      const isVerified = Boolean(primaryCharger?.hasVerifiedPricing || (primaryCharger?.pricingPerKWh && primaryCharger.pricingPerKWh > 0));
      const pricePerKWh = isVerified && primaryCharger?.pricingPerKWh ? primaryCharger.pricingPerKWh : 18;

      if (!isVerified) hasUnverifiedPricing = true;

      const stopCostINR = Math.round(kwh * pricePerKWh);
      totalChargingCostINR += stopCostINR;

      stopCostDetails.push({
        stationId: stop.station.id,
        stationName: stop.station.name,
        connectorType: stop.connectorType || primaryCharger?.connectorType || 'CCS2',
        energyAddedKWh: kwh,
        pricePerKWh,
        isVerifiedPrice: isVerified,
        costINR: stopCostINR,
      });
    });

    const totalJourneyCostINR = totalChargingCostINR + tollCostINR;

    // Cost Per Km calculation (Total Cost / Route Distance)
    const costPerKmINR = totalDistanceKm > 0 ? Math.round((totalJourneyCostINR / totalDistanceKm) * 100) / 100 : 0;

    // Proportional cost split percentage
    const chargingCostPercent = totalJourneyCostINR > 0 ? Math.round((totalChargingCostINR / totalJourneyCostINR) * 100) : 0;
    const tollCostPercent = totalJourneyCostINR > 0 ? (100 - chargingCostPercent) : 0;

    // Toll breakdown tracking
    const tollPlazaCount = matchedTolls.length;
    let pricedTollsCount = 0;
    let unpricedTollsCount = 0;

    matchedTolls.forEach(t => {
      if (t.plaza?.carTollFeeINR && t.plaza.carTollFeeINR > 0) {
        pricedTollsCount++;
      } else {
        unpricedTollsCount++;
      }
    });

    // Data Confidence Classification
    let dataConfidence: 'HIGH_CONFIDENCE' | 'PARTIAL_ESTIMATED' | 'ESTIMATED' | 'UNAVAILABLE' = 'HIGH_CONFIDENCE';
    let dataConfidenceMessage = 'High Confidence • Verified station tariffs and FASTag toll data';

    if (hasUnverifiedPricing || unpricedTollsCount > 0) {
      dataConfidence = 'PARTIAL_ESTIMATED';
      dataConfidenceMessage = 'Estimated • Based on available station tariffs and FASTag toll rates';
    }

    if (totalJourneyCostINR === 0 && totalDistanceKm > 0) {
      dataConfidence = 'ESTIMATED';
      dataConfidenceMessage = 'Single-charge journey within starting battery range (No public charging required)';
    }

    // Dynamic Cost Insight Generation
    let costInsight = '';
    if (totalJourneyCostINR === 0) {
      costInsight = '💡 Single-charge journey with no tolls required.';
    } else if (chargingCostPercent >= tollCostPercent) {
      costInsight = `💡 Charging accounts for ${chargingCostPercent}% of your estimated journey cost.`;
    } else {
      costInsight = `💡 Tolls account for ${tollCostPercent}% of your estimated journey cost.`;
    }

    // ICE Petrol Equivalent Comparison (Avg 14 km/L @ ₹102/L + Tolls)
    const iceFuelCost = Math.round((totalDistanceKm / 14) * 102);
    const iceEquivalentCostINR = iceFuelCost + tollCostINR;
    const estimatedSavingsINR = Math.max(0, iceEquivalentCostINR - totalJourneyCostINR);

    return {
      estimatedChargingCostINR: totalChargingCostINR,
      estimatedTollCostINR: tollCostINR,
      totalJourneyCostINR,
      costPerKmINR,
      chargingCostPercent,
      tollCostPercent,
      kwhEnergyAddedTotal: Math.round(totalKWhAdded),
      iceEquivalentCostINR,
      estimatedSavingsINR,
      chargingStopsCount: recommendedStops.length,
      tollPlazaCount,
      pricedTollsCount,
      unpricedTollsCount,
      dataConfidence,
      dataConfidenceMessage,
      costInsight,
      stopCostDetails,
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
      factors.push({ label: 'Sparse Charger Corridor', passed: false, detail: 'Corridor charging density is low. Drive conservatively.' });
    }

    const finalScore = Math.max(0, Math.min(100, score));
    const status = finalScore >= 85 ? 'OPTIMAL' : finalScore >= 65 ? 'READY' : 'WARNING';
    const headline = status === 'OPTIMAL' ? 'Journey Optimal & Fully Prepared' : status === 'READY' ? 'Journey Ready with Cautions' : 'Low Readiness Score';
    const subhead = `Readiness Score ${finalScore}/100 based on starting SOC (${startingSOCPercent}%), ${safetyReservePercent}% reserve, and charger density.`;

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
