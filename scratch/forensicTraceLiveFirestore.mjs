// Forensic Trace Script for Live Firestore Station Dataset on voltconnect-30c9b

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

function normalizeStationData(rawStation) {
  const stationId = String(rawStation.station_id || rawStation.id || `st-${Math.random().toString(36).substring(2, 9)}`);
  const rawLat = Number(
    rawStation.latitude ?? rawStation.lat ?? rawStation.lat_num ?? rawStation.AddressInfo?.Latitude ?? rawStation.location?.latitude ?? rawStation.location?.lat ?? rawStation._geoloc?.lat
  );
  const rawLng = Number(
    rawStation.longitude ?? rawStation.lng ?? rawStation.lng_num ?? rawStation.AddressInfo?.Longitude ?? rawStation.location?.longitude ?? rawStation.location?.lng ?? rawStation._geoloc?.lng
  );

  const latitude = !isNaN(rawLat) && rawLat >= -90 && rawLat <= 90 ? rawLat : 17.435;
  const longitude = !isNaN(rawLng) && rawLng >= -180 && rawLng <= 180 ? rawLng : 78.385;
  const name = rawStation.name || rawStation.station_name || 'VoltConnect Charging Station';

  let chargers = [];
  if (Array.isArray(rawStation.chargers) && rawStation.chargers.length > 0) {
    chargers = rawStation.chargers.map((c, idx) => ({
      id: String(c.id || `chg-${stationId}-${idx}`),
      connectorType: c.connectorType || c.type || 'CCS2',
      powerKW: Number(c.powerKW || c.power_kw) || 50,
      pricingPerKWh: Number(c.pricingPerKWh || 18),
    }));
  } else {
    chargers = [{ id: `chg-${stationId}-0`, connectorType: 'CCS2', powerKW: 50, pricingPerKWh: 18 }];
  }

  return { id: stationId, name, latitude, longitude, chargers };
}

async function runForensicTrace() {
  console.log('=== VC FORENSIC DATA-PATH TRACE ON LIVE FIRESTORE (voltconnect-30c9b) ===\n');

  const app = initializeApp({ projectId: 'voltconnect-30c9b' });
  const db = getFirestore(app);

  let rawDocs = [];
  try {
    const snapshot = await getDocs(collection(db, 'stations'));
    rawDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`[FIRESTORE QUERY SUCCESS] Raw Documents Retrieved: ${rawDocs.length}`);
  } catch (err) {
    console.error(`[FIRESTORE QUERY ERROR]: ${err.message}`);
    return;
  }

  const allStations = rawDocs.map(normalizeStationData);
  console.log(`Normalized Stations: ${allStations.length}`);

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
  console.log(`Geometry Points: ${geometry.length}`);

  // Range Specs
  const nominalRangeKm = 612; // BMW iX
  const startingSOCPercent = 100;
  const safetyReservePercent = 15;
  const leg1MaxSafeKm = Math.round(nominalRangeKm * ((startingSOCPercent - safetyReservePercent) / 100)); // 520 km
  const subsequentMaxSafeKm = Math.round(nominalRangeKm * ((85 - safetyReservePercent) / 100)); // 428 km

  // Bounding Box
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  geometry.forEach(pt => {
    if (pt[0] < minLat) minLat = pt[0];
    if (pt[0] > maxLat) maxLat = pt[0];
    if (pt[1] < minLng) minLng = pt[1];
    if (pt[1] > maxLng) maxLng = pt[1];
  });

  const bboxStations = allStations.filter(st => 
    st.latitude >= minLat - 0.8 && st.latitude <= maxLat + 0.8 &&
    st.longitude >= minLng - 0.8 && st.longitude <= maxLng + 0.8
  );

  console.log(`BBox Compatible Stations: ${bboxStations.length}`);

  // Corridor 80km
  const corridorList = [];
  bboxStations.forEach(st => {
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

  console.log(`Corridor List (within 80km of route): ${corridorList.length}`);

  // Print distribution of corridor stations along the route in 250km bins
  console.log('\n--- CORRIDOR STATION DISTRIBUTION ALONG ROUTE ---');
  for (let d = 0; d < totalRoadDistanceKm; d += 250) {
    const inBin = corridorList.filter(cs => cs.approxDistFromOriginKm >= d && cs.approxDistFromOriginKm < d + 250);
    console.log(`  [${d} km - ${d + 250} km]: ${inBin.length} stations`);
    if (inBin.length > 0) {
      console.log(`    Sample: ${inBin[0].station.name} (${inBin[0].approxDistFromOriginKm} km, Lat: ${inBin[0].station.latitude.toFixed(3)}, Lng: ${inBin[0].station.longitude.toFixed(3)})`);
    }
  }

  // Safe Sequential Stops Generation
  let currentDistKm = 0;
  let prevStopDistKm = 0;
  let stopIndex = 0;
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
        console.log(`\n⚠ STATIONS GAP DETECTED AT currentDistKm = ${currentDistKm} km! Max safe range was ${currentMaxSafeKm} km.`);
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

    recommendedStops.push({
      name: selected.station.name,
      distanceFromOriginKm: selected.approxDistFromOriginKm,
      arrivalSOC,
    });

    prevStopDistKm = selected.approxDistFromOriginKm;
    currentDistKm = selected.approxDistFromOriginKm;
    stopIndex++;
    if (stopIndex > 25) break;
  }

  console.log(`\n--- PLANNER OUTPUT RECOMMENDED STOPS (${recommendedStops.length} STOPS) ---`);
  recommendedStops.forEach((s, idx) => {
    console.log(`  Stop ${idx + 1}: ${s.name} [${s.distanceFromOriginKm} km] (Arrival SOC: ${s.arrivalSOC}%)`);
  });

  const recIds = new Set(recommendedStops.map(r => r.name));
  const otherCompatible = corridorList.filter(cs => !recIds.has(cs.station.name));

  console.log(`\nOther Compatible Stations Count: ${otherCompatible.length}`);
}

runForensicTrace().catch(console.error);
