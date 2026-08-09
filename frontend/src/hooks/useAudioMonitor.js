import { useState, useEffect, useRef, useCallback } from 'react';

export function useAudioMonitor({
  isEnabled = false,
  sensitivityThreshold = 80, // dB threshold
  onDistressTrigger = null
}) {
  const [decibels, setDecibels] = useState(38);
  const [threatStatus, setThreatStatus] = useState("NORMAL"); // NORMAL, CAUTION, WARNING, DANGER
  const [isMicAllowed, setIsMicAllowed] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const simIntervalRef = useRef(null);

  // Sound synthesis chime generator
  const playTacticalChime = useCallback((type = "warning") => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "warning") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "siren") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.25);
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.55);
      }
    } catch (e) {
      console.warn("Web Audio chime synth warning:", e);
    }
  }, []);

  // Classify decibel level
  const classifyDb = useCallback((db) => {
    if (db < 50) return "NORMAL";
    if (db < 70) return "CAUTION";
    if (db < sensitivityThreshold) return "WARNING";
    return "DANGER";
  }, [sensitivityThreshold]);

  // Start real microphone analyzer
  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;
      setIsMicAllowed(true);
      setErrorMsg(null);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        
        // Approximate ambient dB from FFT average (30 - 100 dB)
        const calcDb = Math.round(30 + (avg / 255) * 70);
        setDecibels(calcDb);

        const status = classifyDb(calcDb);
        setThreatStatus(status);

        if (status === "DANGER" && onDistressTrigger) {
          onDistressTrigger(calcDb);
        }

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.warn("Microphone access unavailable or denied. Operating in synthetic acoustic simulation mode:", err);
      setIsMicAllowed(false);
      setErrorMsg("Mic offline (using live acoustic simulation)");
      startSimulatedAudio();
    }
  }, [classifyDb, onDistressTrigger]);

  // Simulated ambient acoustic fluctuation
  const startSimulatedAudio = useCallback(() => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    simIntervalRef.current = setInterval(() => {
      // Fluctuate around 38 - 54 dB normally
      const base = 42;
      const jitter = Math.floor((Math.random() - 0.5) * 14);
      const val = Math.max(32, Math.min(96, base + jitter));
      setDecibels(val);
      setThreatStatus(classifyDb(val));
    }, 1200);
  }, [classifyDb]);

  // Stop all audio
  const stopAudio = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsMicAllowed(false);
  }, []);

  // Trigger manual simulated acoustic spike for testing
  const triggerAcousticSpike = useCallback((spikeDb = 88) => {
    setDecibels(spikeDb);
    const status = classifyDb(spikeDb);
    setThreatStatus(status);
    playTacticalChime("warning");
    if (status === "DANGER" && onDistressTrigger) {
      onDistressTrigger(spikeDb);
    }
  }, [classifyDb, onDistressTrigger, playTacticalChime]);

  useEffect(() => {
    if (isEnabled) {
      startMic();
    } else {
      stopAudio();
    }

    return () => {
      stopAudio();
    };
  }, [isEnabled, startMic, stopAudio]);

  return {
    decibels,
    threatStatus,
    isMicAllowed,
    errorMsg,
    triggerAcousticSpike,
    playTacticalChime
  };
}
