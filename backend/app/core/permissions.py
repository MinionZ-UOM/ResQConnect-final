# backend/app/core/permissions.py
from typing import List
from fastapi import Depends, HTTPException, status

from app.api.deps import get_current_user     
from app.schemas.user import User
from app.crud.role import get_role

def _allowed(needed: str, granted: List[str]) -> bool:
    if needed in granted:
        return True
    for g in granted:                           # wildcard match "task:*"
        if g.endswith(":*") and needed.startswith(g[:-1]):
            return True
    return False


def require_perms(*needed: str):
    """
    Usage examples
    --------------
    @router.post("/", dependencies=[require_perms("request:create")])
    async def create_request(...): ...

    @router.get("/dashboard", dependencies=[require_perms("dashboard:view_all")])
    async def global_dashboard(): ...
    """

    def guard(user: User = Depends(get_current_user)) -> User:
        # — hydrate role if a dev override left it empty —
        if user.role is None:
            user.role = get_role(user.role_id)

        granted = user.role.permissions if user.role else []

        if all(_allowed(req, granted) for req in needed):
            return user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Missing permission(s): {', '.join(needed)}",
        )

    # return as FastAPI dependency
    return Depends(guard)