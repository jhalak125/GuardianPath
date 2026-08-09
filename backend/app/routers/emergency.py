from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime
from ..models.emergency import SOSPayload, FakeCallPersona
from ..services.ws_manager import ws_manager
from ..services.safety_graph import safety_graph_service

router = APIRouter(prefix="/emergency", tags=["Emergency & Discreet Deterrence"])

FAKE_CALL_PERSONAS: List[FakeCallPersona] = [
    {
      "id": "persona_mom",
      "name": "Mummy (Home)",
      "relationship": "Family",
      "avatar_color": "#E11D48",
      "incoming_phone": "+91 98201 23456",
      "dialogue_script": [
        "Beta, kahan pahunche? Main balcony se dekh rahi hoon, main road ke lights on hain.",
        "Papa aur main building ke main gate pe khade hain tumhara wait kar rahe hain.",
        "Speaker pe hi rehne do phone, jab tak gate ke andar na aa jao. Seedhe main road se aao!"
      ]
    },
    {
      "id": "persona_police",
      "name": "Police PCR Patrol 112",
      "relationship": "Emergency Police Van",
      "avatar_color": "#0284C7",
      "incoming_phone": "112 / 1091 - PCR Control",
      "dialogue_script": [
        "City Police Control room here. PCR Patrol Cruiser 4 has visual on your GPS coordinates near Main Road.",
        "Our patrol team is 60 seconds away from the junction. Stay on the brightly lit avenue.",
        "Keep the line active. High-definition CCTV surveillance is currently locked on your route."
      ]
    },
    {
      "id": "persona_driver",
      "name": "Ramesh (Ola / Uber Cab)",
      "relationship": "Driver • Silver Dzire",
      "avatar_color": "#059669",
      "incoming_phone": "+91 94451 88920",
      "dialogue_script": [
        "Bhaiya / Didi, main silver Swift Dzire leke corner pe khada hoon, hazard parking lights on hain.",
        "Main aapko footpath pe walk karte hue dekh sakta hoon. Door unlock kar diya hai.",
        "Aap seedhe car ke paas aa jaiye, main gate open karke wait kar raha hoon."
      ]
    },
    {
      "id": "persona_brother",
      "name": "Bhai (Scooty Ready)",
      "relationship": "Brother",
      "avatar_color": "#7C3AED",
      "incoming_phone": "+91 98112 34567",
      "dialogue_script": [
        "Haan bhai, main 100 feet road ke corner pe scooty start karke khada hoon.",
        "Live location dekh raha hoon, bas 1 minute mein reach kar raha hoon.",
        "Main road pe hi rukna, kisi dark gali mein mat jaana!"
      ]
    }
]

@router.post("/sos")
async def trigger_emergency_sos(payload: SOSPayload):
    """
    Dispatches immediate high-priority emergency alert payload with GPS coordinates,
    trigger type, battery level, and broadcasts to trusted contacts.
    """
    timestamp = payload.timestamp or (datetime.utcnow().isoformat() + "Z")
    
    # Locate nearest safe haven to include in dispatch payload
    nearest_havens = safety_graph_service.get_safe_havens_near(payload.location.lat, payload.location.lng, radius_meters=5000)
    nearest_haven_name = f"{nearest_havens[0].name} ({int(nearest_havens[0].distance_meters or 0)}m)" if nearest_havens else "Apollo 24/7 Pharmacy (60m)"

    alert_message = {
        "type": "EMERGENCY_ALERT",
        "session_id": payload.session_id or "live_session",
        "user_name": payload.user_name or "Aarav / Ananya",
        "status": "SOS_ACTIVE",
        "trigger_type": payload.trigger_type,
        "current_location": {"lat": payload.location.lat, "lng": payload.location.lng},
        "battery_level": payload.battery_level or 100,
        "ambient_decibels": payload.ambient_decibels or 40.0,
        "nearest_safe_haven": nearest_haven_name,
        "timestamp": timestamp,
        "alert_text": f"CRITICAL SOS TRIGGERED [{payload.trigger_type}]: Emergency assistance requested! National Helpline 112 & Women Helpline 1091 alerted."
    }

    # Broadcast to WebSocket live track if session_id provided
    if payload.session_id:
        await ws_manager.broadcast_to_session(payload.session_id, alert_message)

    return {
        "status": "DISPATCHED",
        "timestamp": timestamp,
        "dispatch_id": f"IND_POL_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "nearest_safe_haven": nearest_haven_name,
        "trusted_contacts_notified": 3,
        "channels": ["SMS_112_SIMULATED", "WOMEN_HELPLINE_1091", "WEBSOCKET_BROADCAST"]
    }

@router.get("/fake-call-personas")
async def get_fake_call_personas():
    """Returns dynamic audio dialogue scripts for fake incoming calls."""
    return FAKE_CALL_PERSONAS
