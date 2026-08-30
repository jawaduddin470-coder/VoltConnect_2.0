import { voltInsightService } from '../../../../services/voltInsightService';
import { UserVehicle } from '../../../../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export async function runVoltInsightTests(): Promise<{ passed: number; total: number }> {
  let passed = 0;
  let total = 0;

  async function runTest(name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`[PASS] ${name}`);
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message);
    }
  }

  const sampleVehicle: UserVehicle = {
    id: 'veh-analytics-01',
    userId: 'u-101',
    category: '4-wheeler',
    manufacturer: 'Tata Motors',
    model: 'Nexon EV',
    batteryCapacitykWh: 45,
    usableCapacitykWh: 43.2,
    estimatedRangeKm: 345,
    currentBatteryPercent: 80,
    estimatedHealthSOH: 98,
    connectorTypes: ['CCS2'],
    acMaxPowerKW: 7.2,
    dcMaxPowerKW: 60,
    isDefault: true,
    dataSource: 'VERIFIED',
    createdAt: new Date().toISOString(),
  };

  // Test 1: Derived EV Profile Metrics
  await runTest('EV Profile Derived Metrics Calculation', async () => {
    voltInsightService.logEvent('u-101', 'veh-analytics-01', 'TRIP_COMPLETED', { distanceKm: 120 });
    voltInsightService.logEvent('u-101', 'veh-analytics-01', 'CHARGING_COMPLETED', { costINR: 450 });

    const res = await voltInsightService.getEVProfileSummary(sampleVehicle);
    assert(res.hasEnoughData === true, 'Vehicle with logged events must return hasEnoughData = true');
    assert(res.summary !== null, 'Summary object must be present');
    assert(res.summary?.totalDistanceKm === 120, 'Total distance must reflect logged trip event');
    assert(res.summary?.totalExpenditureINR === 450, 'Expenditure must reflect logged charging event');
  });

  // Test 2: Recommendations Generation
  await runTest('Contextual Recommendation Engine', async () => {
    const recs = await voltInsightService.getRecommendations(sampleVehicle);
    assert(Array.isArray(recs), 'Recommendations must return an array');
    assert(recs.length > 0, 'Should return contextual optimization recommendations');
  });

  return { passed, total };
}

// Run tests
runVoltInsightTests();
