import pytest
from scoring.rules import (
    score_elevation,
    score_temperature,
    score_weather_condition,
    calculate_assessment,
    MAX_POINTS_ELEVATION,
    MAX_POINTS_TEMPERATURE,
    MAX_POINTS_WEATHER,
)

def test_normal_available_factors():
    """Test standard scoring when all 3 data sources return valid data."""
    elevation_raw = {"status": "available", "raw_value": 5280.0, "source": "USGS"}
    temp_raw = {"status": "available", "numeric_val": 72.0, "source": "Open-Meteo"}
    weather_raw = {"status": "available", "wcode": 0, "raw_value": "Clear sky", "source": "Open-Meteo"}

    score, factors = calculate_assessment(elevation_raw, temp_raw, weather_raw)

    assert score is not None
    # Elevation 5280 ft -> 25/30
    # Temp 72 F -> 30/30
    # Weather code 0 -> 40/40
    # Total = 95 / 100
    assert score == 95.0
    assert len(factors) == 3
    for f in factors:
        assert f["status"] == "available"
        assert f["points"] is not None

def test_high_and_low_values():
    """Test extreme high/low elevations and temperatures."""
    # High elevation (12,000 ft -> 5 pts), extreme heat (108°F -> 5 pts), severe weather (wcode 95 -> 0 pts)
    elev = {"status": "available", "raw_value": 12000.0, "source": "USGS"}
    temp = {"status": "available", "numeric_val": 108.0, "source": "Open-Meteo"}
    weather = {"status": "available", "wcode": 95, "raw_value": "Thunderstorm", "source": "Open-Meteo"}

    score, factors = calculate_assessment(elev, temp, weather)
    # Total = 5 + 5 + 0 = 10 / 100
    assert score == 10.0

def test_unavailable_factor_is_not_zero():
    """
    CRITICAL MANDATORY TEST:
    Verify that an unavailable factor is explicitly marked status='unavailable',
    points=None (NOT 0), and raw_value=None.
    """
    elev = {"status": "available", "raw_value": 3000.0, "source": "USGS"} # 30 pts
    temp = {"status": "unavailable", "reason": "Request timed out", "source": "Open-Meteo"}
    weather = {"status": "available", "wcode": 1, "raw_value": "Mainly clear", "source": "Open-Meteo"} # 40 pts

    score, factors = calculate_assessment(elev, temp, weather)

    # Find temperature factor
    temp_factor = next(f for f in factors if f["factor_name"] == "Temperature")
    assert temp_factor["status"] == "unavailable"
    assert temp_factor["points"] is None  # MUST NOT BE ZERO!
    assert temp_factor["raw_value"] is None
    assert temp_factor["reason"] == "Request timed out"

    # Score calculation on available factors (30 + 40 = 70 earned out of 30 + 40 = 70 available max) -> 100.0%
    assert score == 100.0

def test_multiple_unavailable_factors():
    """Test when 2 out of 3 factors are unavailable."""
    elev = {"status": "unavailable", "reason": "HTTP 500 error", "source": "USGS"}
    temp = {"status": "unavailable", "reason": "Timeout", "source": "Open-Meteo"}
    weather = {"status": "available", "wcode": 2, "raw_value": "Partly cloudy", "source": "Open-Meteo"} # 32 / 40 pts

    score, factors = calculate_assessment(elev, temp, weather)
    
    # 32 earned out of 40 max available -> (32/40)*100 = 80.0
    assert score == 80.0
    assert factors[0]["points"] is None
    assert factors[1]["points"] is None
    assert factors[2]["points"] == 32.0

def test_all_factors_unavailable():
    """Test when ALL factors are unavailable."""
    elev = {"status": "unavailable", "reason": "Timeout", "source": "USGS"}
    temp = {"status": "unavailable", "reason": "Timeout", "source": "Open-Meteo"}
    weather = {"status": "unavailable", "reason": "Timeout", "source": "Open-Meteo"}

    score, factors = calculate_assessment(elev, temp, weather)

    assert score is None
    for f in factors:
        assert f["status"] == "unavailable"
        assert f["points"] is None

def test_score_boundaries():
    """Test score boundaries remain strictly within 0 - 100."""
    # Optimal values
    elev = {"status": "available", "raw_value": 100.0, "source": "USGS"} # 30
    temp = {"status": "available", "numeric_val": 70.0, "source": "Open-Meteo"} # 30
    weather = {"status": "available", "wcode": 0, "raw_value": "Clear sky", "source": "Open-Meteo"} # 40

    score, _ = calculate_assessment(elev, temp, weather)
    assert 0.0 <= score <= 100.0
    assert score == 100.0
