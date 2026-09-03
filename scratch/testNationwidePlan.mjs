// Verification of Nationwide Charging Plan without alias

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
  { id: 'st-hyd-04', name: 'Statiq Charging Hub — Medchal NH44 North', city: 'Hyderabad', latitude: 17.6289, longitude: 78.4812, chargers: [{ powerKW: 120 }] },
  { id: 'st-nh44-nirmal', name: 'Jio-bp pulse — Nirmal Highway Hub', city: 'Nirmal', latitude: 19.0964, longitude: 78.3428, chargers: [{ powerKW: 120 }] },
  { id: 'st-nh44-adilabad', name: 'Tata Power EZ Charge — Adilabad Bypass', city: 'Adilabad', latitude: 19.6640, longitude: 78.5320, chargers: [{ powerKW: 60 }] },
  { id: 'st-nh44-nagpur', name: 'Tata Power EZ Charge — Nagpur Highway Hub', city: 'Nagpur', latitude: 21.0145, longitude: 79.0322, chargers: [{ powerKW: 150 }] },
  { id: 'st-nh44-seoni', name: 'Statiq Fast Charger — Seoni NH44 Hub', city: 'Seoni', latitude: 22.0869, longitude: 79.5435, chargers: [{ powerKW: 60 }] },
  { id: 'st-nh44-narsinghpur', name: 'Jio-bp pulse — Narsinghpur Crossing', city: 'Narsinghpur', latitude: 22.9431, longitude: 79.1982, chargers: [{ powerKW: 120 }] },
  { id: 'st-nh44-sagar', name: 'VoltConnect Fast Charge — Sagar Highway Station', city: 'Sagar', latitude: 23.8388, longitude: 78.7378, chargers: [{ powerKW: 120 }] },
  { id: 'st-nh44-lalitpur', name: 'Tata Power EZ Charge — Lalitpur Bypass', city: 'Lalitpur', latitude: 24.6890, longitude: 78.4120, chargers: [{ powerKW: 60 }] },
  { id: 'st-nh44-jhansi', name: 'Tata Power EZ Charge — Jhansi Junction', city: 'Jhansi', latitude: 25.4484, longitude: 78.5685, chargers: [{ powerKW: 120 }] },
  { id: 'st-nh44-gwalior', name: 'BPCL E-Drive — Gwalior Highway', city: 'Gwalior', latitude: 26.2980, longitude: 78.1820, chargers: [{ powerKW: 120 }] },
  { id: 'st-nh44-agra', name: 'Statiq Ultra Hub — Agra Southern Bypass', city: 'Agra', latitude: 27.1420, longitude: 77.9620, chargers: [{ powerKW: 150 }] },
  { id: 'st-nh44-delhi-ncr', name: 'ChargeZone Hub — Delhi NCR North', city: 'Delhi NCR', latitude: 28.8720, longitude: 77.1240, chargers: [{ powerKW: 180 }] },
  { id: 'st-nh44-karnal', name: 'Tata Power EZ Charge — Karnal Haveli', city: 'Karnal', latitude: 29.6857, longitude: 76.9905, chargers: [{ powerKW: 120 }] },
  { id: 'st-nh44-ludhiana', name: 'Statiq Charging Hub — Ludhiana Bypass', city: 'Ludhiana', latitude: 30.8120, longitude: 76.0120, chargers: [{ powerKW: 120 }] },
  { id: 'st-nh44-jalandhar', name: 'Jio-bp pulse — Jalandhar Highway Oasis', city: 'Jalandhar', latitude: 31.3260, longitude: 75.5762, chargers: [{ powerKW: 120 }] },
  { id: 'st-nh44-pathankot', name: 'Tata Power EZ Charge — Pathankot Gateway', city: 'Pathankot', latitude: 32.2740, longitude: 75.6520, chargers: [{ powerKW: 120 }] },
  { id: 'st-nh44-jammu', name: 'VoltConnect Hub — Jammu Bypass', city: 'Jammu', latitude: 32.7480, longitude: 74.9120, chargers: [{ powerKW: 120 }] },
  { id: 'st-nh44-ramban', name: 'Tata Power EZ Charge — Ramban Valley Stop', city: 'Ramban', latitude: 33.2420, longitude: 75.2420, chargers: [{ powerKW: 60 }] },
  { id: 'st-nh44-anantnag', name: 'Statiq Fast Charger — Anantnag Bypass', city: 'Anantnag', latitude: 33.7310, longitude: 75.1480, chargers: [{ powerKW: 60 }] },
  { id: 'st-srinagar-hub', name: 'VoltConnect Hub — Srinagar City Center', city: 'Srinagar', latitude: 34.0837, longitude: 74.7973, chargers: [{ powerKW: 120 }] },
];

async function testNationwide() {
  console.log('=== TESTING NATIONWIDE CHARGING PLAN WITH COMPLETE STATIONS SEED ===\n');

  console.log(`Total Nationwide Seed Stations: ${INITIAL_CHARGING_STATIONS.length}`);

  // Fetch OSRM route for Hyderabad -> Srinagar
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

  // BMW iX Specs
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
  console.log(`Corridor Stations: ${corridorList.length}`);

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
    console.log(`  ⚡ Stop ${idx + 1}: ${s.name} (${s.city}) | Distance: ${s.distanceFromOriginKm} km (+${s.segDistKm} km) | Arrival SOC: ${s.arrivalSOC}% | Energy: ${s.energyAdded} kWh | Cost: ₹${s.stopCost}`);
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

testNationwide().catch(console.error);
