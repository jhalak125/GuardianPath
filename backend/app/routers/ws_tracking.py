from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
import json
from ..services.ws_manager import ws_manager
from ..services.safety_graph import safety_graph_service

router = APIRouter(tags=["Real-Time Tracking WebSocket"])

@router.websocket("/ws/live-track/{session_id}")
async def websocket_live_track(websocket: WebSocket, session_id: str):
    """
    Bidirectional WebSocket connection for live telemetry sync between
    Night Walker and Trusted Contact Viewers.
    """
    await ws_manager.connect(session_id, websocket)
    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                msg = json.loads(raw_data)
                msg_type = msg.get("type", "TELEMETRY_UPDATE")

                if msg_type == "TELEMETRY_UPDATE":
                    lat = float(msg.get("lat", 40.7128))
                    lng = float(msg.get("lng", -74.0060))
                    user_name = msg.get("user_name", "Alex")
                    battery = int(msg.get("battery_level", 85))
                    speed = float(msg.get("speed_mps", 1.2))
                    timer = int(msg.get("dead_man_timer_remaining", 300))
                    decibels = float(msg.get("ambient_decibels", 42.0))
                    status = msg.get("status", "EN_ROUTE_SAFE")

                    # Find nearest safe haven
                    nearest_havens = safety_graph_service.get_safe_havens_near(lat, lng, radius_meters=3000)
                    nearest_str = f"{nearest_havens[0].name} ({int(nearest_havens[0].distance_meters or 0)}m)" if nearest_havens else "Scanning..."

                    broadcast_payload = {
                        "type": "PEER_STATUS",
                        "session_id": session_id,
                        "user_name": user_name,
                        "current_location": {"lat": lat, "lng": lng},
                        "status": status,
                        "last_checkin_timestamp": datetime.utcnow().isoformat() + "Z",
                        "battery_level": battery,
                        "speed_mps": speed,
                        "dead_man_timer_remaining": timer,
                        "ambient_decibels": decibels,
                        "nearest_safe_haven": nearest_str
                    }

                    await ws_manager.broadcast_to_session(session_id, broadcast_payload, exclude_ws=websocket)

                elif msg_type in ("SOS_TRIGGER", "EMERGENCY_ALERT"):
                    await ws_manager.broadcast_to_session(session_id, msg, exclude_ws=websocket)

                elif msg_type == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG", "timestamp": datetime.utcnow().isoformat()}))

            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(session_id, websocket)
    except Exception:
        ws_manager.disconnect(session_id, websocket)
