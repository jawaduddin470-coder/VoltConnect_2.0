/**
 * VOLTCONNECT 2.0 — SINGLETON GEOLOCATION SERVICE
 * Wraps browser navigator.geolocation.watchPosition with zero memory leaks,
 * client-side tracking state, accuracy validation, and event listener subscriptions.
 */

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null; // meters
  heading: number | null; // degrees
  speed: number | null; // m/s
  timestamp: number | null;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unsupported';
  trackingState: 'idle' | 'locating' | 'active' | 'error';
  errorMessage: string | null;
}

type LocationListener = (state: LocationState) => void;

class LocationService {
  private state: LocationState = {
    latitude: null,
    longitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
    permissionState: typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'prompt' : 'unsupported',
    trackingState: 'idle',
    errorMessage: null,
  };

  private listeners: Set<LocationListener> = new Set();
  private watchId: number | null = null;

  public getState(): LocationState {
    return { ...this.state };
  }

  public subscribe(listener: LocationListener): () => void {
    this.listeners.add(listener);
    // Push current state immediately
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach(listener => listener(currentState));
  }

  /**
   * Starts live geolocation tracking via watchPosition.
   * Reuses existing watcher if already active.
   */
  public startTracking(): void {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      this.state = {
        ...this.state,
        permissionState: 'unsupported',
        trackingState: 'error',
        errorMessage: 'Geolocation is not supported by your browser.',
      };
      this.notify();
      return;
    }

    if (this.watchId !== null) {
      // Already tracking
      return;
    }

    this.state = {
      ...this.state,
      trackingState: 'locating',
      errorMessage: null,
    };
    this.notify();

    this.watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        this.state = {
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          heading: heading || null,
          speed: speed || null,
          timestamp: pos.timestamp,
          permissionState: 'granted',
          trackingState: 'active',
          errorMessage: null,
        };
        this.notify();
      },
      err => {
        let msg = 'Failed to obtain live location.';
        let permState: LocationState['permissionState'] = this.state.permissionState;

        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = 'Location access is disabled. Please enable location permission in your browser settings.';
            permState = 'denied';
            break;
          case err.POSITION_UNAVAILABLE:
            msg = 'GPS location is currently unavailable. Please check your device location settings.';
            break;
          case err.TIMEOUT:
            msg = 'Location request timed out. Please try again.';
            break;
        }

        this.state = {
          ...this.state,
          permissionState: permState,
          trackingState: 'error',
          errorMessage: msg,
        };
        this.notify();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  }

  /**
   * Stops active geolocation watcher.
   */
  public stopTracking(): void {
    if (this.watchId !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.state = {
      ...this.state,
      trackingState: 'idle',
    };
    this.notify();
  }
}

export const locationService = new LocationService();
