from fastapi import APIRouter, HTTPException, status

from app.core.permissions import require_perms
from app.crud import workflow_resources as crud
from app.schemas.workflow import WorkflowResource, WorkflowResourceCreate, WorkflowResourceUpdate

router = APIRouter(prefix="/workflow-outputs/{request_id}/resources", tags=["Workflow Resources"])


@router.get(
    "",
    response_model=list[WorkflowResource],
    dependencies=[require_perms("resource:read")],
)
def list_workflow_resources(request_id: str):
    return crud.list_resources(request_id)


@router.post(
    "",
    response_model=WorkflowResource,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_perms("resource:create")],
)
def create_workflow_resource(request_id: str, payload: WorkflowResourceCreate):
    try:
        return crud.create_resource(request_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch(
    "/{resource_id}",
    response_model=WorkflowResource,
    dependencies=[require_perms("resource:update")],
)
def update_workflow_resource(request_id: str, resource_id: str, payload: WorkflowResourceUpdate):
    try:
        return crud.update_resource(request_id, resource_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete(
    "/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[require_perms("resource:delete")],
)
def delete_workflow_resource(request_id: str, resource_id: str):
    try:
        crud.delete_resource(request_id, resource_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
