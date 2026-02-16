from typing import List, Optional
from datetime import datetime, timezone
from firebase_admin import firestore

from app.core.firebase import get_db
from app.schemas.observation import ObservationCreate, ObservationResponse

db = get_db()


def create_observation(
    payload: ObservationCreate,
    user_uid: str
) -> ObservationResponse:
    ref = db.collection("observations").document()
    now = firestore.SERVER_TIMESTAMP

    # write main record
    ref.set({
        **payload.dict(),
        "created_by": user_uid,
        "created_at": now
    })

    # return with real timestamps & IDs
    return ObservationResponse(
        id=ref.id,
        created_by=user_uid,
        created_at=datetime.now(timezone.utc),
        **payload.dict()
    )


def list_observations(
    disaster_id: Optional[str] = None
) -> List[ObservationResponse]:
    col = db.collection("observations")
    if disaster_id:
        col = col.where("disaster_id", "==", disaster_id)

    docs = col.stream()
    return [
        ObservationResponse(id=d.id, **(d.to_dict() or {}))
        for d in docs
    ]


def get_observation(obs_id: str) -> Optional[ObservationResponse]:
    doc = db.collection("observations").document(obs_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    return ObservationResponse(id=doc.id, **data)


def delete_observation(obs_id: str) -> None:
    db.collection("observations").document(obs_id).delete()
