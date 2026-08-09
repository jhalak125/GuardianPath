from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from ..models.routing import (
    RouteComparisonRequest,
    RouteComparisonResponse,
    SafeHaven,
    Coordinates
)
from ..services.routing_service import routing_service
from ..services.safety_graph import safety_graph_service

router = APIRouter(prefix="/routes", tags=["Routing & Safe Havens"])

@router.post("/compare", response_model=RouteComparisonResponse)
async def compare_safety_routes(request: RouteComparisonRequest):
    """
    Evaluates origin and destination to return two routes:
    1. Fastest direct route (minimizing physical distance)
    2. Guardian Safe route (maximizing lighting, CCTV coverage, and safe havens)
    """
    try:
        response = routing_service.compare_routes(request.origin, request.destination)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Route calculation error: {str(e)}")

@router.get("/safe-havens", response_model=List[SafeHaven])
async def get_nearby_safe_havens(
    lat: float = Query(..., examples=[12.9750], description="Latitude"),
    lng: float = Query(..., examples=[77.6100], description="Longitude"),
    radius_meters: float = Query(3000.0, description="Radius in meters")
):
    """
    Returns verified 24/7 safe havens (Apollo pharmacies, police booths, hospital ERs, convenience hubs) near location.
    """
    return safety_graph_service.get_safe_havens_near(lat, lng, radius_meters)

@router.get("/graph-overview")
async def get_graph_overview():
    """
    Returns all graph intersections and streets with lighting & CCTV metrics for tactical heatmap rendering.
    """
    return {
        "nodes": list(safety_graph_service.nodes_data.values()),
        "safe_havens": safety_graph_service.safe_havens,
        "incidents_count": len(safety_graph_service.incidents)
    }
