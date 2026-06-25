import { useState, useCallback, useEffect } from "react";

export type LocationStatus = "idle" | "loading" | "granted" | "denied" | "unsupported";

export interface UseUserLocationResult {
  coords: { lat: number; lng: number } | null;
  status: LocationStatus;
  request: () => void;
}

const STORAGE_KEY = "hiram_user_coords";

export function useUserLocation(): UseUserLocationResult {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as { lat: number; lng: number }) : null;
    } catch {
      return null;
    }
  });

  const [status, setStatus] = useState<LocationStatus>(() =>
    sessionStorage.getItem(STORAGE_KEY) ? "granted" : "idle"
  );

  useEffect(() => {
    if (!navigator.geolocation) setStatus("unsupported");
  }, []);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setStatus("granted");
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(c));
      },
      () => setStatus("denied")
    );
  }, []);

  return { coords, status, request };
}
