# app/crud/disaster.py
from typing import List, Optional
from firebase_admin import firestore
from datetime import datetime, timezone

from app.core.firebase import get_db
from app.schemas.disaster import DisasterCreate, DisasterResponse

from app.utils.logger import get_logger
logger = get_logger(__name__)

db = get_db()


def create_disaster(
    payload: DisasterCreate,
    admin_uid: str = "",
    is_agent_suggestion: bool = False,
) -> DisasterResponse:
    batch = db.batch()
    disaster_ref = db.collection("disasters").document()
    chat_ref = db.collection("chatSessions").document()
    now = firestore.SERVER_TIMESTAMP

    batch.set(
        disaster_ref,
        {
            **payload.dict(),
            "created_at": now,
            "created_by": admin_uid,
            "chat_session_id": chat_ref.id,
            "participants": [],
            "is_agent_suggestion": is_agent_suggestion,
        },
    )
    batch.set(
        chat_ref,
        {
            "disaster_id": disaster_ref.id,
            "created_at": now,
        },
    )
    batch.commit()

    return DisasterResponse(
        id=disaster_ref.id,
        chat_session_id=chat_ref.id,
        created_at=datetime.now(timezone.utc),
        created_by=admin_uid,
        **payload.dict(),
    )


def list_disasters() -> List[DisasterResponse]:
    docs = db.collection("disasters").stream()
    results = []
    for d in docs:
        data = d.to_dict()
        if data.get("is_agent_suggestion", False):
            continue

        results.append(DisasterResponse(id=d.id, **data))

    return results


def list_agent_suggested_disasters() -> List[DisasterResponse]:
    """
    Return only those Disaster documents where is_agent_suggestion == True.
    """
    docs = db.collection("disasters").stream()
    results: List[DisasterResponse] = []

    for d in docs:
        data = d.to_dict()
        if data.get("is_agent_suggestion", False):
            results.append(DisasterResponse(id=d.id, **data))

    return results


def get_disaster(disaster_id: str) -> Optional[DisasterResponse]:
    doc_ref = db.collection("disasters").document(disaster_id)
    snap = doc_ref.get()
    if not snap.exists:
        return None

    data = snap.to_dict() or {}
    # load participants sub-collection
    parts = doc_ref.collection("participants").stream()
    participants = [{"uid": p.id, **(p.to_dict() or {})} for p in parts]
    data["participants"] = participants
    return DisasterResponse(id=snap.id, **data)


def join_disaster(disaster_id: str, uid: str, role: str) -> Optional[DisasterResponse]:
    doc_ref = db.collection("disasters").document(disaster_id)
    snap = doc_ref.get()
    if not snap.exists:
        return None

    # 1) add/update the participant sub-doc
    doc_ref.collection("participants") \
           .document(uid) \
           .set(
               {"role": role, "joined_at": firestore.SERVER_TIMESTAMP},
               merge=True
    )

    # 2) also array-union the UID into the root `participants` field
    doc_ref.update({
        "participants": firestore.ArrayUnion([uid])
    })

    # return the updated disaster, including full participants list
    return get_disaster(disaster_id)


def leave_disaster(disaster_id: str, uid: str) -> Optional[DisasterResponse]:
    doc_ref = db.collection("disasters").document(disaster_id)
    if not doc_ref.get().exists:
        return None

    # remove from sub-collection
    doc_ref.collection("participants").document(uid).delete()

    # remove from root array
    doc_ref.update({
        "participants": firestore.ArrayRemove([uid])
    })

    return get_disaster(disaster_id)


def delete_disaster(disaster_id: str) -> None:
    """
    Permanently remove the disaster document and its associated chat session.
    """
    doc_ref = db.collection("disasters").document(disaster_id)
    doc = doc_ref.get()
    if doc.exists:
        data = doc.to_dict() or {}
        chat_id = data.get("chat_session_id")
        if chat_id:
            db.collection("chatSessions").document(chat_id).delete()
    doc_ref.delete()


def has_joined(disaster_id: str, uid: str) -> Optional[bool]:
    """
    Return:
      - True  if the user UID is in the participants sub-collection
      - False if the disaster exists but the user hasn’t joined
      - None  if the disaster does not exist at all
    """
    doc_ref = db.collection("disasters").document(disaster_id)
    snap = doc_ref.get()
    if not snap.exists:
        return None

    part_doc = doc_ref.collection("participants").document(uid).get()
    return part_doc.exists


