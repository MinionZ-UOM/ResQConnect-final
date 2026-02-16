from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.crud.workflow_output import get_snapshot
from app.schemas.workflow import (
    ApprovalStatus,
    WorkflowTask,
    WorkflowTaskCreate,
    WorkflowTaskUpdate,
)


def _task_from_dict(entry: Dict) -> WorkflowTask:
    return WorkflowTask(**entry)


def _sum_breakdown_quantities(entries: List[Dict]) -> int:
    """Compute the total quantity from a list of breakdown dictionaries."""

    total = 0
    for item in entries:
        if not isinstance(item, dict):
            continue
        try:
            quantity = int(item.get("quantity", 0))
        except (TypeError, ValueError):
            continue
        if quantity < 0:
            continue
        total += quantity
    return total


def list_tasks(request_id: str) -> List[WorkflowTask]:
    _, data = get_snapshot(request_id)
    return [_task_from_dict(entry) for entry in data.get("tasks", [])]


def get_task(request_id: str, task_id: str) -> Optional[WorkflowTask]:
    tasks = list_tasks(request_id)
    for task in tasks:
        if task.task_id == task_id:
            return task
    return None


def create_task(request_id: str, payload: WorkflowTaskCreate) -> WorkflowTask:
    doc_ref, data = get_snapshot(request_id)
    tasks = data.get("tasks", [])
    if any(entry.get("task_id") == payload.task_id for entry in tasks):
        raise ValueError("Task with this id already exists")

    now = datetime.now(timezone.utc)
    task_dict = payload.dict(by_alias=False)
    task_dict.setdefault("approval_status", ApprovalStatus.PENDING)
    task_dict.update({
        "created_at": now,
        "updated_at": now,
    })

    tasks.append(task_dict)
    doc_ref.update({
        "tasks": tasks,
        "updated_at": now,
    })
    return _task_from_dict(task_dict)


def update_task(request_id: str, task_id: str, payload: WorkflowTaskUpdate) -> WorkflowTask:
    doc_ref, data = get_snapshot(request_id)
    tasks = data.get("tasks", [])
    if not tasks:
        raise ValueError("No tasks stored for this request")

    updated = None
    now = datetime.now(timezone.utc)
    for idx, entry in enumerate(tasks):
        if entry.get("task_id") == task_id:
            updates = payload.dict(exclude_unset=True)
            entry.update(updates)
            entry["updated_at"] = now
            tasks[idx] = entry
            updated = entry
            break

    if not updated:
        raise ValueError("Task not found")

    doc_ref.update({
        "tasks": tasks,
        "updated_at": now,
    })
    return _task_from_dict(updated)


def delete_task(request_id: str, task_id: str) -> None:
    doc_ref, data = get_snapshot(request_id)
    tasks = data.get("tasks", [])
    resources = data.get("resource_suggestions", [])
    new_tasks = [entry for entry in tasks if entry.get("task_id") != task_id]
    if len(new_tasks) == len(tasks):
        raise ValueError("Task not found")

    now = datetime.now(timezone.utc)
    updated_resources: List[Dict] = []
    resources_changed = False

    for entry in resources:
        entry_copy = dict(entry)
        breakdown_entries = entry_copy.get("breakdown")

        if isinstance(breakdown_entries, list):
            filtered_breakdown: List[Dict] = []
            removed = False
            for item in breakdown_entries:
                if not isinstance(item, dict):
                    continue
                if item.get("task_id") == task_id:
                    removed = True
                    continue
                filtered_breakdown.append(dict(item))

            if removed:
                entry_copy["breakdown"] = filtered_breakdown
                entry_copy["total_quantity"] = _sum_breakdown_quantities(filtered_breakdown)
                entry_copy["updated_at"] = now
                resources_changed = True

        else:
            allocations = entry_copy.get("task_allocations")
            if isinstance(allocations, dict) and task_id in allocations:
                allocations = dict(allocations)
                allocations.pop(task_id, None)
                filtered_allocations = {
                    key: value
                    for key, value in allocations.items()
                    if isinstance(value, int) and value > 0
                }
                new_total = sum(filtered_allocations.values())
                entry_copy["task_allocations"] = filtered_allocations
                if "quantity_total" in entry_copy or "total_quantity" in entry_copy:
                    entry_copy["quantity_total"] = new_total
                    entry_copy["total_quantity"] = new_total
                if "quantity" in entry_copy:
                    entry_copy["quantity"] = str(new_total) if new_total else "0"
                entry_copy["updated_at"] = now
                resources_changed = True

        updated_resources.append(entry_copy)

    update_payload = {
        "tasks": new_tasks,
        "updated_at": now,
    }
    if resources_changed:
        update_payload["resource_suggestions"] = updated_resources

    doc_ref.update(update_payload)
