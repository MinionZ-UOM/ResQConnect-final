from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.task import TaskCreate, Task, TaskStatusUpdate, TaskAssignPayload
from app.schemas.user import User
from app.core.permissions import require_perms
from app.crud import task as crud
from app.api.deps import get_current_user
from app.crud.task import get_task, update_task

router = APIRouter(prefix="/tasks", tags=["Tasks"])

# --- create ---
@router.post(
    "/", response_model=Task, status_code=status.HTTP_201_CREATED,
    dependencies=[require_perms("task:assign")]
)
def create_task(payload: TaskCreate):
    return crud.create_task(payload)


# --- list ---
@router.get("", response_model=list[Task], dependencies=[require_perms("task:read_all")])
@router.get("/", include_in_schema=False)  
def list_tasks():
    return crud.list_tasks()


@router.get("/me", response_model=list[Task], dependencies=[require_perms("task:read_own")])
def my_tasks(current: User = Depends(get_current_user)):
    return crud.list_tasks_by_assignee(current.uid)


# --- detail ---
@router.get("/{task_id}", response_model=Task)
def read_task(
    task_id: str,
    current: User = Depends(get_current_user),
):
    task = crud.get_task(task_id)
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")

    # AuthZ: allow if read_all or it's assigned to me
    try:
        require_perms("task:read_all")(current)
    except HTTPException:
        if task.assigned_to != current.uid:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorised")

    return task


# -- update status --
@router.patch(
    "/{task_id}/status",
    response_model=Task,
)
def update_task_status(
    task_id: str,
    payload: TaskStatusUpdate,
    current: User = Depends(get_current_user),
):
    task = crud.get_task(task_id)
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")

    return crud.update_task_status(task_id, payload)


@router.patch(
    "/{task_id}/authorize",
    response_model=Task,
    dependencies=[require_perms("task:authorize")],
)
def authorize_task_endpoint(
    task_id: str,
):
    task = crud.get_task(task_id)
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    return crud.authorize_task(task_id)


@router.patch(
    "/{task_id}/assign",
    response_model=Task,
    dependencies=[require_perms("task:assign")],
)
def assign_task(
    task_id: str,
    payload: TaskAssignPayload,
    current: User = Depends(get_current_user),
):
    task = get_task(task_id)
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    # pass the BaseModel directly, not a dict
    return update_task(task_id, payload)