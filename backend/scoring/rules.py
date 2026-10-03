"""
LOCO Location Assessment Tool - Scoring Engine Rules

All scoring rules, point allocations, thresholds, and unavailable factor strategies
live strictly within this module.
"""

from typing import Dict, List, Any, Optional

MAX_POINTS_ELEVATION = 30.0
MAX_POINTS_TEMPERATURE = 30.0
MAX_POINTS_WEATHER = 40.0

def score_elevation(elevation_data: dict) -> dict:
    """
    Scores Elevation (Max 30 points).
    Rules:
    - 0 ft to 4,000 ft: 30 pts (Optimal human/commercial altitude)
    - 4,001 ft to 7,000 ft: 25 pts (High altitude - e.g. Denver 5,280 ft)
    - 7,001 ft to 10,000 ft: 15 pts (Very high altitude)
    - Above 10,000 ft or Below 0 ft: 5 pts (Extreme altitude or below sea level)
    """
    if elevation_data.get("status") != "available" or elevation_data.get("raw_value") is None:
        return {
            "factor_name": "Elevation",
            "status": "unavailable",
            "raw_value": None,
            "points": None,  # MUST NOT BE ZERO!
            "max_points": MAX_POINTS_ELEVATION,
            "source": elevation_data.get("source", "USGS"),
            "reason": elevation_data.get("reason", "Data source unavailable")
        }

    raw_val = elevation_data["raw_value"]
    # raw_val can be float or int
    try:
        val = float(raw_val)
    except (ValueError, TypeError):
        return {
            "factor_name": "Elevation",
            "status": "unavailable",
            "raw_value": None,
            "points": None,
            "max_points": MAX_POINTS_ELEVATION,
            "source": elevation_data.get("source", "USGS"),
            "reason": f"Invalid numeric elevation value: {raw_val}"
        }

    if 0 <= val <= 4000:
        pts = 30.0
    elif 4000 < val <= 7000:
        pts = 25.0
    elif 7000 < val <= 10000:
        pts = 15.0
    else:
        pts = 5.0

    return {
        "factor_name": "Elevation",
        "status": "available",
        "raw_value": f"{val:.1f} ft",
        "points": pts,
        "max_points": MAX_POINTS_ELEVATION,
        "source": elevation_data.get("source", "USGS"),
        "reason": None
    }


def score_temperature(temp_data: dict) -> dict:
    """
    Scores Temperature (Max 30 points).
    Rules:
    - 60°F to 80°F: 30 pts (Ideal comfortable temperature)
    - 45°F–59°F or 81°F–92°F: 22 pts (Moderate temperature)
    - 30°F–44°F or 93°F–104°F: 12 pts (Cold or hot temperature)
    - Below 30°F or Above 104°F: 5 pts (Extreme cold/heat)
    """
    if temp_data.get("status") != "available" or temp_data.get("numeric_val") is None:
        return {
            "factor_name": "Temperature",
            "status": "unavailable",
            "raw_value": None,
            "points": None,  # MUST NOT BE ZERO!
            "max_points": MAX_POINTS_TEMPERATURE,
            "source": temp_data.get("source", "Open-Meteo"),
            "reason": temp_data.get("reason", "Data source unavailable")
        }

    try:
        temp = float(temp_data["numeric_val"])
    except (ValueError, TypeError):
        return {
            "factor_name": "Temperature",
            "status": "unavailable",
            "raw_value": None,
            "points": None,
            "max_points": MAX_POINTS_TEMPERATURE,
            "source": temp_data.get("source", "Open-Meteo"),
            "reason": "Invalid temperature numeric value"
        }

    if 60.0 <= temp <= 80.0:
        pts = 30.0
    elif (45.0 <= temp < 60.0) or (80.0 < temp <= 92.0):
        pts = 22.0
    elif (30.0 <= temp < 45.0) or (92.0 < temp <= 104.0):
        pts = 12.0
    else:
        pts = 5.0

    return {
        "factor_name": "Temperature",
        "status": "available",
        "raw_value": f"{temp:.1f} °F",
        "points": pts,
        "max_points": MAX_POINTS_TEMPERATURE,
        "source": temp_data.get("source", "Open-Meteo"),
        "reason": None
    }


def score_weather_condition(weather_data: dict) -> dict:
    """
    Scores Weather Condition (Max 40 points).
    Rules:
    - Clear sky / Mainly clear: 40 pts
    - Partly cloudy / Overcast: 32 pts
    - Fog / Light drizzle / Rime fog: 20 pts
    - Rain / Snow / Rain showers: 10 pts
    - Severe Thunderstorm / Heavy rain / Hail: 0 pts (Adverse weather)
    """
    if weather_data.get("status") != "available" or weather_data.get("wcode") is None:
        return {
            "factor_name": "Weather Condition",
            "status": "unavailable",
            "raw_value": None,
            "points": None,  # MUST NOT BE ZERO!
            "max_points": MAX_POINTS_WEATHER,
            "source": weather_data.get("source", "Open-Meteo"),
            "reason": weather_data.get("reason", "Data source unavailable")
        }

    wcode = weather_data["wcode"]
    raw_str = weather_data.get("raw_value", f"Weather code {wcode}")

    if wcode in [0, 1]:
        pts = 40.0
    elif wcode in [2, 3]:
        pts = 32.0
    elif wcode in [45, 48, 51, 53, 55, 56, 57]:
        pts = 20.0
    elif wcode in [61, 63, 66, 71, 73, 77, 80, 81, 85]:
        pts = 10.0
    else:
        # Severe: heavy rain 65/67, heavy snow 75/86, violent shower 82, thunderstorm 95/96/99
        pts = 0.0

    return {
        "factor_name": "Weather Condition",
        "status": "available",
        "raw_value": raw_str,
        "points": pts,
        "max_points": MAX_POINTS_WEATHER,
        "source": weather_data.get("source", "Open-Meteo"),
        "reason": None
    }


def calculate_assessment(elevation_raw: dict, temp_raw: dict, weather_raw: dict) -> tuple[Optional[float], List[dict]]:
    """
    Calculates factor scores and overall assessment score (0-100).
    
    Unavailable factors rule:
    - Unavailable factors do NOT award 0 points. Their points remain None.
    - If some factors are available and others unavailable, the total score is computed as
      the proportion of points earned among available factors, re-scaled to a 100-point scale:
      total_score = round((earned_available_points / max_available_points) * 100, 1)
    - If ALL factors are unavailable, total_score is None.
    """
    factor_elevation = score_elevation(elevation_raw)
    factor_temp = score_temperature(temp_raw)
    factor_weather = score_weather_condition(weather_raw)

    factors = [factor_elevation, factor_temp, factor_weather]

    available_earned = 0.0
    available_max = 0.0
    has_available = False

    for f in factors:
        if f["status"] == "available" and f["points"] is not None:
            has_available = True
            available_earned += f["points"]
            available_max += f["max_points"]

    if not has_available or available_max == 0:
        total_score = None
    else:
        raw_score = (available_earned / available_max) * 100.0
        # Clamp between 0 and 100
        total_score = round(max(0.0, min(100.0, raw_score)), 1)

    return total_score, factors
