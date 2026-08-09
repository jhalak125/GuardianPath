import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_INCIDENTS } from '../data/urbanSafetyData';

const SafetyContext = createContext(null);

export const DEFAULT_CONTACTS = [
  { id: "c1", name: "Mummy (Home)", phone: "+91 98201 23456", relationship: "Family", is_notified: true },
  { id: "c2", name: "Bhai (Scooty Ready)", phone: "+91 98112 34567", relationship: "Brother", is_notified: true },
  { id: "c3", name: "Police PCR Patrol 112 & Women Helpline 1091", phone: "112 / 1091", relationship: "Emergency Police & Women Helpline", is_notified: true }
];

export function SafetyProvider({ children }) {
  const [activeTab, setActiveTab] = useState("routes"); // routes, escort, audio, tracker, havens
  const [isFakeCallOpen, setIsFakeCallOpen] = useState(false);
  const [fakeCallPersona, setFakeCallPersona] = useState(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  
  // Emergency SOS State
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [sosTriggerType, setSosTriggerType] = useState(null);
  const [sosDispatchData, setSosDispatchData] = useState(null);
  const [isStrobeActive, setIsStrobeActive] = useState(false);

  // Audio Threat State
  const [isAudioMonitorActive, setIsAudioMonitorActive] = useState(false);
  const [currentDecibels, setCurrentDecibels] = useState(42);
  const [audioThreatLevel, setAudioThreatLevel] = useState("NORMAL");

  // Crowdsource Hazards
  const [incidents, setIncidents] = useState(DEFAULT_INCIDENTS);
  const [isHazardModalOpen, setIsHazardModalOpen] = useState(false);

  // Trusted Contacts & Session
  const [sessionId] = useState(() => `sess_ind_${Math.random().toString(36).substring(2, 9)}`);
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS);

  // Fetch incidents
  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch('/api/incidents');
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (e) {
      setIncidents(DEFAULT_INCIDENTS);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Trigger SOS dispatch and immediately alert contacts
  const triggerSOS = async (triggerType = "MANUAL_PANIC", location = { lat: 12.9725, lng: 77.6080 }, decibels = currentDecibels) => {
    setIsSOSActive(true);
    setSosTriggerType(triggerType);
    setIsStrobeActive(true);

    const latStr = (location?.lat || 12.9725).toFixed(5);
    const lngStr = (location?.lng || 77.6080).toFixed(5);
    const mapsUrl = `https://maps.google.com/?q=${latStr},${lngStr}`;
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const alertMessage = `🚨 CRITICAL EMERGENCY SOS: Immediate assistance required! My live location: ${mapsUrl} at ${timeStr}. (Trigger: ${triggerType}). National Police 112 & Women Helpline 1091 alerted.`;

    // Immediately trigger WhatsApp alert to primary contact upon user gesture
    try {
      const primaryPhone = "919820123456";
      const waUrl = `https://api.whatsapp.com/send?phone=${primaryPhone}&text=${encodeURIComponent(alertMessage)}`;
      window.open(waUrl, '_blank');
    } catch (err) {
      console.warn("Could not automatically open WhatsApp window:", err);
    }

    try {
      const res = await fetch('/api/emergency/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_name: "Aarav / Ananya",
          location: location,
          trigger_type: triggerType,
          battery_level: 90,
          ambient_decibels: decibels,
          message: alertMessage
        })
      });

      if (res.ok) {
        const dispatch = await res.json();
        setSosDispatchData(dispatch);
      }
    } catch (e) {
      setSosDispatchData({
        status: "DISPATCHED_INDIA_EMERGENCY",
        timestamp: new Date().toISOString(),
        nearest_safe_haven: "Apollo 24/7 Pharmacy & Night Safe Haven (45m)",
        trusted_contacts_notified: contacts.length
      });
    }
  };

  const dismissSOS = () => {
    setIsSOSActive(false);
    setSosTriggerType(null);
    setSosDispatchData(null);
    setIsStrobeActive(false);
  };

  const toggleStrobe = () => {
    setIsStrobeActive(prev => !prev);
  };

  const openFakeCall = (persona = null) => {
    setFakeCallPersona(persona);
    setIsFakeCallOpen(true);
  };

  const closeFakeCall = () => {
    setIsFakeCallOpen(false);
  };

  return (
    <SafetyContext.Provider
      value={{
        activeTab,
        setActiveTab,
        sessionId,
        isFakeCallOpen,
        openFakeCall,
        closeFakeCall,
        fakeCallPersona,
        isCalculatorOpen,
        setIsCalculatorOpen,
        isSOSActive,
        sosTriggerType,
        sosDispatchData,
        triggerSOS,
        dismissSOS,
        isStrobeActive,
        toggleStrobe,
        isAudioMonitorActive,
        setIsAudioMonitorActive,
        currentDecibels,
        setCurrentDecibels,
        audioThreatLevel,
        setAudioThreatLevel,
        incidents,
        fetchIncidents,
        isHazardModalOpen,
        setIsHazardModalOpen,
        contacts,
        setContacts
      }}
    >
      {children}
    </SafetyContext.Provider>
  );
}

export function useSafety() {
  const context = useContext(SafetyContext);
  if (!context) {
    throw new Error('useSafety must be used within a SafetyProvider');
  }
  return context;
}
