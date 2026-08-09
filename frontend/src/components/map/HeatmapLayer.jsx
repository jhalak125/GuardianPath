import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function HeatmapLayer({ map }) {
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    // Fetch graph overview data to render illumination zones and CCTV clusters
    fetch('/api/routes/graph-overview')
      .then(res => res.json())
      .then(data => {
        if (!data || !data.nodes) return;

        data.nodes.forEach(node => {
          const lighting = node.lighting || 0.8;
          const cctv = node.cctv || 0.7;

          // Illumination radius circle
          const illumColor = lighting > 0.8 ? '#00FF9D' : (lighting > 0.5 ? '#FFB703' : '#FF2A6D');
          L.circle([node.lat, node.lng], {
            radius: lighting > 0.8 ? 55 : (lighting > 0.5 ? 40 : 25),
            color: illumColor,
            weight: 1,
            fillColor: illumColor,
            fillOpacity: lighting > 0.8 ? 0.08 : (lighting > 0.5 ? 0.05 : 0.12)
          }).bindTooltip(`
            <div style="font-size: 11px; font-family: var(--font-mono);">
              <strong>${node.name}</strong><br/>
              Lighting: ${Math.round(lighting * 100)}% | CCTV: ${Math.round(cctv * 100)}%
            </div>
          `).addTo(layerGroup);
        });
      })
      .catch(e => {
        console.warn("Could not fetch graph overview for heatmap:", e);
      });

    return () => {
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
      }
    };
  }, [map]);

  return null;
}
