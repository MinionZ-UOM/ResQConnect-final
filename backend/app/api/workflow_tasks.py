from fastapi import APIRouter, HTTPException, status

from app.core.permissions import require_perms
from app.crud import workflow_tasks as crud
from app.schemas.workflow import WorkflowTask, WorkflowTaskCreate, WorkflowTaskUpdate

router = APIRouter(prefix="/workflow-outputs/{request_id}/tasks", tags=["Workflow Tasks"])


@router.get(
    "",
    response_model=list[WorkflowTask],
    dependencies=[require_perms("task:read_all")],
)
def list_workflow_tasks(request_id: str):
    return crud.list_tasks(request_id)


@router.post(
    "",
    response_model=WorkflowTask,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_perms("task:assign")],
)
def create_workflow_task(request_id: str, payload: WorkflowTaskCreate):
    try:
        return crud.create_task(request_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch(
    "/{task_id}",
    response_model=WorkflowTask,
    dependencies=[require_perms("task:assign")],
)
def update_workflow_task(request_id: str, task_id: str, payload: WorkflowTaskUpdate):
    try:
        return crud.update_task(request_id, task_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[require_perms("task:assign")],
)
def delete_workflow_task(request_id: str, task_id: str):
    try:
        crud.delete_task(request_id, task_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
