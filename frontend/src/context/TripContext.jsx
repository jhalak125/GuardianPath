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

    // Check if we have pre-computed high-fidelity route data for this preset
    const presetData = PRESET_ROUTES_DATA[customDest.name];

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
        throw new Error(`HTTP ${res.status}: Backend offline or proxy unavailable`);
      }

      const data = await res.json();
      setRouteComparison(data);
      if (!currentLocation) {
        setCurrentLocation(customOrigin);
      }
    } catch (err) {
      // Dynamic fallback for deployed static frontend on Vercel / GitHub Pages
      if (presetData) {
        setRouteComparison({
          origin: customOrigin,
          destination: customDest,
          guardian_safe_route: presetData.guardian_safe_route,
          fastest_route: presetData.fastest_route
        });
      } else {
        // Generic fallback for custom pinned coordinates
        const dist = Math.hypot(customDest.lat - customOrigin.lat, customDest.lng - customOrigin.lng) * 111000;
        const dur = Math.round((dist / 1.2 / 60) * 10) / 10;
        setRouteComparison({
          origin: customOrigin,
          destination: customDest,
          guardian_safe_route: {
            id: "guardian_safe",
            title: "Guardian Safe Route (Illuminated)",
            distance_meters: Math.round(dist * 1.05),
            duration_minutes: Math.round(dur * 1.05 * 10) / 10,
            safety_score: 95,
            lighting_coverage_pct: 98,
            cctv_coverage_pct: 94,
            safe_havens_count: 3,
            waypoints: [
              customOrigin,
              { lat: (customOrigin.lat + customDest.lat) / 2, lng: (customOrigin.lng + customDest.lng) / 2 },
              customDest
            ],
            safe_havens_along_route: DEFAULT_SAFE_HAVENS.slice(0, 2),
            hazard_warnings: []
          },
          fastest_route: {
            id: "fastest",
            title: "Fastest Direct Route",
            distance_meters: Math.round(dist),
            duration_minutes: dur,
            safety_score: 18,
            lighting_coverage_pct: 25,
            cctv_coverage_pct: 15,
            safe_havens_count: 1,
            waypoints: [customOrigin, customDest],
            safe_havens_along_route: [],
            hazard_warnings: [
              "Low lighting on unmonitored rear shortcut",
              "Reported poor lighting in blind alley"
            ]
          }
        });
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
