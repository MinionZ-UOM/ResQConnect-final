# app/crud/task.py

from datetime import datetime, timezone
from typing import List, Optional

from google.cloud.firestore import DocumentReference
from app.core.firebase import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskStatusUpdate, Task

COLLECTION = "tasks"


def _ref(task_id: Optional[str] = None) -> DocumentReference:
    coll = get_db().collection(COLLECTION)
    return coll.document(task_id) if task_id else coll.document()


def create_task(obj_in: TaskCreate) -> Task:
    """
    Create a new Task document from TaskCreate, set initial status and timestamps.
    """
    now = datetime.now(timezone.utc)
    data = obj_in.dict()
    data.update({
        "status": TaskStatusUpdate.schema()["properties"]["status"]["default"] if "default" in TaskStatusUpdate.schema()["properties"]["status"] else "pending",
        "created_at": now,
        "updated_at": now,
    })
    doc = _ref()
    doc.set(data)
    return Task(id=doc.id, **data)


def get_task(task_id: str) -> Optional[Task]:
    """
    Fetch a single Task by ID.
    """
    snap = _ref(task_id).get()
    if not snap.exists:
        return None
    return Task(id=snap.id, **snap.to_dict())


def list_tasks() -> List[Task]:
    """
    List all Tasks in the collection, normalizing Firestore keys
    into the Pydantic schema.
    """
    docs = get_db().collection(COLLECTION).stream()
    tasks: list[Task] = []

    for doc in docs:
        data = doc.to_dict()

        if "disasterId" in data:
            data["disaster_id"] = data.pop("disasterId")
        if "assignedTo" in data:
            data["assigned_to"] = data.pop("assignedTo")
        if "etaMinutes" in data:
            data["eta_minutes"] = data.pop("etaMinutes")

        tasks.append(Task(**{"id": doc.id, **data}))

    return tasks


def list_tasks_by_assignee(uid: str) -> List[Task]:
    """
    List all Tasks assigned to a particular UID.
    """
    qs = get_db().collection(COLLECTION).where("assigned_to", "==", uid).stream()
    return [Task(id=s.id, **s.to_dict()) for s in qs]


def update_task(task_id: str, obj_in: TaskUpdate) -> Optional[Task]:
    """
    Apply partial updates to any updatable Task fields.
    """
    updates = obj_in.dict(exclude_unset=True)
    if not updates:
        return get_task(task_id)

    updates["updated_at"] = datetime.now(timezone.utc)
    _ref(task_id).update(updates)
    return get_task(task_id)


def update_task_status(task_id: str, obj_in: TaskStatusUpdate) -> Optional[Task]:
    """
    Update only status and/or ETA of a Task.
    """
    updates = obj_in.dict(exclude_unset=True)
    updates["updated_at"] = datetime.now(timezone.utc)
    _ref(task_id).update(updates)
    return get_task(task_id)


def authorize_task(task_id: str) -> Optional[Task]:
    """
    Mark a Task as authorized (set is_authorized=True) and update the timestamp.
    """
    now = datetime.now(timezone.utc)
    updates = {
        "is_authorized": True,
        "updated_at": now,
    }
    _ref(task_id).update(updates)
    return get_task(task_id)


def get_tasks_by_disaster(disaster_id: str) -> List[Task]:
    """
    Fetch all tasks whose `disaster_id` field matches the given disaster_id,
    and return them as fully‐validated Task objects.
    """
    db = get_db()
    query = db.collection("tasks").where("disaster_id", "==", disaster_id)
    snaps = query.stream()

    results: List[Task] = []
    for snap in snaps:
        data = snap.to_dict() or {}
        # Snap.id is the Firestore doc ID, so pass it in explicitly
        task = Task(id=snap.id, **data)
        results.append(task)
    return results