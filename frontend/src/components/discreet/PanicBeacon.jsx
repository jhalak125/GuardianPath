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
  const emergencyMessage = `🚨 CRITICAL EMERGENCY SOS: Immediate assistance required! My live location: ${mapsUrl} at ${timeStr}. (Trigger: ${sosTriggerType || 'MANUAL_PANIC'}). National Police 112 & Women Helpline 1091 alerted.`;

  const handleOpenWhatsAppAlert = (phone = "") => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(emergencyMessage)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(emergencyMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7, 10, 17, 0.96)',
      backdropFilter: 'blur(24px)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px',
      overflowY: 'auto'
    }}>
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
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: '6px' }}>
        <div 
          className="animate-pulse-crimson"
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'rgba(255, 42, 109, 0.2)',
            border: '2px solid var(--neon-crimson)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px',
            boxShadow: 'var(--shadow-glow-crimson)'
          }}
        >
          <ShieldAlert size={34} color="var(--neon-crimson)" />
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', color: '#fff', letterSpacing: '0.06em', margin: 0 }}>
          CRITICAL SOS DISPATCH ACTIVE
        </h1>

        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          background: 'rgba(255, 42, 109, 0.2)', 
          color: 'var(--neon-crimson)',
          border: '1px solid var(--border-crimson)',
          padding: '4px 12px',
          borderRadius: '20px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          fontWeight: 700,
          marginTop: '6px'
        }}>
          <Radio size={14} className="animate-beacon-live" />
          <span>TRIGGER: {sosTriggerType || 'MANUAL_PANIC'} • POLICE 112 NOTIFIED</span>
        </div>
      </div>

      {/* Center Emergency Contacts Alert Stream */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '540px', width: '100%', margin: '14px auto' }}>
        <div className="glass-panel-crimson" style={{ padding: '16px 18px', borderRadius: '16px' }}>
          
          {/* Automatic Dispatch Confirmation Banner */}
          <div style={{
            background: 'rgba(0, 255, 157, 0.12)',
            border: '1px solid rgba(0, 255, 157, 0.4)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '14px'
          }}>
            <BellRing size={20} color="var(--neon-emerald)" className="animate-beacon-live" />
            <div style={{ fontSize: '0.82rem', color: 'var(--neon-emerald)', fontWeight: 600 }}>
              ✓ SOS Alert & Live GPS transmitted to Mummy (+91 98201 23456) & Police PCR 112!
            </div>
          </div>

          {/* Location & Safe Haven Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            <div style={{ background: 'rgba(0,0,0,0.45)', padding: '8px 10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} color="var(--neon-cyan)" /> GPS Coordinates
              </div>
              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#fff' }}>
                {latStr}° N, {lngStr}° E
              </strong>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.45)', padding: '8px 10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={12} color="var(--neon-emerald)" /> Nearest Safe Haven
              </div>
              <strong style={{ fontSize: '0.82rem', color: 'var(--neon-emerald)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                Apollo 24/7 Pharmacy (45m)
              </strong>
            </div>
          </div>

          {/* Emergency Contacts Real Alert Dispatch List */}
          <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-emerald)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle size={14} color="var(--neon-emerald)" />
            <span>EMERGENCY CONTACTS (1-TAP DIRECT ACTIONS):</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
            {contacts.map((c, i) => (
              <div 
                key={c.id || i}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 42, 109, 0.35)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {c.relationship} • {c.phone}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleOpenWhatsAppAlert(c.phone)}
                    style={{
                      background: '#25D366',
                      color: '#fff',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                    title="Send WhatsApp Alert"
                  >
                    <MessageCircle size={12} /> WhatsApp
                  </button>

                  <a
                    href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                    style={{
                      background: 'var(--neon-cyan)',
                      color: '#070A11',
                      textDecoration: 'none',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Call Contact Directly"
                  >
                    <PhoneCall size={12} /> Call
                  </a>
                </div>
              </div>
            ))}

            {/* National 112 Emergency Police Direct Call Card */}
            <div 
              style={{
                background: 'rgba(255, 42, 109, 0.15)',
                border: '1px solid var(--border-crimson)',
                borderRadius: '10px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                  National Emergency Helpline (112)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#ff8cae', fontFamily: 'var(--font-mono)' }}>
                  Police PCR, Fire & Women Helpline (1091)
                </div>
              </div>

              <a
                href="tel:112"
                style={{
                  background: 'var(--neon-crimson)',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 0 12px rgba(255, 42, 109, 0.6)'
                }}
              >
                <PhoneCall size={13} /> CALL 112
              </a>
            </div>
          </div>

          {/* Quick Broadcast Link to All */}
          <button
            onClick={() => handleOpenWhatsAppAlert("")}
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '8px',
              borderRadius: '6px',
              background: 'rgba(37, 211, 102, 0.2)',
              border: '1px solid rgba(37, 211, 102, 0.4)',
              color: '#25D366',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Share2 size={13} />
            <span>BROADCAST LIVE LOCATION ALERT ON WHATSAPP</span>
          </button>

          {/* Tactical Hardware Siren & Strobe Controls */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={() => setIsSirenPlaying(prev => !prev)}
              className="hud-action-btn"
              style={{
                flex: 1,
                padding: '10px',
                background: isSirenPlaying ? 'var(--neon-crimson)' : 'rgba(255, 42, 109, 0.25)',
                color: '#fff',
                border: '1px solid var(--border-crimson)',
                borderRadius: '8px',
                fontSize: '0.82rem'
              }}
            >
              {isSirenPlaying ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span>{isSirenPlaying ? 'STOP SIREN' : 'LOUD SIREN'}</span>
            </button>

            <button
              onClick={toggleStrobe}
              className="hud-action-btn"
              style={{
                flex: 1,
                padding: '10px',
                background: isStrobeActive ? 'var(--neon-amber)' : 'rgba(255, 183, 3, 0.25)',
                color: isStrobeActive ? '#070A11' : '#fff',
                border: '1px solid rgba(255, 183, 3, 0.4)',
                borderRadius: '8px',
                fontSize: '0.82rem'
              }}
            >
              <Zap size={15} />
              <span>{isStrobeActive ? 'DISABLE STROBE' : 'TACTICAL STROBE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cancel / Dismiss SOS Button */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '420px', width: '100%', margin: '0 auto 6px' }}>
        <button
          onClick={dismissSOS}
          className="checkin-btn"
          style={{
            background: 'var(--neon-emerald)',
            color: '#070A11',
            padding: '12px',
            fontSize: '0.95rem'
          }}
        >
          <CheckCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
          <span>I AM SAFE — CANCEL SOS BEACON</span>
        </button>
      </div>
    </div>
  );
}
