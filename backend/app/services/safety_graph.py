import json
import math
import os
from typing import Dict, List, Tuple, Any, Optional
import networkx as nx
from ..config import settings
from ..models.routing import Coordinates, SafeHaven
from ..models.incident import IncidentReport

def haversine_distance_meters(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """Calculate the great circle distance in meters between two points on the earth."""
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat / 2.0) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2.0) ** 2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371000.0  # Earth's radius in meters
    return c * r

class SafetyGraphService:
    def __init__(self):
        self.graph = nx.Graph()
        self.nodes_data: Dict[str, Dict[str, Any]] = {}
        self.safe_havens: List[SafeHaven] = []
        self.incidents: List[IncidentReport] = []
        self.load_data()

    def load_data(self):
        data_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "urban_safety_nodes.json")
        data_path = os.path.abspath(data_path)
        
        with open(data_path, "r", encoding="utf-8") as f:
            raw = json.load(f)

        # Load Safe Havens
        self.safe_havens = [
            SafeHaven(
                id=sh["id"],
                name=sh["name"],
                type=sh["type"],
                lat=sh["lat"],
                lng=sh["lng"],
                address=sh.get("address"),
                phone=sh.get("phone"),
                features=sh.get("features", [])
            )
            for sh in raw.get("safe_havens", [])
        ]

        # Load Incidents
        self.incidents = [
            IncidentReport(
                id=inc["id"],
                lat=inc["lat"],
                lng=inc["lng"],
                category=inc["category"],
                severity=inc["severity"],
                description=inc["description"],
                timestamp=inc["timestamp"],
                upvotes=inc.get("upvotes", 1)
            )
            for inc in raw.get("initial_incidents", [])
        ]

        # Load Nodes (Intersections)
        for node in raw.get("intersections", []):
            node_id = node["id"]
            self.nodes_data[node_id] = node
            self.graph.add_node(
                node_id,
                name=node["name"],
                lat=node["lat"],
                lng=node["lng"],
                lighting=node.get("lighting", 0.8),
                cctv=node.get("cctv", 0.7)
            )

        # Load Edges (Streets)
        for street in raw.get("streets", []):
            u = street["from"]
            v = street["to"]
            if u in self.nodes_data and v in self.nodes_data:
                coord_u = (self.nodes_data[u]["lat"], self.nodes_data[u]["lng"])
                coord_v = (self.nodes_data[v]["lat"], self.nodes_data[v]["lng"])
                dist_m = haversine_distance_meters(coord_u, coord_v)
                
                lighting = street.get("lighting", 0.8)
                cctv = street.get("cctv", 0.7)
                street_type = street.get("type", "street")
                name = street.get("name", "Unnamed Street")

                self.graph.add_edge(
                    u, v,
                    name=name,
                    distance=dist_m,
                    lighting=lighting,
                    cctv=cctv,
                    type=street_type
                )

        self.recompute_edge_safety_weights()

    def recompute_edge_safety_weights(self):
        """Calculates safety score and cost C(e) for every edge in the graph."""
        for u, v, data in self.graph.edges(data=True):
            dist_m = data.get("distance", 100.0)
            lighting = data.get("lighting", 0.8)  # S_L in [0, 1]
            cctv = data.get("cctv", 0.7)          # S_C in [0, 1]
            
            # Compute midpoint of edge
            node_u = self.nodes_data[u]
            node_v = self.nodes_data[v]
            mid_lat = (node_u["lat"] + node_v["lat"]) / 2.0
            mid_lng = (node_u["lng"] + node_v["lng"]) / 2.0
            midpoint = (mid_lat, mid_lng)

            # Safe Haven proximity score S_H in [0, 1]
            min_sh_dist = float('inf')
            for sh in self.safe_havens:
                sh_dist = haversine_distance_meters(midpoint, (sh.lat, sh.lng))
                if sh_dist < min_sh_dist:
                    min_sh_dist = sh_dist

            if min_sh_dist <= settings.SAFE_HAVEN_BUFFER_METERS:
                safe_haven_score = max(0.0, 1.0 - (min_sh_dist / settings.SAFE_HAVEN_BUFFER_METERS))
            else:
                safe_haven_score = 0.0

            # Incident penalty score I in [0, 1]
            incident_score = 0.0
            for inc in self.incidents:
                inc_dist = haversine_distance_meters(midpoint, (inc.lat, inc.lng))
                if inc_dist <= settings.INCIDENT_IMPACT_RADIUS_METERS:
                    weight_mult = 1.0 if inc.severity == "high" else (0.6 if inc.severity == "medium" else 0.3)
                    proximity_factor = max(0.0, 1.0 - (inc_dist / settings.INCIDENT_IMPACT_RADIUS_METERS))
                    incident_score += proximity_factor * weight_mult

            incident_score = min(1.0, incident_score)

            # Safety penalty calculation
            w_L = settings.WEIGHT_LIGHTING
            w_C = settings.WEIGHT_CCTV
            w_H = settings.WEIGHT_SAFE_HAVEN
            w_I = settings.WEIGHT_INCIDENT

            penalty_factor = 1.0 + (w_L * (1.0 - lighting)) + (w_C * (1.0 - cctv)) - (w_H * safe_haven_score) + (w_I * incident_score)
            penalty_factor = max(0.1, penalty_factor)

            # Safety-weighted cost for A* / Dijkstra
            safety_cost = dist_m * penalty_factor

            # Normalize safety score (0 to 100) for edge
            raw_safety = (lighting * 0.40) + (cctv * 0.30) + (safe_haven_score * 0.30) - (incident_score * 0.40)
            edge_safety_pct = int(max(5, min(99, raw_safety * 100)))

            data["safety_cost"] = safety_cost
            data["safe_haven_score"] = safe_haven_score
            data["incident_score"] = incident_score
            data["safety_score"] = edge_safety_pct

    def find_nearest_node(self, coord: Coordinates) -> str:
        """Find the closest intersection node ID in the graph to the provided coordinate."""
        best_node = None
        min_dist = float('inf')
        target = (coord.lat, coord.lng)
        
        for node_id, data in self.nodes_data.items():
            dist = haversine_distance_meters(target, (data["lat"], data["lng"]))
            if dist < min_dist:
                min_dist = dist
                best_node = node_id
        return best_node

    def add_incident(self, incident: IncidentReport) -> IncidentReport:
        self.incidents.insert(0, incident)
        self.recompute_edge_safety_weights()
        return incident

    def get_safe_havens_near(self, lat: float, lng: float, radius_meters: float = 2000.0) -> List[SafeHaven]:
        results = []
        origin = (lat, lng)
        for sh in self.safe_havens:
            dist = haversine_distance_meters(origin, (sh.lat, sh.lng))
            if dist <= radius_meters:
                sh_copy = sh.model_copy()
                sh_copy.distance_meters = round(dist, 1)
                results.append(sh_copy)
        results.sort(key=lambda x: x.distance_meters or 0)
        return results

safety_graph_service = SafetyGraphService()
