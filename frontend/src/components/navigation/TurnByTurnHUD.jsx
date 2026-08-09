import React from 'react';
import { ShieldCheck, MapPin, ArrowUpRight, CheckCircle } from 'lucide-react';
import { useTrip } from '../../context/TripContext';

export default function TurnByTurnHUD() {
  const { activeRoute, walkProgressPct, isEscortActive } = useTrip();

  if (!isEscortActive || !activeRoute) return null;

  // Detect nearest safe haven along route
  const nextHaven = activeRoute.safe_havens_along_route && activeRoute.safe_havens_along_route.length > 0
    ? activeRoute.safe_havens_along_route[0]
    : null;

  return (
    <div className="glass-panel-emerald" style={{ padding: '12px 18px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: 'var(--neon-emerald)', color: '#070A11', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowUpRight size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-emerald)', textTransform: 'uppercase' }}>
              CURRENT SAFE CORRIDOR
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
              MG Road / Brigade Police Protected Avenue (LED Lit)
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            PROGRESS
          </div>
          <div style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--neon-emerald)' }}>
            {walkProgressPct}%
          </div>
        </div>
      </div>

      {nextHaven && (
        <div style={{ 
          background: 'rgba(0, 255, 157, 0.12)', 
          border: '1px solid rgba(0, 255, 157, 0.3)', 
          borderRadius: '8px', 
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#fff' }}>
            <ShieldCheck size={14} color="var(--neon-emerald)" />
            <span>Safe Haven Ahead: <strong>{nextHaven.name}</strong></span>
          </div>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-emerald)' }}>
            ~35m
          </span>
        </div>
      )}
    </div>
  );
}
