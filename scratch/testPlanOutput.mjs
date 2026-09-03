// Test Plan Generation with Exact Highway Chain

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

const INITIAL_CHARGING_STATIONS = [
  { id: 'st-hyd-01', name: 'VoltConnect Hub — Gachibowli Tech Park', city: 'Hyderabad', latitude: 17.4401, longitude: 78.3489, chargers: [{ powerKW: 150 }] },
  { id: 'st-hyd-02', name: 'Tata Power EZ Charge — Jubilee Hills', city: 'Hyderabad', latitude: 17.4315, longitude: 78.4072, chargers: [{ powerKW: 60 }] },
  { id: 'st-route-leg1', name: 'Tata Power EZ Charge — Washim Highway Hub', city: 'Washim', latitude: 20.4285, longitude: 76.9403, chargers: [{ powerKW: 150 }] },
  { id: 'st-route-leg2', name: 'VoltConnect Hypercharge — Indore Bypass Hub', city: 'Indore', latitude: 22.5003, longitude: 75.9237, chargers: [{ powerKW: 180 }] },
  { id: 'st-route-leg3', name: 'Statiq Ultra Hub — Delhi-Jaipur Expressway', city: 'Alwar / NCR', latitude: 27.0810, longitude: 76.6489, chargers: [{ powerKW: 150 }] },
  { id: 'st-route-leg4', name: 'Tata Power EZ Charge — Pathankot Gateway', city: 'Pathankot', latitude: 32.1847, longitude: 75.6484, chargers: [{ powerKW: 150 }] },
  { id: 'st-route-leg5', name: 'VoltConnect Fast Charge — Ramban Valley Stop', city: 'Ramban', latitude: 33.1688, longitude: 75.3033, chargers: [{ powerKW: 120 }] },
  { id: 'st-srinagar-hub', name: 'VoltConnect Hub — Srinagar City Center', city: 'Srinagar', latitude: 34.0837, longitude: 74.7973, chargers: [{ powerKW: 120 }] },
];

async function testPlan() {
  console.log('=== TESTING ACCURATE 5-STOP HIGHWAY CORRIDOR PLAN ===\n');

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

  console.log(`Route Distance: ${totalRoadDistanceKm} km`);

  const nominalRangeKm = 612;
  const usableCapacitykWh = 105.2;
  const startingSOCPercent = 100;
  const safetyReservePercent = 15;
  const leg1MaxSafeKm = Math.round(nominalRangeKm * ((startingSOCPercent - safetyReservePercent) / 100)); // 520 km
  const subsequentMaxSafeKm = Math.round(nominalRangeKm * ((85 - safetyReservePercent) / 100)); // 428 km

  // Map stations to corridor
  const corridorList = [];
  INITIAL_CHARGING_STATIONS.forEach(st => {
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
    if (minDistanceToRouteKm <= 80) {
      const approxDistFromOriginKm = Math.round((closestPtIndex / geometry.length) * totalRoadDistanceKm);
      corridorList.push({ station: st, minDistanceToRouteKm, approxDistFromOriginKm });
    }
  });

  corridorList.sort((a, b) => a.approxDistFromOriginKm - b.approxDistFromOriginKm);

  // Sequential Stop Planner
  let currentDistKm = 0;
  let prevStopDistKm = 0;
  let stopIndex = 0;
  let totalKWh = 0;
  let totalCost = 0;
  const recommendedStops = [];

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
      if (candidates.length === 0) {
        console.log(`Gap detected at ${currentDistKm} km`);
        break;
      }
    }

    candidates.sort((a, b) => {
      const aMaxKw = Math.max(...a.station.chargers.map(c => c.powerKW), 0);
      const bMaxKw = Math.max(...b.station.chargers.map(c => c.powerKW), 0);
      const aDistScore = 100 - Math.abs(a.approxDistFromOriginKm - targetDistFromOriginKm);
      const bDistScore = 100 - Math.abs(b.approxDistFromOriginKm - targetDistFromOriginKm);
      return (bMaxKw * 2 + bDistScore - b.minDistanceToRouteKm * 3) - (aMaxKw * 2 + aDistScore - a.minDistanceToRouteKm * 3);
    });

    const selected = candidates[0];
    const segDistKm = selected.approxDistFromOriginKm - prevStopDistKm;
    const consumedRatio = segDistKm / nominalRangeKm;
    const arrivalSOC = Math.max(10, Math.round(currentDepSOC - consumedRatio * 100));
    const energyAdded = Math.round(((85 - arrivalSOC) / 100) * usableCapacitykWh);
    const stopCost = Math.round(energyAdded * 18);

    totalKWh += energyAdded;
    totalCost += stopCost;

    recommendedStops.push({
      name: selected.station.name,
      city: selected.station.city,
      distanceFromOriginKm: selected.approxDistFromOriginKm,
      segDistKm,
      arrivalSOC,
      energyAdded,
      stopCost,
    });

    prevStopDistKm = selected.approxDistFromOriginKm;
    currentDistKm = selected.approxDistFromOriginKm;
    stopIndex++;
    if (stopIndex > 25) break;
  }

  console.log(`\n--- RECOMMENDED CHARGING STOPS (${recommendedStops.length} STOPS) ---`);
  recommendedStops.forEach((s, idx) => {
    console.log(`  ⚡ Stop ${idx + 1}: ${s.name} (${s.city}) | Distance: ${s.distanceFromOriginKm} km (+${s.segDistKm} km) | Arrival SOC: ${s.arrivalSOC}% | Energy Added: ${s.energyAdded} kWh | Cost: ₹${s.stopCost}`);
  });

  const finalLegKm = Math.round((totalRoadDistanceKm - currentDistKm) * 10) / 10;
  const finalConsumed = finalLegKm / nominalRangeKm;
  const finalArrivalSOC = Math.round((85 - finalConsumed * 100) * 10) / 10;

  console.log(`\nFinal Leg to Srinagar: ${finalLegKm} km | Arrival SOC: ${finalArrivalSOC}% (Safe Threshold: 15%)`);
  console.log(`Final Leg Reachable? ${finalLegKm <= subsequentMaxSafeKm && finalArrivalSOC >= 15 ? '✓ PASS' : '✕ FAIL'}`);

  console.log(`\nTotal Charging Energy: ${totalKWh} kWh`);
  console.log(`Total Charging Cost: ₹${totalCost.toLocaleString('en-IN')}`);
  console.log(`Toll Cost: ₹395`);
  console.log(`Total Journey Cost: ₹${(totalCost + 395).toLocaleString('en-IN')}`);
}

testPlan().catch(console.error);
