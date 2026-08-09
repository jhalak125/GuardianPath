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
    <div className="glass-panel" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '100%' }}>
      
      {/* Row 1: Header + Mic Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={16} color="var(--neon-emerald)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: '#fff', letterSpacing: '0.04em' }}>
            WEB AUDIO THREAT RADAR
          </span>
        </div>

        <button
          className={`hud-action-btn ${isAudioMonitorActive ? 'hud-btn-emerald' : 'hud-btn-stealth'}`}
          onClick={() => setIsAudioMonitorActive(prev => !prev)}
          style={{ padding: '4px 10px', fontSize: '0.72rem' }}
        >
          {isAudioMonitorActive ? <Volume2 size={13} /> : <VolumeX size={13} />}
          <span>{isAudioMonitorActive ? 'MIC ACTIVE' : 'ENABLE MIC'}</span>
        </button>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(255, 183, 3, 0.12)', border: '1px solid rgba(255, 183, 3, 0.3)', borderRadius: '4px', padding: '4px 8px', fontSize: '0.7rem', color: 'var(--neon-amber)' }}>
          ℹ️ {errorMsg}
        </div>
      )}

      {/* Row 2: Live Real-time Oscilloscope Waveform Canvas */}
      <canvas 
        ref={canvasRef} 
        width={340} 
        height={36} 
        className="waveform-canvas" 
        style={{ width: '100%', height: '36px', borderRadius: '4px' }}
      />

      {/* Row 3: Ambient Decibel Level + Test Spike Trigger Button (ALWAYS VISIBLE) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          background: 'rgba(0, 0, 0, 0.45)', 
          padding: '6px 10px', 
          borderRadius: '6px', 
          border: '1px solid var(--border-subtle)',
          flex: 1
        }}>
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            AMBIENT:
          </span>
          <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: getStatusColor() }}>
            {decibels} dB
          </strong>
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: getStatusColor() }}>
            ({threatStatus})
          </span>
        </div>

        <button
          className="hud-action-btn hud-btn-danger"
          style={{ padding: '6px 12px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
          onClick={() => triggerAcousticSpike(92)}
          title="Simulate sudden scream or distress spike to test auto-SOS"
        >
          <Zap size={12} />
          <span>TEST SPIKE (92dB)</span>
        </button>
      </div>

    </div>
  );
}
