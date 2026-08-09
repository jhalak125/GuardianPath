import networkx as nx
from typing import List, Tuple, Dict, Any, Optional
from ..models.routing import (
    Coordinates, RouteOption, RouteComparisonResponse,
    SafeHaven, HazardWarning
)
from ..config import SAFETY_WEIGHTS, PROXIMITY_BUFFERS
from .safety_graph import safety_graph_service, haversine_distance_meters

class RoutingService:
    def __init__(self):
        self.graph_service = safety_graph_service

    def _heuristic_distance(self, u: str, v: str) -> float:
        """Heuristic for A* algorithm: physical distance in meters."""
        node_u = self.graph_service.nodes_data[u]
        node_v = self.graph_service.nodes_data[v]
        return haversine_distance_meters((node_u["lat"], node_u["lng"]), (node_v["lat"], node_v["lng"]))

    def _calculate_pure_edge_safety(
        self,
        node_path: List[str],
        waypoints: List[Coordinates]
    ) -> Tuple[int, int, int, List[SafeHaven], List[str], float]:
        """
        Pure data-driven safety calculation based directly on the mathematical formula:
        Score = 100 * (w_L * S_L + w_C * S_C + w_H * S_H) / (w_L + w_C + w_H + w_I * I)
        derived purely from graph edges, lighting, CCTV, safe haven buffers, and crowdsourced hazards.
        """
        graph = self.graph_service.graph
        nodes_data = self.graph_service.nodes_data
        
        w_L = SAFETY_WEIGHTS["w_lighting"]
        w_C = SAFETY_WEIGHTS["w_cctv"]
        w_H = SAFETY_WEIGHTS["w_safe_haven"]
        w_I = SAFETY_WEIGHTS["w_incident"]

        total_distance = 0.0
        weighted_lighting_sum = 0.0
        weighted_cctv_sum = 0.0
        hazard_warnings: List[str] = []

        # 1. Edge traversal metrics
        for i in range(len(node_path) - 1):
            u = node_path[i]
            v = node_path[i + 1]
            edge_data = graph.get_edge_data(u, v) or {}

            dist = edge_data.get("distance", 100.0)
            lighting = edge_data.get("lighting", 0.5)
            cctv = edge_data.get("cctv", 0.5)
            street_name = edge_data.get("name", "Street")
            street_type = edge_data.get("type", "street")

            total_distance += dist
            weighted_lighting_sum += (lighting * dist)
            weighted_cctv_sum += (cctv * dist)

            if lighting < 0.40:
                hazard_warnings.append(f"Low/unlit stretch on {street_name} ({int(lighting*100)}% lit)")
            if street_type == "alley":
                hazard_warnings.append(f"Narrow unmonitored gali on {street_name}")

        dist_denom = max(1.0, total_distance)
        avg_lighting = weighted_lighting_sum / dist_denom
        avg_cctv = weighted_cctv_sum / dist_denom

        # 2. Real Safe Havens along waypoints (buffer 100m)
        safe_havens_along: List[SafeHaven] = []
        seen_havens = set()
        for sh in self.graph_service.safe_havens:
            for wp in waypoints:
                dist_sh = haversine_distance_meters((wp.lat, wp.lng), (sh.lat, sh.lng))
                if dist_sh <= PROXIMITY_BUFFERS["safe_haven_buffer_m"] and sh.id not in seen_havens:
                    sh_copy = sh.model_copy()
                    sh_copy.distance_meters = round(dist_sh, 1)
                    safe_havens_along.append(sh_copy)
                    seen_havens.add(sh.id)
                    break

        # Safe haven coverage factor S_H (0.0 to 1.0)
        # 1 safe haven per 500m gives full haven saturation
        haven_density = min(1.0, (len(safe_havens_along) * 500.0) / dist_denom)

        # 3. Real Crowdsourced Incidents along route waypoints (buffer 80m)
        incident_severity_sum = 0.0
        seen_incidents = set()
        for inc in self.graph_service.incidents:
            for wp in waypoints:
                dist_inc = haversine_distance_meters((wp.lat, wp.lng), (inc.lat, inc.lng))
                if dist_inc <= PROXIMITY_BUFFERS["incident_penalty_buffer_m"] and inc.id not in seen_incidents:
                    sev_multiplier = 1.0 if inc.severity == "high" else 0.5
                    incident_severity_sum += (sev_multiplier * max(0.2, 1.0 - (dist_inc / 150.0)))
                    warn = f"Reported {inc.category.replace('_', ' ')}: {inc.description}"
                    if warn not in hazard_warnings:
                        hazard_warnings.append(warn)
                    seen_incidents.add(inc.id)
                    break

        # Pure mathematical formula:
        numerator = (w_L * avg_lighting) + (w_C * avg_cctv) + (w_H * haven_density)
        denominator = w_L + w_C + w_H + (w_I * incident_severity_sum)
        
        pure_score_ratio = numerator / max(0.01, denominator)
        calculated_safety_score = int(max(1, min(100, round(pure_score_ratio * 100.0))))

        lighting_pct = int(min(100, max(0, avg_lighting * 100)))
        cctv_pct = int(min(100, max(0, avg_cctv * 100)))

        return (calculated_safety_score, lighting_pct, cctv_pct, safe_havens_along, hazard_warnings, total_distance)

    def _compile_route_details(
        self,
        route_id: str,
        title: str,
        node_path: List[str],
        origin: Coordinates,
        destination: Coordinates
    ) -> RouteOption:
        nodes_data = self.graph_service.nodes_data

        # Construct full coordinate sequence
        waypoints: List[Coordinates] = [origin]
        for node_id in node_path:
            n = nodes_data[node_id]
            waypoints.append(Coordinates(lat=n["lat"], lng=n["lng"]))
        waypoints.append(destination)

        # Calculate pure data-driven safety
        safety_score, lighting_pct, cctv_pct, safe_havens_along, hazard_warnings, edge_dist = (
            self._calculate_pure_edge_safety(node_path, waypoints)
        )

        # Full distance including origin and destination connectors
        first_node = nodes_data[node_path[0]]
        last_node = nodes_data[node_path[-1]]
        total_dist = (
            edge_dist +
            haversine_distance_meters((origin.lat, origin.lng), (first_node["lat"], first_node["lng"])) +
            haversine_distance_meters((last_node["lat"], last_node["lng"]), (destination.lat, destination.lng))
        )

        # Walking speed ~1.2 m/s -> 72 m/min
        duration_minutes = round(total_dist / 72.0, 1)

        return RouteOption(
            id=route_id,
            title=title,
            distance_meters=round(total_dist, 1),
            duration_minutes=duration_minutes,
            safety_score=safety_score,
            lighting_coverage_pct=lighting_pct,
            cctv_coverage_pct=cctv_pct,
            safe_havens_count=len(safe_havens_along),
            waypoints=waypoints,
            safe_havens_along_route=safe_havens_along,
            hazard_warnings=hazard_warnings
        )

    def compare_routes(self, origin: Coordinates, destination: Coordinates) -> RouteComparisonResponse:
        self.graph_service.load_data()
        start_node = self.graph_service.find_nearest_node(origin)
        end_node = self.graph_service.find_nearest_node(destination)

        graph = self.graph_service.graph

        if not start_node or not end_node:
            nodes = list(self.graph_service.nodes_data.keys())
            start_node = nodes[0]
            end_node = nodes[-1]

        # 1. Guardian Safe Route: A* on safety_cost (prefers high lighting & safe havens)
        try:
            safe_path = nx.astar_path(
                graph,
                start_node,
                end_node,
                heuristic=lambda u, v: self._heuristic_distance(u, v),
                weight="safety_cost"
            )
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            try:
                safe_path = nx.dijkstra_path(graph, start_node, end_node, weight="safety_cost")
            except nx.NetworkXNoPath:
                safe_path = [start_node, end_node]

        # 2. Fastest Route: Dijkstra on physical distance
        try:
            fastest_path = nx.dijkstra_path(graph, start_node, end_node, weight="distance")
        except nx.NetworkXNoPath:
            fastest_path = [start_node, end_node]

        # If fastest and safe paths are identical, find shortest alternative path
        if fastest_path == safe_path and start_node != end_node:
            try:
                all_paths = list(nx.all_simple_paths(graph, start_node, end_node, cutoff=7))
                if len(all_paths) > 1:
                    all_paths.sort(key=lambda p: sum(graph[p[i]][p[i+1]].get("distance", 100) for i in range(len(p)-1)))
                    fastest_path = all_paths[0]
                    safe_path = min(all_paths, key=lambda p: sum(graph[p[i]][p[i+1]].get("safety_cost", 100) for i in range(len(p)-1)))
            except Exception:
                pass

        fastest_option = self._compile_route_details(
            route_id="fastest",
            title="Fastest Direct Route",
            node_path=fastest_path,
            origin=origin,
            destination=destination
        )

        guardian_option = self._compile_route_details(
            route_id="guardian_safe",
            title="Guardian Safe Route (Illuminated)",
            node_path=safe_path,
            origin=origin,
            destination=destination
        )

        mid_lat = (origin.lat + destination.lat) / 2.0
        mid_lng = (origin.lng + destination.lng) / 2.0
        nearby_havens = self.graph_service.get_safe_havens_near(mid_lat, mid_lng, radius_meters=3000.0)

        return RouteComparisonResponse(
            fastest_route=fastest_option,
            guardian_safe_route=guardian_option,
            origin=origin,
            destination=destination,
            safe_havens_nearby=nearby_havens
        )

routing_service = RoutingService()
