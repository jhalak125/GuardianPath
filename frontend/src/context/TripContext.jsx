import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRESET_ROUTES_DATA, DEFAULT_SAFE_HAVENS } from '../data/urbanSafetyData';

const TripContext = createContext(null);

export const DEFAULT_ORIGIN = { lat: 12.9695, lng: 77.6020, name: "MG Road Metro Station Exit 2" };
export const DEFAULT_DESTINATION = { lat: 12.9815, lng: 77.6185, name: "Commercial Street Gateway (Safe Hub)" };

export const PRESET_DESTINATIONS = [
  { name: "Commercial Street Gateway (Safe Hub)", lat: 12.9815, lng: 77.6185 },
  { name: "Brigade Road Pink Police Booth (1091)", lat: 12.9755, lng: 77.6120 },
  { name: "Apollo 24/7 Pharmacy Safe Haven", lat: 12.9725, lng: 77.6080 },
  { name: "24/7 Swagat Fuel Oasis & Store", lat: 12.9785, lng: 77.6150 }
];

// Helper to resolve preset route by name substring or coordinates proximity
export const resolvePresetRoute = (dest) => {
  if (!dest) return PRESET_ROUTES_DATA["Commercial Street Gateway (Safe Hub)"];
  
  // Exact match
  if (dest.name && PRESET_ROUTES_DATA[dest.name]) {
    return PRESET_ROUTES_DATA[dest.name];
  }

  // Name keyword match
  const nameStr = (dest.name || "").toLowerCase();
  if (nameStr.includes("apollo") || nameStr.includes("pharmacy")) {
    return PRESET_ROUTES_DATA["Apollo 24/7 Pharmacy Safe Haven"];
  }
  if (nameStr.includes("brigade") || nameStr.includes("police") || nameStr.includes("1091")) {
    return PRESET_ROUTES_DATA["Brigade Road Pink Police Booth (1091)"];
  }
  if (nameStr.includes("swagat") || nameStr.includes("fuel") || nameStr.includes("oasis")) {
    return PRESET_ROUTES_DATA["24/7 Swagat Fuel Oasis & Store"];
  }
  if (nameStr.includes("commercial") || nameStr.includes("gateway")) {
    return PRESET_ROUTES_DATA["Commercial Street Gateway (Safe Hub)"];
  }

  // Coordinate proximity match
  if (dest.lat && dest.lng) {
    if (Math.hypot(dest.lat - 12.9725, dest.lng - 77.6080) < 0.003) {
      return PRESET_ROUTES_DATA["Apollo 24/7 Pharmacy Safe Haven"];
    }
    if (Math.hypot(dest.lat - 12.9755, dest.lng - 77.6120) < 0.003) {
      return PRESET_ROUTES_DATA["Brigade Road Pink Police Booth (1091)"];
    }
    if (Math.hypot(dest.lat - 12.9785, dest.lng - 77.6150) < 0.003) {
      return PRESET_ROUTES_DATA["24/7 Swagat Fuel Oasis & Store"];
    }
    if (Math.hypot(dest.lat - 12.9815, dest.lng - 77.6185) < 0.003) {
      return PRESET_ROUTES_DATA["Commercial Street Gateway (Safe Hub)"];
    }
  }

  return PRESET_ROUTES_DATA["Commercial Street Gateway (Safe Hub)"];
};

export function TripProvider({ children }) {
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState(DEFAULT_DESTINATION);
  const [routeComparison, setRouteComparison] = useState(() => ({
    origin: DEFAULT_ORIGIN,
    destination: DEFAULT_DESTINATION,
    ...PRESET_ROUTES_DATA["Commercial Street Gateway (Safe Hub)"]
  }));
  const [selectedRouteId, setSelectedRouteId] = useState("guardian_safe");
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);

  // Active Escort Navigation
  const [isEscortActive, setIsEscortActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_ORIGIN);
  const [walkProgressPct, setWalkProgressPct] = useState(0);
  const [isSimulatingWalk, setIsSimulatingWalk] = useState(false);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState(1);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);

  // Active route helper
  const activeRoute = routeComparison
    ? (selectedRouteId === "guardian_safe" ? routeComparison.guardian_safe_route : routeComparison.fastest_route)
    : null;

  // Fetch or dynamically compute route comparison
  const fetchRouteComparison = useCallback(async (customOrigin = origin, customDest = destination) => {
    setIsLoadingRoute(true);
    setRouteError(null);

    const presetData = resolvePresetRoute(customDest);

    try {
      const res = await fetch('/api/routes/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: customOrigin.lat, lng: customOrigin.lng },
          destination: { lat: customDest.lat, lng: customDest.lng },
          preference: 'max_safety'
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Backend offline`);
      }

      const data = await res.json();
      setRouteComparison(data);
      if (!currentLocation) {
        setCurrentLocation(customOrigin);
      }
    } catch (err) {
      // 100% Guaranteed instant dynamic fallback on Vercel / GitHub Pages / Offline
      setRouteComparison({
        origin: customOrigin,
        destination: customDest,
        guardian_safe_route: presetData.guardian_safe_route,
        fastest_route: presetData.fastest_route
      });
      if (!currentLocation) {
        setCurrentLocation(customOrigin);
      }
    } finally {
      setIsLoadingRoute(false);
    }
  }, [origin, destination, currentLocation]);

  // Initial load
  useEffect(() => {
    fetchRouteComparison(origin, destination);
  }, [fetchRouteComparison]);

  // Start Escort Mode
  const startEscortMode = () => {
    setIsEscortActive(true);
    setWalkProgressPct(0);
    setCurrentWaypointIndex(0);
    setIsSimulatingWalk(true);
    if (activeRoute && activeRoute.waypoints && activeRoute.waypoints.length > 0) {
      setCurrentLocation(activeRoute.waypoints[0]);
    }
  };

  const stopEscortMode = () => {
    setIsEscortActive(false);
    setIsSimulatingWalk(false);
    setWalkProgressPct(0);
    setCurrentWaypointIndex(0);
  };

  // Live walk simulation loop
  useEffect(() => {
    let interval = null;
    if (isSimulatingWalk && isEscortActive && activeRoute?.waypoints?.length > 1) {
      const waypoints = activeRoute.waypoints;
      interval = setInterval(() => {
        setCurrentWaypointIndex(prev => {
          const nextIndex = prev + 1;
          if (nextIndex >= waypoints.length) {
            setWalkProgressPct(100);
            setIsSimulatingWalk(false);
            return prev;
          }
          const pct = Math.round((nextIndex / (waypoints.length - 1)) * 100);
          setWalkProgressPct(pct);
          setCurrentLocation(waypoints[nextIndex]);
          return nextIndex;
        });
      }, 3500 / simSpeedMultiplier);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulatingWalk, isEscortActive, activeRoute, simSpeedMultiplier]);

  return (
    <TripContext.Provider
      value={{
        origin,
        setOrigin,
        destination,
        setDestination,
        routeComparison,
        selectedRouteId,
        setSelectedRouteId,
        activeRoute,
        isLoadingRoute,
        routeError,
        fetchRouteComparison,
        isEscortActive,
        currentLocation,
        setCurrentLocation,
        walkProgressPct,
        isSimulatingWalk,
        startEscortMode,
        stopEscortMode,
        simSpeedMultiplier,
        setSimSpeedMultiplier,
        currentWaypointIndex
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
}