def get_all_volunteers_by_disaster(disaster_id: str) -> Optional[List[dict]]:
    """
    Return full participant records for volunteers (role='volunteer') in a disaster,
    each with a non-null 'display_name' (falling back to UID).
    - Returns None if the disaster does not exist.
    """
    logger.debug(f"Checking if disaster '{disaster_id}' exists.")
    doc_ref = db.collection("disasters").document(disaster_id)
    if not doc_ref.get().exists:
        logger.debug(f"Disaster '{disaster_id}' does not exist.")
        return None

    volunteers: List[dict] = []
    logger.debug(
        f"Fetching participants with role='volunteer' for disaster '{disaster_id}'.")

    for part_snap in (
        doc_ref.collection("participants")
               .where("role", "==", "volunteer")
               .stream()
    ):
        uid = part_snap.id
        pdata = part_snap.to_dict() or {}
        logger.debug(f"Processing participant UID: {uid}")

        user_snap = db.collection("users").document(uid).get()
        if user_snap.exists:
            display_name = user_snap.get("display_name") or uid
            location = user_snap.get("location")
            logger.debug(
                f"************location of {uid} is {location} **************")
            if location:
                location_lat = location.get('lat')
                location_lng = location.get('lng')

            logger.debug(
                f"Found user document for UID: {uid}, display_name: {display_name}")
        else:
            display_name = uid
            logger.debug(
                f"No user document found for UID: {uid}. Using UID as display_name.")

        volunteers.append({
            "uid": uid,
            "display_name": display_name,
            "location_lat": location_lat,
            "location_lng": location_lng,
            **pdata
        })
        logger.debug(
            f"Volunteer record added: UID: {uid}, Display Name: {display_name}")

    logger.debug(f"Total volunteers found: {len(volunteers)}")
    logger.debug(f"Volunteers found: {volunteers}")
    return volunteers


def get_all_volunteer_ids_by_disaster(disaster_id: str) -> Optional[List[str]]:
    """
    Return list of UIDs for volunteers (role='volunteer') in a disaster.
    - Returns None if the disaster does not exist.
    """
    doc_ref = db.collection("disasters").document(disaster_id)
    snap = doc_ref.get()
    if not snap.exists:
        return None

    # Query volunteer participant IDs from sub-collection
    volunteer_docs = doc_ref.collection("participants") \
        .where("role", "==", "volunteer") \
        .stream()
    volunteer_ids = [v.id for v in volunteer_docs]
    return volunteer_ids


def get_disaster_locations() -> List[dict]:
    """
    Return a list of all disasters, each with:
      - id: the disaster document ID
      - name: the disaster’s name
      - location: the disaster’s location object (e.g. { latitude, longitude, address })

    If there are no disasters, returns an empty list.
    """
    docs = db.collection("disasters").stream()
    locations_list: List[dict] = []
    for d in docs:
        print(f"[DEBUG] Processing disaster: {d}")
        data = d.to_dict() or {}
        locations_list.append({
            "id": d.id,
            "name": data.get("name"),
            "location": data.get("location")
        })
    return locations_list


def approve_disaster(disaster_id: str) -> Optional[DisasterResponse]:
    """
    Mark an agent-suggested Disaster as approved by setting is_agent_suggestion=False.
    Returns the updated DisasterResponse, or None if not found.
    """
    doc_ref = db.collection("disasters").document(disaster_id)
    snapshot = doc_ref.get()
    if not snapshot.exists:
        return None

    # Update the flag
    doc_ref.update({"is_agent_suggestion": False})
    updated = doc_ref.get().to_dict()
    return DisasterResponse(id=disaster_id, **updated)


def discard_disaster(disaster_id: str) -> bool:
    """
    Discard (delete) an agent-suggested Disaster.
    Returns True if deletion succeeded, False if document did not exist.
    """
    doc_ref = db.collection("disasters").document(disaster_id)
    snapshot = doc_ref.get()
    if not snapshot.exists:
        return False

    doc_ref.delete()
    return True