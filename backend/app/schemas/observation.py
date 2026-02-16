from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ObservationCreate(BaseModel):
    disaster_id: str = Field(..., description="ID of the related disaster event")
    title: str
    description: str
    observation_type: str
    urgency: str
    latitude: Optional[float]
    longitude: Optional[float]
    address: str
    image_urls: List[str] = []


class ObservationResponse(ObservationCreate):
    id: str
    created_by: str
    created_at: datetime
