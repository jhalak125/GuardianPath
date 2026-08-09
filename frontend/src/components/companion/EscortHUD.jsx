import React from 'react';
import { 
  Play, 
  Pause, 
  FastForward, 
  Square, 
  ShieldCheck, 
  ArrowUpRight 
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import { useSafety } from '../../context/SafetyContext';
import DeadManTimer from './DeadManTimer';
import TurnByTurnHUD from '../navigation/TurnByTurnHUD';

export default function EscortHUD() {
  const { 
    isEscortActive, 
    stopEscortMode, 
    activeRoute, 
    walkProgressPct, 
    isSimulatingWalk, 
    setIsSimulatingWalk, 
    simSpeedMultiplier, 
    setSimSpeedMultiplier,
    currentLocation
  } = useTrip();

  const { currentDecibels, isAudioMonitorActive } = useSafety();

  if (!isEscortActive) {
    return (
      <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
        <ShieldCheck size={28} color="var(--neon-emerald)" style={{ margin: '0 auto 8px' }} />
        <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '1rem', marginBottom: '4px' }}>
          GUARDIAN ESCORT READY
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Select a destination and start escort mode for live turn guidance, Dead-Man's switch, and live safety telemetry.
        </p>
      </div>
    );
  }

  return (
    <div className="escort-hud-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* 1. Safe Corridor & Progress Banner */}
      <TurnByTurnHUD />

      {/* 2. Dead-Man's Switch Timer (Responsive Dial on Desktop / Inline on Mobile) */}
      <DeadManTimer />

      {/* 3. Escort Walk Controls (Compact on Mobile / Full on Desktop) */}
      <div className="glass-panel" style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <button
            className="hud-action-btn hud-btn-emerald"
            style={{ flex: 2, padding: '8px 10px' }}
            onClick={() => setIsSimulatingWalk(prev => !prev)}
          >
            {isSimulatingWalk ? <Pause size={14} /> : <Play size={14} />}
            <span>{isSimulatingWalk ? 'PAUSE WALK' : 'RESUME WALK'}</span>
          </button>

          <button
            className="hud-action-btn"
            style={{ flex: 1, background: 'rgba(255, 255, 255, 0.08)', color: '#fff', padding: '8px' }}
            onClick={() => setSimSpeedMultiplier(prev => (prev >= 4 ? 1 : prev + 1))}
            title="Cycle Walk Speed"
          >
            <FastForward size={14} />
            <span>{simSpeedMultiplier}X</span>
          </button>

          <button
            className="hud-action-btn hud-btn-danger"
            style={{ flex: 1.5, padding: '8px 10px' }}
            onClick={stopEscortMode}
            title="End Escort Mode"
          >
            <Square size={14} />
            <span>END TRIP</span>
          </button>
        </div>
      </div>

      {/* 4. Live Telemetry Stream (Desktop Full View Only) */}
      <div className="escort-desktop-telemetry glass-panel" style={{ padding: '12px' }}>
        <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>
          LIVE TELEMETRY STREAM
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>GPS COORDINATES</div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)' }}>
              {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Tracking...'}
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>AMBIENT ACOUSTICS</div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: currentDecibels > 80 ? 'var(--neon-crimson)' : 'var(--neon-emerald)' }}>
              {currentDecibels} dB ({isAudioMonitorActive ? 'ACTIVE' : 'SIMULATED'})
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
