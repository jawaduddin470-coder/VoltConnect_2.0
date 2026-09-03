// Full verification script for Phase 3D Safe Route Selection Engine

async function verifyFullPipeline() {
  console.log('=== PHASE 3D FULL PIPELINE SAFE ROUTE VERIFICATION ===\n');

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

  console.log('Route Distance:', totalRoadDistanceKm, 'km');

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

  const leg1MaxSafeKm = Math.round(nominalRangeKm * ((startingSOCPercent - safetyReservePercent) / 100)); // 520 km
  const subsequentMaxSafeKm = Math.round(nominalRangeKm * ((85 - safetyReservePercent) / 100)); // 428 km

  console.log('\n--- VEHICLE PARAMETERS ---');
  console.log('Vehicle: BMW iX xDrive50');
  console.log('Nominal Range:', nominalRangeKm, 'km');
  console.log('Usable Capacity:', bmwIX.usableCapacitykWh, 'kWh');
  console.log('Leg 1 Max Safe Distance (100% SOC):', leg1MaxSafeKm, 'km');
  console.log('Subsequent Legs Max Safe Distance (85% SOC):', subsequentMaxSafeKm, 'km\n');

  // Generate candidate stations along route geometry
  const stations = [
    { name: 'Kurnool Highway Fast Charge', latitude: 15.8281, longitude: 78.0373, chargers: [{ powerKW: 120 }] },
    { name: 'Adilabad NH44 EV Hub', latitude: 19.6641, longitude: 78.532, chargers: [{ powerKW: 150 }] },
    { name: 'Nagpur Expressway EV Park', latitude: 21.1458, longitude: 79.0882, chargers: [{ powerKW: 150 }] },
    { name: 'Seoni Bypass DC Charger', latitude: 22.0869, longitude: 79.5435, chargers: [{ powerKW: 120 }] },
    { name: 'Narsinghpur Highway Hub', latitude: 22.9432, longitude: 79.1976, chargers: [{ powerKW: 120 }] },
    { name: 'Jhansi Bypass EV Station', latitude: 25.4484, longitude: 78.5685, chargers: [{ powerKW: 150 }] },
    { name: 'Gwalior Highway EV Hub', latitude: 26.2183, longitude: 78.1828, chargers: [{ powerKW: 120 }] },
    { name: 'Agra Yamuna Expressway Hub', latitude: 27.1767, longitude: 78.0081, chargers: [{ powerKW: 150 }] },
    { name: 'Mathura Highway DC Fast', latitude: 27.4924, longitude: 77.6737, chargers: [{ powerKW: 120 }] },
    { name: 'Palwal Delhi-NCR EV Plaza', latitude: 28.1487, longitude: 77.332, chargers: [{ powerKW: 150 }] },
    { name: 'Ambala NH44 EV Park', latitude: 30.3782, longitude: 76.7767, chargers: [{ powerKW: 150 }] },
    { name: 'Ludhiana Highway DC Charger', latitude: 30.901, longitude: 75.8573, chargers: [{ powerKW: 120 }] },
    { name: 'Jalandhar NH44 EV Hub', latitude: 31.326, longitude: 75.5762, chargers: [{ powerKW: 150 }] },
    { name: 'Pathankot Gateway EV Station', latitude: 32.2643, longitude: 75.642, chargers: [{ powerKW: 120 }] },
  ];

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const corridorStations = stations.map(st => {
    let minDistanceToRouteKm = 999;
    let closestPtIndex = 0;
    for (let i = 0; i < geometry.length; i++) {
      const pt = geometry[i];
      const distKm = haversineDistance(st.latitude, st.longitude, pt[0], pt[1]);
      if (distKm < minDistanceToRouteKm) {
        minDistanceToRouteKm = distKm;
        closestPtIndex = i;
      }
    }
    const approxDistFromOriginKm = Math.round((closestPtIndex / geometry.length) * totalRoadDistanceKm);
    return { station: st, minDistanceToRouteKm, approxDistFromOriginKm };
  });

  const corridorList = corridorStations.filter(cs => cs.minDistanceToRouteKm <= 80);
  corridorList.sort((a, b) => a.approxDistFromOriginKm - b.approxDistFromOriginKm);

  console.log('Corridor Chargers Sampled:', corridorList.length);

  // Run Safe Sequential Selection algorithm
  const recommendedStops = [];
  let currentDistKm = 0;
  let prevStopDistKm = 0;
  let stopIndex = 0;

  while (true) {
    const currentDepSOC = stopIndex === 0 ? startingSOCPercent : 85;
    const currentMaxSafeKm = stopIndex === 0 ? leg1MaxSafeKm : subsequentMaxSafeKm;
    const remainingDistKm = totalRoadDistanceKm - currentDistKm;

    if (remainingDistKm <= currentMaxSafeKm) break;

    const targetDistFromOriginKm = currentDistKm + currentMaxSafeKm * 0.88;

    let candidates = corridorList.filter(
      cs => cs.approxDistFromOriginKm > currentDistKm + 10 && cs.approxDistFromOriginKm <= currentDistKm + currentMaxSafeKm
    );

    if (candidates.length === 0) {
      candidates = corridorList.filter(
        cs => cs.approxDistFromOriginKm > currentDistKm + 5 && cs.approxDistFromOriginKm <= currentDistKm + currentMaxSafeKm + 30
      );
      if (candidates.length === 0) break;
    }

    candidates.sort((a, b) => {
      const aMaxKw = Math.max(...a.station.chargers.map(c => c.powerKW), 0);
      const bMaxKw = Math.max(...b.station.chargers.map(c => c.powerKW), 0);
      const aDistScore = 100 - Math.abs(a.approxDistFromOriginKm - targetDistFromOriginKm);
      const bDistScore = 100 - Math.abs(b.approxDistFromOriginKm - targetDistFromOriginKm);
      return (bMaxKw * 2 + bDistScore - b.minDistanceToRouteKm * 3) - (aMaxKw * 2 + aDistScore - a.minDistanceToRouteKm * 3);
    });

    const selected = candidates[0];
    const maxKw = Math.max(...selected.station.chargers.map(c => c.powerKW), 50);
    const segDistKm = selected.approxDistFromOriginKm - prevStopDistKm;
    const consumedRatio = segDistKm / nominalRangeKm;
    const arrivalSOC = Math.max(10, Math.round(currentDepSOC - consumedRatio * 100));

    recommendedStops.push({
      station: selected.station,
      distanceFromOriginKm: selected.approxDistFromOriginKm,
      distanceFromPreviousStopKm: segDistKm,
      estimatedArrivalSOCPercent: arrivalSOC,
      maxPowerKW: maxKw,
    });

    prevStopDistKm = selected.approxDistFromOriginKm;
    currentDistKm = selected.approxDistFromOriginKm;
    stopIndex++;

    if (stopIndex > 25) break;
  }

  console.log('\n--- NEW RECOMMENDED CHARGING PLAN VALIDATION ---');
  let prevPos = 0;
  let depSOC = startingSOCPercent;
  let allPass = true;

  recommendedStops.forEach((stop, idx) => {
    const segDist = Math.round((stop.distanceFromOriginKm - prevPos) * 10) / 10;
    const maxSafe = idx === 0 ? leg1MaxSafeKm : subsequentMaxSafeKm;
    const consumedRatio = segDist / nominalRangeKm;
    const arrSOC = Math.round((depSOC - consumedRatio * 100) * 10) / 10;
    const passes = segDist <= maxSafe && arrSOC >= safetyReservePercent;
    if (!passes) allPass = false;

    console.log(`Segment ${idx + 1}: ${idx === 0 ? 'Origin (Hyderabad)' : `Stop ${idx}`} ➔ ⚡${stop.station.name}`);
    console.log(`  - Distance: ${segDist} km | Max Safe: ${maxSafe} km`);
    console.log(`  - Departure SOC: ${depSOC}% | Arrival SOC: ${arrSOC}% (Safety Threshold: ${safetyReservePercent}%)`);
    console.log(`  - Status: ${passes ? '✓ PASS' : '✕ FAIL'}\n`);

    prevPos = stop.distanceFromOriginKm;
    depSOC = 85;
  });

  // Final Leg
  const finalSegDist = Math.round((totalRoadDistanceKm - prevPos) * 10) / 10;
  const consumedRatio = finalSegDist / nominalRangeKm;
  const finalArrSOC = Math.round((depSOC - consumedRatio * 100) * 10) / 10;
  const finalPasses = finalSegDist <= subsequentMaxSafeKm && finalArrSOC >= safetyReservePercent;
  if (!finalPasses) allPass = false;

  console.log(`Segment ${recommendedStops.length + 1} (FINAL LEG): Stop ${recommendedStops.length} ➔ Srinagar (Destination)`);
  console.log(`  - Distance: ${finalSegDist} km | Max Safe: ${subsequentMaxSafeKm} km`);
  console.log(`  - Departure SOC: ${depSOC}% | Arrival SOC: ${finalArrSOC}% (Safety Threshold: ${safetyReservePercent}%)`);
  console.log(`  - Status: ${finalPasses ? '✓ PASS' : '✕ FAIL'}\n`);

  console.log('Total Recommended Stops:', recommendedStops.length);
  console.log('Every Segment Passes Safe Reachability:', allPass ? 'YES ✓' : 'NO ✕');
}

verifyFullPipeline().catch(console.error);
