
"""Pydantic schemas for the v2 chatbot endpoints."""
from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field
from typing import Optional

class Coordinates(BaseModel):
    latitude: float = Field(..., description="Latitude component of the user's location")
    longitude: float = Field(..., description="Longitude component of the user's location")


class User(BaseModel):
    id: str = Field(..., description="Unique identifier for the user")
    name: str = Field(..., description="Display name of the user")
    role: str = Field(..., description="User's role within the ResQConnect platform")
    location: Optional[Coordinates] = None


class ChatHistoryItem(BaseModel):
    role: str = Field(..., description="Speaker role, e.g. 'user' or 'assistant'")
    content: str = Field(..., description="Content of the chat message")


class ChatInput(BaseModel):
    user: User
    prompt: str = Field(..., description="Latest user prompt for the chatbot")
    chat_history: List[ChatHistoryItem] = Field(default_factory=list)


