from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import uuid4
import re
import yaml

from app.schemas.workflow import (
    ApprovalStatus,
    ManpowerBreakdown,
    ResourceQuantityBreakdown,
    WorkflowManpower,
    WorkflowOutputCreate,
    WorkflowResourceCreate,
    WorkflowTaskCreate,
)


def _normalise_string(value: Any) -> str:
    """Convert YAML scalar values to trimmed strings."""

    if value is None:
        return ""
    if isinstance(value, (int, float)):
        return str(value)
    return str(value).strip()


def _coerce_positive_int(value: Any) -> Optional[int]:
    """Safely cast ``value`` to a positive integer if possible."""

    try:
        number = int(value)
    except (TypeError, ValueError):
        return None
    return number if number >= 0 else None


def _parse_resource_breakdown(entries: Any) -> List[ResourceQuantityBreakdown]:
    """Normalise resource breakdown entries from the agent output."""

    if not isinstance(entries, list):
        return []

    breakdown: List[ResourceQuantityBreakdown] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        task_id = _normalise_string(entry.get("task_id"))
        quantity = _coerce_positive_int(entry.get("quantity"))
        if not task_id or quantity is None:
            continue
        breakdown.append(ResourceQuantityBreakdown(task_id=task_id, quantity=quantity))
    return breakdown


def _parse_manpower_breakdown(entries: Any) -> List[ManpowerBreakdown]:
    """Normalise manpower breakdown entries from the agent output."""

    if not isinstance(entries, list):
        return []

    breakdown: List[ManpowerBreakdown] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        task_id = _normalise_string(entry.get("task_id"))
        volunteers = _coerce_positive_int(entry.get("volunteers"))
        if not task_id or volunteers is None:
            continue
        breakdown.append(ManpowerBreakdown(task_id=task_id, volunteers=volunteers))
    return breakdown


def build_workflow_output_payload(
    *,
    workflow_id: str,
    request_id: Optional[str],
    tasks_yaml: str,
) -> WorkflowOutputCreate:
    """Parse the agentic YAML output into a ``WorkflowOutputCreate`` model."""

    if not request_id or not str(request_id).strip():
        raise ValueError("request_id is required to persist workflow outputs")

    try:
        tasks_yaml = str(tasks_yaml).strip()

        fence_match = re.search(
            r"(?is)```(?:yaml|json|text)?\s*([\s\S]*?)\s*```",
            tasks_yaml,
        )
        if fence_match:
            tasks_yaml = fence_match.group(1).strip()
        else:
            tasks_yaml = tasks_yaml.replace("`", "").strip()

        parsed_yaml: Dict[str, Any] = yaml.safe_load(tasks_yaml) or {}
    except yaml.YAMLError as exc:
        raise ValueError("Unable to parse workflow output YAML") from exc

    raw_tasks: List[Dict[str, Any]] = []
    if isinstance(parsed_yaml.get("tasks"), list):
        raw_tasks = [entry for entry in parsed_yaml["tasks"] if isinstance(entry, dict)]

    tasks: List[WorkflowTaskCreate] = []
    for entry in raw_tasks:
        step = entry.get("step")
        priority = entry.get("priority")
        if not step or not priority:
            continue
        task_identifier = _normalise_string(entry.get("id") or uuid4().hex)
        tasks.append(
            WorkflowTaskCreate(
                id=task_identifier,
                step=_normalise_string(step),
                priority=_normalise_string(priority),
                approval_status=ApprovalStatus.PENDING,
            )
        )

    requirements: Dict[str, Any] = {}
    if isinstance(parsed_yaml.get("requirements"), dict):
        requirements = parsed_yaml["requirements"]

    raw_resources: List[Dict[str, Any]] = []
    if isinstance(requirements.get("resources"), list):
        raw_resources = [
            entry for entry in requirements["resources"] if isinstance(entry, dict)
        ]

    resources: List[WorkflowResourceCreate] = []
    for entry in raw_resources:
        resource_type = entry.get("type")
        total_quantity = _coerce_positive_int(entry.get("total_quantity"))
        if not resource_type or total_quantity is None:
            continue
        resource_identifier = entry.get("id")
        breakdown = _parse_resource_breakdown(entry.get("breakdown"))
        computed_total = sum(item.quantity for item in breakdown)
        if computed_total and computed_total != total_quantity:
            total_quantity = computed_total
        substitution_for = _normalise_string(entry.get("substitution_for")) or None
        quantity_text = _normalise_string(entry.get("quantity")) or None
        resources.append(
            WorkflowResourceCreate(
                resource_id=_normalise_string(resource_identifier) or None,
                resource_type=_normalise_string(resource_type),
                total_quantity=total_quantity,
                breakdown=breakdown,
                substitution_for=substitution_for,
                quantity=quantity_text,
                approval_status=ApprovalStatus.PENDING,
            )
        )

    manpower: Optional[WorkflowManpower] = None
    manpower_data = requirements.get("manpower")
    if isinstance(manpower_data, dict):
        breakdown = _parse_manpower_breakdown(manpower_data.get("breakdown"))
        total_volunteers = _coerce_positive_int(manpower_data.get("total_volunteers"))
        computed_total = sum(item.volunteers for item in breakdown)
        if computed_total and computed_total != (total_volunteers or 0):
            total_volunteers = computed_total if computed_total > 0 else total_volunteers
        notes = _normalise_string(manpower_data.get("notes")) or None
        if total_volunteers is not None or breakdown or notes:
            manpower = WorkflowManpower(
                total_volunteers=total_volunteers,
                breakdown=breakdown,
                notes=notes,
            )

    return WorkflowOutputCreate(
        workflow_id=workflow_id,
        request_id=str(request_id).strip(),
        tasks=[t.model_dump(by_alias=True) for t in tasks],
        resource_suggestions=[r.model_dump(by_alias=True) for r in resources],
        manpower=manpower,
    )
