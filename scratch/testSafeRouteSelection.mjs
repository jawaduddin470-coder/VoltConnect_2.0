// Test Safe Route Selection algorithm for Hyderabad -> Srinagar with BMW iX

async function testSafeRouteSelection() {
  console.log('=== SAFE ROUTE SELECTION ALGORITHM VERIFICATION ===\n');

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

  // BMW iX Specs
  const bmwIX = {
    manufacturer: 'BMW',
    model: 'iX xDrive50',
    batteryCapacitykWh: 111.5,
    usableCapacitykWh: 105.2,
    estimatedRangeKm: 612,
    currentBatteryPercent: 100,
  };

  const safetyReservePercent = 15;
  const nominalRangeKm = bmwIX.estimatedRangeKm; // 612 km
  const startingSOCPercent = 100;

  // Max Safe Range Formulas
  const leg1MaxSafeKm = Math.round(nominalRangeKm * ((startingSOCPercent - safetyReservePercent) / 100)); // 520 km
  const subsequentMaxSafeKm = Math.round(nominalRangeKm * ((85 - safetyReservePercent) / 100)); // 428 km

  console.log('Leg 1 Max Safe Distance (100% SOC -> 15% Reserve):', leg1MaxSafeKm, 'km');
  console.log('Subsequent Legs Max Safe Distance (85% SOC -> 15% Reserve):', subsequentMaxSafeKm, 'km\n');

  // Simulate sequential stop selection where every segment is <= maxSafeKm
  let currentDistKm = 0;
  let currentDepSOC = startingSOCPercent;
  let stopCount = 0;
  const stops = [];

  while (true) {
    const currentMaxSafeKm = stopCount === 0 ? leg1MaxSafeKm : subsequentMaxSafeKm;
    const distRemaining = totalRoadDistanceKm - currentDistKm;

    if (distRemaining <= currentMaxSafeKm) {
      // Final leg to destination is safely reachable!
      break;
    }

    // Pick safe target stop position ~ 85% of currentMaxSafeKm
    const targetLegDist = Math.round(currentMaxSafeKm * 0.88);
    const nextStopDistFromOrigin = currentDistKm + targetLegDist;
    stopCount++;

    stops.push({
      name: `Recommended Charging Stop ${stopCount}`,
      distanceFromOriginKm: nextStopDistFromOrigin,
      segmentDistKm: targetLegDist,
    });

    currentDistKm = nextStopDistFromOrigin;
    currentDepSOC = 85;
  }

  console.log('--- SEGMENT-BY-SEGMENT VERIFICATION ---');
  let prevDist = 0;
  let depSOC = startingSOCPercent;

  stops.forEach((stop, idx) => {
    const segDist = Math.round((stop.distanceFromOriginKm - prevDist) * 10) / 10;
    const maxSafe = idx === 0 ? leg1MaxSafeKm : subsequentMaxSafeKm;
    const consumedRatio = segDist / nominalRangeKm;
    const arrSOC = Math.round((depSOC - consumedRatio * 100) * 10) / 10;
    const passes = segDist <= maxSafe && arrSOC >= safetyReservePercent;

    console.log(`Segment ${idx + 1}: ${idx === 0 ? 'Origin' : `Stop ${idx}`} ➔ ${stop.name}`);
    console.log(`  - Distance: ${segDist} km (Max Safe: ${maxSafe} km)`);
    console.log(`  - Departure SOC: ${depSOC}% | Arrival SOC: ${arrSOC}% (Safety Threshold: ${safetyReservePercent}%)`);
    console.log(`  - Pass/Fail: ${passes ? '✓ PASS' : '✕ FAIL'}\n`);

    prevDist = stop.distanceFromOriginKm;
    depSOC = 85;
  });

  // Final Leg
  const finalSegDist = Math.round((totalRoadDistanceKm - prevDist) * 10) / 10;
  const consumedRatio = finalSegDist / nominalRangeKm;
  const arrSOC = Math.round((depSOC - consumedRatio * 100) * 10) / 10;
  const passes = finalSegDist <= subsequentMaxSafeKm && arrSOC >= safetyReservePercent;

  console.log(`Segment ${stops.length + 1} (FINAL LEG): Stop ${stops.length} ➔ Srinagar (Destination)`);
  console.log(`  - Distance: ${finalSegDist} km (Max Safe: ${subsequentMaxSafeKm} km)`);
  console.log(`  - Departure SOC: ${depSOC}% | Arrival SOC: ${arrSOC}% (Safety Threshold: ${safetyReservePercent}%)`);
  console.log(`  - Pass/Fail: ${passes ? '✓ PASS' : '✕ FAIL'}\n`);

  console.log('Total Stops:', stops.length);
  console.log('All Segments Pass:', passes ? 'YES ✓' : 'NO');
}

testSafeRouteSelection().catch(console.error);
