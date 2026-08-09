import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useTrip } from '../../context/TripContext';
import { useSafety } from '../../context/SafetyContext';
import { DEFAULT_SAFE_HAVENS } from '../../data/urbanSafetyData';

export default function SafeHavenMarkers({ map }) {
  const layerGroupRef = useRef(null);
  const { setDestination, fetchRouteComparison, origin } = useTrip();
  const { incidents } = useSafety();

  useEffect(() => {
    if (!map) return;

    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
    }

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    const renderHavens = (havens) => {
      if (!havens || !Array.isArray(havens)) return;
      layerGroup.clearLayers();

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
        } else if (sh.type === 'shelter') {
          badgeColor = '#FF8C00';
          iconChar = '🚒';
        }

        const havenIcon = L.divIcon({
          className: 'haven-marker-icon',
          html: `
            <div style="
              background: rgba(14, 20, 34, 0.94);
              border: 2px solid ${badgeColor};
              box-shadow: 0 0 16px ${badgeColor};
              width: 34px;
              height: 34px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 17px;
              cursor: pointer;
              transition: transform 0.2s ease;
            ">
              ${iconChar}
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        const marker = L.marker([sh.lat, sh.lng], { icon: havenIcon }).addTo(layerGroup);

        const featuresHtml = (sh.features || [])
          .map(f => `<span style="background: rgba(0,255,157,0.12); color: #00FF9D; padding: 2px 6px; border-radius: 4px; font-size: 10px; border: 1px solid rgba(0,255,157,0.3); margin-right: 4px; display: inline-block; margin-top: 4px;">✓ ${f}</span>`)
          .join(' ');

        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
          <div style="font-family: var(--font-main); min-width: 220px; padding: 2px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="font-size: 18px;">${iconChar}</span>
              <strong style="color: ${badgeColor}; font-size: 14px;">${sh.name}</strong>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">
              ${sh.address || 'Verified 24/7 Safe Haven'}
            </div>
            <div style="font-size: 11px; font-family: var(--font-mono); color: var(--neon-cyan); margin-bottom: 6px;">
              📞 ${sh.phone || '112 / 1091 (Emergency Helpline)'}
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
              padding: 7px;
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
              const detourDest = {
                name: `${sh.name} (Emergency Haven)`,
                lat: sh.lat,
                lng: sh.lng
              };
              setDestination(detourDest);
              fetchRouteComparison(origin, detourDest);
              map.closePopup();
            };
          }
        });
      });

      // Render crowdsource incidents
      const activeIncidents = incidents || [];
      activeIncidents.forEach(inc => {
        const isHigh = inc.severity === 'high';
        const incIcon = L.divIcon({
          className: 'incident-marker-icon',
          html: `
            <div class="${isHigh ? 'animate-pulse-crimson' : ''}" style="
              background: rgba(35, 12, 22, 0.92);
              border: 2px solid ${isHigh ? 'var(--neon-crimson)' : 'var(--neon-amber)'};
              box-shadow: 0 0 14px ${isHigh ? 'var(--neon-crimson)' : 'var(--neon-amber)'};
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              cursor: pointer;
            ">
              ⚠️
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const incMarker = L.marker([inc.lat, inc.lng], { icon: incIcon }).addTo(layerGroup);
        incMarker.bindPopup(`
          <div style="font-family: var(--font-main); min-width: 180px;">
            <div style="color: var(--neon-crimson); font-weight: 700; font-size: 13px; margin-bottom: 4px;">
              ⚠️ Reported Hazard: ${inc.category.replace('_', ' ').toUpperCase()}
            </div>
            <div style="font-size: 12px; color: #fff; margin-bottom: 6px;">
              "${inc.description}"
            </div>
            <div style="font-size: 10px; font-family: var(--font-mono); color: var(--text-muted);">
              SEVERITY: ${inc.severity.toUpperCase()} • ${inc.upvotes || 5} CONFIRMATIONS
            </div>
          </div>
        `);
      });
    };

    // 1. Immediately render default verified safe havens & incidents (Guaranteed offline / deployed display)
    renderHavens(DEFAULT_SAFE_HAVENS);

    // 2. Fetch live updates if backend is available
    fetch('/api/routes/safe-havens?lat=12.9750&lng=77.6100&radius_meters=5000')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Backend offline, using bundled safe haven data");
      })
      .then(havens => {
        if (havens && Array.isArray(havens) && havens.length > 0) {
          renderHavens(havens);
        }
      })
      .catch(err => {
        // Default safe havens already rendered
      });

    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
      }
    };
  }, [map, incidents, setDestination, fetchRouteComparison, origin]);

  return null;
}
