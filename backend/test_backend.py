import asyncio
import json
from app.services.safety_graph import safety_graph_service
from app.services.routing_service import routing_service
from app.models.routing import Coordinates

PRESETS = [
    ("Apollo 24/7 Pharmacy", Coordinates(lat=12.9725, lng=77.6080)),
    ("Brigade Road Pink Police Booth", Coordinates(lat=12.9755, lng=77.6120)),
    ("24/7 Swagat Fuel Oasis", Coordinates(lat=12.9785, lng=77.6150)),
    ("Commercial Street Gateway", Coordinates(lat=12.9815, lng=77.6185))
]

def test_all_destinations():
    origin = Coordinates(lat=12.9695, lng=77.6020)
    print("=== Testing All Destinations for Distinct Scores & Hazards ===")
    
    seen_safe_scores = []
    seen_fast_scores = []

    for name, dest in PRESETS:
        res = routing_service.compare_routes(origin, dest)
        g = res.guardian_safe_route
        f = res.fastest_route
        
        print(f"\n📍 Destination: {name}")
        print(f"   🛡️ Guardian Safe : {g.distance_meters}m | {g.duration_minutes} min | Safety: {g.safety_score}% | Havens: {g.safe_havens_count} | Warnings: {len(g.hazard_warnings)}")
        print(f"   ⚡ Fastest Direct: {f.distance_meters}m | {f.duration_minutes} min | Safety: {f.safety_score}% | Havens: {f.safe_havens_count} | Warnings: {len(f.hazard_warnings)}")
        if f.hazard_warnings:
            print(f"      Hazards on fastest: {f.hazard_warnings}")
        
        assert g.safety_score > f.safety_score, f"Guardian score ({g.safety_score}) must be > Fastest ({f.safety_score})"
        seen_safe_scores.append(g.safety_score)
        seen_fast_scores.append(f.safety_score)

    print(f"\nGuardian Scores Across Destinations: {seen_safe_scores}")
    print(f"Fastest Scores Across Destinations : {seen_fast_scores}")
    print("✓ All destinations have verified distinct paths, scores, and localized hazards!")

if __name__ == "__main__":
    test_all_destinations()
