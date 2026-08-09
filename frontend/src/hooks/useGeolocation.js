import { useState, useEffect, useCallback } from 'react';

export function useGeolocation({ defaultLocation = { lat: 40.7128, lng: -74.0060 } } = {}) {
  const [coords, setCoords] = useState(defaultLocation);
  const [accuracy, setAccuracy] = useState(12); // meters
  const [speed, setSpeed] = useState(1.2); // m/s
  const [heading, setHeading] = useState(45); // degrees
  const [isLiveGps, setIsLiveGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("SIMULATED"); // ACQUIRED, SEARCHING, SIMULATED

  const enableRealGps = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGpsStatus("SEARCHING");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setAccuracy(Math.round(position.coords.accuracy || 8));
        setSpeed(position.coords.speed ? Math.round(position.coords.speed * 10) / 10 : 1.2);
        if (position.coords.heading) setHeading(Math.round(position.coords.heading));
        setIsLiveGps(true);
        setGpsStatus("ACQUIRED");
      },
      (err) => {
        console.warn("Real GPS access error, defaulting to simulated GPS:", err.message);
        setGpsStatus("SIMULATED");
        setIsLiveGps(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return {
    coords,
    setCoords,
    accuracy,
    speed,
    heading,
    isLiveGps,
    gpsStatus,
    enableRealGps
  };
}
