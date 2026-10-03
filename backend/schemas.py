from typing import List, Optional
from pydantic import BaseModel, Field, model_validator

class AssessmentCreate(BaseModel):
    label: str = Field(..., min_length=1, description="Location label e.g. Denver Office")
    address: Optional[str] = Field(None, description="US Address e.g. 1437 Bannock St, Denver, CO")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Latitude between -90 and 90")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Longitude between -180 and 180")

    @model_validator(mode="after")
    def validate_address_or_coordinates(self):
        has_address = bool(self.address and self.address.strip())
        has_coords = (self.latitude is not None) and (self.longitude is not None)

        if not has_address and not has_coords:
            raise ValueError("You must provide either a US Address or Latitude and Longitude coordinates.")
        return self

class FactorResponse(BaseModel):
    id: str
    assessment_id: str
    factor_name: str
    raw_value: Optional[str] = None
    points: Optional[float] = None
    max_points: float
    source: str
    status: str  # "available" or "unavailable"
    reason: Optional[str] = None
    created_at: str

class AssessmentResponse(BaseModel):
    id: str
    label: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    total_score: Optional[float] = None
    created_at: str
    factors: List[FactorResponse] = []
