import { calculateBatteryHealthEstimate } from '../../../vehicles/utils/calculationEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export function runVoltHealthTests(): { passed: number; total: number } {
  let passed = 0;
  let total = 0;

  function runTest(name: string, fn: () => void) {
    total++;
    try {
      fn();
      passed++;
      console.log(`[PASS] ${name}`);
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message);
    }
  }

  // Test 1: Modelled SOH Bounds
  runTest('Modelled SOH Calculation Bounds', () => {
    const healthNew = calculateBatteryHealthEstimate(0.5, 50, 'low');
    const healthOld = calculateBatteryHealthEstimate(5.0, 800, 'high');

    assert(healthNew.estimatedHealthSOH >= 95, 'New battery should have >= 95% SOH');
    assert(healthOld.estimatedHealthSOH < 90, 'Older battery with high DC fast charging should reflect degradation');
    assert(healthNew.confidence === 'MEDIUM', 'Engine estimate must carry MEDIUM confidence');
  });

  // Test 2: Usable Capacity Scaling
  runTest('Usable Capacity Scaling by SOH', () => {
    const health = calculateBatteryHealthEstimate(2.0, 300, 'moderate');
    assert(health.usableCapacitykWh > 0, 'Usable capacity must be positive');
    assert(health.usableCapacitykWh <= 40.5, 'Usable capacity cannot exceed pack rating');
  });

  return { passed, total };
}

// Execute tests on import
runVoltHealthTests();
