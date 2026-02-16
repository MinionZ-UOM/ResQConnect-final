from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class ResourceType(str, Enum):
    VEHICLE = "vehicle"
    FOOD = "food"
    MEDICINE = "medicine"
    WATER = "water"
    CLOTHING = "clothing"
    SHELTER = "shelter"
    RESCUE_EQUIPMENT = "rescue_equipment"
    COMMUNICATION_DEVICE = "communication_device"
    POWER_SUPPLY = "power_supply"
    SANITATION_KIT = "sanitation_kit"
    FUEL = "fuel"
    MEDICAL_KIT = "medical_kit"

class ResourceStatus(str, Enum):
    AVAILABLE = "available"
    NOT_AVAILABLE = "not_available"

class ResourceBase(BaseModel):
    category: ResourceType
    quantity_total: int
    quantity_available: int
    location_lat: float
    location_lng: float
    status: ResourceStatus = ResourceStatus.AVAILABLE

class ResourceCreate(ResourceBase):
    uid: str  

class StatusChangePayload(BaseModel):
    status: ResourceStatus

class ResourceUpdate(BaseModel):
    quantity_used: Optional[int] = None

    class Config:
        orm_mode = True

class Resource(ResourceBase):
    resource_id: str
    uid: str
    role_id: str 
    updated_at: datetime

    class Config:
        orm_mode = True

