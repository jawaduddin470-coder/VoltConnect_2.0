import { routingService } from '../src/services/routingService';
import { tripPlanningEngine } from '../src/services/tripPlanningEngine';
import { chargingDataService } from '../src/services/chargingDataService';
import { UserVehicle } from '../src/types';

async function runPipelineTest() {
  console.log('--- STARTING PROMPT 2 ACCEPTANCE PIPELINE TEST ---');
  
  const waypoints = [
    { name: 'Hyderabad (Gachibowli)', latitude: 17.435, longitude: 78.385 },
    { name: 'Srinagar (Kashmir)', latitude: 34.0837, longitude: 74.7973 },
  ];

  const bmwIX: UserVehicle = {
    id: 'veh-bmw-ix-test',
    userId: 'test-user',
    category: '4-wheeler',
    manufacturer: 'BMW',
    model: 'iX xDrive50',
    variant: 'xDrive50',
    batteryCapacitykWh: 111.5,
    usableCapacitykWh: 105.2,
    estimatedRangeKm: 525,
    currentBatteryPercent: 85,
    estimatedHealthSOH: 98,
    connectorTypes: ['CCS2', 'Type2'],
    acMaxPowerKW: 11.0,
    dcMaxPowerKW: 195.0,
    isDefault: true,
    dataSource: 'VERIFIED',
    createdAt: new Date().toISOString(),
  };

  const stations = await chargingDataService.getStations();
  const route = await routingService.calculateRoadRoute(waypoints);

  console.log('\n--- TEST A: BMW iX @ 85% SOC ---');
  const plan85 = tripPlanningEngine.planEVJourney(route, bmwIX, stations, 15);

  console.log('\n--- TEST B: BMW iX @ 50% SOC ---');
  const plan50 = tripPlanningEngine.planEVJourney(route, { ...bmwIX, currentBatteryPercent: 50 }, stations, 15);

  console.log('\n--- TEST C: BMW iX @ 20% SOC ---');
  const plan20 = tripPlanningEngine.planEVJourney(route, { ...bmwIX, currentBatteryPercent: 20 }, stations, 15);
}

runPipelineTest().catch(console.error);
