// Inspect station distances along Hyderabad -> Srinagar

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
  { id: 'st-hyd-01', name: 'VoltConnect Hub — Gachibowli Tech Park', city: 'Hyderabad', latitude: 17.4401, longitude: 78.3489, powerKW: 150 },
  { id: 'st-hyd-02', name: 'Tata Power EZ Charge — Jubilee Hills', city: 'Hyderabad', latitude: 17.4315, longitude: 78.4072, powerKW: 60 },
  { id: 'st-hyd-04', name: 'Statiq Charging Hub — Medchal NH44 North', city: 'Hyderabad', latitude: 17.6289, longitude: 78.4812, powerKW: 120 },
  { id: 'st-nh44-nirmal', name: 'Jio-bp pulse — Nirmal Highway Hub', city: 'Nirmal', latitude: 19.0964, longitude: 78.3428, powerKW: 120 },
  { id: 'st-nh44-adilabad', name: 'Tata Power EZ Charge — Adilabad Bypass', city: 'Adilabad', latitude: 19.6640, longitude: 78.5320, powerKW: 60 },
  { id: 'st-nh44-nagpur', name: 'Tata Power EZ Charge — Nagpur Highway Hub', city: 'Nagpur', latitude: 21.0145, longitude: 79.0322, powerKW: 150 },
  { id: 'st-nh44-seoni', name: 'Statiq Fast Charger — Seoni NH44 Hub', city: 'Seoni', latitude: 22.0869, longitude: 79.5435, powerKW: 60 },
  { id: 'st-nh44-narsinghpur', name: 'Jio-bp pulse — Narsinghpur Crossing', city: 'Narsinghpur', latitude: 22.9431, longitude: 79.1982, powerKW: 120 },
  { id: 'st-nh44-sagar', name: 'VoltConnect Fast Charge — Sagar Highway Station', city: 'Sagar', latitude: 23.8388, longitude: 78.7378, powerKW: 120 },
  { id: 'st-nh44-lalitpur', name: 'Tata Power EZ Charge — Lalitpur Bypass', city: 'Lalitpur', latitude: 24.6890, longitude: 78.4120, powerKW: 60 },
  { id: 'st-nh44-jhansi', name: 'Tata Power EZ Charge — Jhansi Junction', city: 'Jhansi', latitude: 25.4484, longitude: 78.5685, powerKW: 120 },
  { id: 'st-nh44-gwalior', name: 'BPCL E-Drive — Gwalior Highway', city: 'Gwalior', latitude: 26.2980, longitude: 78.1820, powerKW: 120 },
  { id: 'st-nh44-agra', name: 'Statiq Ultra Hub — Agra Southern Bypass', city: 'Agra', latitude: 27.1420, longitude: 77.9620, powerKW: 150 },
  { id: 'st-nh44-delhi-ncr', name: 'ChargeZone Hub — Delhi NCR North', city: 'Delhi NCR', latitude: 28.8720, longitude: 77.1240, powerKW: 180 },
  { id: 'st-nh44-karnal', name: 'Tata Power EZ Charge — Karnal Haveli', city: 'Karnal', latitude: 29.6857, longitude: 76.9905, powerKW: 120 },
  { id: 'st-nh44-ludhiana', name: 'Statiq Charging Hub — Ludhiana Bypass', city: 'Ludhiana', latitude: 30.8120, longitude: 76.0120, powerKW: 120 },
  { id: 'st-nh44-jalandhar', name: 'Jio-bp pulse — Jalandhar Highway Oasis', city: 'Jalandhar', latitude: 31.3260, longitude: 75.5762, powerKW: 120 },
  { id: 'st-nh44-pathankot', name: 'Tata Power EZ Charge — Pathankot Gateway', city: 'Pathankot', latitude: 32.2740, longitude: 75.6520, powerKW: 120 },
  { id: 'st-nh44-jammu', name: 'VoltConnect Hub — Jammu Bypass', city: 'Jammu', latitude: 32.7480, longitude: 74.9120, powerKW: 120 },
  { id: 'st-nh44-ramban', name: 'Tata Power EZ Charge — Ramban Valley Stop', city: 'Ramban', latitude: 33.2420, longitude: 75.2420, powerKW: 60 },
  { id: 'st-nh44-anantnag', name: 'Statiq Fast Charger — Anantnag Bypass', city: 'Anantnag', latitude: 33.7310, longitude: 75.1480, powerKW: 60 },
  { id: 'st-srinagar-hub', name: 'VoltConnect Hub — Srinagar City Center', city: 'Srinagar', latitude: 34.0837, longitude: 74.7973, powerKW: 120 },
];

async function inspect() {
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
    const approxDistFromOriginKm = Math.round((closestPtIndex / geometry.length) * totalRoadDistanceKm);
    console.log(`[${approxDistFromOriginKm} km] ${st.name} (${st.city}) - Detour: ${minDistanceToRouteKm.toFixed(1)} km`);
  });
}

inspect().catch(console.error);
