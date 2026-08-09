import React from 'react';
import { ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { useDeadManSwitch } from '../../hooks/useDeadManSwitch';
import { useSafety } from '../../context/SafetyContext';
import { useTrip } from '../../context/TripContext';

export default function DeadManTimer() {
  const { triggerSOS } = useSafety();
  const { isEscortActive, currentLocation } = useTrip();

  const {
    remainingSeconds,
    progressPct,
    isWarning,
    formattedTime,
    checkIn,
    totalCheckins
  } = useDeadManSwitch({
    isActive: isEscortActive,
    intervalSeconds: 180, // 3-minute interval
    onTimeoutEmergency: () => {
      triggerSOS("DEAD_MAN_TIMEOUT", currentLocation);
    }
  });

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;
  const strokeColor = isWarning ? 'var(--neon-crimson)' : 'var(--neon-emerald)';

  return (
    <div className={`dead-man-card glass-panel ${isWarning ? 'glass-panel-crimson animate-pulse-crimson' : ''}`} style={{ padding: '10px 14px' }}>
      
      {/* Desktop View: Circular Sweep Dial */}
      <div className="dead-man-desktop-view">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={15} color={strokeColor} />
            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.05em', color: '#fff' }}>
              DEAD-MAN'S CHECK-IN SWITCH
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {totalCheckins} CHECK-INS
          </span>
        </div>

        <div className="dead-man-container" style={{ padding: '4px' }}>
          <div className="countdown-svg-wrapper" style={{ width: '110px', height: '110px' }}>
            <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="55"
                cy="55"
                r={radius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="55"
                cy="55"
                r={radius}
                stroke={strokeColor}
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
              />
            </svg>

            <div className="countdown-center-text">
              <div style={{ fontSize: '1.45rem', color: strokeColor, lineHeight: 1 }}>
                {formattedTime}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {isWarning ? 'TAP TO CONFIRM' : 'AUTO-SOS IN'}
              </div>
            </div>
          </div>

          {isWarning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--neon-crimson)', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>
              <AlertCircle size={13} className="animate-pulse-crimson" />
              <span>Check-in required! Auto SOS triggers at 0:00</span>
            </div>
          )}

          <button 
            className="checkin-btn"
            onClick={checkIn}
            style={{
              background: isWarning ? 'var(--neon-crimson)' : 'var(--neon-emerald)',
              color: isWarning ? '#ffffff' : '#070A11',
              boxShadow: isWarning ? 'var(--shadow-glow-crimson)' : 'var(--shadow-glow-emerald)',
              marginTop: '8px'
            }}
          >
            <ShieldCheck size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            <span>I'M SAFE (RESET TIMER)</span>
          </button>
        </div>
      </div>

      {/* Mobile View: Compact Inline Countdown & One-Tap Reset */}
      <div className="dead-man-mobile-view">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} color={strokeColor} className={isWarning ? "animate-pulse-crimson" : ""} />
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                AUTO-SOS COUNTDOWN
              </div>
              <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: strokeColor, lineHeight: 1.1 }}>
                {formattedTime}
              </div>
            </div>
          </div>

          <button
            onClick={checkIn}
            className="checkin-btn"
            style={{
              flex: 1,
              marginTop: 0,
              padding: '8px 12px',
              fontSize: '0.85rem',
              background: isWarning ? 'var(--neon-crimson)' : 'var(--neon-emerald)',
              color: isWarning ? '#fff' : '#070A11',
              boxShadow: isWarning ? 'var(--shadow-glow-crimson)' : 'var(--shadow-glow-emerald)'
            }}
          >
            <ShieldCheck size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            <span>I'M SAFE</span>
          </button>
        </div>
      </div>

    </div>
  );
}
