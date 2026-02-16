# app/crud/chat.py
from typing import List
from firebase_admin import firestore
from datetime import timezone

from app.core.firebase import get_db
from app.schemas.chat import ChatMessageResponse

db = get_db()

def _chat_id_for_disaster(disaster_id: str) -> str:
    d = db.collection("disasters").document(disaster_id).get()
    if not d.exists:
        raise ValueError("Disaster not found")
    return d.to_dict()["chat_session_id"]


def list_messages(disaster_id: str, limit: int = 50) -> List[ChatMessageResponse]:
    chat_id = _chat_id_for_disaster(disaster_id)
    q = (
        db.collection("chatSessions")
          .document(chat_id)
          .collection("messages")
          .order_by("created_at", direction=firestore.Query.DESCENDING)
          .limit(limit)
          .stream()
    )
    return [
        ChatMessageResponse(
            id=m.id,
            created_at=m.to_dict()["created_at"].replace(tzinfo=timezone.utc),
            **{k: v for k, v in m.to_dict().items() if k != "created_at"},
        )
        for m in q
    ]


def send_message(disaster_id: str, uid: str, text: str) -> None:
    chat_id = _chat_id_for_disaster(disaster_id)
    (
        db.collection("chatSessions")
          .document(chat_id)
          .collection("messages")
          .add(
              {
                  "sender_id": uid,
                  "text": text,
                  "created_at": firestore.SERVER_TIMESTAMP,
              }
          )
    )
