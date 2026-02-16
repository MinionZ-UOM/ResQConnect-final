from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, root_validator


class ApprovalStatus(str, Enum):
    """Represents the moderation state for generated items."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class WorkflowTaskBase(BaseModel):
    """Core attributes describing a generated task suggestion."""

    task_id: str = Field(..., alias="id")
    step: str
    priority: str
    approval_status: ApprovalStatus = Field(default=ApprovalStatus.PENDING)

    # Pydantic v2 configuration
    model_config = {
        "populate_by_name": True,
        "anystr_strip_whitespace": True,
        "use_enum_values": True,
    }


class WorkflowTaskCreate(WorkflowTaskBase):
    """Payload used when storing a new generated task."""

    pass


class WorkflowTaskUpdate(BaseModel):
    """Fields that can be updated for a stored task suggestion."""

    step: Optional[str] = None
    priority: Optional[str] = None
    approval_status: Optional[ApprovalStatus] = None

    # converted v1 `Config` -> v2 `model_config`
    model_config = {
        "anystr_strip_whitespace": True,
        "use_enum_values": True,
    }


class WorkflowTask(WorkflowTaskBase):
    """Database representation of a generated task suggestion."""

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ResourceQuantityBreakdown(BaseModel):
    """Represents the quantity of a resource assigned to a specific task."""

    task_id: str
    quantity: int

    model_config = {
        "anystr_strip_whitespace": True,
    }


class WorkflowResourceBase(BaseModel):
    """Core attributes describing a generated resource recommendation."""

    resource_id: Optional[str] = Field(default=None, alias="id")
    resource_type: str = Field(..., alias="type")
    total_quantity: Optional[int] = Field(default=None, alias="total_quantity")
    breakdown: List[ResourceQuantityBreakdown] = Field(
        default_factory=list,
        description="Breakdown of quantity required per workflow task",
    )
    substitution_for: Optional[str] = Field(
        default=None,
        description="Original requested item if substitution occurred",
    )
    quantity: Optional[str] = Field(
        default=None,
        description="Legacy textual quantity representation, if provided",
    )
    approval_status: ApprovalStatus = Field(default=ApprovalStatus.PENDING)

    # converted v1 `Config` -> v2 `model_config`
    model_config = {
        "populate_by_name": True,
        "anystr_strip_whitespace": True,
        "use_enum_values": True,
    }


class WorkflowResourceCreate(WorkflowResourceBase):
    """Payload used when storing a new resource recommendation."""

    pass


class WorkflowResourceUpdate(BaseModel):
    """Fields that can be updated for a stored resource recommendation."""

    resource_type: Optional[str] = None
    total_quantity: Optional[int] = Field(default=None, alias="total_quantity")
    breakdown: Optional[List[ResourceQuantityBreakdown]] = None
    substitution_for: Optional[str] = None
    quantity: Optional[str] = None
    approval_status: Optional[ApprovalStatus] = None

    model_config = {
        "anystr_strip_whitespace": True,
        "use_enum_values": True,
    }


class WorkflowResource(WorkflowResourceBase):
    """Database representation of a generated resource recommendation."""

    resource_id: str = Field(...)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ManpowerBreakdown(BaseModel):
    """Represents the volunteer requirement for a specific task."""

    task_id: str
    volunteers: int

    model_config = {
        "anystr_strip_whitespace": True,
    }


class WorkflowManpower(BaseModel):
    """Additional manpower details produced by the workflow."""

    total_volunteers: Optional[int] = None
    breakdown: List[ManpowerBreakdown] = Field(default_factory=list)
    notes: Optional[str] = None

    model_config = {
        "anystr_strip_whitespace": True,
    }


class WorkflowOutputIdentifiers(BaseModel):
    """Identifiers shared across workflow output payloads."""

    # make the *internal* field canonical `workflow_id` and accept legacy `workflow_run_id`
    workflow_id: str = Field(..., alias="workflow_run_id")
    request_id: str = Field(..., min_length=1)

    # converted v1 `Config` -> v2 `model_config`
    model_config = {
        "populate_by_name": True,
        "anystr_strip_whitespace": True,
    }


class WorkflowOutputCreate(WorkflowOutputIdentifiers):
    """Payload accepted when storing a workflow run."""

    tasks: List[WorkflowTaskCreate] = Field(default_factory=list)
    resource_suggestions: List[WorkflowResourceCreate] = Field(default_factory=list)
    manpower: Optional[WorkflowManpower] = None

    @root_validator(pre=True)
    def _flatten_requirements(cls, values: dict) -> dict:
        requirements = values.pop("requirements", None)
        if requirements:
            values.setdefault("manpower", requirements.get("manpower"))
            values.setdefault("resource_suggestions", requirements.get("resources", []))
        return values


class WorkflowOutput(WorkflowOutputIdentifiers):
    """Database representation of a stored workflow run."""

    tasks: List[WorkflowTask] = Field(default_factory=list)
    resource_suggestions: List[WorkflowResource] = Field(default_factory=list)
    manpower: Optional[WorkflowManpower] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
