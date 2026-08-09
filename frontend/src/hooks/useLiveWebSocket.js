import { useState, useEffect, useRef, useCallback } from 'react';

export function useLiveWebSocket({
  sessionId,
  isBroadcasting = false,
  telemetryData = {},
  onPeerUpdate = null,
  onEmergencyAlert = null
}) {
  const [connectionStatus, setConnectionStatus] = useState("DISCONNECTED"); // CONNECTED, CONNECTING, DISCONNECTED
  const [peerStatus, setPeerStatus] = useState(null);
  const [lastPing, setLastPing] = useState(null);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const broadcastIntervalRef = useRef(null);

  const connect = useCallback(() => {
    if (!sessionId) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live-track/${sessionId}`;
      
      setConnectionStatus("CONNECTING");
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("CONNECTED");
        setLastPing(new Date().toLocaleTimeString());
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "PEER_STATUS") {
            setPeerStatus(data);
            if (onPeerUpdate) onPeerUpdate(data);
          } else if (data.type === "EMERGENCY_ALERT") {
            if (onEmergencyAlert) onEmergencyAlert(data);
          }
        } catch (e) {
          console.warn("WebSocket parse error:", e);
        }
      };

      ws.onclose = () => {
        setConnectionStatus("DISCONNECTED");
        // Schedule reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        setConnectionStatus("DISCONNECTED");
      };
    } catch (e) {
      console.warn("WebSocket connection failure:", e);
      setConnectionStatus("DISCONNECTED");
    }
  }, [sessionId, onPeerUpdate, onEmergencyAlert]);

  // Send telemetry
  const sendTelemetry = useCallback((customPayload = null) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = customPayload || {
        type: "TELEMETRY_UPDATE",
        session_id: sessionId,
        lat: telemetryData.lat || 40.7128,
        lng: telemetryData.lng || -74.0060,
        user_name: telemetryData.user_name || "Alex",
        battery_level: telemetryData.battery_level || 84,
        speed_mps: telemetryData.speed_mps || 1.2,
        dead_man_timer_remaining: telemetryData.dead_man_timer_remaining || 180,
        ambient_decibels: telemetryData.ambient_decibels || 42,
        status: telemetryData.status || "EN_ROUTE_SAFE"
      };

      socketRef.current.send(JSON.stringify(payload));
      setLastPing(new Date().toLocaleTimeString());
    }
  }, [sessionId, telemetryData]);

  // Send Emergency SOS over WebSocket
  const sendSOS = useCallback((triggerType = "MANUAL_PANIC", location = null) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const loc = location || { lat: telemetryData.lat || 40.7128, lng: telemetryData.lng || -74.0060 };
      const payload = {
        type: "EMERGENCY_ALERT",
        session_id: sessionId,
        user_name: telemetryData.user_name || "Alex",
        status: "SOS_ACTIVE",
        trigger_type: triggerType,
        current_location: loc,
        battery_level: telemetryData.battery_level || 84,
        timestamp: new Date().toISOString()
      };
      socketRef.current.send(JSON.stringify(payload));
    }
  }, [sessionId, telemetryData]);

  // Initial connect
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connect]);

  // Periodic broadcasting when escort active
  useEffect(() => {
    if (isBroadcasting && connectionStatus === "CONNECTED") {
      broadcastIntervalRef.current = setInterval(() => {
        sendTelemetry();
      }, 2500);
    } else {
      if (broadcastIntervalRef.current) clearInterval(broadcastIntervalRef.current);
    }

    return () => {
      if (broadcastIntervalRef.current) clearInterval(broadcastIntervalRef.current);
    };
  }, [isBroadcasting, connectionStatus, sendTelemetry]);

  return {
    connectionStatus,
    peerStatus,
    lastPing,
    sendTelemetry,
    sendSOS
  };
}
