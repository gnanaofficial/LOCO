import asyncio
import logging
from typing import List
from fastapi import APIRouter, HTTPException, status
from schemas import AssessmentCreate, AssessmentResponse
from services.census import geocode_address, GeocodingError
from services.elevation import fetch_elevation
from services.weather import fetch_weather_and_temperature
from scoring.rules import calculate_assessment
import database

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assessments", tags=["Assessments"])

@router.post("", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment(payload: AssessmentCreate):
    """
    Creates a new location assessment:
    1. Geocodes address if coordinates not supplied
    2. Fetches public data (USGS Elevation, Open-Meteo Weather) concurrently
    3. Scores 0-100 handling unavailable factors without setting them to 0
    4. Saves assessment to database
    """
    address = payload.address.strip() if payload.address else None
    lat = payload.latitude
    lon = payload.longitude

    # Address mode: convert address to lat/lon using US Census Geocoder
    if lat is None or lon is None:
        if not address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either a US address or valid coordinates (latitude and longitude) must be provided."
            )
        try:
            lat, lon = await geocode_address(address)
        except GeocodingError as ge:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(ge)
            )
        except Exception as e:
            logger.error(f"Unexpected geocoding exception: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Geocoding service error occurred. Please verify your address and try again."
            )

    # Fetch public data sources concurrently
    try:
        elevation_task = fetch_elevation(lat, lon)
        weather_task = fetch_weather_and_temperature(lat, lon)

        elevation_res, weather_res = await asyncio.gather(
            elevation_task, weather_task, return_exceptions=True
        )

        # Handle exceptions gracefully if task crashed unexpectedly
        if isinstance(elevation_res, Exception):
            logger.error(f"Elevation fetch exception: {elevation_res}")
            elevation_raw = {
                "status": "unavailable",
                "raw_value": None,
                "reason": f"Service exception: {str(elevation_res)}",
                "source": "USGS"
            }
        else:
            elevation_raw = elevation_res

        if isinstance(weather_res, Exception):
            logger.error(f"Weather fetch exception: {weather_res}")
            temp_raw = {
                "status": "unavailable",
                "raw_value": None,
                "reason": f"Service exception: {str(weather_res)}",
                "source": "Open-Meteo"
            }
            weather_cond_raw = temp_raw.copy()
        else:
            temp_raw, weather_cond_raw = weather_res

    except Exception as e:
        logger.error(f"Error fetching location factors: {e}")
        # Mark all as unavailable rather than crashing whole assessment
        elevation_raw = {"status": "unavailable", "raw_value": None, "reason": "Fetch error", "source": "USGS"}
        temp_raw = {"status": "unavailable", "raw_value": None, "reason": "Fetch error", "source": "Open-Meteo"}
        weather_cond_raw = temp_raw.copy()

    # Calculate assessment score and factor breakdown
    total_score, factors = calculate_assessment(elevation_raw, temp_raw, weather_cond_raw)

    # Save assessment and factors to database
    try:
        saved_record = await database.save_assessment(
            label=payload.label.strip(),
            latitude=lat,
            longitude=lon,
            address=address,
            total_score=total_score,
            factors=factors
        )
        return saved_record
    except Exception as e:
        logger.error(f"Database save error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save assessment. Please try again."
        )


@router.get("", response_model=List[AssessmentResponse])
async def list_all_assessments():
    """Returns all saved location assessments."""
    try:
        return await database.list_assessments()
    except Exception as e:
        logger.error(f"Database list error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve assessments."
        )


@router.get("/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(assessment_id: str):
    """Returns a single location assessment by ID."""
    try:
        record = await database.get_assessment_by_id(assessment_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assessment with ID '{assessment_id}' was not found."
            )
        return record
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database get error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve assessment details."
        )
