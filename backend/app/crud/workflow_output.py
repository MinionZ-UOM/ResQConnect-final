from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from uuid import uuid4

from google.cloud.firestore import DocumentReference

from app.core.firebase import get_db
from app.schemas.workflow import (
    ApprovalStatus,
    WorkflowOutput,
    WorkflowOutputCreate,
    WorkflowResource,
    WorkflowResourceCreate,
    WorkflowTask,
    WorkflowTaskCreate,
)

COLLECTION = "workflow_outputs"


def _ref(request_id: Optional[str] = None) -> DocumentReference:
    coll = get_db().collection(COLLECTION)
    return coll.document(request_id) if request_id else coll.document()


def _serialize_task(task: WorkflowTaskCreate, *, now: datetime) -> Dict:
    base = task.dict(by_alias=False)
    base.setdefault("approval_status", ApprovalStatus.PENDING)
    base.setdefault("created_at", now)
    base.setdefault("updated_at", now)
    return base


def _serialize_resource(resource: WorkflowResourceCreate, *, now: datetime) -> Dict:
    base = resource.dict(by_alias=False)
    if not base.get("resource_id"):
        base["resource_id"] = uuid4().hex
    base.setdefault("approval_status", ApprovalStatus.PENDING)
    base.setdefault("created_at", now)
    base.setdefault("updated_at", now)
    return base


def _to_task(obj: Dict) -> WorkflowTask:
    return WorkflowTask(**obj)


def _to_resource(obj: Dict) -> WorkflowResource:
    return WorkflowResource(**obj)


def _to_output(request_id: str, data: Dict) -> WorkflowOutput:
    tasks = [_to_task(t) for t in data.get("tasks", [])]
    resources = [_to_resource(r) for r in data.get("resource_suggestions", [])]
    payload = {
        "workflow_run_id": data.get("workflow_run_id") or data.get("workflow_id"),
        "request_id": request_id,
        "tasks": tasks,
        "resource_suggestions": resources,
        "manpower": data.get("manpower"),
        "created_at": data.get("created_at"),
        "updated_at": data.get("updated_at"),
    }
    return WorkflowOutput(**payload)


def _get_snapshot(request_id: str) -> Tuple[DocumentReference, Dict]:
    doc_ref = _ref(request_id)
    snap = doc_ref.get()
    if not snap.exists:
        raise ValueError("Workflow output not found for this request")
    return doc_ref, snap.to_dict() or {}


def upsert(payload: WorkflowOutputCreate) -> WorkflowOutput:
    now = datetime.now(timezone.utc)
    if not payload.request_id:
        raise ValueError("request_id is required to store workflow outputs")

    # Accept either attribute name depending on schema changes:
    workflow_id_value = getattr(payload, "workflow_run_id", None) or getattr(payload, "workflow_id", None)

    doc_ref = _ref(payload.request_id)
    snap = doc_ref.get()

    base: Dict = {
        # keep storing legacy key name in DB for backwards compatibility
        "workflow_run_id": workflow_id_value,
        "request_id": payload.request_id,
        "manpower": payload.manpower.dict(exclude_none=True) if payload.manpower else None,
    }

    tasks_data = [_serialize_task(task, now=now) for task in payload.tasks]
    resources_data = [_serialize_resource(resource, now=now) for resource in payload.resource_suggestions]

    base["tasks"] = tasks_data
    base["resource_suggestions"] = resources_data
    base["updated_at"] = now

    if snap.exists:
        existing = snap.to_dict() or {}
        base["created_at"] = existing.get("created_at", now)
    else:
        base["created_at"] = now

    doc_ref.set(base)
    return _to_output(payload.request_id, base)


def get(request_id: str) -> Optional[WorkflowOutput]:
    snap = _ref(request_id).get()
    if not snap.exists:
        return None
    return _to_output(request_id, snap.to_dict() or {})


def list_all() -> List[WorkflowOutput]:
    col = get_db().collection(COLLECTION).stream()
    outputs: List[WorkflowOutput] = []
    for snap in col:
        outputs.append(_to_output(snap.id, snap.to_dict() or {}))
    return outputs


def delete(request_id: str) -> None:
    doc_ref = _ref(request_id)
    snap = doc_ref.get()
    if not snap.exists:
        raise ValueError("Workflow output not found for this request")
    doc_ref.delete()


def get_snapshot(request_id: str) -> Tuple[DocumentReference, Dict]:
    return _get_snapshot(request_id)
