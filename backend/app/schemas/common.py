from pydantic import BaseModel, Field

class Location(BaseModel):
    """Simple lat/lng pair for API payloads & responses."""
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
