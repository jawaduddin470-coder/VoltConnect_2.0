import {
  validateSOC,
  calculateAvailableEnergy,
  calculateEstimatedRange,
  calculateEnergyRequired,
  calculateChargingRequirement,
  calculateBatteryHealthEstimate,
  checkChargerCompatibility,
} from '../calculationEngine';
import { UserVehicle, Charger } from '../../../../types';

// Simple lightweight assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export function runCalculationEngineTests(): { passed: number; total: number } {
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

  // Test 1: SOC Validation Boundaries
  runTest('SOC validation boundaries', () => {
    assert(validateSOC(-10) === 0, 'Negative SOC should clamp to 0');
    assert(validateSOC(150) === 100, 'SOC > 100 should clamp to 100');
    assert(validateSOC(75) === 75, 'Valid SOC 75 should return 75');
  });

  // Test 2: Available Energy Calculation
  runTest('Available Energy Calculation', () => {
    const energy = calculateAvailableEnergy(45.0, 43.2, 80, 98);
    assert(energy > 0, 'Available energy must be positive');
    assert(energy <= 43.2, 'Available energy cannot exceed usable capacity');
  });

  // Test 3: Estimated Range by EV Category
  runTest('Estimated Range by EV Category', () => {
    const carRange = calculateEstimatedRange('4-wheeler', 30, 130);
    const bikeRange = calculateEstimatedRange('2-wheeler', 3.5, 32);
    assert(carRange.estimatedRangeKm > 100, 'Car range should exceed 100 km');
    assert(bikeRange.estimatedRangeKm > 50, '2W range should exceed 50 km');
  });

  // Test 4: Energy Required & Charging Time
  runTest('Charging Time & Cost Engine', () => {
    const req = calculateEnergyRequired(45.0, 80, 20); // 60% delta = 27 kWh
    assert(req === 27.0, `Expected 27.0 kWh required, got ${req}`);

    const res = calculateChargingRequirement(27.0, 50.0, 18.0);
    assert(res.estimatedTimeMins > 0, 'Charging time should be positive');
    assert(res.estimatedCostINR === 486, `Expected 486 INR cost, got ${res.estimatedCostINR}`);
  });

  // Test 5: Charger Compatibility
  runTest('Charger Compatibility Matching', () => {
    const vehicle: UserVehicle = {
      id: 'v1',
      userId: 'u1',
      category: '4-wheeler',
      manufacturer: 'Tata',
      model: 'Nexon',
      batteryCapacitykWh: 45,
      usableCapacitykWh: 43.2,
      estimatedRangeKm: 345,
      currentBatteryPercent: 80,
      estimatedHealthSOH: 98,
      connectorTypes: ['CCS2', 'Type2'],
      acMaxPowerKW: 7.2,
      dcMaxPowerKW: 60,
      isDefault: true,
      dataSource: 'VERIFIED',
      createdAt: new Date().toISOString(),
    };

    const ccsCharger: Charger = {
      id: 'c1',
      stationId: 's1',
      connectorType: 'CCS2',
      powerKW: 50,
      pricingPerKWh: 18,
      status: 'Available',
      lastUpdated: '10 mins ago',
    };

    const atherCharger: Charger = {
      id: 'c2',
      stationId: 's1',
      connectorType: 'Ather Fast',
      powerKW: 3.3,
      pricingPerKWh: 15,
      status: 'Available',
      lastUpdated: '10 mins ago',
    };

    assert(checkChargerCompatibility(vehicle, ccsCharger).isCompatible === true, 'CCS2 charger must be compatible with Nexon EV');
    assert(checkChargerCompatibility(vehicle, atherCharger).isCompatible === false, 'Ather Fast charger must not be compatible with Nexon EV');
  });

  return { passed, total };
}

// Execute tests on script import
runCalculationEngineTests();
