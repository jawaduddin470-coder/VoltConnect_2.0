// Standalone ES module diagnostic to inspect Hyderabad -> Srinagar segment distances, SOC propagation, and readiness score calculation

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function runAudit() {
  console.log('=== HYDERABAD -> SRINAGAR FULL PIPELINE DIAGNOSTIC ===\n');

  const waypoints = [
    { name: 'Hyderabad (Gachibowli)', latitude: 17.435, longitude: 78.385 },
    { name: 'Srinagar (Kashmir)', latitude: 34.0837, longitude: 74.7973 }
  ];

  const coordsString = waypoints.map(w => `${w.longitude.toFixed(6)},${w.latitude.toFixed(6)}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&steps=true`;

  const res = await fetch(url);
  const data = await res.json();
  const route = data.routes[0];
  const totalRoadDistanceKm = Math.round((route.distance / 1000) * 10) / 10;
  const geometry = route.geometry.coordinates.map(c => [c[1], c[0]]);

  console.log('Total Road Distance:', totalRoadDistanceKm, 'km');
  console.log('Route Geometry Points:', geometry.length);

  // BMW iX Specs
  const bmwIX = {
    id: 'veh-bmw-ix',
    manufacturer: 'BMW',
    model: 'iX xDrive50',
    batteryCapacitykWh: 111.5,
    usableCapacitykWh: 105.2,
    estimatedRangeKm: 612,
    currentBatteryPercent: 100,
    connectorTypes: ['CCS2', 'Type2'],
  };

  const safetyReservePercent = 15;
  const nominalRangeKm = bmwIX.estimatedRangeKm; // 612 km
  const startingSOCPercent = 100;
  const effectivePlanningRangeKm = Math.max(120, Math.round(nominalRangeKm * (1 - safetyReservePercent / 100))); // 520 km
  const leg1UsableRangeKm = Math.max(60, Math.round(effectivePlanningRangeKm * (startingSOCPercent / 100))); // 520 km

  console.log('\n--- VEHICLE RANGE PARAMETERS ---');
  console.log('Nominal Range:', nominalRangeKm, 'km');
  console.log('Safety Reserve:', safetyReservePercent, '%');
  console.log('Usable Battery Capacity:', bmwIX.usableCapacitykWh, 'kWh');
  console.log('Effective Safe Planning Range (per leg after 15% reserve):', effectivePlanningRangeKm, 'km');
  console.log('Leg 1 Usable Range (100% SOC):', leg1UsableRangeKm, 'km');

  // Candidate recommended stops from tripPlanningEngine
  const simulatedRecommendedStops = [
    { name: 'Nagpur Fast Charge Hub', distanceFromOriginKm: 470, maxPowerKW: 150 },
    { name: 'Jhansi Highway DC Charging', distanceFromOriginKm: 940, maxPowerKW: 120 },
    { name: 'Agra Yamuna Expressway Superhub', distanceFromOriginKm: 1390, maxPowerKW: 150 },
    { name: 'Ambala NH44 EV Hub', distanceFromOriginKm: 1820, maxPowerKW: 120 },
  ];

  console.log('\n--- SEGMENT-BY-SEGMENT REACHABILITY AUDIT ---');

  let currentPos = 0;
  let currentSOC = startingSOCPercent;

  simulatedRecommendedStops.forEach((stop, idx) => {
    const segDist = Math.round((stop.distanceFromOriginKm - currentPos) * 10) / 10;
    const maxSafeRange = idx === 0 ? leg1UsableRangeKm : effectivePlanningRangeKm;

    const consumedRatio = segDist / nominalRangeKm;
    const arrivalSOC = Math.max(0, Math.round(currentSOC - consumedRatio * 100));
    const isReachable = segDist <= maxSafeRange && arrivalSOC >= safetyReservePercent;

    console.log(`Segment ${idx + 1}: ${idx === 0 ? 'Origin (Hyderabad)' : simulatedRecommendedStops[idx - 1].name} ➔ ${stop.name}`);
    console.log(`  - Distance: ${segDist} km`);
    console.log(`  - Start Position: ${currentPos} km | End Position: ${stop.distanceFromOriginKm} km`);
    console.log(`  - Departure SOC: ${currentSOC}%`);
    console.log(`  - Expected Arrival SOC: ${arrivalSOC}% (Safety Threshold: ${safetyReservePercent}%)`);
    console.log(`  - Max Safe Segment Distance: ${maxSafeRange} km`);
    console.log(`  - Reachable: ${isReachable ? '✓ PASS' : '✕ FAIL'}\n`);

    currentPos = stop.distanceFromOriginKm;
    currentSOC = 85; // Target charge SOC at stop
  });

  // Final Leg: Last Stop -> Srinagar Destination
  const finalSegDist = Math.round((totalRoadDistanceKm - currentPos) * 10) / 10;
  const maxSafeRange = effectivePlanningRangeKm;
  const consumedRatio = finalSegDist / nominalRangeKm;
  const arrivalSOC = Math.max(0, Math.round(currentSOC - consumedRatio * 100));
  const isReachable = finalSegDist <= maxSafeRange && arrivalSOC >= safetyReservePercent;

  console.log(`Segment 5 (FINAL LEG): ${simulatedRecommendedStops[3].name} ➔ Srinagar (Destination)`);
  console.log(`  - Distance: ${finalSegDist} km`);
  console.log(`  - Start Position: ${currentPos} km | End Position: ${totalRoadDistanceKm} km`);
  console.log(`  - Departure SOC: ${currentSOC}%`);
  console.log(`  - Expected Arrival SOC: ${arrivalSOC}% (Safety Threshold: ${safetyReservePercent}%)`);
  console.log(`  - Max Safe Segment Distance: ${maxSafeRange} km`);
  console.log(`  - Reachable: ${isReachable ? '✓ PASS' : '✕ FAIL'}\n`);

  console.log('--- SUMMARY OF AUDIT FINDINGS ---');
  console.log('Total Stops Recommended:', simulatedRecommendedStops.length);
  console.log('Final Leg Distance:', finalSegDist, 'km');
  console.log('Is Final Leg (1820 km ➔ 2306.8 km = 486.8 km) Reachable within 520 km Safe Range?', finalSegDist <= 520 ? 'YES' : 'NO');
}

runAudit().catch(console.error);
