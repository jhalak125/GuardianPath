import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useTrip } from '../../context/TripContext';
import { useSafety } from '../../context/SafetyContext';

export default function SafeHavenMarkers({ map }) {
  const layerGroupRef = useRef(null);
  const { setDestination, fetchRouteComparison, origin } = useTrip();
  const { incidents } = useSafety();

  useEffect(() => {
    if (!map) return;

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    // Fetch all verified safe havens
    fetch('/api/routes/safe-havens?lat=12.9750&lng=77.6100&radius_meters=5000')
      .then(res => res.json())
      .then(havens => {
        if (!havens || !Array.isArray(havens)) return;

        havens.forEach(sh => {
          let badgeColor = '#00FF9D';
          let iconChar = '🏥';

          if (sh.type === 'police') {
            badgeColor = '#00E5FF';
            iconChar = '👮';
          } else if (sh.type === 'hospital') {
            badgeColor = '#FF2A6D';
            iconChar = '🚑';
          } else if (sh.type === 'convenience') {
            badgeColor = '#FFB703';
            iconChar = '🏪';
          } else if (sh.type === 'pharmacy') {
            badgeColor = '#00FF9D';
            iconChar = '💊';
          }

          const havenIcon = L.divIcon({
            className: 'haven-marker-icon',
            html: `
              <div style="
                background: rgba(14, 20, 34, 0.9);
                border: 2px solid ${badgeColor};
                box-shadow: 0 0 14px ${badgeColor};
                width: 32px;
                height: 32px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.2s;
              ">
                ${iconChar}
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const marker = L.marker([sh.lat, sh.lng], { icon: havenIcon }).addTo(layerGroup);

          const featuresHtml = (sh.features || [])
            .map(f => `<span style="background: rgba(0,255,157,0.12); color: #00FF9D; padding: 2px 6px; border-radius: 4px; font-size: 10px; border: 1px solid rgba(0,255,157,0.3); margin-right: 4px; display: inline-block; margin-top: 4px;">✓ ${f}</span>`)
            .join(' ');

          const popupContent = document.createElement('div');
          popupContent.innerHTML = `
            <div style="font-family: var(--font-main); min-width: 210px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="font-size: 16px;">${iconChar}</span>
                <strong style="color: ${badgeColor}; font-size: 14px;">${sh.name}</strong>
              </div>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">
                ${sh.address || 'Verified Indian 24/7 Safe Haven'}
              </div>
              <div style="font-size: 11px; font-family: var(--font-mono); color: var(--neon-cyan); margin-bottom: 6px;">
                📞 ${sh.phone || '112 / 1091 (Police & Women Helpline)'}
              </div>
              <div style="margin-bottom: 10px;">
                ${featuresHtml}
              </div>
              <button id="detour-btn-${sh.id}" style="
                width: 100%;
                background: ${badgeColor};
                color: #070A11;
                font-weight: 700;
                font-size: 11px;
                font-family: var(--font-display);
                letter-spacing: 0.05em;
                padding: 6px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              ">
                REROUTE TO THIS SAFE HAVEN
              </button>
            </div>
          `;

          marker.bindPopup(popupContent);

          marker.on('popupopen', () => {
            const btn = document.getElementById(`detour-btn-${sh.id}`);
            if (btn) {
              btn.onclick = () => {
                const targetDest = { lat: sh.lat, lng: sh.lng, name: sh.name };
                setDestination(targetDest);
                fetchRouteComparison(origin, targetDest);
                marker.closePopup();
              };
            }
          });
        });
      })
      .catch(e => console.warn("Could not fetch safe havens:", e));

    // Also render Crowdsourced Incidents Pins (Hazard Icon)
    if (incidents && Array.isArray(incidents)) {
      incidents.forEach(inc => {
        const hazardIcon = L.divIcon({
          className: 'hazard-marker-icon',
          html: `
            <div style="
              background: rgba(255, 42, 109, 0.25);
              border: 1px solid #FF2A6D;
              box-shadow: 0 0 12px #FF2A6D;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              color: #ffffff;
              animation: liveBeaconPulse 1.5s infinite;
            ">
              ⚠️
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const incMarker = L.marker([inc.lat, inc.lng], { icon: hazardIcon }).addTo(layerGroup);
        incMarker.bindPopup(`
          <div style="font-family: var(--font-main); min-width: 180px;">
            <strong style="color: #FF2A6D;">⚠️ Reported Hazard</strong><br/>
            <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--neon-amber);">${inc.category.replace('_', ' ')} [${inc.severity}]</span><br/>
            <span style="font-size: 12px; color: var(--text-main);">${inc.description}</span><br/>
            <span style="font-size: 10px; font-family: var(--font-mono); color: var(--text-muted);">Community Upvotes: ${inc.upvotes}</span>
          </div>
        `);
      });
    }

    return () => {
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
      }
    };
  }, [map, incidents, origin, setDestination, fetchRouteComparison]);

  return null;
}
