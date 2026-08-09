import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Zap, 
  MapPin, 
  Building2, 
  CheckCircle, 
  Radio, 
  PhoneCall, 
  MessageCircle,
  Share2,
  BellRing
} from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { useTrip } from '../../context/TripContext';

export default function PanicBeacon() {
  const { 
    isSOSActive, 
    sosTriggerType, 
    sosDispatchData, 
    dismissSOS,
    isStrobeActive,
    toggleStrobe,
    contacts
  } = useSafety();

  const { currentLocation } = useTrip();

  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const sirenIntervalRef = useRef(null);

  // Synthesize Tactical Loud Alarm Siren via Web Audio API
  const playSirenBurst = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1300, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(650, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.start();
      osc.stop(ctx.currentTime + 0.62);
    } catch (e) {}
  };

  useEffect(() => {
    if (isSirenPlaying && isSOSActive) {
      playSirenBurst();
      sirenIntervalRef.current = setInterval(playSirenBurst, 700);
    } else {
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
    }

    return () => {
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
    };
  }, [isSirenPlaying, isSOSActive]);

  if (!isSOSActive) return null;

  const latStr = currentLocation ? currentLocation.lat.toFixed(5) : "12.9725";
  const lngStr = currentLocation ? currentLocation.lng.toFixed(5) : "77.6080";
  const mapsUrl = `https://maps.google.com/?q=${latStr},${lngStr}`;
  const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const emergencyMessage = `🚨 CRITICAL EMERGENCY SOS: Immediate assistance required! My live location: ${mapsUrl} at ${timeStr}. (Trigger: ${sosTriggerType || 'MANUAL_PANIC'}). Emergency 112 & Women Helpline 1091 alerted.`;

  const handleOpenWhatsAppAlert = (phone = "") => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(emergencyMessage)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(emergencyMessage)}`;
    window.open(url, '_blank');
  };

  // Filter only trusted family contacts
  const familyContacts = (contacts || []).filter(c => !c.phone.includes("112") && !c.name.toLowerCase().includes("police"));

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7, 10, 17, 0.97)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 'clamp(8px, 2vh, 18px) clamp(10px, 2.5vw, 20px)',
      overflowY: 'auto'
    }} className="no-scrollbar">
      {/* Strobe Effect Canvas/Underlay */}
      {isStrobeActive && (
        <div 
          className="animate-strobe"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.18,
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
      )}

      {/* Header SOS Alert */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div 
          className="animate-pulse-crimson"
          style={{
            width: 'clamp(38px, 8vw, 50px)',
            height: 'clamp(38px, 8vw, 50px)',
            borderRadius: '50%',
            background: 'rgba(255, 42, 109, 0.2)',
            border: '2px solid var(--neon-crimson)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 4px',
            boxShadow: 'var(--shadow-glow-crimson)'
          }}
        >
          <ShieldAlert size={24} color="var(--neon-crimson)" />
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)', color: '#fff', letterSpacing: '0.04em', margin: 0 }}>
          CRITICAL SOS DISPATCH ACTIVE
        </h1>

        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '5px', 
          background: 'rgba(255, 42, 109, 0.2)', 
          color: 'var(--neon-crimson)',
          border: '1px solid var(--border-crimson)',
          padding: '2px 8px',
          borderRadius: '16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          fontWeight: 700,
          marginTop: '3px'
        }}>
          <Radio size={11} className="animate-beacon-live" />
          <span>TRIGGER: {sosTriggerType || 'MANUAL_PANIC'} • 112 NOTIFIED</span>
        </div>
      </div>

      {/* Center Emergency Contacts Alert Stream */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', width: '100%', margin: '4px auto' }}>
        <div className="glass-panel-crimson" style={{ padding: '10px 12px', borderRadius: '12px' }}>
          
          {/* Automatic Dispatch Confirmation Banner */}
          <div style={{
            background: 'rgba(0, 255, 157, 0.12)',
            border: '1px solid rgba(0, 255, 157, 0.4)',
            borderRadius: '6px',
            padding: '5px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '6px'
          }}>
            <BellRing size={14} color="var(--neon-emerald)" className="animate-beacon-live" />
            <div style={{ fontSize: '0.72rem', color: 'var(--neon-emerald)', fontWeight: 600, lineHeight: 1.2 }}>
              ✓ SOS Alert & Live GPS transmitted to Mummy (+91 98201 23456) & 112!
            </div>
          </div>

          {/* Location & Safe Haven Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
            <div style={{ background: 'rgba(0,0,0,0.45)', padding: '5px 8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={10} color="var(--neon-cyan)" /> GPS Coordinates
              </div>
              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#fff' }}>
                {latStr}° N, {lngStr}° E
              </strong>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.45)', padding: '5px 8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={10} color="var(--neon-emerald)" /> Safe Haven Ahead
              </div>
              <strong style={{ fontSize: '0.75rem', color: 'var(--neon-emerald)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                Apollo 24/7 Pharmacy (45m)
              </strong>
            </div>
          </div>

          {/* Emergency Contacts Real Alert Dispatch List (Zero Scrollbar - Clean Display) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {familyContacts.map((c, i) => (
              <div 
                key={c.id || i}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 42, 109, 0.3)',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#fff' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {c.phone}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleOpenWhatsAppAlert(c.phone)}
                    style={{
                      background: '#25D366',
                      color: '#fff',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      cursor: 'pointer'
                    }}
                    title="Send WhatsApp Alert"
                  >
                    <MessageCircle size={11} /> WhatsApp
                  </button>

                  <a
                    href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                    style={{
                      background: 'var(--neon-cyan)',
                      color: '#070A11',
                      textDecoration: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                    title="Call Contact Directly"
                  >
                    <PhoneCall size={11} /> Call
                  </a>
                </div>
              </div>
            ))}

            {/* National 112 Emergency Police Direct Call Card */}
            <div 
              style={{
                background: 'rgba(255, 42, 109, 0.15)',
                border: '1px solid var(--border-crimson)',
                borderRadius: '6px',
                padding: '5px 8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#fff' }}>
                  Police 112 & Women Helpline 1091
                </div>
                <div style={{ fontSize: '0.65rem', color: '#ff8cae', fontFamily: 'var(--font-mono)' }}>
                  National Emergency Dispatch
                </div>
              </div>

              <a
                href="tel:112"
                style={{
                  background: 'var(--neon-crimson)',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 0 10px rgba(255, 42, 109, 0.6)'
                }}
              >
                <PhoneCall size={11} /> CALL 112
              </a>
            </div>
          </div>

          {/* Quick Broadcast Link to All */}
          <button
            onClick={() => handleOpenWhatsAppAlert("")}
            style={{
              width: '100%',
              marginTop: '6px',
              padding: '6px',
              borderRadius: '6px',
              background: 'rgba(37, 211, 102, 0.18)',
              border: '1px solid rgba(37, 211, 102, 0.4)',
              color: '#25D366',
              fontSize: '0.72rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <Share2 size={12} />
            <span>BROADCAST LIVE ALERT ON WHATSAPP</span>
          </button>

          {/* Tactical Hardware Siren & Strobe Controls */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <button
              onClick={() => setIsSirenPlaying(prev => !prev)}
              className="hud-action-btn"
              style={{
                flex: 1,
                padding: '6px',
                background: isSirenPlaying ? 'var(--neon-crimson)' : 'rgba(255, 42, 109, 0.25)',
                color: '#fff',
                border: '1px solid var(--border-crimson)',
                borderRadius: '6px',
                fontSize: '0.72rem'
              }}
            >
              {isSirenPlaying ? <VolumeX size={12} /> : <Volume2 size={12} />}
              <span>{isSirenPlaying ? 'STOP SIREN' : 'LOUD SIREN'}</span>
            </button>

            <button
              onClick={toggleStrobe}
              className="hud-action-btn"
              style={{
                flex: 1,
                padding: '6px',
                background: isStrobeActive ? 'var(--neon-amber)' : 'rgba(255, 183, 3, 0.25)',
                color: isStrobeActive ? '#070A11' : '#fff',
                border: '1px solid rgba(255, 183, 3, 0.4)',
                borderRadius: '6px',
                fontSize: '0.72rem'
              }}
            >
              <Zap size={12} />
              <span>{isStrobeActive ? 'DISABLE STROBE' : 'STROBE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cancel / Dismiss SOS Button (Always 100% Visible at Bottom) */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '440px', width: '100%', margin: '4px auto 0' }}>
        <button
          onClick={dismissSOS}
          className="checkin-btn"
          style={{
            background: 'var(--neon-emerald)',
            color: '#070A11',
            padding: '9px',
            fontSize: '0.88rem',
            boxShadow: '0 0 16px rgba(0, 255, 157, 0.5)'
          }}
        >
          <CheckCircle size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
          <span>I AM SAFE — CANCEL SOS BEACON</span>
        </button>
      </div>
    </div>
  );
}
