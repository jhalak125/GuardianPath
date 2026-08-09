from typing import Dict, Any

class AudioThreatClassifier:
    """Classifies audio decibel levels and frequency distress spikes."""

    @staticmethod
    def classify_decibel_level(db: float) -> Dict[str, Any]:
        """
        Classify ambient decibels:
        - < 45 dB: Quiet / Normal night ambiance
        - 45 - 65 dB: Moderate conversational activity
        - 65 - 80 dB: High noise / Traffic / Shouting nearby
        - 80 - 95 dB: Elevated threat / Aggressive scream / Car horn alarm
        - > 95 dB: Critical distress event / Gunshot / Crash / Screaming
        """
        if db < 45:
            return {
                "level": "QUIET",
                "status": "NORMAL",
                "color": "#00FF9D",
                "threat_score": 0.05,
                "is_distress": False,
                "message": "Ambient environment is calm and quiet."
            }
        elif db < 65:
            return {
                "level": "NORMAL",
                "status": "NORMAL",
                "color": "#05D9E8",
                "threat_score": 0.20,
                "is_distress": False,
                "message": "Normal conversational city ambiance."
            }
        elif db < 80:
            return {
                "level": "ELEVATED",
                "status": "CAUTION",
                "color": "#FFC107",
                "threat_score": 0.55,
                "is_distress": False,
                "message": "Elevated noise detected. Monitoring sound stream closely."
            }
        elif db < 95:
            return {
                "level": "HIGH_ALERT",
                "status": "WARNING",
                "color": "#FF9F1C",
                "threat_score": 0.85,
                "is_distress": True,
                "message": "Sudden loud acoustic spike or shouting detected!"
            }
        else:
            return {
                "level": "CRITICAL_DISTRESS",
                "status": "DANGER",
                "color": "#FF2A6D",
                "threat_score": 1.00,
                "is_distress": True,
                "message": "Critical acoustic anomaly! Distress / Scream threshold exceeded!"
            }

audio_classifier = AudioThreatClassifier()
