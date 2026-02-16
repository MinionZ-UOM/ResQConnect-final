from fastapi import APIRouter, HTTPException, status

from app.core.permissions import require_perms
from app.crud import workflow_output as crud
from app.schemas.workflow import WorkflowOutput, WorkflowOutputCreate

router = APIRouter(prefix="/workflow-outputs", tags=["Workflow Outputs"])


@router.post(
    "/",
    response_model=WorkflowOutput,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_perms("task:assign")],
)
def upsert_workflow_output(payload: WorkflowOutputCreate):
    try:
        return crud.upsert(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get(
    "/",
    response_model=list[WorkflowOutput],
    dependencies=[require_perms("task:read_all")],
)
def list_workflow_outputs():
    return crud.list_all()


@router.get(
    "/{request_id}",
    response_model=WorkflowOutput,
    dependencies=[require_perms("task:read_all")],
)
def get_workflow_output(request_id: str):
    result = crud.get(request_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow output not found")
    return result


@router.delete(
    "/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[require_perms("task:assign")],
)
def delete_workflow_output(request_id: str):
    try:
        crud.delete(request_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
