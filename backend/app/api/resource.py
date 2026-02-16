# from fastapi import APIRouter, Depends, HTTPException, status
# from app.schemas.resource import ResourceCreate, Resource, ResourceUpdate, StatusChangePayload
# from app.core.permissions import require_perms
# from app.crud import resource as crud
# from typing import List, Dict, Any
# from app.agent.schemas.state import State
# from app.agent.core.manager import Manager
# from fastapi.responses import JSONResponse
# from app.crud.disaster import get_disaster
# from app.crud.task import get_tasks_by_disaster
# from app.crud.resource import get_request_resources 

# from app.agent.core.manager import Manager

# from app.utils.logger import get_logger
# logger = get_logger(__name__)

# router = APIRouter(prefix="/resources", tags=["Resources"])


# @router.post(
#     "/", 
#     response_model=Resource, 
#     status_code=status.HTTP_201_CREATED,
#     dependencies=[require_perms("resource:create")]
# )
# def create_resource(payload: ResourceCreate):
#     try:
#         return crud.create(payload)  # role_id is fetched based on uid
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# @router.get(
#     "/", 
#     response_model=list[Resource], 
#     dependencies=[require_perms("resource:read")]
# )
# def list_resources():
#     try:
#         return crud.list_all()
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch resources: {str(e)}")


# @router.get(
#     "/available", 
#     response_model=list[Resource], 
#     dependencies=[require_perms("resource:read")]
# )
# def list_available_resources():
#     try:
#         return crud.list_available()
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch available resources: {str(e)}")


# @router.get(
#     "/locations",
#     response_model=List[Dict[str, Any]]
# )
# def get_all_resource_locations():
#     try:
#         return crud.list_locations()
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to fetch all resource locations: {str(e)}"
#         )
    

# @router.get(
#     "/{rid}", 
#     response_model=Resource, 
#     dependencies=[require_perms("resource:read")]
# )
# def read_resource(rid: str):
#     res = crud.get(rid)
#     if not res:
#         raise HTTPException(status_code=404, detail="Resource not found")
#     return res


# @router.patch(
#     "/{rid}", 
#     response_model=Resource, 
#     dependencies=[require_perms("resource:update")]
# )
# def update_resource(rid: str, payload: ResourceUpdate):
#     res = crud.get(rid)
#     if not res:
#         raise HTTPException(status_code=404, detail="Resource not found")
#     try:
#         return crud.patch(rid, payload)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")
    

# @router.delete(
#     "/{rid}",
#     response_model=dict,
#     status_code=status.HTTP_200_OK,
#     dependencies=[require_perms("resource:delete")]
# )
# def delete_resource(rid: str):
#     try:
#         crud.delete(rid)
#         return {"detail": "Resource deleted successfully"}
#     except ValueError as e:
#         raise HTTPException(status_code=404, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

# @router.put(
#     "/{rid}/status",
#     response_model=Resource,
#     status_code=status.HTTP_200_OK,
#     dependencies=[require_perms("resource:update")]
# )
# def change_resource_status(rid: str, payload: StatusChangePayload):
#     try:
#         return crud.set_status(rid, payload.status.value)
#     except ValueError as e:
#         raise HTTPException(status_code=404, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")
    

# URGENCY_MAP = {
#     1: "low",
#     2: "medium",
#     3: "high",
#     4: "critical",
# }

# def map_urgency(raw: Any) -> str:
#     """
#     Normalize whatever `raw` is into one of "low","medium","high","critical".
#     """
#     if isinstance(raw, int):
#         return URGENCY_MAP.get(raw, "medium")
#     # If it’s already a string:
#     s = str(raw).lower()
#     if s in URGENCY_MAP.values():
#         return s
#     # Missing or unknown ⇒ default
#     return "medium"


# @router.post(
#     "/suggest/{disaster_id}",
#     status_code=status.HTTP_200_OK,
# )
# async def suggest(disaster_id: str) -> Any:
#     logger.debug(f"suggest() called with disaster_id={disaster_id}")

#     # 1) Fetch the Disaster
#     disaster = get_disaster(disaster_id)
#     if not disaster:
#         logger.debug(f"Disaster {disaster_id} not found")
#         raise HTTPException(status_code=404, detail="Disaster not found")
#     logger.debug(f"Found disaster: {disaster_id}")

#     # 2) Fetch tasks
#     tasks = get_tasks_by_disaster(disaster_id)
#     logger.debug(f"Retrieved {len(tasks)} tasks: {[t.id for t in tasks]}")
#     if not tasks:
#         logger.debug(f"No tasks found for disaster {disaster_id}")
#         raise HTTPException(status_code=404, detail="No tasks found for this disaster")

#     # 3) Filter & format
#     filtered_tasks: List[Dict[str, Any]] = []
#     for t in tasks:
#         logger.debug(f"Checking resources for task {t.id}")
#         resources_map = get_request_resources(t.id)
#         if not resources_map:
#             logger.debug(f"No resources for task {t.id}, skipping")
#             continue

#         tr = resources_map[t.id]
#         raw_reqs = tr.get("resource_requirements", [])
#         manpower = tr.get("manpower_requirement")
#         logger.debug(f"Found {len(raw_reqs)} resource entries, manpower={manpower!r}")

#         # Unwrap your ['key', value] pairs
#         formatted_reqs = []
#         for rr in raw_reqs:
#             rt = rr.get("resource_type")
#             qty = rr.get("quantity")
#             if isinstance(rt, list) and isinstance(qty, list):
#                 formatted_reqs.append({
#                     "resource_type": rt[1],
#                     "quantity":       qty[1],
#                 })
#                 logger.debug(f"resource_type={rt[1]}, quantity={qty[1]}")
#             else:
#                 formatted_reqs.append({
#                     "resource_type": rt,
#                     "quantity":       qty,
#                 })
#                 logger.debug(f"resource_type={rt!r}, quantity={qty!r}")

#         # ── handle missing .urgency safely ──
#         raw_urgency = getattr(t, "urgency", None)
#         urgency = map_urgency(raw_urgency)
#         logger.debug(f"raw_urgency={raw_urgency!r} mapped to '{urgency}'")

#         filtered_tasks.append({
#             "name":                  None,
#             "description":           t.instructions,
#             "urgency":               urgency,
#             "resource_requirements": formatted_reqs,
#             "manpower_requirement":  manpower,
#         })

#     logger.debug(f"Built filtered_tasks with {len(filtered_tasks)} entries")

#     # 4) Build response
#     response_content = {
#         "previous_action": "task_creation",
#         "next_action":     "task_allocation",
#         "request":         None,
#         "disaster": {
#             "disaster_id":   disaster_id,
#             "disaster_type": getattr(disaster, "type", "") or "",
#             "disaster_coordinates": {
#                 "lat": disaster.location.lat,
#                 "lng": disaster.location.lng
#             },
#             "disaster_location": None,
#             "disaster_summary":  disaster.description
#         },
#         "tasks":            filtered_tasks,
#         "task_allocations": None
#     }

#     logger.debug(f"Returning response with {len(filtered_tasks)} tasks")

#     ## Now we should pass this to the manager and he should handle the rest 
#     manager = Manager()

#     response = manager.run(response_content)
    
#     return response   

#     # return JSONResponse(content=response_content)