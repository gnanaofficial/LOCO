import logging
import httpx
from config import settings

logger = logging.getLogger(__name__)

CENSUS_GEOCODER_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"

class GeocodingError(Exception):
    """Raised when geocoding fails or produces no match."""
    pass

async def geocode_address(address: str) -> tuple[float, float]:
    """
    Converts a US address into (latitude, longitude) using US Census Geocoder API.
    Raises GeocodingError if match is not found or API fails.
    """
    if not address or not address.strip():
        raise GeocodingError("Address cannot be empty.")
        
    params = {
        "address": address.strip(),
        "benchmark": "Public_AR_Current",
        "format": "json"
    }
    
    headers = {
        "User-Agent": settings.USER_AGENT
    }

    try:
        async with httpx.AsyncClient(timeout=settings.HTTP_TIMEOUT) as client:
            response = await client.get(CENSUS_GEOCODER_URL, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            matches = data.get("result", {}).get("addressMatches", [])
            if not matches:
                raise GeocodingError(f"No address match found for '{address}'. Please check the US address.")
                
            first_match = matches[0]
            coords = first_match.get("coordinates", {})
            lon = coords.get("x")
            lat = coords.get("y")
            
            if lat is None or lon is None:
                raise GeocodingError("Malformed geocoder response: missing coordinates.")
                
            return float(lat), float(lon)
            
    except httpx.TimeoutException:
        logger.error(f"US Census Geocoder timed out for address: {address}")
        raise GeocodingError("US Census Geocoder request timed out. Please try again.")
    except httpx.HTTPStatusError as e:
        logger.error(f"US Census Geocoder HTTP error {e.response.status_code} for address: {address}")
        raise GeocodingError(f"US Census Geocoder service error ({e.response.status_code}).")
    except httpx.RequestError as e:
        logger.error(f"US Census Geocoder connection error: {e}")
        raise GeocodingError("Unable to connect to US Census Geocoder service.")
    except Exception as e:
        if isinstance(e, GeocodingError):
            raise e
        logger.error(f"Unexpected geocoding error: {e}")
        raise GeocodingError(f"Failed to geocode address: {str(e)}")
