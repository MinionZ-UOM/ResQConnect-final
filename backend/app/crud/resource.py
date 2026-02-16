from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from google.cloud.firestore import DocumentReference
from app.core.firebase import get_db
from app.schemas.resource import ResourceCreate, ResourceUpdate, Resource
from app.schemas.resource import Resource, ResourceType

from app.utils.logger import get_logger
logger = get_logger(__name__)

COLLECTION = "resources"
USER_COLLECTION = "users"


def _ref(rid: str | None = None) -> DocumentReference:
    coll = get_db().collection(COLLECTION)
    return coll.document(rid) if rid else coll.document()

def create(obj_in: ResourceCreate) -> Resource:
    doc = _ref()

    # Get user document by uid
    user_snap = get_db().collection(USER_COLLECTION).document(obj_in.uid).get()
    if not user_snap.exists:
        raise ValueError("User not found")

    user_data = user_snap.to_dict()
    role_id = str(user_data.get("role_id"))
    if role_id not in ["admin", "volunteer"]:
        raise ValueError("Invalid role_id in user profile")

    data = obj_in.dict()
    data["role_id"] = role_id
    data["updated_at"] = datetime.now(timezone.utc)

    doc.set(data)
    return Resource(resource_id=doc.id, **data)

def get(rid: str) -> Optional[Resource]:
    snap = _ref(rid).get()
    if not snap.exists:
        return None

    data = snap.to_dict()

    if "role_id" not in data or not data["role_id"]:
        uid = data.get("uid")
        if not uid:
            raise ValueError(f"Cannot resolve 'role_id': UID is missing in resource {rid}")

        user_snap = get_db().collection(USER_COLLECTION).document(uid).get()
        if not user_snap.exists:
            raise ValueError(f"User not found for UID: {uid}")

        role_id = user_snap.to_dict().get("role_id")
        if not role_id:
            raise ValueError(f"role_id missing in user profile for UID: {uid}")

        _ref(rid).update({"role_id": role_id})
        data["role_id"] = role_id

    return Resource(resource_id=snap.id, **data)


def list_all() -> List[Resource]:
    resources = []
    for s in get_db().collection(COLLECTION).stream():
        try:
            resources.append(Resource(resource_id=s.id, **s.to_dict()))
        except Exception as e:
            logger.warning(f"Skipping invalid resource {s.id}: {e}")
    return resources

def list_available() -> List[Resource]:
    query = get_db().collection(COLLECTION).where("status", "==", "available")
    resources = []
    for s in query.stream():
        try:
            resources.append(Resource(resource_id=s.id, **s.to_dict()))
        except Exception as e:
            logger.warning(f"Skipping invalid available resource {s.id}: {e}")
    return resources

def patch(rid: str, obj_in: ResourceUpdate) -> Resource:
    existing = get(rid)
    if not existing:
        raise ValueError("Resource not found")

    data = {}

    if obj_in.quantity_used is not None:
        new_available = existing.quantity_available - obj_in.quantity_used
        if new_available < 0:
            raise ValueError("Not enough quantity available to fulfill this request")
        data["quantity_available"] = new_available

        # Auto-update status based on availability only
        data["status"] = "not_available" if new_available == 0 else "available"

    else:
        raise ValueError("quantity_used is required to update the resource")

    data["updated_at"] = datetime.now(timezone.utc)
    _ref(rid).update(data)

    return get(rid)

def set_status(rid: str, status: str) -> Resource:
    _ref(rid).update({
        "status": status,
        "updated_at": datetime.now(timezone.utc)
    })
    return get(rid)

def update_role_id_by_uid(uid: str):
    user_snap = get_db().collection(USER_COLLECTION).document(uid).get()
    if not user_snap.exists:
        raise ValueError("User not found")

    user_data = user_snap.to_dict()
    role_id = str(user_data.get("role_id"))
    if role_id not in ["admin", "volunteer"]:
        raise ValueError("Invalid role_id in user profile")

    query = get_db().collection(COLLECTION).where("uid", "==", uid).where("role_id", "==", None)
    for doc in query.stream():
        doc.reference.update({
            "role_id": role_id,
            "updated_at": datetime.now(timezone.utc)
        })

