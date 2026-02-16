# app/schemas/chat.py
from datetime import datetime
from pydantic import BaseModel

class ChatMessageCreate(BaseModel):
    text: str

class ChatMessageResponse(BaseModel):
    id: str
    sender_id: str
    text: str
    created_at: datetime
