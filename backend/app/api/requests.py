from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from app.schemas.request import Request, RequestCreate, RequestStatusUpdate
from app.schemas.user import User
from app.core.permissions import require_perms
from app.api.deps import get_current_user
from app.crud import request as crud

# Import both the task and the Celery app itself
from app.celery_config import run_agentic_workflow, celery_app

from app.utils.logger import get_logger
logger = get_logger(__name__)

router = APIRouter(prefix="/requests", tags=["Requests"], redirect_slashes=False)


@router.post(
    "",
    response_model=Request,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_perms("request:create")],
)
@router.post(
    "/",  
    include_in_schema=False,
    response_model=Request,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_perms("request:create")],
)
async def create_request(
    payload: RequestCreate,
    current: User = Depends(get_current_user)
):
    # Create the request in the database
    request = crud.create(current.uid, payload)

    logger.debug(f'request : {request}')

    # Build the agentic payload for the v2 workflow
    agent_payload = {
        "request_id": request.id,
        "request_text": payload.description,
        "image_url": request.media[0].url if request.media else None,
        "metadata": {
            "type_of_need": request.type_of_need.lower(),
            "disaster_id": request.disaster_id,
            "coordinates": {
                "lat": request.location.lat,
                "lng": request.location.lng,
            },
        },
    }
    # Enqueue the task using a borrowed Celery connection
    try:
        with celery_app.connection_or_acquire() as conn:
            run_agentic_workflow.apply_async(
                args=[agent_payload],
                connection=conn
            )
    except Exception as e:
        # If Redis is exhausted or channel borrowing fails
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enqueue agentic task: {e}"
        )

    return request

# - list -
@router.get(
    "",
    response_model=List[Request],
    dependencies=[require_perms("request:read_all")],
)
@router.get(
    "/",  
    include_in_schema=False,
    response_model=List[Request],
    dependencies=[require_perms("request:read_all")],
)
def list_requests():
    return crud.list_all()


@router.get(
    "/me",
    response_model=list[Request],
    dependencies=[require_perms("request:read_own")],
)
def my_requests(current: User = Depends(get_current_user)):
    return crud.list_by_owner(current.uid)


# - detail -
@router.get("/{req_id}", response_model=Request)
def read_request(
    req_id: str,
    current: User = Depends(get_current_user),
):
    req = crud.get(req_id)
    if not req:
        raise HTTPException(404, "Request not found")

    # authorisation: admins / responders can read_all, owner can read_own
    try:
        require_perms("request:read_all")(current)
    except HTTPException:
        if req.created_by != current.uid:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorised")

    return req


# - status patch -
@router.patch(
    "/{req_id}/status",
    response_model=Request,
    dependencies=[require_perms("request:update_status")],  # add to roles!
)
def update_request_status(
    req_id: str,
    payload: RequestStatusUpdate,
):
    if not crud.get(req_id):
        raise HTTPException(404, "Request not found")
    return crud.patch_status(req_id, payload)


@router.get("/disaster/{disaster_id}", response_model=List[Request])
def list_requests_by_disaster(disaster_id: str):
    """
    GET /requests/disaster/{disaster_id}
    Returns only those requests which have a matching disaster_id.
    """
    results = crud.list_by_disaster(disaster_id)
    if not results:
        # Optional: return empty list or 404 if you prefer
        return []
    return results