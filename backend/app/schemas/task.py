from pydantic import BaseModel, Field, Extra
from typing import List, Optional, Literal
from datetime import datetime
from enum import Enum


class TaskBase(BaseModel):
    source_request_id: Optional[str] = Field(
        None,
        description="(Optional) ID of the original request that spawned this task",
    )
    priority: Literal[1, 2, 3] = Field(
        3,
        description="Task priority: 1=High, 2=Medium, 3=Low",
    )
    instructions: Optional[str] = None
    role_required: str = Field(
        "first_responder",
        description="Required role for the task",
    )
    resource_ids: List[str] = Field(
        default_factory=list,
        description="List of inventory resource IDs linked to this task",
    )

    disaster_id: str = Field(
        ...,
        description="Identifier of the disaster this task belongs to",
    )
    is_authorized: bool = Field(
        False,
        description="Whether the caller is authorized to view/modify this task",
    )


class TaskCreate(TaskBase):
    assigned_to: Optional[str] = Field(
        None,
        description="UID of volunteer or responder to whom this task is assigned",
    )


class TaskUpdate(BaseModel):
    instructions: Optional[str] = None
    priority: Optional[Literal[1, 2, 3]] = None
    role_required: Optional[str] = None
    resource_ids: Optional[List[str]] = None
    assigned_to: Optional[str] = None
    disaster_id: Optional[str] = None
    is_authorized: Optional[bool] = None


class TaskStatusEnum(str, Enum):
    pending   = "pending"
    on_route  = "on_route"
    completed = "completed"
    failed    = "failed"


class TaskStatusUpdate(BaseModel):
    status: TaskStatusEnum
    eta_minutes: Optional[int] = Field(
        None,
        ge=0,
        description="Estimated time of arrival in minutes",
    )


class TaskInDBBase(TaskBase):
    id: str
    assigned_to: Optional[str] = None
    status: TaskStatusEnum = Field(
        TaskStatusEnum.pending,
        description="Current status of the task",
    )
    eta_minutes: Optional[int] = Field(
        None,
        ge=0,
        description="Estimated time of arrival in minutes",
    )
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class Task(TaskInDBBase):
    """
    Complete Task schema for responses (including agent outputs),
    but ignore any extra fields coming from the LLM.
    """
    class Config:
        orm_mode = True
        extra = Extra.ignore

class TaskAssignPayload(BaseModel):
    assigned_to: str