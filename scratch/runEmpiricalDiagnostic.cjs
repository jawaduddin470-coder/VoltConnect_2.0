const fs = require('fs');
const path = require('path');

// Test 1: Hyderabad -> Vijayawada
// Test 2: Hyderabad -> Srinagar
// Test 3: Hyderabad -> Bengaluru
// Test 4: Delhi -> Mumbai

async function runFullDiagnostic() {
  console.log('=== VOLTCONNECT 2.0 — EMPIRICAL CHARGING STATION CORRIDOR DIAGNOSTIC ===\n');

  const testRoutes = [
    {
      name: 'Hyderabad -> Vijayawada',
      waypoints: [
        { name: 'Hyderabad (Gachibowli)', latitude: 17.435, longitude: 78.385 },
        { name: 'Vijayawada', latitude: 16.5062, longitude: 80.648 }
      ]
    },
    {
      name: 'Hyderabad -> Srinagar',
      waypoints: [
        { name: 'Hyderabad (Gachibowli)', latitude: 17.435, longitude: 78.385 },
        { name: 'Srinagar (Kashmir)', latitude: 34.0837, longitude: 74.7973 }
      ]
    },
    {
      name: 'Hyderabad -> Bengaluru',
      waypoints: [
        { name: 'Hyderabad (Gachibowli)', latitude: 17.435, longitude: 78.385 },
        { name: 'Bangalore, Karnataka', latitude: 12.9716, longitude: 77.5946 }
      ]
    },
    {
      name: 'Delhi -> Mumbai',
      waypoints: [
        { name: 'New Delhi', latitude: 28.6139, longitude: 77.209 },
        { name: 'Mumbai, Maharashtra', latitude: 19.076, longitude: 72.8777 }
      ]
    }
  ];

  for (const tr of testRoutes) {
    const coordsString = tr.waypoints.map(w => `${w.longitude.toFixed(6)},${w.latitude.toFixed(6)}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&steps=true`;

    const res = await fetch(url);
    const data = await res.json();
    const route = data.routes[0];
    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    const geometry = route.geometry.coordinates.map(c => [c[1], c[0]]);

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    geometry.forEach(pt => {
      if (pt[0] < minLat) minLat = pt[0];
      if (pt[0] > maxLat) maxLat = pt[0];
      if (pt[1] < minLng) minLng = pt[1];
      if (pt[1] > maxLng) maxLng = pt[1];
    });

    console.log(`Route: ${tr.name}`);
    console.log(`- Distance: ${distanceKm} km`);
    console.log(`- Geometry Points: ${geometry.length}`);
    console.log(`- Bounding Box: minLat=${minLat.toFixed(4)}, maxLat=${maxLat.toFixed(4)}, minLng=${minLng.toFixed(4)}, maxLng=${maxLng.toFixed(4)}\n`);
  }
}

runFullDiagnostic().catch(console.error);
