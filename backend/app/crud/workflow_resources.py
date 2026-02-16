from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import uuid4

from app.crud.workflow_output import get_snapshot
from app.schemas.workflow import (
    ApprovalStatus,
    WorkflowResource,
    WorkflowResourceCreate,
    WorkflowResourceUpdate,
)


def _resource_from_dict(entry: Dict) -> WorkflowResource:
    return WorkflowResource(**entry)


def list_resources(request_id: str) -> List[WorkflowResource]:
    _, data = get_snapshot(request_id)
    return [_resource_from_dict(entry) for entry in data.get("resource_suggestions", [])]


def get_resource(request_id: str, resource_id: str) -> Optional[WorkflowResource]:
    resources = list_resources(request_id)
    for resource in resources:
        if resource.resource_id == resource_id:
            return resource
    return None


def create_resource(request_id: str, payload: WorkflowResourceCreate) -> WorkflowResource:
    doc_ref, data = get_snapshot(request_id)
    resources = data.get("resource_suggestions", [])

    now = datetime.now(timezone.utc)
    resource_dict = payload.dict(by_alias=False)
    resource_dict.setdefault("resource_id", uuid4().hex)
    resource_dict.setdefault("approval_status", ApprovalStatus.PENDING)
    if any(entry.get("resource_id") == resource_dict["resource_id"] for entry in resources):
        raise ValueError("Resource with this id already exists")

    resource_dict.update({
        "created_at": now,
        "updated_at": now,
    })

    resources.append(resource_dict)
    doc_ref.update({
        "resource_suggestions": resources,
        "updated_at": now,
    })
    return _resource_from_dict(resource_dict)


def update_resource(request_id: str, resource_id: str, payload: WorkflowResourceUpdate) -> WorkflowResource:
    doc_ref, data = get_snapshot(request_id)
    resources = data.get("resource_suggestions", [])
    if not resources:
        raise ValueError("No resources stored for this request")

    updated = None
    now = datetime.now(timezone.utc)
    for idx, entry in enumerate(resources):
        if entry.get("resource_id") == resource_id:
            updates = payload.dict(exclude_unset=True)
            entry.update(updates)
            entry["updated_at"] = now
            resources[idx] = entry
            updated = entry
            break

    if not updated:
        raise ValueError("Resource not found")

    doc_ref.update({
        "resource_suggestions": resources,
        "updated_at": now,
    })
    return _resource_from_dict(updated)


def delete_resource(request_id: str, resource_id: str) -> None:
    doc_ref, data = get_snapshot(request_id)
    resources = data.get("resource_suggestions", [])
    new_resources = [entry for entry in resources if entry.get("resource_id") != resource_id]
    if len(new_resources) == len(resources):
        raise ValueError("Resource not found")

    now = datetime.now(timezone.utc)
    doc_ref.update({
        "resource_suggestions": new_resources,
        "updated_at": now,
    })
