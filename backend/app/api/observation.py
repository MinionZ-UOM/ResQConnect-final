from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, status, Query

from app.schemas.observation import ObservationCreate, ObservationResponse
from app.crud.observation import (
    create_observation,
    list_observations,
    get_observation,
    delete_observation,
)
from app.api.deps import get_current_user
from app.core.permissions import require_perms as check_permission

router = APIRouter(prefix="/observations", tags=["Observations"])


@router.post(
    "",
    response_model=ObservationResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/",
    include_in_schema=False,
    response_model=ObservationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_obs(
    payload: ObservationCreate,
    user=Depends(get_current_user),
):
    if not check_permission(user, "observation:create"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return create_observation(payload, user.uid)


@router.get("", response_model=List[ObservationResponse])
@router.get("/", include_in_schema=False, response_model=List[ObservationResponse])
def list_obs(disaster_id: Optional[str] = Query(None)):
    return list_observations(disaster_id)


@router.get("/{obs_id}", response_model=ObservationResponse)
def read_obs(obs_id: str):
    obs = get_observation(obs_id)
    if obs is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Observation not found")
    return obs


@router.delete("/{obs_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_obs(obs_id: str, user=Depends(get_current_user)):
    if not check_permission(user, "observation:delete"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
    delete_observation(obs_id)
