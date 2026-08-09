from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "GuardianPath Safety Routing API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Safety algorithm weights
    # C(e) = D(e) * (1 + w_L*(1 - S_L) + w_C*(1 - S_C) - w_H*S_H + w_I*I)
    WEIGHT_LIGHTING: float = 1.8       # Penalty for darkness (w_L)
    WEIGHT_CCTV: float = 1.2           # Penalty for unmonitored zones (w_C)
    WEIGHT_SAFE_HAVEN: float = 0.6     # Safety bonus for safe haven proximity (w_H)
    WEIGHT_INCIDENT: float = 2.5       # Heavy penalty for reported hazards (w_I)
    
    # Proximity thresholds in meters
    SAFE_HAVEN_BUFFER_METERS: float = 120.0
    INCIDENT_IMPACT_RADIUS_METERS: float = 150.0
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        case_sensitive = True

settings = Settings()

SAFETY_WEIGHTS = {
    "w_lighting": settings.WEIGHT_LIGHTING,
    "w_cctv": settings.WEIGHT_CCTV,
    "w_safe_haven": settings.WEIGHT_SAFE_HAVEN,
    "w_incident": settings.WEIGHT_INCIDENT,
}

PROXIMITY_BUFFERS = {
    "safe_haven_buffer_m": settings.SAFE_HAVEN_BUFFER_METERS,
    "incident_penalty_buffer_m": settings.INCIDENT_IMPACT_RADIUS_METERS,
}
