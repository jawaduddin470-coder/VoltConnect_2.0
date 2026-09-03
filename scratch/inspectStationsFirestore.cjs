const fs = require('fs');

async function fetchAllFirestoreStations() {
  const projectId = 'voltconnect-30c9b';
  let nextPageToken = '';
  let allDocuments = [];

  console.log('Fetching all documents from Firestore collection: stations...');

  do {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/stations?pageSize=300${
      nextPageToken ? `&pageToken=${nextPageToken}` : ''
    }`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error('Firestore API Error:', response.status, await response.text());
      break;
    }

    const data = await response.json();
    if (data.documents && data.documents.length > 0) {
      allDocuments = allDocuments.concat(data.documents);
    }
    nextPageToken = data.nextPageToken || '';
  } while (nextPageToken);

  console.log(`Successfully fetched ${allDocuments.length} station documents from Firestore.`);

  // Parse fields
  const parsedStations = allDocuments.map(doc => {
    const fields = doc.fields || {};
    const extractVal = f => {
      if (!f) return null;
      if (f.stringValue !== undefined) return f.stringValue;
      if (f.doubleValue !== undefined) return Number(f.doubleValue);
      if (f.integerValue !== undefined) return Number(f.integerValue);
      if (f.booleanValue !== undefined) return f.booleanValue;
      if (f.arrayValue !== undefined && f.arrayValue.values) {
        return f.arrayValue.values.map(extractVal);
      }
      if (f.mapValue !== undefined && f.mapValue.fields) {
        const obj = {};
        for (const k in f.mapValue.fields) {
          obj[k] = extractVal(f.mapValue.fields[k]);
        }
        return obj;
      }
      return null;
    };

    const parsed = {};
    for (const key in fields) {
      parsed[key] = extractVal(fields[key]);
    }
    parsed.id = doc.name.split('/').pop();
    return parsed;
  });

  // Save parsed payload for offline analysis
  fs.writeFileSync('scratch/firestore_stations_dump.json', JSON.stringify(parsedStations, null, 2));
  console.log('Saved parsed station documents to scratch/firestore_stations_dump.json');

  // Perform Diagnostic Statistics
  console.log('\n--- FIRESTORE DATASET DIAGNOSTIC SUMMARY ---');
  console.log('Total Documents:', parsedStations.length);

  let validCoordCount = 0;
  let missingCoordCount = 0;
  let latLngOrderSwappedCount = 0;

  parsedStations.forEach(s => {
    const lat = Number(s.latitude ?? s.AddressInfo?.Latitude);
    const lng = Number(s.longitude ?? s.AddressInfo?.Longitude);

    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      validCoordCount++;
    } else {
      missingCoordCount++;
    }
  });

  console.log('Valid Coordinates:', validCoordCount);
  console.log('Missing/Invalid Coordinates:', missingCoordCount);

  // Now test Hyderabad -> Vijayawada corridor
  const hydVjaWaypoints = [
    { latitude: 17.435, longitude: 78.385 },
    { latitude: 16.5062, longitude: 80.648 }
  ];
  const coordsString = hydVjaWaypoints.map(w => `${w.longitude.toFixed(6)},${w.latitude.toFixed(6)}`).join(';');
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&steps=true`;
  const osrmRes = await fetch(osrmUrl);
  const osrmData = await osrmRes.json();
  const route = osrmData.routes[0];
  const routeGeometry = route.geometry.coordinates.map(c => [c[1], c[0]]);

  console.log('\n--- HYDERABAD -> VIJAYAWADA ROUTE DIAGNOSTIC ---');
  console.log('Route Distance:', Math.round(route.distance / 1000), 'km');
  console.log('Route Geometry Points:', routeGeometry.length);

  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  routeGeometry.forEach(pt => {
    if (pt[0] < minLat) minLat = pt[0];
    if (pt[0] > maxLat) maxLat = pt[0];
    if (pt[1] < minLng) minLng = pt[1];
    if (pt[1] > maxLng) maxLng = pt[1];
  });
  console.log('Route Bounding Box:', { minLat, maxLat, minLng, maxLng });

  const latMargin = 0.8;
  const lngMargin = 0.8;

  const bboxStations = parsedStations.filter(st => {
    const lat = Number(st.latitude ?? st.AddressInfo?.Latitude);
    const lng = Number(st.longitude ?? st.AddressInfo?.Longitude);
    if (isNaN(lat) || isNaN(lng)) return false;
    return (
      lat >= minLat - latMargin &&
      lat <= maxLat + latMargin &&
      lng >= minLng - lngMargin &&
      lng <= maxLng + lngMargin
    );
  });

  console.log('Stations inside Route Bounding Box:', bboxStations.length);

  // Haversine Distance helper
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const corridorStations80km = [];
  const corridorStations30km = [];
  const corridorStations15km = [];

  bboxStations.forEach(st => {
    const lat = Number(st.latitude ?? st.AddressInfo?.Latitude);
    const lng = Number(st.longitude ?? st.AddressInfo?.Longitude);
    let minDist = 999;
    for (let pt of routeGeometry) {
      const d = haversine(lat, lng, pt[0], pt[1]);
      if (d < minDist) minDist = d;
    }
    if (minDist <= 80) corridorStations80km.push({ name: st.name || st.station_name, lat, lng, minDist });
    if (minDist <= 30) corridorStations30km.push({ name: st.name || st.station_name, lat, lng, minDist });
    if (minDist <= 15) corridorStations15km.push({ name: st.name || st.station_name, lat, lng, minDist });
  });

  console.log('Corridor Stations (<= 80 km):', corridorStations80km.length);
  console.log('Corridor Stations (<= 30 km):', corridorStations30km.length);
  console.log('Corridor Stations (<= 15 km):', corridorStations15km.length);
}

fetchAllFirestoreStations().catch(console.error);
