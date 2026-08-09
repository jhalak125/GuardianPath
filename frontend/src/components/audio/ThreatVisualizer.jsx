import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  Radio, 
  Sliders,
  Zap
} from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { useAudioMonitor } from '../../hooks/useAudioMonitor';
import { useTrip } from '../../context/TripContext';

export default function ThreatVisualizer() {
  const { 
    isAudioMonitorActive, 
    setIsAudioMonitorActive, 
    currentDecibels, 
    setCurrentDecibels,
    triggerSOS 
  } = useSafety();

  const { currentLocation } = useTrip();

  const [threshold, setThreshold] = useState(82); // dB trigger threshold
  const [lastDistressTimestamp, setLastDistressTimestamp] = useState(null);
  const canvasRef = useRef(null);
  const canvasMobileRef = useRef(null);

  const {
    decibels,
    threatStatus,
    isMicAllowed,
    errorMsg,
    triggerAcousticSpike,
    playTacticalChime
  } = useAudioMonitor({
    isEnabled: isAudioMonitorActive,
    sensitivityThreshold: threshold,
    onDistressTrigger: (spikeDb) => {
      setLastDistressTimestamp(new Date().toLocaleTimeString());
      playTacticalChime("siren");
      triggerSOS("AUDIO_DISTRESS", currentLocation, spikeDb);
    }
  });

  // Sync decibels to context
  useEffect(() => {
    setCurrentDecibels(decibels);
  }, [decibels, setCurrentDecibels]);

  // Live Oscilloscope Waveform Animation on Canvas (Both Desktop & Mobile canvases)
  useEffect(() => {
    let animationId;
    let phase = 0;

    const renderWave = () => {
      const canvases = [canvasRef.current, canvasMobileRef.current].filter(Boolean);

      canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width;
        const height = canvas.height;
        const midY = height / 2;

        const strokeColor = decibels > threshold ? '#FF2A6D' : (decibels > 65 ? '#FFB703' : '#00FF9D');

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = strokeColor;
        ctx.shadowBlur = 8;
        ctx.shadowColor = strokeColor;

        const waveAmplitude = isAudioMonitorActive ? Math.min(midY - 2, (decibels - 30) * 0.8) : 3;
        const frequency = 0.05;

        for (let x = 0; x < width; x++) {
          const y = midY + Math.sin(x * frequency + phase) * waveAmplitude * Math.sin((x / width) * Math.PI);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      phase += isAudioMonitorActive ? (decibels / 400) : 0.02;
      animationId = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [decibels, threshold, isAudioMonitorActive]);

  const getStatusColor = () => {
    if (threatStatus === "DANGER") return 'var(--neon-crimson)';
    if (threatStatus === "WARNING") return 'var(--neon-amber)';
    if (threatStatus === "CAUTION") return 'var(--neon-cyan)';
    return 'var(--neon-emerald)';
  };

  return (
    <div>
      {/* =========================================================================
          DESKTOP FULL VIEW: Everything Fully Expanded
          ========================================================================= */}
      <div className="desktop-audio-view" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Header Info Panel */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--neon-emerald)" />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                WEB AUDIO THREAT RADAR
              </span>
            </div>

            <button
              className={`hud-action-btn ${isAudioMonitorActive ? 'hud-btn-emerald' : 'hud-btn-stealth'}`}
              onClick={() => setIsAudioMonitorActive(prev => !prev)}
            >
              {isAudioMonitorActive ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{isAudioMonitorActive ? 'LISTENER ACTIVE' : 'ENABLE MIC'}</span>
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Continuously analyzes microphone ambient decibels & sudden scream/distress frequencies to trigger automated SOS beacons if you are in danger.
          </p>

          {errorMsg && (
            <div style={{ background: 'rgba(255, 183, 3, 0.12)', border: '1px solid rgba(255, 183, 3, 0.3)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', color: 'var(--neon-amber)', marginBottom: '10px' }}>
              ℹ️ {errorMsg}
            </div>
          )}

          {/* Live Waveform Canvas */}
          <canvas 
            ref={canvasRef} 
            width={320} 
            height={60} 
            className="waveform-canvas" 
            style={{ width: '100%', marginBottom: '12px' }}
          />

          {/* Decibel Gauge Meter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 0, 0, 0.35)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                CURRENT AMBIENT LEVEL
              </div>
              <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: getStatusColor() }}>
                {decibels} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>dB</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                THREAT LEVEL
              </div>
              <div style={{ fontSize: '0.95rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: getStatusColor() }}>
                {threatStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Sensitivity Calibration Controls */}
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>
              <Sliders size={13} color="var(--neon-cyan)" />
              <span>DISTRESS TRIGGER THRESHOLD</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--neon-crimson)', fontWeight: 700 }}>
              {threshold} dB
            </span>
          </div>

          <input 
            type="range"
            min="65"
            max="95"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--neon-crimson)', cursor: 'pointer', marginBottom: '10px' }}
          />

          <button
            className="hud-action-btn hud-btn-danger"
            style={{ width: '100%', padding: '8px' }}
            onClick={() => triggerAcousticSpike(92)}
          >
            <Zap size={13} />
            <span>TEST DISTRESS SPIKE (92 dB)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MOBILE COMPACT GLANCE VIEW: Fits into ~130px with Zero Scrolling
          ========================================================================= */}
      <div className="mobile-audio-view">
        <div className="glass-panel" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          
          {/* Row 1: Header + Mic Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={15} color="var(--neon-emerald)" />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
                AUDIO THREAT RADAR
              </span>
            </div>

            <button
              className={`hud-action-btn ${isAudioMonitorActive ? 'hud-btn-emerald' : 'hud-btn-stealth'}`}
              onClick={() => setIsAudioMonitorActive(prev => !prev)}
              style={{ padding: '3px 8px', fontSize: '0.7rem' }}
            >
              {isAudioMonitorActive ? <Volume2 size={12} /> : <VolumeX size={12} />}
              <span>{isAudioMonitorActive ? 'MIC ACTIVE' : 'ENABLE MIC'}</span>
            </button>
          </div>

          {/* Row 2: Compact Waveform */}
          <canvas 
            ref={canvasMobileRef} 
            width={300} 
            height={28} 
            className="waveform-canvas" 
            style={{ width: '100%', height: '28px' }}
          />

          {/* Row 3: Compact Decibel Level + Test Trigger Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 0, 0, 0.4)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>LEVEL:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: getStatusColor() }}>
                {decibels} dB
              </strong>
              <span style={{ fontSize: '0.65rem', color: getStatusColor(), fontWeight: 700 }}>
                ({threatStatus})
              </span>
            </div>

            <button
              className="hud-action-btn hud-btn-danger"
              style={{ padding: '4px 10px', fontSize: '0.7rem' }}
              onClick={() => triggerAcousticSpike(92)}
            >
              <Zap size={11} />
              <span>TEST SPIKE (92dB)</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
