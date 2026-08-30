/**
 * VOLTCONNECT 2.0 — REAL ROAD ROUTING SERVICE (OSRM ENGINE)
 * Queries Open Source Routing Machine (OSRM) driving API to retrieve exact road distances,
 * estimated driving times, and polyline geometries for multi-waypoint routes.
 */

export interface RouteWaypointInput {
  name: string;
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][]; // [latitude, longitude] tuples
  steps: {
    instruction: string;
    distanceKm: number;
    durationMinutes: number;
  }[];
  waypoints: {
    name: string;
    latitude: number;
    longitude: number;
  }[];
}

class RoutingService {
  /**
   * Calculates actual driving road route through array of waypoints using OSRM API.
   * Format for OSRM coords: longitude,latitude;longitude,latitude...
   */
  public async calculateRoadRoute(waypoints: RouteWaypointInput[]): Promise<RouteResult> {
    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints (Origin and Destination) are required to calculate a route.');
    }

    // Format OSRM coordinate string: lon,lat;lon,lat...
    const coordsString = waypoints
      .map(w => `${w.longitude.toFixed(6)},${w.latitude.toFixed(6)}`)
      .join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&steps=true`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM Routing API returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No driving road route found between the specified locations.');
      }

      const route = data.routes[0];
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10; // Convert meters to km
      const durationMinutes = Math.round(route.duration / 60); // Convert seconds to minutes

      // Convert GeoJSON [lon, lat] coordinates to Leaflet [lat, lon] tuples
      const geometry: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
      );

      // Extract leg steps
      const steps: { instruction: string; distanceKm: number; durationMinutes: number }[] = [];
      if (route.legs) {
        route.legs.forEach((leg: any) => {
          if (leg.steps) {
            leg.steps.forEach((step: any) => {
              if (step.name) {
                steps.push({
                  instruction: `Drive along ${step.name}`,
                  distanceKm: Math.round((step.distance / 1000) * 10) / 10,
                  durationMinutes: Math.round(step.duration / 60),
                });
              }
            });
          }
        });
      }

      return {
        distanceKm,
        durationMinutes,
        geometry,
        steps,
        waypoints: waypoints.map(w => ({ name: w.name, latitude: w.latitude, longitude: w.longitude })),
      };
    } catch (err: any) {
      console.warn('[RoutingService] OSRM primary route failed, calculating geodesic road estimation:', err);
      return this.fallbackGeodesicRoute(waypoints);
    }
  }

  /**
   * Fallback geodesic estimation if OSRM endpoint is temporarily unreachable.
   */
  private fallbackGeodesicRoute(waypoints: RouteWaypointInput[]): RouteResult {
    let totalDistKm = 0;
    const geometry: [number, number][] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const w1 = waypoints[i];
      const w2 = waypoints[i + 1];
      const segDist = this.haversineDistance(w1.latitude, w1.longitude, w2.latitude, w2.longitude) * 1.25; // 1.25 winding factor
      totalDistKm += segDist;

      // Generate intermediate interpolation points for map display
      const stepsCount = 10;
      for (let s = 0; s <= stepsCount; s++) {
        const t = s / stepsCount;
        const lat = w1.latitude + (w2.latitude - w1.latitude) * t;
        const lng = w1.longitude + (w2.longitude - w1.longitude) * t;
        geometry.push([lat, lng]);
      }
    }

    const durationMinutes = Math.round((totalDistKm / 65) * 60); // 65 km/h avg highway speed

    return {
      distanceKm: Math.round(totalDistKm * 10) / 10,
      durationMinutes,
      geometry,
      steps: [],
      waypoints: waypoints.map(w => ({ name: w.name, latitude: w.latitude, longitude: w.longitude })),
    };
  }

  public haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const routingService = new RoutingService();
