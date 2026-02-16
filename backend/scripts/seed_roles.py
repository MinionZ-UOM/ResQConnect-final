"""
Run once: python -m scripts.seed_roles
"""

from app.core.firebase import roles_ref, get_db

ROLES = {
    "admin": {
        "name": "Administrator",
        "permissions": [
            "request:read_all",
            "task:*",
            "resource:*",
            "user:manage",
            "dashboard:view_all",
        ],
    },
    "first_responder": {
        "name": "First Responder",
        "permissions": [
            "request:read_all",
            "task:assign",
            "task:read_all",
            "task:update_status",
            "resource:read",
            "resource:update",
            "dashboard:view_all",
        ],
    },
    "volunteer": {
        "name": "Volunteer",
        "permissions": [
            "task:read_own",
            "task:update_status",
            "resource:*",
        ],
    },
    "affected_individual": {
        "name": "Affected Individual",
        "permissions": [
            "request:create",
            "request:read_own",
        ],
    },
}

def run():
    batch = get_db().batch()
    for rid, data in ROLES.items():
        batch.set(roles_ref().document(rid), data, merge=True)
    batch.commit()
    print("Roles seeded ✔")

if __name__ == "__main__":
    run()
