from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class IncidentCreate(BaseModel):
    lat: float
    lng: float
    category: str = Field(..., examples=["poor_lighting"], description="poor_lighting, suspicious_activity, blocked_path, harassment, infrastructure")
    severity: str = Field("medium", examples=["high"], description="low, medium, high, critical")
    description: str = Field(..., min_length=3, max_length=500)

class IncidentReport(BaseModel):
    id: str
    lat: float
    lng: float
    category: str
    severity: str
    description: str
    timestamp: str
    upvotes: int = 1
    verified: bool = True
