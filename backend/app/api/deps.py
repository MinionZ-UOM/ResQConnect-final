from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as fb_auth

from app.core.firebase import verify_token
from app.crud.user import get_user, create_user
from app.crud.role import get_role
from app.schemas.user import User


bearer_scheme = HTTPBearer(auto_error=False)


async def _parse_authorization_header(             
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """
    Pull the raw Firebase ID-token out of the Authorization header.
    """
    if creds is None:
        raise HTTPException(status_code=401, detail="Auth token missing")
    return creds.credentials


# Back-compat alias if some old code still imports `_raw_token`
_raw_token = _parse_authorization_header


async def get_current_user(id_token: str = Depends(_parse_authorization_header)) -> User:
    """
    • Verifies the Firebase ID-token.
    • Creates a Firestore users/{uid} document on first sign-in
      (default role: affected_individual).
    • Loads the matching role document and attaches it to the User model.
    """
    decoded = verify_token(id_token)
    uid = decoded["uid"]

    user = get_user(uid)

    # First-time sign-in → provision a Firestore record
    if user is None:
        create_user(
            uid=uid,
            email=decoded.get("email", ""),
            display_name=decoded.get("name"),
            role_id="affected_individual",
        )

        # Optional: embed the role in future tokens as a custom claim
        try:
            fb_auth.set_custom_user_claims(uid, {"role": "affected_individual"})
        except Exception:
            # Local dev service account may lack this permission — ignore
            pass

        user = get_user(uid)  # now guaranteed to exist

    if user is None:  # ultra-defensive fallback
        raise HTTPException(status_code=403, detail="User record not found")

    # Enrich with full Role document
    user.role = get_role(user.role_id)
    return user


def require_roles(*allowed: str):
    """
    Usage example:

        @router.get("/admin-only", dependencies=[require_roles("admin")])
    """

    def guard(user: User = Depends(get_current_user)) -> User:
        if user.role_id not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required roles: {', '.join(allowed)}",
            )
        return user

    return Depends(guard)
