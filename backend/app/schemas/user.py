from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Coordinates(BaseModel):
    latitude: float = Field(..., alias="lat")
    longitude: float = Field(..., alias="lng")

    class Config:
        allow_population_by_field_name = True

class Role(BaseModel):
    id: str
    name: str
    permissions: List[str]

class User(BaseModel):
    uid: str
    email: str
    display_name: Optional[str] = None
    role_id: str
    role: Optional[Role] = None
    created_at: Optional[datetime] = None
    availability: Optional[bool] = None 

    location: Optional[Coordinates] = None

class UserCreate(BaseModel):
    display_name: str
    role_id: Optional[str] = None 

class AvailabilityUpdate(BaseModel):
    availability: bool
    location: Optional[Coordinates] = None 