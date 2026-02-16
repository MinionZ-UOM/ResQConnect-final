# app/api/chat.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.chat import ChatMessageCreate, ChatMessageResponse
from app.api.deps import get_current_user
from app.crud import chat as crud

router = APIRouter(
    prefix="/disasters/{disaster_id}/chat",
    tags=["Chat"],
)


@router.get("/messages", response_model=List[ChatMessageResponse])
def list_messages(disaster_id: str, limit: int = 50):
    try:
        return crud.list_messages(disaster_id, limit)
    except ValueError:  # raised when disaster doesn't exist
        raise HTTPException(404, "Disaster not found")


@router.post("/messages", status_code=status.HTTP_201_CREATED)
def send_message(disaster_id: str, payload: ChatMessageCreate, user=Depends(get_current_user)):
    try:
        crud.send_message(disaster_id, user.uid, payload.text)
    except ValueError:
        raise HTTPException(404, "Disaster not found")
