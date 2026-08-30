import { rankStationsForVehicle } from '../stationRanking';
import { evaluateStationReachability } from '../rangeReachability';
import { ChargingStation, UserVehicle } from '../../../../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export function runStationRankingTests(): { passed: number; total: number } {
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

  const sampleVehicle: UserVehicle = {
    id: 'v1',
    userId: 'u1',
    category: '4-wheeler',
    manufacturer: 'Tata',
    model: 'Nexon EV Long Range',
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

  const sampleStations: ChargingStation[] = [
    {
      id: 'st-1',
      name: 'VoltCharge Hub Gachibowli',
      description: 'DC Fast Hub',
      address: 'Gachibowli',
      city: 'Hyderabad',
      latitude: 17.44,
      longitude: 78.38,
      operatingHours: '24/7 Open',
      amenities: ['Café'],
      voltScore: 96,
      status: 'active',
      verificationStatus: 'approved',
      dataSource: 'simulated',
      lastUpdated: '2 mins ago',
      chargers: [
        {
          id: 'c1',
          stationId: 'st-1',
          connectorType: 'CCS2',
          powerKW: 60,
          pricingPerKWh: 18,
          status: 'Available',
          lastUpdated: '2 mins ago',
        },
      ],
    },
    {
      id: 'st-2',
      name: 'Ather Grid Scooter Hub',
      description: '2W Fast Charger',
      address: 'Madhapur',
      city: 'Hyderabad',
      latitude: 17.45,
      longitude: 78.39,
      operatingHours: '24/7 Open',
      amenities: [],
      voltScore: 90,
      status: 'active',
      verificationStatus: 'approved',
      dataSource: 'simulated',
      lastUpdated: '10 mins ago',
      chargers: [
        {
          id: 'c2',
          stationId: 'st-2',
          connectorType: 'Ather Fast',
          powerKW: 3.3,
          pricingPerKWh: 15,
          status: 'Available',
          lastUpdated: '10 mins ago',
        },
      ],
    },
  ];

  // Test 1: Reachability Evaluation
  runTest('Reachability Evaluation for Nearby Station', () => {
    const res = evaluateStationReachability(sampleVehicle, sampleStations[0], 17.435, 78.385);
    assert(res.status === 'WITHIN_RANGE', 'Station 5km away must be WITHIN_RANGE');
    assert(res.estimatedArrivalSOC > 70, 'Arrival SOC should be > 70%');
  });

  // Test 2: Smart Station Ranking & Best Match
  runTest('Smart Station Ranking Best Match', () => {
    const ranked = rankStationsForVehicle(sampleStations, sampleVehicle, 17.435, 78.385);
    assert(ranked.length === 2, 'Should rank 2 stations');
    assert(ranked[0].station.id === 'st-1', 'CCS2 compatible station must rank #1 for Nexon EV');
    assert(ranked[0].isBestMatch === true, 'Top compatible station must be marked BEST MATCH');
  });

  return { passed, total };
}

// Auto-run on import
runStationRankingTests();
