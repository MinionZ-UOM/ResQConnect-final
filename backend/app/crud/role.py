from typing import Optional

from app.core.firebase import roles_ref
from app.schemas.user import Role


def get_role(role_id: str) -> Optional[Role]:
    doc = roles_ref().document(role_id).get()
    if not doc.exists:
        return None
    return Role(id=doc.id, **doc.to_dict())
