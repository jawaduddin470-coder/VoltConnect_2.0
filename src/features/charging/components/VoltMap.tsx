import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ChargingStation, UserVehicle } from '@/types';
import { checkStationCompatibility } from '../utils/compatibility';
import { LocateFixed, Navigation, Compass } from 'lucide-react';

interface VoltMapProps {
  stations: ChargingStation[];
  activeVehicle: UserVehicle | null;
  selectedStation: ChargingStation | null;
  bestMatchStationId?: string;
  onSelectStation: (station: ChargingStation) => void;
  userLat?: number | null;
  userLng?: number | null;
  accuracy?: number | null;
  isLiveLocationActive?: boolean;
  onDisableFollowMe?: () => void;
}

interface SpatialCluster {
  id: string;
  lat: number;
  lng: number;
  stations: ChargingStation[];
  bounds: L.LatLngBounds;
}

/**
 * Groups array of stations into spatial grid clusters based on current map zoom level.
 */
function computeSpatialClusters(stations: ChargingStation[], zoom: number): SpatialCluster[] {
  if (zoom >= 13) {
    // Zoomed in: individual markers for all valid stations
    return stations
      .filter(s => !isNaN(s.latitude) && !isNaN(s.longitude))
      .map(s => ({
        id: `st-${s.id}`,
        lat: s.latitude,
        lng: s.longitude,
        stations: [s],
        bounds: L.latLngBounds([s.latitude, s.longitude], [s.latitude, s.longitude]),
      }));
  }

  // Grid cell size in degrees based on zoom level
  const gridSize = 360 / Math.pow(2, zoom + 1);
  const clustersMap = new Map<string, SpatialCluster>();

  for (const station of stations) {
    const lat = Number(station.latitude);
    const lng = Number(station.longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;

    const cellX = Math.floor((lng + 180) / gridSize);
    const cellY = Math.floor((lat + 90) / gridSize);
    const cellKey = `${cellX}_${cellY}`;

    const existing = clustersMap.get(cellKey);
    if (existing) {
      existing.stations.push(station);
      const count = existing.stations.length;
      existing.lat = (existing.lat * (count - 1) + lat) / count;
      existing.lng = (existing.lng * (count - 1) + lng) / count;
      existing.bounds.extend([lat, lng]);
    } else {
      clustersMap.set(cellKey, {
        id: `cluster-${cellKey}`,
        lat,
        lng,
        stations: [station],
        bounds: L.latLngBounds([lat, lng], [lat, lng]),
      });
    }
  }

  return Array.from(clustersMap.values());
}

export const VoltMap: React.FC<VoltMapProps> = ({
  stations,
  activeVehicle,
  selectedStation,
  bestMatchStationId,
  onSelectStation,
  userLat,
  userLng,
  accuracy,
  isLiveLocationActive,
  onDisableFollowMe,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // Initialize Map & ResizeObserver
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [17.435, 78.385], // Center on India / Hyderabad corridor
        zoom: 6,
        zoomControl: false,
        preferCanvas: true,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Handle user manual pan/zoom to disable follow-me mode
      map.on('dragstart', () => {
        if (onDisableFollowMe) onDisableFollowMe();
      });

      // Immediate & delayed size invalidation to guarantee 100% full container fill
      map.invalidateSize();
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    const map = mapInstanceRef.current;

    // Attach ResizeObserver to container element
    const resizeObserver = new ResizeObserver(() => {
      if (map) {
        map.invalidateSize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [onDisableFollowMe]);

  // Render Station Clusters & Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    const renderCurrentView = () => {
      markersGroup.clearLayers();
      const currentZoom = map.getZoom();
      const clusters = computeSpatialClusters(stations, currentZoom);

      clusters.forEach(cluster => {
        if (cluster.stations.length > 1) {
          // CLUSTER MARKER
          const count = cluster.stations.length;
          const clusterSize = count > 999 ? 48 : count > 99 ? 42 : 36;

          const clusterIcon = L.divIcon({
            className: 'custom-volt-cluster',
            html: `
              <div style="
                width: ${clusterSize}px;
                height: ${clusterSize}px;
                background: linear-gradient(135deg, #0284C7 0%, #0F172A 100%);
                border: 2.5px solid #38BDF8;
                border-radius: 50%;
                color: #FFFFFF;
                font-family: 'Outfit', sans-serif;
                font-weight: 800;
                font-size: ${clusterSize > 42 ? 11 : 12}px;
                box-shadow: 0 4px 16px rgba(14, 165, 233, 0.45);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 0.2s ease;
              ">
                ${count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
              </div>
            `,
            iconSize: [clusterSize, clusterSize],
            iconAnchor: [clusterSize / 2, clusterSize / 2],
          });

          const marker = L.marker([cluster.lat, cluster.lng], { icon: clusterIcon });
          marker.on('click', () => {
            map.fitBounds(cluster.bounds, { padding: [40, 40], maxZoom: 15 });
          });
          markersGroup.addLayer(marker);
        } else {
          // INDIVIDUAL STATION MARKER
          const station = cluster.stations[0];
          const compatibility = checkStationCompatibility(activeVehicle, station);
          const isSelected = selectedStation?.id === station.id;
          const isBestMatch = bestMatchStationId === station.id;

          let markerColor = '#10B981'; // Available Green
          if (station.chargers.every(c => c.status !== 'Available')) markerColor = '#F59E0B'; // Occupied Amber
          if (station.status === 'offline') markerColor = '#F43F5E';
          if (compatibility.status === 'RED') markerColor = '#F43F5E';

          const markerSize = isSelected ? 38 : isBestMatch ? 34 : 26;

          const stationIcon = L.divIcon({
            className: 'custom-volt-station',
            html: `
              <div style="
                width: ${markerSize}px;
                height: ${markerSize}px;
                background-color: ${markerColor};
                border: 2.5px solid white;
                border-radius: 50%;
                box-shadow: 0 4px 12px rgba(15, 23, 42, 0.35);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                cursor: pointer;
                transition: transform 0.2s ease;
              ">
                ${isBestMatch ? '<span style="position: absolute; top: -8px; right: -4px; background: #0EA5E9; color: white; font-size: 8px; font-weight: 800; padding: 2px 4px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.3)">BEST</span>' : ''}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
            `,
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize / 2, markerSize / 2],
          });

          const marker = L.marker([station.latitude, station.longitude], { icon: stationIcon });
          marker.on('click', () => {
            onSelectStation(station);
          });
          markersGroup.addLayer(marker);
        }
      });
    };

    renderCurrentView();
    map.on('zoomend', renderCurrentView);

    if (selectedStation && !isNaN(selectedStation.latitude) && !isNaN(selectedStation.longitude)) {
      map.panTo([selectedStation.latitude, selectedStation.longitude], { animate: true });
    }

    return () => {
      map.off('zoomend', renderCurrentView);
    };
  }, [stations, activeVehicle, selectedStation, bestMatchStationId, onSelectStation]);

  // Render Live User Location Marker & Accuracy Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLat !== null && userLat !== undefined && userLng !== null && userLng !== undefined) {
      const userCoords: L.LatLngTuple = [userLat, userLng];

      // 1. User Location Marker Pin (● YOU)
      const userIcon = L.divIcon({
        className: 'volt-user-location-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="
              width: 24px;
              height: 24px;
              background-color: #0EA5E9;
              border: 3px solid #FFFFFF;
              border-radius: 50%;
              box-shadow: 0 0 20px rgba(14, 165, 233, 0.8), 0 4px 12px rgba(15, 23, 42, 0.4);
              z-index: 2;
            "></div>
            <div style="
              position: absolute;
              width: 44px;
              height: 44px;
              background-color: rgba(14, 165, 233, 0.25);
              border-radius: 50%;
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
              z-index: 1;
            "></div>
            <div style="
              position: absolute;
              top: -22px;
              background-color: #0F172A;
              color: #38BDF8;
              font-family: 'Outfit', sans-serif;
              font-size: 9px;
              font-weight: 800;
              padding: 2px 6px;
              border-radius: 8px;
              border: 1px solid #0EA5E9;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">YOU</div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userCoords);
      } else {
        userMarkerRef.current = L.marker(userCoords, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      }

      // 2. Accuracy Circle
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
            weight: 1.5,
          }).addTo(map);
        }
      }

      // Pan or Center if Live Location Active
      if (isLiveLocationActive) {
        map.setView(userCoords, Math.max(map.getZoom(), 13), { animate: true });
      }
    } else {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
    }
  }, [userLat, userLng, accuracy, isLiveLocationActive]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-10" />
    </div>
  );
};
