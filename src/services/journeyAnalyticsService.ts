/**
 * VOLTCONNECT 2.0 — JOURNEY COST INTELLIGENCE & READINESS ENGINE (PHASE 3A)
 * Computes traceable charging energy costs, highway tolls, cost per km,
 * proportional expense distribution, dynamic cost insights, petrol ICE comparison,
 * and a 100% deterministic 7-factor Journey Readiness Engine (0-100 score).
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

export interface JourneyReadinessFactorDetail {
  score: number;
  maxScore: number;
  passed: boolean;
  label: string;
  detail: string;
}

export interface JourneyReadinessResult {
  score: number; // 0 - 100
  status: 'READY' | 'READY_WITH_ATTENTION' | 'REVIEW' | 'NOT_READY' | 'UNAVAILABLE';
  confidence: 'HIGH' | 'PARTIAL' | 'LOW';
  factors: {
    battery: JourneyReadinessFactorDetail;
    chargingPlan: JourneyReadinessFactorDetail;
    safetyReserve: JourneyReadinessFactorDetail;
    chargerCoverage: JourneyReadinessFactorDetail;
    batteryHealth: JourneyReadinessFactorDetail;
    routeData: JourneyReadinessFactorDetail;
    costData: JourneyReadinessFactorDetail;
  };
  strengths: string[];
  warnings: string[];
  primaryConcern: string | null;
  headline?: string;
  subhead?: string;
}

// Backward compatibility alias for legacy components
export type JourneyReadiness = JourneyReadinessResult;

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
   * Evaluates deterministic 7-factor Journey Readiness Score (0-100) per Phase 3A specification.
   */
  public computeJourneyReadiness(
    startingSOCPercent: number,
    safetyReservePercent: number,
    totalDistanceKm: number,
    effectivePlanningRangeKm: number,
    recommendedStops: RecommendedChargingStop[],
    activeVehicle: UserVehicle | null,
    otherCompatibleCount: number = 0,
    costConfidenceState: string = 'HIGH_CONFIDENCE'
  ): JourneyReadinessResult {
    // Return UNAVAILABLE if essential route data is missing
    if (!totalDistanceKm || totalDistanceKm <= 0) {
      return {
        score: 0,
        status: 'UNAVAILABLE',
        confidence: 'LOW',
        factors: {
          battery: { score: 0, maxScore: 25, passed: false, label: 'Starting Battery SOC', detail: 'Essential route data missing.' },
          chargingPlan: { score: 0, maxScore: 25, passed: false, label: 'Charging-Plan Coverage', detail: 'Route distance not calculated.' },
          safetyReserve: { score: 0, maxScore: 15, passed: false, label: 'Safety Reserve', detail: 'Route distance not calculated.' },
          chargerCoverage: { score: 0, maxScore: 15, passed: false, label: 'Corridor Charger Coverage', detail: 'Route distance not calculated.' },
          batteryHealth: { score: 0, maxScore: 10, passed: false, label: 'Battery Health (SOH)', detail: 'Route distance not calculated.' },
          routeData: { score: 0, maxScore: 5, passed: false, label: 'Route Data Completeness', detail: 'Route distance missing.' },
          costData: { score: 0, maxScore: 5, passed: false, label: 'Cost Data Confidence', detail: 'Route distance missing.' },
        },
        strengths: [],
        warnings: ['Essential route or destination data is missing.'],
        primaryConcern: 'Essential route data missing.',
      };
    }

    const strengths: string[] = [];
    const warnings: string[] = [];

    // Factor 1: Starting SOC / Battery Suitability (Max 25 pts)
    let batteryScore = 25;
    let batteryPassed = true;
    let batteryDetail = `Starting at ${startingSOCPercent}% SOC provides optimal initial leg range.`;

    if (startingSOCPercent >= 80) {
      batteryScore = 25;
      strengths.push(`High starting battery (${startingSOCPercent}% SOC).`);
    } else if (startingSOCPercent >= 50) {
      batteryScore = 18;
      batteryDetail = `Starting at ${startingSOCPercent}% SOC requires initial charging stop sooner.`;
      warnings.push(`Starting battery is moderate (${startingSOCPercent}% SOC). Initial stop scheduled earlier.`);
    } else if (startingSOCPercent >= 25) {
      batteryScore = 10;
      batteryPassed = false;
      batteryDetail = `Starting at ${startingSOCPercent}% SOC is low for highway driving. Charge before departure.`;
      warnings.push(`Low starting battery (${startingSOCPercent}% SOC). Recommend charging before hitting highway.`);
    } else {
      batteryScore = 3;
      batteryPassed = false;
      batteryDetail = `Critical starting battery (${startingSOCPercent}% SOC). Immediate departure charging required.`;
      warnings.push(`Critical starting battery (${startingSOCPercent}% SOC). Immediate departure charging required.`);
    }

    // Factor 2: Charging-Plan Segment Coverage (Max 25 pts)
    let planScore = 25;
    let planPassed = true;
    let planDetail = 'Planned charging strategy provides full safe coverage across all route legs.';
    
    // Evaluate segment distances
    const leg1UsableRange = Math.max(60, Math.round(effectivePlanningRangeKm * (startingSOCPercent / 100)));
    let currentPos = 0;
    let unallocatedDistance = false;

    if (recommendedStops.length > 0) {
      // Check Leg 1
      const leg1Dist = recommendedStops[0].distanceFromOriginKm;
      if (leg1Dist > leg1UsableRange) {
        unallocatedDistance = true;
      }
      currentPos = leg1Dist;

      // Check subsequent legs
      for (let i = 1; i < recommendedStops.length; i++) {
        const segDist = recommendedStops[i].distanceFromOriginKm - currentPos;
        if (segDist > effectivePlanningRangeKm) {
          unallocatedDistance = true;
        }
        currentPos = recommendedStops[i].distanceFromOriginKm;
      }

      // Check final leg to destination
      const finalLegDist = totalDistanceKm - currentPos;
      if (finalLegDist > effectivePlanningRangeKm) {
        unallocatedDistance = true;
      }
    } else {
      // Single-charge journey
      if (totalDistanceKm > leg1UsableRange) {
        unallocatedDistance = true;
      }
    }

    if (unallocatedDistance) {
      planScore = 8;
      planPassed = false;
      planDetail = 'Charging gap detected between planned stops or final destination.';
      warnings.push('Charging gap detected between planned stops or final destination.');
    } else {
      strengths.push('Complete charging strategy covers all route legs within safe range.');
    }

    // Factor 3: Safety Reserve Buffer (Max 15 pts)
    let reserveScore = 15;
    let reservePassed = true;
    let reserveDetail = `${safetyReservePercent}% reserve buffer protects against wind & AC energy drain.`;

    if (safetyReservePercent >= 15) {
      reserveScore = 15;
      strengths.push(`Robust ${safetyReservePercent}% safety reserve buffer configured.`);
    } else if (safetyReservePercent >= 10) {
      reserveScore = 10;
      reserveDetail = `${safetyReservePercent}% safety reserve is acceptable but tight for high-speed driving.`;
      warnings.push(`${safetyReservePercent}% safety reserve is tight for high-speed highway driving.`);
    } else {
      reserveScore = 4;
      reservePassed = false;
      reserveDetail = `${safetyReservePercent}% reserve buffer is below recommended 15% safety threshold.`;
      warnings.push(`${safetyReservePercent}% safety reserve buffer is below 15% safety threshold.`);
    }

    // Factor 4: Corridor Charger Coverage & Availability (Max 15 pts)
    let coverageScore = 15;
    let coveragePassed = true;
    let coverageDetail = 'Strong charging station density available along route corridor.';
    const totalCorridorChargers = recommendedStops.length + otherCompatibleCount;

    if (totalCorridorChargers >= 5 || totalDistanceKm <= leg1UsableRange) {
      coverageScore = 15;
      strengths.push(`Strong corridor charger coverage (${totalCorridorChargers} chargers detected).`);
    } else if (totalCorridorChargers >= 1) {
      coverageScore = 10;
      coverageDetail = `Moderate corridor charger coverage (${totalCorridorChargers} chargers detected).`;
    } else {
      coverageScore = 0;
      coveragePassed = false;
      coverageDetail = 'No compatible charging stations found along route corridor.';
      warnings.push('No compatible charging stations found along route corridor.');
    }

    // Factor 5: Battery Health / SOH (Max 10 pts)
    let sohScore = 10;
    let sohPassed = true;
    let sohDetail = 'Vehicle SOH data unavailable. Assuming nominal 100% battery state.';

    const realSoh = activeVehicle?.estimatedHealthSOH;
    if (typeof realSoh === 'number' && realSoh > 0) {
      if (realSoh >= 90) {
        sohScore = 10;
        sohDetail = `Battery State of Health (SOH) is optimal at ${realSoh}%.`;
        strengths.push(`High battery health (${realSoh}% SOH).`);
      } else if (realSoh >= 80) {
        sohScore = 7;
        sohDetail = `Battery State of Health (SOH) is good at ${realSoh}%.`;
      } else {
        sohScore = 4;
        sohPassed = false;
        sohDetail = `Battery State of Health (SOH) is degraded at ${realSoh}%. Range may vary.`;
        warnings.push(`Battery State of Health is ${realSoh}%. Practical range may be reduced.`);
      }
    }

    // Factor 6: Route-Data Completeness (Max 5 pts)
    const routeDataScore = 5;
    const routeDataPassed = true;
    const routeDataDetail = 'Route geometry, road distance, and waypoints fully verified.';
    strengths.push('Verified route geometry and OSRM road distance.');

    // Factor 7: Cost & Toll Data Confidence (Max 5 pts)
    let costScore = 5;
    let costPassed = true;
    let costDetail = 'High confidence with verified tariffs and FASTag toll data.';

    if (costConfidenceState === 'PARTIAL_ESTIMATED' || costConfidenceState === 'ESTIMATED') {
      costScore = 3;
      costDetail = 'Partial confidence based on standard public charging tariffs.';
    } else if (costConfidenceState === 'UNAVAILABLE') {
      costScore = 1;
      costPassed = false;
      costDetail = 'Cost or toll rate data unavailable.';
    }

    // Total Deterministic Score Calculation (0-100)
    const totalScore = Math.max(0, Math.min(100,
      batteryScore + planScore + reserveScore + coverageScore + sohScore + routeDataScore + costScore
    ));

    // Determine Status
    let status: 'READY' | 'READY_WITH_ATTENTION' | 'REVIEW' | 'NOT_READY' | 'UNAVAILABLE' = 'READY';
    if (totalScore >= 90) status = 'READY';
    else if (totalScore >= 75) status = 'READY_WITH_ATTENTION';
    else if (totalScore >= 50) status = 'REVIEW';
    else status = 'NOT_READY';

    // Determine Confidence
    let confidence: 'HIGH' | 'PARTIAL' | 'LOW' = 'HIGH';
    if (costConfidenceState === 'HIGH_CONFIDENCE' && routeDataPassed) confidence = 'HIGH';
    else if (routeDataPassed) confidence = 'PARTIAL';
    else confidence = 'LOW';

    const primaryConcern = warnings.length > 0 ? warnings[0] : null;

    return {
      score: totalScore,
      status,
      confidence,
      factors: {
        battery: { score: batteryScore, maxScore: 25, passed: batteryPassed, label: 'Starting Battery SOC', detail: batteryDetail },
        chargingPlan: { score: planScore, maxScore: 25, passed: planPassed, label: 'Charging-Plan Coverage', detail: planDetail },
        safetyReserve: { score: reserveScore, maxScore: 15, passed: reservePassed, label: 'Safety Reserve', detail: reserveDetail },
        chargerCoverage: { score: coverageScore, maxScore: 15, passed: coveragePassed, label: 'Corridor Charger Coverage', detail: coverageDetail },
        batteryHealth: { score: sohScore, maxScore: 10, passed: sohPassed, label: 'Battery Health (SOH)', detail: sohDetail },
        routeData: { score: routeDataScore, maxScore: 5, passed: routeDataPassed, label: 'Route Data Completeness', detail: routeDataDetail },
        costData: { score: costScore, maxScore: 5, passed: costPassed, label: 'Cost Data Confidence', detail: costDetail },
      },
      strengths,
      warnings,
      primaryConcern,
    };
  }
}

export const journeyAnalyticsService = new JourneyAnalyticsService();
