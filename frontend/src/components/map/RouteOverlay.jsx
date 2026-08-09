import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useTrip } from '../../context/TripContext';

export default function RouteOverlay({ map }) {
  const { routeComparison, selectedRouteId, origin, destination } = useTrip();

  const safeLineRef = useRef(null);
  const safeGlowLineRef = useRef(null);
  const fastestLineRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);

  useEffect(() => {
    if (!map || !routeComparison) return;

    const { fastest_route, guardian_safe_route } = routeComparison;

    // Clean previous layers
    if (safeLineRef.current) map.removeLayer(safeLineRef.current);
    if (safeGlowLineRef.current) map.removeLayer(safeGlowLineRef.current);
    if (fastestLineRef.current) map.removeLayer(fastestLineRef.current);
    if (originMarkerRef.current) map.removeLayer(originMarkerRef.current);
    if (destMarkerRef.current) map.removeLayer(destMarkerRef.current);

    // 1. Draw Fastest Route Polyline (Amber Dashed)
    if (fastest_route && fastest_route.waypoints) {
      const fastCoords = fastest_route.waypoints.map(w => [w.lat, w.lng]);
      fastestLineRef.current = L.polyline(fastCoords, {
        color: '#FFB703',
        weight: selectedRouteId === 'fastest' ? 5 : 3,
        dashArray: '8, 8',
        opacity: selectedRouteId === 'fastest' ? 0.95 : 0.45,
        lineCap: 'round'
      }).addTo(map);

      fastestLineRef.current.bindPopup(`
        <div style="font-family: var(--font-main);">
          <strong style="color: #FFB703;">⚡ Fastest Direct Route</strong><br/>
          <span>Distance: ${fastest_route.distance_meters}m (${fastest_route.duration_minutes} min)</span><br/>
          <span>Safety Rating: <strong style="color: #FF2A6D;">${fastest_route.safety_score}%</strong> (Low lighting alleys)</span>
        </div>
      `);
    }

    // 2. Draw Guardian Safe Route Polyline (Neon Emerald with Glow Underlay)
    if (guardian_safe_route && guardian_safe_route.waypoints) {
      const safeCoords = guardian_safe_route.waypoints.map(w => [w.lat, w.lng]);
      
      // Outer glow line
      safeGlowLineRef.current = L.polyline(safeCoords, {
        color: '#00FF9D',
        weight: selectedRouteId === 'guardian_safe' ? 12 : 6,
        opacity: selectedRouteId === 'guardian_safe' ? 0.35 : 0.15,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Core crisp line
      safeLineRef.current = L.polyline(safeCoords, {
        color: '#00FF9D',
        weight: selectedRouteId === 'guardian_safe' ? 5 : 3,
        opacity: selectedRouteId === 'guardian_safe' ? 1 : 0.6,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      safeLineRef.current.bindPopup(`
        <div style="font-family: var(--font-main);">
          <strong style="color: #00FF9D;">🛡️ Guardian Safe Route</strong><br/>
          <span>Distance: ${guardian_safe_route.distance_meters}m (${guardian_safe_route.duration_minutes} min)</span><br/>
          <span>Safety Rating: <strong style="color: #00FF9D;">${guardian_safe_route.safety_score}%</strong></span><br/>
          <span>Lighting: ${guardian_safe_route.lighting_coverage_pct}% | Safe Havens: ${guardian_safe_route.safe_havens_count}</span>
        </div>
      `);
    }

    // 3. Origin Marker
    const originIcon = L.divIcon({
      className: 'route-origin-pin',
      html: `
        <div style="background: #00E5FF; color: #070A11; padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 10px; font-weight: 700; border: 1px solid #ffffff; box-shadow: 0 0 10px #00E5FF; text-align: center; white-space: nowrap;">
          ORIGIN
        </div>
      `,
      iconSize: [50, 20],
      iconAnchor: [25, 24]
    });
    originMarkerRef.current = L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(map);

    // 4. Destination Marker
    const destIcon = L.divIcon({
      className: 'route-dest-pin',
      html: `
        <div style="background: #FF2A6D; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 10px; font-weight: 700; border: 1px solid #ffffff; box-shadow: 0 0 12px #FF2A6D; text-align: center; white-space: nowrap;">
          TARGET
        </div>
      `,
      iconSize: [50, 20],
      iconAnchor: [25, 24]
    });
    destMarkerRef.current = L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(map);

    return () => {
      if (safeLineRef.current) map.removeLayer(safeLineRef.current);
      if (safeGlowLineRef.current) map.removeLayer(safeGlowLineRef.current);
      if (fastestLineRef.current) map.removeLayer(fastestLineRef.current);
      if (originMarkerRef.current) map.removeLayer(originMarkerRef.current);
      if (destMarkerRef.current) map.removeLayer(destMarkerRef.current);
    };
  }, [map, routeComparison, selectedRouteId, origin, destination]);

  return null;
}
