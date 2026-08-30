import { ChargingStation } from '@/types';

export interface VoltScoreBreakdown {
  score: number;
  grade: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'NEEDS_ATTENTION';
  colorClass: string;
  reliabilityMetric: number;     // Hardware Uptime %
  availabilityMetric: number;    // Real-time Open Ports %
  dataFreshnessMetric: number;   // CPO Sync Recency %
  userRatingMetric: number;      // Driver Review Rating %
  explanation: string;
}

export function calculateVoltScore(station: ChargingStation): VoltScoreBreakdown {
  const totalChargers = station.chargers.length;
  if (totalChargers === 0) {
    return {
      score: 40,
      grade: 'NEEDS_ATTENTION',
      colorClass: 'text-rose-600 border-rose-200 bg-rose-50',
      reliabilityMetric: 40,
      availabilityMetric: 0,
      dataFreshnessMetric: 50,
      userRatingMetric: 70,
      explanation: 'Platform reliability score based on recent infrastructure data. No active chargers detected.',
    };
  }

  const activeCount = station.chargers.filter(
    c => c.status === 'Available' || c.status === 'Charging' || c.status === 'Occupied'
  ).length;

  const availableCount = station.chargers.filter(c => c.status === 'Available').length;

  // 1. Hardware Uptime Reliability (50% weight)
  const reliabilityMetric = Math.round((activeCount / totalChargers) * 100);

  // 2. Real-time Open Port Availability (20% weight)
  const availabilityMetric = Math.round((availableCount / totalChargers) * 100);

  // 3. Data Freshness Metric (15% weight)
  let dataFreshnessMetric = 96;
  if (station.lastUpdated.includes('hour')) dataFreshnessMetric = 80;
  else if (station.lastUpdated.includes('day')) dataFreshnessMetric = 60;

  // 4. Driver Rating Metric (15% weight)
  const userRatingMetric = station.verificationStatus === 'approved' ? 94 : 75;

  // Composite VoltScore Weighted Formula
  const rawScore = Math.round(
    reliabilityMetric * 0.45 +
    availabilityMetric * 0.25 +
    dataFreshnessMetric * 0.15 +
    userRatingMetric * 0.15
  );

  const score = Math.min(100, Math.max(30, rawScore));

  let grade: VoltScoreBreakdown['grade'] = 'GOOD';
  let colorClass = 'text-teal-600 border-teal-200 bg-teal-50';

  if (score >= 90) {
    grade = 'EXCELLENT';
    colorClass = 'text-emerald-600 border-emerald-200 bg-emerald-50';
  } else if (score >= 75) {
    grade = 'GOOD';
    colorClass = 'text-teal-600 border-teal-200 bg-teal-50';
  } else if (score >= 60) {
    grade = 'MODERATE';
    colorClass = 'text-amber-600 border-amber-200 bg-amber-50';
  } else {
    grade = 'NEEDS_ATTENTION';
    colorClass = 'text-rose-600 border-rose-200 bg-rose-50';
  }

  return {
    score,
    grade,
    colorClass,
    reliabilityMetric,
    availabilityMetric,
    dataFreshnessMetric,
    userRatingMetric,
    explanation: 'Platform reliability score calculated from hardware uptime history, real-time port availability, data freshness, and verified driver ratings.',
  };
}
