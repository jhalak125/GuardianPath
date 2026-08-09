from pydantic import BaseModel, Field
from typing import List, Optional

class Coordinates(BaseModel):
    lat: float = Field(..., examples=[12.9695], description="Latitude in decimal degrees")
    lng: float = Field(..., examples=[77.6020], description="Longitude in decimal degrees")

class SafeHaven(BaseModel):
    id: str
    name: str
    type: str  # pharmacy, police, hospital, convenience, shelter
    lat: float
    lng: float
    address: Optional[str] = None
    phone: Optional[str] = None
    distance_meters: Optional[float] = None
    features: List[str] = []

class HazardWarning(BaseModel):
    title: str
    description: str
    severity: str  # low, medium, high, critical
    lat: Optional[float] = None
    lng: Optional[float] = None

class RouteSegment(BaseModel):
    name: str
    distance_meters: float
    lighting_pct: float
    cctv_pct: float
    safety_score: float
    waypoints: List[Coordinates]

class RouteOption(BaseModel):
    id: str  # "fastest" | "guardian_safe"
    title: str
    distance_meters: float
    duration_minutes: float
    safety_score: int  # 0 to 100
    lighting_coverage_pct: int  # 0 to 100
    cctv_coverage_pct: int      # 0 to 100
    safe_havens_count: int
    waypoints: List[Coordinates]
    safe_havens_along_route: List[SafeHaven] = []
    hazard_warnings: List[str] = []
    polyline_encoded: Optional[str] = None

class RouteComparisonRequest(BaseModel):
    origin: Coordinates
    destination: Coordinates
    preference: Optional[str] = "max_safety"

class RouteComparisonResponse(BaseModel):
    fastest_route: RouteOption
    guardian_safe_route: RouteOption
    origin: Coordinates
    destination: Coordinates
    safe_havens_nearby: List[SafeHaven] = []