def delete(rid: str) -> bool:
    doc_ref = _ref(rid)
    snap = doc_ref.get()
    if not snap.exists:
        raise ValueError("Resource not found")
    doc_ref.delete()
    return True

def set_status(rid: str, status: str) -> Resource:
    _ref(rid).update({
        "status": status,
        "updated_at": datetime.now(timezone.utc)
    })
    return get(rid)  


def get_resources_by_ids_and_type(donor_ids: List[str], resource_type: str) -> List[Resource]:
    """
    Fetch all resources whose `uid` is in the provided donor_ids list
    and whose category matches the given resource_type.
    """
    # Validate resource_type
    try:
        rt = ResourceType(resource_type)
    except ValueError:
        raise ValueError(f"Invalid resource_type: {resource_type}")

    # Firestore only supports 'in' queries up to 10 items;
    query = (
        get_db()
        .collection(COLLECTION)
        .where("uid", "in", donor_ids)
        .where("category", "==", rt.value)
    )
    resources: List[Resource] = []
    for doc_snap in query.stream():
        # reuse your `get()` to ensure role_id hydration and consistent mapping
        res = get(doc_snap.id)
        if res:
            resources.append(res)
        else:
            logger.warning(f"Skipping resource {doc_snap.id} (could not load)")
    logger.info(f"Resources fetched: {resources}")
    return resources


def save_request_resources(request_id: str, entries: List[Dict]) -> None:
    """
    Persist resource_requirements + manpower_requirement per task
    under the 'request_resources' collection keyed by request_id.
    """
    db = get_db()
    db.collection("request_resources") \
      .document(request_id) \
      .set({
          "tasks": entries,
          "created_at": datetime.now(timezone.utc),
      })


def get_request_resources(request_id: str) -> Dict[str, Dict[str, Any]]:
    """
    Load resource_requirements + manpower_requirement per task.
    Supports two document shapes:
      1. Nested under "tasks"
      2. Flat (single-task) schema
    """
    logger.debug(f"Fetching request_resources/{request_id}")
    db = get_db()
    doc_ref = db.collection("request_resources").document(request_id)
    snap = doc_ref.get()

    if not snap.exists:
        logger.debug(f"No document found for request_id={request_id}")
        return {}

    data = snap.to_dict() or {}
    logger.debug(f"Document data: {data!r}")

    entries = data.get("tasks")
    if entries is None:
        logger.debug("tasks field missing – using flat schema fallback")
        entries = [{
            "task_id": request_id,
            "resource_requirements": data.get("resource_requirements", []),
            "manpower_requirement": data.get("manpower_requirement"),
        }]
    else:
        logger.debug(f"Found tasks array with {len(entries)} entries")

    result: Dict[str, Dict[str, Any]] = {}
    for i, entry in enumerate(entries, start=1):
        tid = entry.get("task_id")
        logger.debug(f"Entry #{i}: task_id={tid!r}")
        if not tid:
            logger.debug(f"skipping – no task_id")
            continue

        reqs = entry.get("resource_requirements", [])
        mprep = entry.get("manpower_requirement")
        logger.debug(f"requirements={reqs!r}, manpower={mprep!r}")

        result[tid] = {
            "resource_requirements": reqs,
            "manpower_requirement": mprep,
        }

    logger.debug(f"Returning result with {len(result)} task(s): {list(result.keys())}")
    return result


def list_locations() -> List[Dict[str, Any]]:
    """
    Returns a list of all resources that have both location_lat and location_lng fields,

    """
    db = get_db().collection(COLLECTION)
    result: List[Dict[str, Any]] = []

    for doc_snap in db.stream():
        data = doc_snap.to_dict()
        lat = data.get("location_lat")
        lng = data.get("location_lng")

        # Only include docs that actually have both lat & lng
        if lat is None or lng is None:
            continue
        logger.debug(data)

        result.append({
            "status": data.get("status"),
            "category": data.get("category"),
            "location": {
                "lat": lat,
                "lng": lng
            }
        })

    return result