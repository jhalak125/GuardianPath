import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Radio, 
  BatteryMedium, 
  PhoneCall, 
  Calculator, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { useTrip } from '../../context/TripContext';

export default function Header() {
  const { 
    isSOSActive, 
    triggerSOS, 
    openFakeCall, 
    setIsCalculatorOpen,
    isAudioMonitorActive,
    setIsAudioMonitorActive
  } = useSafety();

  const { isEscortActive, currentLocation } = useTrip();
  const [batteryLevel, setBatteryLevel] = useState(86);

  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }).catch(() => {});
    }
  }, []);

  return (
    <header className="tactical-header">
      {/* Brand Logo */}
      <div className="hud-logo-group">
        <div className={`hud-logo-icon ${isEscortActive ? 'animate-pulse-emerald' : ''}`}>
          <ShieldCheck size={18} />
        </div>
        <div className="hud-logo-title">
          GUARDIAN<span style={{ color: 'var(--neon-emerald)' }}>PATH</span>
        </div>
      </div>

      {/* Center Status Badges (Hidden/Collapsed on Small Screens) */}
      <div className="hud-status-group">
        <div className={`hud-badge ${isEscortActive ? 'active' : ''}`}>
          <Radio size={12} className={isEscortActive ? 'animate-beacon-live' : ''} />
          <span className="badge-text">{isEscortActive ? 'ESCORT LIVE' : 'STANDBY'}</span>
        </div>

        <div className="hud-badge hide-on-mobile">
          <BatteryMedium size={12} color={batteryLevel < 20 ? 'var(--neon-crimson)' : 'var(--neon-emerald)'} />
          <span>{batteryLevel}%</span>
        </div>
      </div>

      {/* Right Quick Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Fake Call Trigger */}
        <button 
          className="hud-action-btn hud-btn-emerald"
          onClick={() => openFakeCall()}
          title="Discreet Fake Call"
        >
          <PhoneCall size={13} />
          <span className="btn-label-desktop">FAKE CALL</span>
        </button>

        {/* Calculator Disguise */}
        <button 
          className="hud-action-btn hud-btn-stealth"
          onClick={() => setIsCalculatorOpen(true)}
          title="Stealth Calculator Disguise"
        >
          <Calculator size={13} />
          <span className="btn-label-desktop">DISGUISE</span>
        </button>

        {/* 1-Tap SOS Panic Button (Always Visible & Prominent) */}
        <button 
          className={`hud-action-btn hud-btn-danger ${isSOSActive ? 'animate-pulse-crimson' : ''}`}
          onClick={() => triggerSOS("MANUAL_PANIC", currentLocation)}
          title="Instant Emergency SOS Alert"
        >
          <ShieldAlert size={14} />
          <span>SOS</span>
        </button>
      </div>
    </header>
  );
}
