import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Lightbulb, 
  Camera, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { useTrip, PRESET_DESTINATIONS } from '../../context/TripContext';
import { useSafety } from '../../context/SafetyContext';

export default function RouteCard() {
  const { 
    routeComparison, 
    selectedRouteId, 
    setSelectedRouteId, 
    startEscortMode, 
    isLoadingRoute,
    destination,
    setDestination,
    origin,
    fetchRouteComparison
  } = useTrip();

  const { setActiveTab } = useSafety();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  if (!routeComparison) {
    return (
      <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
        <span style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          {isLoadingRoute ? 'CALCULATING SAFETY-WEIGHTED ROUTES...' : 'NO ROUTE LOADED'}
        </span>
      </div>
    );
  }

  const { fastest_route, guardian_safe_route } = routeComparison;

  const handleStartEscort = () => {
    startEscortMode();
    setActiveTab('escort');
  };

  const timeDiff = guardian_safe_route && fastest_route
    ? Math.round((guardian_safe_route.duration_minutes - fastest_route.duration_minutes) * 10) / 10
    : 0;

  return (
    <div className="route-card-container">
      
      {/* 1. Destination Selector (Always Visible) */}
      <div className="glass-panel" style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            TARGET DESTINATION
          </span>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-emerald)' }}>
            ✓ SAFE CORRIDOR
          </span>
        </div>

        <select 
          className="tactical-select"
          value={destination.name}
          onChange={(e) => {
            const chosen = PRESET_DESTINATIONS.find(d => d.name === e.target.value);
            if (chosen) {
              setDestination(chosen);
              fetchRouteComparison(origin, chosen);
            }
          }}
        >
          {PRESET_DESTINATIONS.map((dest, idx) => (
            <option key={idx} value={dest.name} style={{ background: '#0E1422', color: '#fff' }}>
              📍 {dest.name}
            </option>
          ))}
        </select>
      </div>

      {/* =========================================================================
          DESKTOP FULL VIEW: Everything Fully Visible & Expanded
          ========================================================================= */}
      <div className="desktop-routes-view">
        {/* Recommended Safe Route Card */}
        {guardian_safe_route && (
          <div 
            className={`route-card ${selectedRouteId === 'guardian_safe' ? 'selected-safe' : ''}`}
            onClick={() => setSelectedRouteId('guardian_safe')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <span className="route-badge-safe">
                <ShieldCheck size={12} />
                RECOMMENDED SAFE
              </span>

              <div className="safety-score-pill" style={{ color: 'var(--neon-emerald)' }}>
                <span>{guardian_safe_route.safety_score}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/100 SAFETY</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                {guardian_safe_route.duration_minutes} min
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                ({guardian_safe_route.distance_meters}m)
              </span>
            </div>

            {/* Metrics Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '8px' }}>
              <div style={{ background: 'rgba(0, 255, 157, 0.08)', padding: '6px', borderRadius: '4px', textAlign: 'center', border: '1px solid rgba(0, 255, 157, 0.2)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <Lightbulb size={10} color="var(--neon-emerald)" /> LIGHT
                </div>
                <strong style={{ fontSize: '12px', color: 'var(--neon-emerald)', fontFamily: 'var(--font-mono)' }}>
                  {guardian_safe_route.lighting_coverage_pct}%
                </strong>
              </div>

              <div style={{ background: 'rgba(0, 229, 255, 0.08)', padding: '6px', borderRadius: '4px', textAlign: 'center', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <Camera size={10} color="var(--neon-cyan)" /> CCTV
                </div>
                <strong style={{ fontSize: '12px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {guardian_safe_route.cctv_coverage_pct}%
                </strong>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '6px', borderRadius: '4px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <Building2 size={10} color="#fff" /> HAVENS
                </div>
                <strong style={{ fontSize: '12px', color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {guardian_safe_route.safe_havens_count}
                </strong>
              </div>
            </div>

            {/* Safe Havens List */}
            {guardian_safe_route.safe_havens_along_route?.length > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                <div style={{ fontWeight: 600, color: 'var(--neon-emerald)', marginBottom: '3px' }}>
                  Safe Havens On Path:
                </div>
                {guardian_safe_route.safe_havens_along_route.map((sh, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <CheckCircle2 size={11} color="var(--neon-emerald)" />
                    <span>{sh.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fastest Direct Route Card */}
        {fastest_route && (
          <div 
            className={`route-card ${selectedRouteId === 'fastest' ? 'selected-fastest' : ''}`}
            onClick={() => setSelectedRouteId('fastest')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <span className="route-badge-fastest">
                <Zap size={12} />
                FASTEST (UNSECURED)
              </span>

              <div className="safety-score-pill" style={{ color: 'var(--neon-crimson)' }}>
                <span>{fastest_route.safety_score}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/100 SAFETY</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                {fastest_route.duration_minutes} min
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                ({fastest_route.distance_meters}m) {timeDiff > 0.1 ? `• ${timeDiff} min faster` : '• Direct unlit shortcut'}
              </span>
            </div>

            {/* Warnings */}
            {fastest_route.hazard_warnings?.length > 0 && (
              <div style={{ background: 'rgba(255, 42, 109, 0.12)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255, 42, 109, 0.3)', fontSize: '11px', color: '#ff8cae' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <AlertTriangle size={12} color="var(--neon-crimson)" /> Hazard Risks:
                </div>
                {fastest_route.hazard_warnings.map((w, i) => (
                  <div key={i} style={{ marginTop: '2px', paddingLeft: '16px' }}>• {w}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          MOBILE COMPACT VIEW: Only Essential Info with Glance Mode
          ========================================================================= */}
      <div className="mobile-routes-view">
        {/* Quick Side-by-Side Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', margin: '4px 0' }}>
          <button
            onClick={() => setSelectedRouteId('guardian_safe')}
            style={{
              background: selectedRouteId === 'guardian_safe' ? 'rgba(0, 255, 157, 0.16)' : 'rgba(255, 255, 255, 0.04)',
              border: selectedRouteId === 'guardian_safe' ? '1px solid var(--border-emerald)' : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '8px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--neon-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} /> SAFE
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--neon-emerald)' }}>
                {guardian_safe_route?.safety_score}%
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, marginTop: '2px' }}>
              {guardian_safe_route?.duration_minutes} min <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>({guardian_safe_route?.distance_meters}m)</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedRouteId('fastest')}
            style={{
              background: selectedRouteId === 'fastest' ? 'rgba(255, 42, 109, 0.16)' : 'rgba(255, 255, 255, 0.04)',
              border: selectedRouteId === 'fastest' ? '1px solid var(--border-crimson)' : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '8px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--neon-amber)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={13} /> FASTEST
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--neon-crimson)' }}>
                {fastest_route?.safety_score}%
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, marginTop: '2px' }}>
              {fastest_route?.duration_minutes} min <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>({fastest_route?.distance_meters}m)</span>
            </div>
          </button>
        </div>

        {/* Mobile Expand Toggle */}
        <button
          onClick={() => setIsMobileExpanded(prev => !prev)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--neon-cyan)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            cursor: 'pointer',
            padding: '2px 0 4px',
            width: '100%'
          }}
        >
          <span>{isMobileExpanded ? 'HIDE METRICS & HAZARDS' : 'VIEW SAFETY METRICS & HAZARDS'}</span>
          {isMobileExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {/* Expanded Mobile Details */}
        {isMobileExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '4px' }}>
            {selectedRouteId === 'guardian_safe' && guardian_safe_route && (
              <div className="glass-panel" style={{ padding: '8px 10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '6px' }}>
                  <div style={{ background: 'rgba(0, 255, 157, 0.08)', padding: '4px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>LIGHT</div>
                    <strong style={{ fontSize: '11px', color: 'var(--neon-emerald)' }}>{guardian_safe_route.lighting_coverage_pct}%</strong>
                  </div>
                  <div style={{ background: 'rgba(0, 229, 255, 0.08)', padding: '4px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>CCTV</div>
                    <strong style={{ fontSize: '11px', color: 'var(--neon-cyan)' }}>{guardian_safe_route.cctv_coverage_pct}%</strong>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>HAVENS</div>
                    <strong style={{ fontSize: '11px', color: '#fff' }}>{guardian_safe_route.safe_havens_count}</strong>
                  </div>
                </div>
                {guardian_safe_route.safe_havens_along_route?.map((sh, i) => (
                  <div key={i} style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={10} color="var(--neon-emerald)" /> {sh.name}
                  </div>
                ))}
              </div>
            )}

            {selectedRouteId === 'fastest' && fastest_route && (
              <div style={{ background: 'rgba(255, 42, 109, 0.12)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255, 42, 109, 0.3)', fontSize: '10px', color: '#ff8cae' }}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={11} color="var(--neon-crimson)" /> Hazard Risks:
                </div>
                {fastest_route.hazard_warnings?.map((w, i) => (
                  <div key={i} style={{ marginTop: '2px', paddingLeft: '14px' }}>• {w}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Start Escort Button (Always Visible) */}
      <button 
        className="checkin-btn"
        onClick={handleStartEscort}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '8px', 
          padding: '10px 14px',
          fontSize: '0.95rem'
        }}
      >
        <ShieldCheck size={18} />
        <span>START GUARDIAN LIVE ESCORT</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
