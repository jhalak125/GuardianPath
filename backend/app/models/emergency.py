from pydantic import BaseModel, Field
from typing import List, Optional
from .routing import Coordinates

class EmergencyContact(BaseModel):
    id: str
    name: str
    phone: str
    relationship: str
    is_notified: bool = False

class SOSPayload(BaseModel):
    session_id: Optional[str] = None
    user_name: Optional[str] = "Night Walker"
    location: Coordinates
    battery_level: Optional[int] = None
    trigger_type: str = Field("MANUAL_PANIC", examples=["MANUAL_PANIC"], description="MANUAL_PANIC, DEAD_MAN_TIMEOUT, AUDIO_DISTRESS, STEALTH_PIN")
    ambient_decibels: Optional[float] = None
    timestamp: Optional[str] = None
    message: Optional[str] = "EMERGENCY: Immediate safety assistance requested at current location!"

class TelemetryUpdate(BaseModel):
    type: str = "TELEMETRY_UPDATE"
    session_id: Optional[str] = None
    lat: float
    lng: float
    battery_level: Optional[int] = 100
    speed_mps: Optional[float] = 0.0
    dead_man_timer_remaining: Optional[int] = 300
    ambient_decibels: Optional[float] = 40.0
    status: Optional[str] = "EN_ROUTE_SAFE"

class PeerStatus(BaseModel):
    type: str = "PEER_STATUS"
    session_id: str
    user_name: str
    current_location: Coordinates
    status: str  # EN_ROUTE_SAFE, CHECKIN_WARNING, SOS_ACTIVE
    last_checkin_timestamp: str
    battery_level: int
    nearest_safe_haven: Optional[str] = None
    speed_mps: Optional[float] = 1.2
    ambient_decibels: Optional[float] = 42.0

class FakeCallPersona(BaseModel):
    id: str
    name: str
    relationship: str
    avatar_color: str
    incoming_phone: str
    dialogue_script: List[str]
