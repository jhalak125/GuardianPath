import React, { useState } from 'react';
import { 
  Users, 
  Radio, 
  BatteryMedium, 
  MapPin, 
  Clock, 
  Building2, 
  ShieldCheck, 
  Share2, 
  Copy, 
  CheckCircle,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { useTrip } from '../../context/TripContext';
import { useLiveWebSocket } from '../../hooks/useLiveWebSocket';

export default function ContactViewer() {
  const { sessionId, contacts, isSOSActive, currentDecibels } = useSafety();
  const { currentLocation, isEscortActive } = useTrip();

  const [copied, setCopied] = useState(false);

  // WebSocket Live Hook
  const { connectionStatus, peerStatus, lastPing } = useLiveWebSocket({
    sessionId: sessionId,
    isBroadcasting: isEscortActive,
    telemetryData: {
      session_id: sessionId,
      lat: currentLocation?.lat,
      lng: currentLocation?.lng,
      battery_level: 88,
      speed_mps: 1.2,
      dead_man_timer_remaining: 180,
      ambient_decibels: currentDecibels,
      status: isSOSActive ? "SOS_ACTIVE" : (isEscortActive ? "EN_ROUTE_SAFE" : "STANDBY")
    }
  });

  const copyShareLink = () => {
    const link = `${window.location.origin}/?session=${sessionId}&mode=tracker`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const latStr = currentLocation ? `${currentLocation.lat.toFixed(4)}° N, ${currentLocation.lng.toFixed(4)}° E` : '12.9695° N, 77.6020° E';

  return (
    <div className="glass-panel" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '100%' }}>
      
      {/* Row 1: Header + Live WS Status + Share Link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={16} color="var(--neon-cyan)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: '#fff', letterSpacing: '0.04em' }}>
            TRUSTED CONTACT VIEWER
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className={`hud-badge ${connectionStatus === 'CONNECTED' ? 'active' : 'warning'}`} style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
            WS {connectionStatus}
          </span>
          <button
            className="hud-action-btn hud-btn-emerald"
            onClick={copyShareLink}
            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
          >
            {copied ? <CheckCircle size={11} /> : <Copy size={11} />}
            <span>{copied ? 'COPIED' : 'SHARE'}</span>
          </button>
        </div>
      </div>

      {/* Row 2: Status Pill */}
      <div style={{
        background: isSOSActive ? 'var(--neon-crimson)' : 'rgba(0, 255, 157, 0.12)',
        color: isSOSActive ? '#fff' : 'var(--neon-emerald)',
        border: isSOSActive ? 'none' : '1px solid rgba(0, 255, 157, 0.3)',
        borderRadius: '6px',
        padding: '5px 8px',
        fontSize: '0.75rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {isSOSActive ? <AlertTriangle size={13} /> : <ShieldCheck size={13} />}
        <span>{isSOSActive ? 'CRITICAL SOS ACTIVE (112 ALERTED)' : (isEscortActive ? 'EN ROUTE SAFE (WELL-LIT CORRIDOR)' : 'STANDBY AT METRO STATION')}</span>
      </div>

      {/* Row 3: 2-Column Compact Telemetry (ALWAYS VISIBLE) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <div style={{ background: 'rgba(0, 0, 0, 0.45)', padding: '5px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>📍 GPS POSITION</div>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#fff', fontWeight: 600 }}>
            {latStr}
          </div>
        </div>

        <div style={{ background: 'rgba(0, 0, 0, 0.45)', padding: '5px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>⚡ BATTERY & SPEED</div>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#fff', fontWeight: 600 }}>
            88% • 1.2 m/s Walk
          </div>
        </div>
      </div>

    </div>
  );
}
