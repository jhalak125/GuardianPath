from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import uuid
from ..models.incident import IncidentReport, IncidentCreate
from ..services.safety_graph import safety_graph_service

router = APIRouter(prefix="/incidents", tags=["Crowdsourced Hazard Reports"])

@router.get("", response_model=List[IncidentReport])
async def list_incidents():
    """Returns active crowdsourced safety incidents & hazards."""
    return safety_graph_service.incidents

@router.post("", response_model=IncidentReport)
async def report_incident(incident_data: IncidentCreate):
    """
    Submits a new hazard report (broken streetlights, suspicious loitering, harassment, blocked path)
    and dynamically re-weights intersecting graph edges.
    """
    try:
        new_id = f"inc_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        report = IncidentReport(
            id=new_id,
            lat=incident_data.lat,
            lng=incident_data.lng,
            category=incident_data.category,
            severity=incident_data.severity,
            description=incident_data.description,
            timestamp=timestamp,
            upvotes=1,
            verified=True
        )
        
        saved = safety_graph_service.add_incident(report)
        return saved
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit hazard report: {str(e)}")

@router.post("/{incident_id}/upvote")
async def upvote_incident(incident_id: str):
    """Upvotes an existing hazard to confirm its active status."""
    for inc in safety_graph_service.incidents:
        if inc.id == incident_id:
            inc.upvotes += 1
            safety_graph_service.recompute_edge_safety_weights()
            return {"status": "success", "id": incident_id, "upvotes": inc.upvotes}
    raise HTTPException(status_code=404, detail="Incident not found")
