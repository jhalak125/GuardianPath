import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Volume2, Play, SkipForward } from 'lucide-react';
import { useSafety } from '../../context/SafetyContext';
import { HINDI_AUDIO_CLIPS } from '../../assets/hindi_audio_data';

export default function FakeCallModal() {
  const { isFakeCallOpen, closeFakeCall, fakeCallPersona } = useSafety();

  const [callState, setCallState] = useState("INCOMING"); // INCOMING, CONNECTED, ENDED
  const [callDuration, setCallDuration] = useState(0);
  const [activeDialogueIndex, setActiveDialogueIndex] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const ringtoneIntervalRef = useRef(null);
  const timerRef = useRef(null);
  const nextLineTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const activeAudioRef = useRef(null);

  // Personas with English Screen Subtitles & Authentic Indian Hindi Spoken Audio
  const personas = [
    {
      id: "mom",
      name: "Mummy (Home)",
      relationship: "Family",
      avatarColor: "#E11D48",
      phone: "+91 98201 23456",
      dialogues: [
        {
          audioKey: "mom_0",
          displayText: "Beta, where have you reached? I'm watching from the balcony, the main road streetlights are completely lit, where are you now?"
        },
        {
          audioKey: "mom_1",
          displayText: "Listen, Papa and I are standing right at the main gate waiting for you. Come straight along the main avenue, don't take any alleys!"
        },
        {
          audioKey: "mom_2",
          displayText: "Keep the phone on speaker until you enter the gate. We are watching the road for you."
        }
      ]
    },
    {
      id: "police",
      name: "Police PCR Patrol 112",
      relationship: "Emergency Patrol Van",
      avatarColor: "#0284C7",
      phone: "112 / 1091 (PCR Control)",
      dialogues: [
        {
          audioKey: "police_0",
          displayText: "Hello! City Police Control Room 112. PCR Patrol Cruiser 4 has visual lock on your live location near Main Road. Stay on the main road."
        },
        {
          audioKey: "police_1",
          displayText: "Our patrol team is 60 seconds away from the junction. Stay on the brightly lit avenue, police team is on the way."
        },
        {
          audioKey: "police_2",
          displayText: "Yes, keep the line active. High-definition CCTV cameras and police patrol are actively monitoring your route."
        }
      ]
    },
    {
      id: "driver",
      name: "Ramesh (Ola / Uber Cab)",
      relationship: "Driver • Silver Dzire",
      avatarColor: "#059669",
      phone: "+91 94451 88920",
      dialogues: [
        {
          audioKey: "driver_0",
          displayText: "Yes sir / ma'am! I am parked at the main road corner in the silver Swift Dzire with hazard parking lights on."
        },
        {
          audioKey: "driver_1",
          displayText: "Yes, I can see you walking on the footpath now. The car doors are unlocked for you, come straight over."
        },
        {
          audioKey: "driver_2",
          displayText: "Engine is running, please come straight to the car, I am waiting right here."
        }
      ]
    },
    {
      id: "brother",
      name: "Bhai (Scooty Ready)",
      relationship: "Brother",
      avatarColor: "#7C3AED",
      phone: "+91 98112 34567",
      dialogues: [
        {
          audioKey: "brother_0",
          displayText: "Hey, I am waiting on the corner of the 100 feet road on my scooty with the engine running, where are you?"
        },
        {
          audioKey: "brother_1",
          displayText: "I am tracking your live location on the app right now, I will reach you in one minute."
        },
        {
          audioKey: "brother_2",
          displayText: "Listen, stay on the main road, do not enter any dark alleys, I am coming right now!"
        }
      ]
    }
  ];

  const currentPersona = selectedPersona || fakeCallPersona || personas[0];

  // Initialize or resume AudioContext for ringtone
  const getAudioContext = useCallback(() => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      return audioContextRef.current;
    } catch (e) {
      return null;
    }
  }, []);

  // Synthesize Phone Ringtone
  const playRingTone = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.25);
      osc2.stop(now + 1.25);
    } catch (e) {}
  }, [getAudioContext]);

  // Play Authentic Indian Hindi Spoken Audio with Automatic Natural Pauses
  const playHindiAudioLine = useCallback((lineIndex, personaObj) => {
    const lines = personaObj.dialogues;
    if (!lines || lines.length === 0) return;

    const safeIndex = lineIndex % lines.length;
    const item = lines[safeIndex];

    setActiveDialogueIndex(safeIndex);
    setIsSpeaking(true);

    if (nextLineTimeoutRef.current) clearTimeout(nextLineTimeoutRef.current);
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
    }

    const audioDataUri = HINDI_AUDIO_CLIPS[item.audioKey];
    if (audioDataUri) {
      const audio = new Audio(audioDataUri);
      activeAudioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        // Natural 2.5 second conversational pause before automatically speaking next line!
        nextLineTimeoutRef.current = setTimeout(() => {
          playHindiAudioLine(safeIndex + 1, personaObj);
        }, 2500);
      };

      audio.onerror = (e) => {
        console.warn("Audio playback error:", e);
        setIsSpeaking(false);
        nextLineTimeoutRef.current = setTimeout(() => {
          playHindiAudioLine(safeIndex + 1, personaObj);
        }, 3000);
      };

      audio.play().catch(e => {
        console.warn("Audio play catch:", e);
        setIsSpeaking(false);
      });
    }
  }, []);

  // Ringtone loop while incoming
  useEffect(() => {
    if (!isFakeCallOpen) {
      setCallState("INCOMING");
      setCallDuration(0);
      setActiveDialogueIndex(0);
      setIsSpeaking(false);
      if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (nextLineTimeoutRef.current) clearTimeout(nextLineTimeoutRef.current);
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      return;
    }

    if (callState === "INCOMING") {
      playRingTone();
      ringtoneIntervalRef.current = setInterval(playRingTone, 2800);
    } else {
      if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
    }

    return () => {
      if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (nextLineTimeoutRef.current) clearTimeout(nextLineTimeoutRef.current);
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
    };
  }, [isFakeCallOpen, callState, playRingTone]);

  // When user taps green ACCEPT button:
  const handleAcceptCall = () => {
    getAudioContext();
    if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
    setCallState("CONNECTED");

    // Immediately start playing authentic Indian Hindi audio line 0 inside user click handler!
    playHindiAudioLine(0, currentPersona);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const handleDeclineCall = () => {
    if (nextLineTimeoutRef.current) clearTimeout(nextLineTimeoutRef.current);
    if (activeAudioRef.current) activeAudioRef.current.pause();
    setCallState("ENDED");
    setTimeout(() => {
      closeFakeCall();
    }, 300);
  };

  const handleManualNextLine = () => {
    if (nextLineTimeoutRef.current) clearTimeout(nextLineTimeoutRef.current);
    playHindiAudioLine(activeDialogueIndex + 1, currentPersona);
  };

  const handleReplayLine = () => {
    if (nextLineTimeoutRef.current) clearTimeout(nextLineTimeoutRef.current);
    playHindiAudioLine(activeDialogueIndex, currentPersona);
  };

  if (!isFakeCallOpen) return null;

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fake-call-overlay">
      {/* Top Status & Persona Quick Switcher */}
      <div>
        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#94A3B8', marginBottom: '8px' }}>
          {callState === "INCOMING" ? "Incoming Call..." : `Guardian Hindi Voice Active (${formatDuration(callDuration)})`}
        </div>

        {callState === "INCOMING" && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {personas.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p)}
                style={{
                  background: currentPersona.id === p.id ? p.avatarColor : 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: currentPersona.id === p.id ? '1px solid #fff' : 'none',
                  borderRadius: '16px',
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center Caller Info */}
      <div style={{ textAlign: 'center' }}>
        <div 
          className="fake-call-avatar animate-beacon-live"
          style={{ background: currentPersona.avatarColor }}
        >
          {currentPersona.name.charAt(0)}
        </div>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 600, margin: '0 0 6px' }}>
          {currentPersona.name}
        </h1>

        <div style={{ fontSize: '1.1rem', color: '#94A3B8', marginBottom: '16px' }}>
          {currentPersona.relationship} • {currentPersona.phone}
        </div>

        {/* In-Call Deterrent Dialogue (English Display Text on Screen, Natural Indian Hindi Spoken Audio) */}
        {callState === "CONNECTED" && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            padding: '18px 22px',
            margin: '0 auto',
            maxWidth: '460px',
            border: '1px solid rgba(255, 255, 255, 0.22)'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#34D399', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
              <Volume2 size={18} className={isSpeaking ? "animate-beacon-live" : ""} />
              <span>{isSpeaking ? "Speaking in Hindi via Speakerphone..." : "Listening (Natural Pause)..."}</span>
              
              {/* Equalizer audio wave animation */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '16px' }}>
                <span style={{ width: '3px', height: isSpeaking ? '16px' : '4px', background: '#34D399', borderRadius: '1px', transition: 'height 0.15s ease' }}></span>
                <span style={{ width: '3px', height: isSpeaking ? '12px' : '6px', background: '#34D399', borderRadius: '1px', transition: 'height 0.15s ease' }}></span>
                <span style={{ width: '3px', height: isSpeaking ? '16px' : '3px', background: '#34D399', borderRadius: '1px', transition: 'height 0.15s ease' }}></span>
                <span style={{ width: '3px', height: isSpeaking ? '10px' : '5px', background: '#34D399', borderRadius: '1px', transition: 'height 0.15s ease' }}></span>
              </div>
            </div>

            {/* Display Subtitles in Clean English */}
            <p style={{ fontSize: '1.15rem', fontStyle: 'italic', lineHeight: 1.5, color: '#ffffff', minHeight: '56px', fontWeight: 400 }}>
              "{currentPersona.dialogues[activeDialogueIndex].displayText}"
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                Line {activeDialogueIndex + 1} of {currentPersona.dialogues.length} (Auto-playing with natural pauses)
              </span>

              <button
                onClick={handleReplayLine}
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <Play size={12} /> Replay
              </button>

              <button
                onClick={handleManualNextLine}
                style={{
                  background: 'rgba(0, 255, 157, 0.25)',
                  color: '#00FF9D',
                  border: '1px solid rgba(0, 255, 157, 0.5)',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <SkipForward size={12} /> Next Line
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Call Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%', maxWidth: '380px', margin: '0 auto' }}>
        {callState === "INCOMING" ? (
          <>
            <button className="call-btn-circle call-btn-decline" onClick={handleDeclineCall} title="Decline Call">
              <PhoneOff size={32} />
            </button>

            <button className="call-btn-circle call-btn-accept animate-beacon-live" onClick={handleAcceptCall} title="Accept Fake Call">
              <Phone size={32} />
            </button>
          </>
        ) : (
          <button className="call-btn-circle call-btn-decline" style={{ width: '80px', height: '80px' }} onClick={handleDeclineCall} title="End Call">
            <PhoneOff size={34} />
          </button>
        )}
      </div>
    </div>
  );
}
