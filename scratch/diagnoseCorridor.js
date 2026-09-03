const fs = require('fs');
const path = require('path');

// Load stations seed or inspect
const stationsFile = path.join(__dirname, '../src/features/charging/data/stationsSeed.ts');
console.log('Inspecting stations file exists:', fs.existsSync(stationsFile));

// Let's create a script to fetch stations from OSRM for Hyderabad -> Vijayawada and test spatial matching
async function runDiagnostic() {
  const waypoints = [
    { name: 'Hyderabad (Gachibowli)', latitude: 17.435, longitude: 78.385 },
    { name: 'Vijayawada', latitude: 16.5062, longitude: 80.648 }
  ];

  const coordsString = waypoints.map(w => `${w.longitude.toFixed(6)},${w.latitude.toFixed(6)}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&steps=true`;

  console.log('Fetching OSRM route for Hyderabad -> Vijayawada...');
  const res = await fetch(url);
  const data = await res.json();
  const route = data.routes[0];
  const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
  const geometry = route.geometry.coordinates.map(c => [c[1], c[0]]);

  console.log('Distance Km:', distanceKm);
  console.log('Route Geometry Points:', geometry.length);

  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  geometry.forEach(pt => {
    if (pt[0] < minLat) minLat = pt[0];
    if (pt[0] > maxLat) maxLat = pt[0];
    if (pt[1] < minLng) minLng = pt[1];
    if (pt[1] > maxLng) maxLng = pt[1];
  });

  console.log('Bounding Box:', { minLat, maxLat, minLng, maxLng });
}

runDiagnostic().catch(console.error);
