import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { chargingDataService } from '@/services/chargingDataService';
import { ChargingStation } from '@/types';
import {
  MapPin,
  Search,
  LocateFixed,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Compass,
} from 'lucide-react';

interface PartnerLocationPickerMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (coords: { lat: number; lng: number; addressSuggestion?: string; citySuggestion?: string }) => void;
}

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const PartnerLocationPickerMap: React.FC<PartnerLocationPickerMapProps> = ({
  initialLat = 17.4385,
  initialLng = 78.3842,
  onLocationSelect,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [currentLat, setCurrentLat] = useState<number>(initialLat);
  const [currentLng, setCurrentLng] = useState<number>(initialLng);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [addressDisplay, setAddressDisplay] = useState('');
  const [existingStations, setExistingStations] = useState<ChargingStation[]>([]);

  // Load existing stations once solely for duplicate proximity checking (not rendered on map)
  useEffect(() => {
    chargingDataService.getAllStationsForAdmin().then(data => {
      setExistingStations(data);
    });
  }, []);

  // Check duplicate proximity (Condition 4: within 50m of an existing station)
  const checkDuplicateLocation = (lat: number, lng: number) => {
    const DUPLICATE_THRESHOLD_METERS = 50;
    const nearby = existingStations.find(st => {
      if (isNaN(st.latitude) || isNaN(st.longitude)) return false;
      const d = haversineDistanceMeters(lat, lng, st.latitude, st.longitude);
      return d <= DUPLICATE_THRESHOLD_METERS;
    });

    if (nearby) {
      const dist = haversineDistanceMeters(lat, lng, nearby.latitude, nearby.longitude);
      setDuplicateWarning(`Nearby Station Detected: "${nearby.name}" is only ${dist}m away. Please verify you are not submitting a duplicate hub.`);
    } else {
      setDuplicateWarning(null);
    }
  };

  // Reverse geocoding via Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        const displayName = data.display_name || '';
        const city = data.address?.city || data.address?.town || data.address?.suburb || data.address?.county || '';
        setAddressDisplay(displayName);
        onLocationSelect({ lat, lng, addressSuggestion: displayName, citySuggestion: city });
      } else {
        onLocationSelect({ lat, lng });
      }
    } catch {
      onLocationSelect({ lat, lng });
    }
  };

  // Update marker position on map
  const updatePosition = (lat: number, lng: number, shouldPan = true, shouldGeocode = true) => {
    const fixedLat = Number(lat.toFixed(6));
    const fixedLng = Number(lng.toFixed(6));
    setCurrentLat(fixedLat);
    setCurrentLng(fixedLng);

    if (markerRef.current) {
      markerRef.current.setLatLng([fixedLat, fixedLng]);
    }

    if (shouldPan && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([fixedLat, fixedLng]);
    }

    checkDuplicateLocation(fixedLat, fixedLng);
    if (shouldGeocode) {
      reverseGeocode(fixedLat, fixedLng);
    } else {
      onLocationSelect({ lat: fixedLat, lng: fixedLng });
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Custom Cyan Pin Icon
    const customIcon = L.divIcon({
      className: 'partner-picker-pin',
      html: `
        <div style="
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0ea5e9;
          color: white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.6);
        ">
          <svg style="transform: rotate(45deg); width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: customIcon,
      draggable: true,
    }).addTo(map);

    marker.bindPopup('<div style="font-size:12px;font-weight:bold;color:#0f172a;">Drag pin or click map to reposition</div>');

    marker.on('dragend', () => {
      const latLng = marker.getLatLng();
      updatePosition(latLng.lat, latLng.lng, false, true);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      updatePosition(e.latlng.lat, e.latlng.lng, true, true);
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    // Trigger initial check
    checkDuplicateLocation(initialLat, initialLng);

    // Invalidate size on container layout
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Search location handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      if (res.ok) {
        const results = await res.json();
        if (results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);
          updatePosition(lat, lon, true, true);
          mapInstanceRef.current?.setView([lat, lon], 15);
        } else {
          alert('No coordinates found for this search. Please try a more specific address or click on the map.');
        }
      }
    } catch {
      alert('Location search service temporarily unavailable. You can click directly on the map to set the location.');
    } finally {
      setIsSearching(false);
    }
  };

  // "Use My Location" handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updatePosition(lat, lng, true, true);
        mapInstanceRef.current?.setView([lat, lng], 16);
        setIsLocating(false);
      },
      err => {
        setIsLocating(false);
        alert(`Location access denied or unavailable (${err.message}). You can select the location on the map.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Search & Location Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search area (e.g. Mehdipatnam, Hyderabad)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all shrink-0"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 border border-sky-500/30 transition-all shrink-0"
        >
          <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'Use My Location'}</span>
        </button>
      </div>

      {/* Duplicate Location Alert (Condition 4) */}
      {duplicateWarning && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="font-semibold">{duplicateWarning}</div>
        </div>
      )}

      {/* Map Canvas Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-inner h-64 sm:h-80 w-full z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Floating Instruction Chip */}
        <div className="absolute top-2 left-2 z-[400] px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-xs border border-slate-800 text-[10px] font-bold text-slate-300 pointer-events-none flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-sky-400" />
          <span>Click map or drag pin to position</span>
        </div>
      </div>

      {/* Live Extracted Coordinates Bar (Condition 7) */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Latitude: </span>
            <span className="font-mono font-bold text-sky-400">{currentLat.toFixed(6)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Longitude: </span>
            <span className="font-mono font-bold text-sky-400">{currentLng.toFixed(6)}</span>
          </div>
        </div>

        {addressDisplay ? (
          <div className="text-[11px] text-slate-400 truncate max-w-md" title={addressDisplay}>
            {addressDisplay}
          </div>
        ) : (
          <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Coordinates Extracted Automatically</span>
          </div>
        )}
      </div>
    </div>
  );
};
