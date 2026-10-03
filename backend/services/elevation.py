import logging
import httpx
from config import settings

logger = logging.getLogger(__name__)

USGS_ELEVATION_URL = "https://epqs.nationalmap.gov/v1/json"

async def fetch_elevation(latitude: float, longitude: float) -> dict:
    """
    Fetches elevation in feet for given lat/lon from USGS Elevation Service.
    Never crashes or throws; returns status='available' or 'unavailable'.
    """
    params = {
        "x": longitude,
        "y": latitude,
        "units": "Feet"
    }
    headers = {
        "User-Agent": settings.USER_AGENT
    }

    try:
        async with httpx.AsyncClient(timeout=settings.HTTP_TIMEOUT) as client:
            response = await client.get(USGS_ELEVATION_URL, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            # USGS EPQS JSON format can vary:
            # Format 1: {"value": "5280", ...} or {"USGS_Elevation_Point_Query_Service": {"Elevation_Query": {"Elevation": 5280}}}
            # Format 2: {"value": 5280.5, ...}
            raw_val = None
            if isinstance(data, dict):
                if "value" in data:
                    raw_val = data["value"]
                elif "USGS_Elevation_Point_Query_Service" in data:
                    eq = data["USGS_Elevation_Point_Query_Service"].get("Elevation_Query", {})
                    raw_val = eq.get("Elevation")
            
            if raw_val is None or raw_val == "-1000000" or raw_val == -1000000:
                return {
                    "status": "unavailable",
                    "raw_value": None,
                    "unit": "ft",
                    "reason": "No elevation data available for coordinates",
                    "source": "USGS"
                }

            try:
                elevation_ft = float(raw_val)
                return {
                    "status": "available",
                    "raw_value": round(elevation_ft, 1),
                    "unit": "ft",
                    "reason": None,
                    "source": "USGS"
                }
            except (ValueError, TypeError):
                return {
                    "status": "unavailable",
                    "raw_value": None,
                    "unit": "ft",
                    "reason": f"Malformed elevation value: {raw_val}",
                    "source": "USGS"
                }

    except httpx.TimeoutException:
        logger.warning(f"USGS Elevation API timed out for coords ({latitude}, {longitude})")
        return {
            "status": "unavailable",
            "raw_value": None,
            "unit": "ft",
            "reason": "Request timed out",
            "source": "USGS"
        }
    except httpx.HTTPStatusError as e:
        logger.warning(f"USGS Elevation HTTP error {e.response.status_code}")
        return {
            "status": "unavailable",
            "raw_value": None,
            "unit": "ft",
            "reason": f"HTTP error ({e.response.status_code})",
            "source": "USGS"
        }
    except Exception as e:
        logger.warning(f"USGS Elevation error: {e}")
        return {
            "status": "unavailable",
            "raw_value": None,
            "unit": "ft",
            "reason": f"Service unavailable ({str(e)})",
            "source": "USGS"
        }
