import { useState, useEffect, useRef, useCallback } from 'react';

export function useDeadManSwitch({
  isActive = false,
  intervalSeconds = 180, // 3 minutes default
  onTimeoutEmergency = null,
  onWarningStateChange = null
}) {
  const [remainingSeconds, setRemainingSeconds] = useState(intervalSeconds);
  const [isWarning, setIsWarning] = useState(false);
  const [totalCheckins, setTotalCheckins] = useState(0);

  const timerRef = useRef(null);

  // Play subtle warning chime via Web Audio API
  const playWarningTone = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.2); // E5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch (e) {
      // Audio context might need user gesture
    }
  }, []);

  // Reset timer (Check-in)
  const checkIn = useCallback(() => {
    setRemainingSeconds(intervalSeconds);
    setIsWarning(false);
    setTotalCheckins(prev => prev + 1);
    if (onWarningStateChange) onWarningStateChange(false);
  }, [intervalSeconds, onWarningStateChange]);

  // Main countdown loop
  useEffect(() => {
    if (!isActive) {
      setRemainingSeconds(intervalSeconds);
      setIsWarning(false);
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (onTimeoutEmergency) {
            onTimeoutEmergency();
          }
          return 0;
        }

        const nextVal = prev - 1;

        // Warning state when under 30 seconds
        if (nextVal <= 30 && !isWarning) {
          setIsWarning(true);
          playWarningTone();
          if (onWarningStateChange) onWarningStateChange(true);
        }

        // Periodic reminder tone at 20s and 10s
        if (nextVal === 20 || nextVal === 10) {
          playWarningTone();
        }

        return nextVal;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, intervalSeconds, isWarning, onTimeoutEmergency, onWarningStateChange, playWarningTone]);

  const progressPct = Math.round((remainingSeconds / intervalSeconds) * 100);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return {
    remainingSeconds,
    progressPct,
    isWarning,
    formattedTime: formatTime(remainingSeconds),
    checkIn,
    totalCheckins
  };
}
