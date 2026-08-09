import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useTrip } from '../../context/TripContext';
import { useSafety } from '../../context/SafetyContext';
import RouteOverlay from './RouteOverlay';
import HeatmapLayer from './HeatmapLayer';
import SafeHavenMarkers from './SafeHavenMarkers';

export default function TacticalMap() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const pulseCircleRef = useRef(null);

  const { currentLocation, isEscortActive } = useTrip();

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [12.9750, 77.6100], // MG Road / Brigade Road, Bengaluru
      zoom: 15,
      zoomControl: true,
      attributionControl: false
    });

    // High-contrast Dark Tactical Vector Tile Layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Marker & Pulsing Radar
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentLocation) return;

    const userLat = currentLocation.lat;
    const userLng = currentLocation.lng;

    // Custom Glowing Tactical User Marker SVG
    const userIconHtml = `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(0, 255, 157, 0.35); animation: liveBeaconPulse 1.8s infinite ease-in-out;"></div>
        <div style="width: 14px; height: 14px; border-radius: 50%; background: #00FF9D; border: 2px solid #ffffff; box-shadow: 0 0 12px #00FF9D;"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      className: 'tactical-user-marker',
      html: userIconHtml,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([userLat, userLng]);
    }

    // Update pulsing radar safety perimeter
    if (!pulseCircleRef.current) {
      pulseCircleRef.current = L.circle([userLat, userLng], {
        radius: 60,
        color: '#00FF9D',
        weight: 1,
        fillColor: '#00FF9D',
        fillOpacity: 0.08
      }).addTo(map);
    } else {
      pulseCircleRef.current.setLatLng([userLat, userLng]);
    }

    if (isEscortActive) {
      map.panTo([userLat, userLng], { animate: true, duration: 0.5 });
    }
  }, [currentLocation, isEscortActive]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
      
      {mapInstanceRef.current && (
        <>
          <HeatmapLayer map={mapInstanceRef.current} />
          <SafeHavenMarkers map={mapInstanceRef.current} />
          <RouteOverlay map={mapInstanceRef.current} />
        </>
      )}
    </div>
  );
}
