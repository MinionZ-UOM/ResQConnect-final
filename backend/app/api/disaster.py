# app/api/disaster.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Body, status

from app.schemas.disaster import DisasterCreate, DisasterResponse
from app.api.deps import get_current_user
from app.core.permissions import require_perms as check_permission
from app.crud import disaster as crud
from app.schemas.disaster import JoinedResponse
from app.crud.disaster import get_all_volunteers_by_disaster
from app.crud.disaster import (
    list_agent_suggested_disasters,
    approve_disaster,
    discard_disaster,
)
from app.schemas.user import User

from app.utils.logger import get_logger
logger = get_logger(__name__)

router = APIRouter(prefix="/disasters", tags=["Disasters"])


@router.post(
    "",
    response_model=DisasterResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/",
    include_in_schema=False,
    response_model=DisasterResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_disaster(
    payload: DisasterCreate,
    user=Depends(get_current_user),
):
    if not check_permission(user, "disaster:create"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admins only")
    return crud.create_disaster(payload, admin_uid=user.uid)


@router.get("", response_model=List[DisasterResponse])
@router.get("/", include_in_schema=False, response_model=List[DisasterResponse])
def list_disasters():
    return crud.list_disasters()


@router.get(
    "/location",
    response_model=List[dict],
    summary="Fetch locations related to each disaster"
)
def list_disaster_locations():
    return crud.get_disaster_locations()


@router.get(
    "/agent-suggested",
    response_model=List[DisasterResponse],
    summary="List only agent-suggested disasters",
)
def get_agent_suggested_disasters():
    """
    Retrieve all Disaster documents where `is_agent_suggestion == True`.
    """
    try:
        disasters = list_agent_suggested_disasters()
        return disasters
    except Exception as e:
        # In case something goes wrong at the Firestore/query layer
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/{disaster_id}", response_model=DisasterResponse)
def get_disaster(disaster_id: str):
    d = crud.get_disaster(disaster_id)
    if d is None:
        raise HTTPException(404, "Not found")
    return d


@router.post(
    "/{disaster_id}/join",
    response_model=DisasterResponse,
    status_code=status.HTTP_200_OK,
)
def join_disaster(
    disaster_id: str,
    role: str = Body(
        ...,
        embed=True,
        regex="^(volunteer|first_responder|affected_individual)$"
    ),
    user=Depends(get_current_user),
):
    # Attempt to add the user to the disaster
    updated = crud.join_disaster(disaster_id, user.uid, role)
    if updated is None:
        # Crud should return None if the disaster_id was invalid
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Disaster not found")
    return updated


@router.delete(
    "/{disaster_id}/leave",
    response_model=DisasterResponse,
    status_code=status.HTTP_200_OK,
)
def leave_disaster(
    disaster_id: str,
    user=Depends(get_current_user),
):
    """
    Remove the current user from the disaster, and return the updated disaster.
    """
    updated = crud.leave_disaster(disaster_id, user.uid)
    if updated is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Disaster not found")
    return updated


@router.delete("/{disaster_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_disaster_endpoint(
    disaster_id: str,
    user=Depends(get_current_user),
):
    # only callers with the "disaster:delete" permission may delete
    if not check_permission(user, "disaster:delete"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins only"
        )

    crud.delete_disaster(disaster_id)


@router.get(
    "/{disaster_id}/joined",
    response_model=JoinedResponse,
    summary="Check if current user has joined a disaster"
)
def check_joined(
    disaster_id: str,
    user=Depends(get_current_user),
):
    joined = crud.has_joined(disaster_id, user.uid)
    if joined is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disaster not found"
        )
    return JoinedResponse(joined=joined)


@router.get(
    "/{disaster_id}/volunteers",
    response_model=List[str],              # now correctly a list of display_name strings
    dependencies=[check_permission("task:assign")],
)
def list_volunteers(disaster_id: str):
    vols = get_all_volunteers_by_disaster(disaster_id)
    if vols is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Disaster not found")
    # Return only display names (all non-null)
    logger.debug(vols)
    return [v["display_name"] for v in vols]


@router.post(
    "/{disaster_id}/approve",
    response_model=DisasterResponse,
    summary="Approve an agent-suggested disaster",
)
def post_approve_disaster(disaster_id: str):
    """
    Approve a Disaster that was suggested by the agent.
    Sets `is_agent_suggestion = False`. Returns the updated Disaster.
    """
    try:
        updated = approve_disaster(disaster_id)
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Disaster {disaster_id} not found",
            )
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/{disaster_id}/discard",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Discard (delete) an agent-suggested disaster",
)
def delete_discard_disaster(disaster_id: str):
    """
    Delete a Disaster that was suggested by the agent.
    """
    try:
        success = discard_disaster(disaster_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Disaster {disaster_id} not found",
            )
        return
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))