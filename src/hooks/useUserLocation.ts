import { useEffect, useState, useCallback } from 'react';
import { locationService, LocationState } from '@/services/locationService';

export function useUserLocation() {
  const [location, setLocation] = useState<LocationState>(locationService.getState());

  useEffect(() => {
    const unsubscribe = locationService.subscribe(newLocation => {
      setLocation(newLocation);
    });
    return unsubscribe;
  }, []);

  const requestLocation = useCallback(() => {
    locationService.startTracking();
  }, []);

  const stopLocation = useCallback(() => {
    locationService.stopTracking();
  }, []);

  return {
    ...location,
    requestLocation,
    stopLocation,
    isLive: location.trackingState === 'active' && location.latitude !== null && location.longitude !== null,
  };
}
