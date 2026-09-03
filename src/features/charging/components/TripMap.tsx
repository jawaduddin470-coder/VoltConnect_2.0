import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { EVTripPlan, RecommendedChargingStop } from '@/services/tripPlanningEngine';
import { routingService } from '@/services/routingService';

interface TripMapProps {
  tripPlan: EVTripPlan;
  selectedStop: RecommendedChargingStop | null;
  onSelectStop: (stop: RecommendedChargingStop) => void;
  isLiveTracking?: boolean;
  userLat?: number | null;
  userLng?: number | null;
  accuracy?: number | null;
  followMe?: boolean;
  onDisableFollowMe?: () => void;
}

export const TripMap: React.FC<TripMapProps> = ({
  tripPlan,
  selectedStop,
  onSelectStop,
  isLiveTracking,
  userLat,
  userLng,
  accuracy,
  followMe,
  onDisableFollowMe,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const stopMarkersRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // Effect 1: Map Initialization and Unmount Cleanup (Guarantees NO detached DOM refs)
  useEffect(() => {
    const containerEl = mapContainerRef.current;
    if (!containerEl) return;

    // Create Leaflet map instance bound to this exact DOM element
    const map = L.map(containerEl, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
      preferCanvas: true,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const stopGroup = L.layerGroup().addTo(map);
    stopMarkersRef.current = stopGroup;
    mapInstanceRef.current = map;

    map.on('dragstart', () => {
      if (onDisableFollowMe) onDisableFollowMe();
    });

    // Helper to safely invalidate size and fit bounds when container acquires dimensions
    const handleResizeAndFit = () => {
      if (!map || !containerEl) return;
      map.invalidateSize();
      if (routePolylineRef.current) {
        const bounds = routePolylineRef.current.getBounds();
        if (bounds.isValid() && containerEl.clientWidth > 0 && containerEl.clientHeight > 0) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    };

    // Attach ResizeObserver to container element
    const resizeObserver = new ResizeObserver(() => {
      handleResizeAndFit();
    });

    resizeObserver.observe(containerEl);

    // Initial size invalidations for Chrome/Blink reflow passes
    map.invalidateSize();
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Cleanup on component unmount
    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run ONCE on mount

  // Effect 2: Update Route Geometry, Bounds, and Corridor Station Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const stopGroup = stopMarkersRef.current;

    if (!map || !stopGroup || !tripPlan) return;

    stopGroup.clearLayers();

    // Render Real Road Route Polyline Line
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (tripPlan.routeGeometry && tripPlan.routeGeometry.length > 0) {
      const polyline = L.polyline(tripPlan.routeGeometry, {
        color: '#0EA5E9',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      routePolylineRef.current = polyline;

      // Fit map view to complete route bounds safely
      const containerEl = mapContainerRef.current;
      if (containerEl && containerEl.clientWidth > 0 && containerEl.clientHeight > 0) {
        const bounds = polyline.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } else {
        // Defer fitBounds to rAF if container is establishing dimensions
        requestAnimationFrame(() => {
          if (map && routePolylineRef.current) {
            const bounds = routePolylineRef.current.getBounds();
            map.invalidateSize();
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [50, 50] });
            }
          }
        });
      }
    }

    // High-Contrast Map Origin & Destination Markers (DARK NAVY TEXT ON SOLID WHITE BACKGROUND)
    tripPlan.waypoints.forEach((wp, idx) => {
      const isOrigin = idx === 0;
      const isDest = idx === tripPlan.waypoints.length - 1;
      const themeColor = isOrigin ? '#059669' : isDest ? '#DC2626' : '#2563EB';

      const pinIcon = L.divIcon({
        className: 'custom-route-wp',
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            background: #FFFFFF;
            color: #0F172A;
            font-weight: 800;
            font-size: 11px;
            font-family: system-ui, -apple-system, sans-serif;
            padding: 6px 14px;
            border-radius: 9999px;
            border: 2.5px solid ${themeColor};
            box-shadow: 0 10px 20px -3px rgba(0,0,0,0.35), 0 4px 6px -4px rgba(0,0,0,0.2);
            white-space: nowrap;
            pointer-events: auto;
          ">
            <span style="
              display: inline-block;
              width: 9px;
              height: 9px;
              background: ${themeColor};
              border-radius: 50%;
            "></span>
            <span style="color: ${themeColor}; font-weight: 900; font-size: 10px; text-transform: uppercase;">
              ${isOrigin ? 'START' : isDest ? 'DESTINATION' : 'WAYPOINT'}
            </span>
            <span style="color: #0F172A; font-weight: 800; font-size: 11px;">
              ${wp.name.split(',')[0]}
            </span>
          </div>
        `,
        iconAnchor: [70, 20],
      });

      L.marker([wp.latitude, wp.longitude], { icon: pinIcon }).addTo(stopGroup);
    });

    // Render Numbered Recommended Charging Markers (⚡ 1, ⚡ 2, ⚡ 3)
    tripPlan.recommendedStops.forEach((stop, idx) => {
      const stopIcon = L.divIcon({
        className: 'custom-charging-stop-rec',
        html: `
          <div style="
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #0EA5E9 0%, #0F172A 100%);
            border: 2.5px solid #38BDF8;
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 11px;
            box-shadow: 0 4px 14px rgba(14,165,233,0.6);
            cursor: pointer;
          ">
            ⚡${idx + 1}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([stop.station.latitude, stop.station.longitude], { icon: stopIcon });
      marker.on('click', () => onSelectStop(stop));
      stopGroup.addLayer(marker);
    });

    // Render Other Compatible Route Charging Markers (⚡)
    tripPlan.otherCompatibleStations.forEach((stop) => {
      const otherIcon = L.divIcon({
        className: 'custom-charging-stop-other',
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background: #1E293B;
            border: 2px solid #38BDF8;
            border-radius: 50%;
            color: #38BDF8;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            cursor: pointer;
          ">
            ⚡
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([stop.station.latitude, stop.station.longitude], { icon: otherIcon });
      marker.on('click', () => onSelectStop(stop));
      stopGroup.addLayer(marker);
    });
  }, [tripPlan, onSelectStop]);

  // Effect 3: Render Live User Location Marker & Accuracy Radius
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tripPlan) return;

    if (userLat !== null && userLat !== undefined && userLng !== null && userLng !== undefined && isLiveTracking) {
      const userCoords: L.LatLngTuple = [userLat, userLng];

      const userIcon = L.divIcon({
        className: 'user-live-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 20px; height: 20px; background: #0EA5E9; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 16px #0EA5E9; z-index: 2;"></div>
            <div style="position: absolute; width: 40px; height: 40px; background: rgba(14,165,233,0.25); border-radius: 50%; animation: ping 2s infinite; z-index: 1;"></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userCoords);
      } else {
        userMarkerRef.current = L.marker(userCoords, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      }

      if (accuracy && accuracy > 0) {
        if (accuracyCircleRef.current) {
          accuracyCircleRef.current.setLatLng(userCoords);
          accuracyCircleRef.current.setRadius(accuracy);
        } else {
          accuracyCircleRef.current = L.circle(userCoords, {
            radius: accuracy,
            color: '#0EA5E9',
            fillColor: '#38BDF8',
            fillOpacity: 0.15,
          }).addTo(map);
        }
      }

      if (followMe) {
        map.panTo(userCoords, { animate: true });
      }
    }
  }, [userLat, userLng, accuracy, isLiveTracking, followMe, tripPlan]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-10" />
    </div>
  );
};
