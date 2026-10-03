import logging
import httpx
from config import settings

logger = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# WMO Weather interpretation codes (WW)
WMO_WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
}

def decode_weather_code(code: int) -> str:
    return WMO_WEATHER_CODES.get(code, f"Weather code {code}")

async def fetch_weather_and_temperature(latitude: float, longitude: float) -> tuple[dict, dict]:
    """
    Fetches temperature and weather condition from Open-Meteo API.
    Returns a tuple of dicts: (temp_factor, weather_factor).
    Never crashes; returns status='available' or 'unavailable'.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current_weather": "true",
        "temperature_unit": "fahrenheit"
    }
    headers = {
        "User-Agent": settings.USER_AGENT
    }

    try:
        async with httpx.AsyncClient(timeout=settings.HTTP_TIMEOUT) as client:
            response = await client.get(OPEN_METEO_URL, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            cw = data.get("current_weather", {})
            temp = cw.get("temperature")
            wcode = cw.get("weathercode")
            
            # 1. Temperature dict
            if temp is not None:
                temp_factor = {
                    "status": "available",
                    "raw_value": f"{round(float(temp), 1)} °F",
                    "numeric_val": float(temp),
                    "source": "Open-Meteo",
                    "reason": None
                }
            else:
                temp_factor = {
                    "status": "unavailable",
                    "raw_value": None,
                    "numeric_val": None,
                    "source": "Open-Meteo",
                    "reason": "Temperature data missing in API response"
                }

            # 2. Weather condition dict
            if wcode is not None:
                condition_str = decode_weather_code(int(wcode))
                weather_factor = {
                    "status": "available",
                    "raw_value": condition_str,
                    "wcode": int(wcode),
                    "source": "Open-Meteo",
                    "reason": None
                }
            else:
                weather_factor = {
                    "status": "unavailable",
                    "raw_value": None,
                    "wcode": None,
                    "source": "Open-Meteo",
                    "reason": "Weather condition code missing in API response"
                }
                
            return temp_factor, weather_factor

    except httpx.TimeoutException:
        logger.warning(f"Open-Meteo API timed out for coords ({latitude}, {longitude})")
        fail_dict = {
            "status": "unavailable",
            "raw_value": None,
            "source": "Open-Meteo",
            "reason": "Request timed out"
        }
        return fail_dict.copy(), fail_dict.copy()
    except httpx.HTTPStatusError as e:
        logger.warning(f"Open-Meteo HTTP error {e.response.status_code}")
        fail_dict = {
            "status": "unavailable",
            "raw_value": None,
            "source": "Open-Meteo",
            "reason": f"HTTP error ({e.response.status_code})"
        }
        return fail_dict.copy(), fail_dict.copy()
    except Exception as e:
        logger.warning(f"Open-Meteo API error: {e}")
        fail_dict = {
            "status": "unavailable",
            "raw_value": None,
            "source": "Open-Meteo",
            "reason": f"Service unavailable ({str(e)})"
        }
        return fail_dict.copy(), fail_dict.copy()
