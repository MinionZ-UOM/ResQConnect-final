from datetime import datetime, timezone
from typing import List, Optional

from google.cloud.firestore import DocumentReference, GeoPoint
from app.core.firebase import get_db
from app.schemas.common import Location
from app.schemas.request import RequestCreate, RequestStatusUpdate, Request

COLLECTION = "requests"


def _ref(req_id: str | None = None) -> DocumentReference:
    coll = get_db().collection(COLLECTION)
    return coll.document(req_id) if req_id else coll.document()


def _location_to_geopoint(loc: Location) -> GeoPoint:
    return GeoPoint(loc.lat, loc.lng)


def _geopoint_to_location(gp: GeoPoint) -> Location:
    return Location(lat=gp.latitude, lng=gp.longitude)


# ----------------------------- CRUD -------------------------------------- #
def create(created_by: str, payload: RequestCreate) -> Request:
    doc = _ref()
    now = datetime.now(timezone.utc)

    data = payload.dict()
    data["location"] = _location_to_geopoint(payload.location)
    data.update(
        {
            "created_by": created_by,
            "status": "open",
            "assigned_task_id": None,
            "created_at": now,
            "updated_at": now,
        }
    )
    doc.set(data)

    data["location"] = payload.location

    return Request(id=doc.id, **data)


def _snap_to_model(snap) -> Request:
    d = snap.to_dict()
    d["location"] = _geopoint_to_location(d["location"])
    return Request(id=snap.id, **d)


def get(req_id: str) -> Optional[Request]:
    snap = _ref(req_id).get()
    return _snap_to_model(snap) if snap.exists else None


def list_all() -> List[Request]:
    return [_snap_to_model(s) for s in get_db().collection(COLLECTION).stream()]


def list_by_owner(uid: str) -> List[Request]:
    qs = get_db().collection(COLLECTION).where("created_by", "==", uid).stream()
    return [_snap_to_model(s) for s in qs]


def patch_status(req_id: str, payload: RequestStatusUpdate) -> Request:
    data = {k: v for k, v in payload.dict().items() if v is not None}
    data["updated_at"] = datetime.now(timezone.utc)
    _ref(req_id).update(data)
    return get(req_id)

def list_by_disaster(disaster_id: str) -> List[Request]:
    """
    Return all Request models whose 'disaster_id' field equals the given value.
    """
    qs = (
        get_db()
        .collection(COLLECTION)
        .where("disaster_id", "==", disaster_id)
        .stream()
    )
    return [_snap_to_model(s) for s in qs]


def delete(req_id: str) -> bool:
    doc = _ref(req_id)
    snap = doc.get()
    if not snap.exists:
        return False
    doc.delete()
    return True
