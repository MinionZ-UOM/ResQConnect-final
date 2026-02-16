from typing import List, Optional
from fastapi import HTTPException, status
from app.core.firebase import users_ref
from app.schemas.user import User, Coordinates
from google.cloud import firestore 

from app.utils.logger import get_logger
logger = get_logger(__name__)

def get_user(uid: str) -> Optional[User]:
    doc = users_ref().document(uid).get()
    if not doc.exists:
        return None
    return User(**doc.to_dict()) 


def create_user(
    uid: str,
    email: str,
    display_name: str | None = None,
    role_id: str = "affected_individual",
) -> None:
    """
    Provision a Firestore record for a brand-new Firebase account.
    """
    users_ref().document(uid).set(
        {
            "uid": uid,
            "email": email,
            "display_name": display_name,
            "role_id": role_id,
            "created_at": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )

def update_user_location(uid: str, coords: Coordinates) -> None:
    user_doc = users_ref().document(uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Update the nested location field
    users_ref().document(uid).update({
        "location": {
            "lat": coords.latitude,
            "lng": coords.longitude
        }
    })


def update_user_availability(uid: str, availability: bool, coords: Optional[Coordinates] = None) -> None:
    # fetch current user
    user_doc = users_ref().document(uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user_data = user_doc.to_dict()
    if user_data.get("role_id") != "volunteer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only volunteers may set availability"
        )

    # perform the update
    users_ref().document(uid).update({"availability": availability})

    # if coordinates were provided, update location too
    if coords:
        update_user_location(uid, coords)


def get_user_availability(uid: str) -> bool:
    """
    Retrieve a volunteer’s availability flag from Firestore.
    Raises 404 if user does not exist.
    Returns False if availability has never been set.
    """
    doc_snap = users_ref().document(uid).get()
    if not doc_snap.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user_data = doc_snap.to_dict()
    return user_data.get("availability", False)

def get_user_ids_by_role_id(role_id: str) -> List[str]:
    """
    Retrieves user IDs for users with the given role_id.
    """
    query = users_ref().where('role_id', '==', role_id).stream()
    user_ids = []

    logger.debug(f"Fetching users with role_id: {role_id}")

    for doc in query:
        user_data = doc.to_dict()
        uid = user_data.get('uid')
        if uid:
            user_ids.append(uid)
            logger.debug(f"Found user: {uid} with role_id: {role_id}")

    logger.debug(f"Total users found with role_id '{role_id}': {len(user_ids)}")
    return user_ids