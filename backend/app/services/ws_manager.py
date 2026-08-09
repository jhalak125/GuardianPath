from typing import Dict, List, Any, Optional
from fastapi import WebSocket
from datetime import datetime
import json
from .safety_graph import safety_graph_service

class WebSocketConnectionManager:
    def __init__(self):
        # Maps session_id -> list of active WebSocket connections
        self.active_sessions: Dict[str, List[WebSocket]] = {}
        # Maps session_id -> latest telemetry snapshot
        self.session_states: Dict[str, Dict[str, Any]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_sessions:
            self.active_sessions[session_id] = []
        self.active_sessions[session_id].append(websocket)

        # Send initial snapshot if available
        if session_id in self.session_states:
            try:
                await websocket.send_text(json.dumps(self.session_states[session_id]))
            except Exception:
                pass

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_sessions:
            if websocket in self.active_sessions[session_id]:
                self.active_sessions[session_id].remove(websocket)
            if not self.active_sessions[session_id]:
                del self.active_sessions[session_id]

    async def broadcast_to_session(self, session_id: str, message: Dict[str, Any], exclude_ws: Optional[WebSocket] = None):
        # Update cached snapshot
        self.session_states[session_id] = message

        if session_id in self.active_sessions:
            dead_connections = []
            for ws in self.active_sessions[session_id]:
                if ws == exclude_ws:
                    continue
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    dead_connections.append(ws)

            for ws in dead_connections:
                self.disconnect(session_id, ws)

    def get_latest_session_state(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self.session_states.get(session_id)

ws_manager = WebSocketConnectionManager()
