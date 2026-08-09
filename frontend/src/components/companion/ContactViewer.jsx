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

  const latStr = currentLocation ? `${currentLocation.lat.toFixed(4)}° N, ${currentLocation.lng.toFixed(4)}° E` : 'Tracking...';

  return (
    <div>
      {/* =========================================================================
          DESKTOP FULL VIEW: Everything Fully Expanded
          ========================================================================= */}
      <div className="desktop-tracker-view" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Session Header Card */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
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

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
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
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            {isSOSActive ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
            <span>{isSOSActive ? 'CRITICAL EMERGENCY: 112 SOS ACTIVE!' : (isEscortActive ? 'EN ROUTE SAFE (WELL-LIT MG ROAD CORRIDOR)' : 'STANDBY AT METRO STATION')}</span>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                <MapPin size={11} color="var(--neon-cyan)" /> LIVE GPS POSITION
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#fff', marginTop: '3px' }}>
                {latStr}
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                <BatteryMedium size={11} color="var(--neon-emerald)" /> BATTERY & SPEED
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#fff', marginTop: '3px' }}>
                88% | 1.2 m/s Walk
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE COMPACT GLANCE VIEW: Fits into ~140px with Zero Scrolling
          ========================================================================= */}
      <div className="mobile-tracker-view">
        <div className="glass-panel" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          
          {/* Row 1: Session ID + Live WS Status + Share Link */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={14} color="var(--neon-cyan)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                {sessionId.substring(0, 14)}...
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

          {/* Row 2: Compact Status Pill */}
          <div style={{
            background: isSOSActive ? 'var(--neon-crimson)' : 'rgba(0, 255, 157, 0.12)',
            color: isSOSActive ? '#fff' : 'var(--neon-emerald)',
            border: isSOSActive ? 'none' : '1px solid rgba(0, 255, 157, 0.3)',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {isSOSActive ? <AlertTriangle size={13} /> : <ShieldCheck size={13} />}
            <span>{isSOSActive ? 'CRITICAL SOS ACTIVE (112 ALERTED)' : (isEscortActive ? 'EN ROUTE SAFE (WELL-LIT CORRIDOR)' : 'STANDBY AT METRO STATION')}</span>
          </div>

          {/* Row 3: 2-Column Compact Telemetry */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>📍 GPS POSITION</div>
              <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                {latStr}
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>⚡ BATTERY & SPEED</div>
              <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                88% • 1.2 m/s
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
