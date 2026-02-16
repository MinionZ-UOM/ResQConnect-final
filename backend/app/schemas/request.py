from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

from .common import Location


class Media(BaseModel):
    url: str = Field(..., description="Public URL of the uploaded media file")
    name: Optional[str] = Field(None, description="Original file name")
    size: Optional[int] = Field(None, description="Size in bytes")


class RequestBase(BaseModel):
    disaster_id: Optional[str] = Field(default=None, description="Identifier for the associated disaster event")
    type_of_need: str = Field(..., examples=["food", "medical", "rescue", "other"])
    description: Optional[str] = Field(None, description="Detailed description of the request")
    media: List[Media] = Field(default_factory=list, description="Uploaded media files")
    location: Location = Field(..., description="Geospatial location of the request")
    auto_extract: Optional[Dict[str, Any]] = Field(None, description="Optional automated metadata")


class RequestCreate(RequestBase):
    title: str = Field(..., description="Short title for the help request")


class RequestStatusUpdate(BaseModel):
    status: str = Field(..., examples=["in_progress", "fulfilled", "closed"])
    assigned_task_id: Optional[str] = None


class Request(RequestBase):
    id: str
    title: Optional[str] = Field(default="Untitled Request", description="Short title for the help request")
    created_by: Optional[str] = None
    status: str = Field(default="open")
    assigned_task_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
