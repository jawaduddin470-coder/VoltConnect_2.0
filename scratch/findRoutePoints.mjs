// Script to find exact coordinate points along Hyderabad -> Srinagar driving route every 350-400 km

async function findPoints() {
  const waypoints = [
    { name: 'Hyderabad (Gachibowli)', latitude: 17.435, longitude: 78.385 },
    { name: 'Srinagar (Kashmir)', latitude: 34.0837, longitude: 74.7973 }
  ];

  const coordsString = waypoints.map(w => `${w.longitude.toFixed(6)},${w.latitude.toFixed(6)}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  const data = await res.json();
  const route = data.routes[0];
  const totalKm = route.distance / 1000;
  const geometry = route.geometry.coordinates.map(c => [c[1], c[0]]);

  console.log('Total Road Distance:', totalKm.toFixed(1), 'km');
  console.log('Total Geometry Points:', geometry.length);

  const targets = [420, 840, 1260, 1680, 2050];
  targets.forEach((tKm, idx) => {
    const ptIdx = Math.round((tKm / totalKm) * geometry.length);
    const pt = geometry[ptIdx];
    console.log(`Target ${tKm} km (Stop ${idx + 1}): Lat ${pt[0].toFixed(4)}, Lng ${pt[1].toFixed(4)}`);
  });
}

findPoints().catch(console.error);
