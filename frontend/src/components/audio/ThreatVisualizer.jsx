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

  // Live Oscilloscope Waveform Animation on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    let phase = 0;
    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      // Color based on decibels
      const strokeColor = decibels > threshold ? '#FF2A6D' : (decibels > 65 ? '#FFB703' : '#00FF9D');

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = strokeColor;
      ctx.shadowBlur = 10;
      ctx.shadowColor = strokeColor;

      const waveAmplitude = isAudioMonitorActive ? Math.min(midY - 4, (decibels - 30) * 0.9) : 4;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header Info Panel */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
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

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Continuously analyzes microphone ambient decibels & sudden scream/distress frequencies to trigger automated SOS beacons if you are in danger.
        </p>

        {errorMsg && (
          <div style={{ background: 'rgba(255, 183, 3, 0.12)', border: '1px solid rgba(255, 183, 3, 0.3)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.78rem', color: 'var(--neon-amber)', marginBottom: '12px' }}>
            ℹ️ {errorMsg}
          </div>
        )}

        {/* Live Waveform Canvas */}
        <canvas 
          ref={canvasRef} 
          width={320} 
          height={70} 
          className="waveform-canvas" 
          style={{ width: '100%', marginBottom: '12px' }}
        />

        {/* Decibel Gauge Meter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 0, 0, 0.35)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              CURRENT AMBIENT LEVEL
            </div>
            <div style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: getStatusColor() }}>
              {decibels} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>dB</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              THREAT LEVEL
            </div>
            <div style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: getStatusColor() }}>
              {threatStatus}
            </div>
          </div>
        </div>
      </div>

      {/* Sensitivity Calibration Controls */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>
            <Sliders size={14} color="var(--neon-cyan)" />
            <span>DISTRESS TRIGGER THRESHOLD</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--neon-crimson)', fontWeight: 700 }}>
            {threshold} dB
          </span>
        </div>

        <input 
          type="range"
          min="65"
          max="95"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--neon-crimson)', cursor: 'pointer', marginBottom: '14px' }}
        />

        {/* Test Simulator Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="hud-action-btn hud-btn-danger"
            style={{ flex: 1, padding: '10px' }}
            onClick={() => triggerAcousticSpike(92)}
          >
            <Zap size={14} />
            <span>TEST DISTRESS SPIKE (92 dB)</span>
          </button>
        </div>

        {lastDistressTimestamp && (
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-crimson)', marginTop: '8px', textAlign: 'center' }}>
            ⚠️ Last Distress Trigger at {lastDistressTimestamp}
          </div>
        )}
      </div>
    </div>
  );
}
