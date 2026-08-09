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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Session Header Card */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--neon-cyan)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
              TRUSTED CONTACT LIVE VIEWER
            </span>
          </div>

          <div className={`hud-badge ${connectionStatus === 'CONNECTED' ? 'active' : 'warning'}`}>
            <Radio size={12} className={connectionStatus === 'CONNECTED' ? 'animate-beacon-live' : ''} />
            <span>WS {connectionStatus}</span>
          </div>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          This view displays what your authorized family & emergency contacts see in real-time as you walk.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, background: 'rgba(0, 0, 0, 0.4)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--neon-cyan)' }}>
            SESSION: {sessionId}
          </div>

          <button
            className="hud-action-btn hud-btn-emerald"
            onClick={copyShareLink}
            style={{ padding: '8px 14px' }}
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            <span>{copied ? 'COPIED!' : 'SHARE LINK'}</span>
          </button>
        </div>
      </div>

      {/* Live Peer Telemetry Stream */}
      <div className={`glass-panel ${isSOSActive ? 'glass-panel-crimson animate-pulse-crimson' : 'glass-panel-cyan'}`} style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: isSOSActive ? 'var(--neon-crimson)' : 'var(--neon-cyan)' }}>
            TELEMETRY STREAM: ANANYA / AARAV (WALKER)
          </span>
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            UPDATED: {lastPing || 'Syncing...'}
          </span>
        </div>

        {/* Status Pill */}
        <div style={{ 
          background: isSOSActive ? 'var(--neon-crimson)' : 'rgba(0, 255, 157, 0.15)', 
          color: isSOSActive ? '#fff' : 'var(--neon-emerald)',
          border: isSOSActive ? 'none' : '1px solid var(--border-emerald)',
          padding: '8px 12px', 
          borderRadius: '8px', 
          fontWeight: 700, 
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px'
        }}>
          {isSOSActive ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
          <span>{isSOSActive ? 'CRITICAL EMERGENCY: 112 / 1091 SOS BROADCAST ACTIVE!' : (isEscortActive ? 'EN ROUTE SAFE (WELL-LIT MG ROAD CORRIDOR)' : 'STANDBY AT METRO STATION')}</span>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <MapPin size={12} color="var(--neon-cyan)" /> LIVE GPS POSITION
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#fff', marginTop: '4px' }}>
              {currentLocation ? `${currentLocation.lat.toFixed(4)}° N, ${currentLocation.lng.toFixed(4)}° E` : 'Tracking...'}
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <BatteryMedium size={12} color="var(--neon-emerald)" /> BATTERY & SPEED
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#fff', marginTop: '4px' }}>
              88% | 1.2 m/s Walk
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <Building2 size={12} color="var(--neon-emerald)" /> NEAREST SAFE HAVEN
            </div>
            <div style={{ fontSize: '11px', color: 'var(--neon-emerald)', marginTop: '4px' }}>
              Apollo 24/7 Pharmacy Safe Hub (45m)
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <Activity size={12} color="var(--neon-cyan)" /> AMBIENT DECIBELS
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#fff', marginTop: '4px' }}>
              {currentDecibels} dB (Normal Ambiance)
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contacts List */}
      <div className="glass-panel" style={{ padding: '14px' }}>
        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px' }}>
          AUTHORIZED INDIAN CONTACT SUBSCRIBERS
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {contacts.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: '6px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{c.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.phone} • {c.relationship}</div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--neon-emerald)', background: 'rgba(0, 255, 157, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-emerald)' }}>
                ✓ SUBSCRIBED
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
