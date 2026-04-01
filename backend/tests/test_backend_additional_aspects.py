import asyncio
from datetime import datetime
from pathlib import Path
import sys

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.api import deps
from app.api import workflow_outputs as workflow_outputs_api
from app.api import workflow_resources as workflow_resources_api
from app.api import workflow_tasks as workflow_tasks_api
from app.core import permissions
from app.schemas.user import Role, User
from app.schemas.workflow import WorkflowOutput


def make_user(
    uid: str = "user-1",
    role_id: str = "admin",
    permissions_list: list[str] | None = None,
    with_role: bool = True,
) -> User:
    role = None
    if with_role:
        role = Role(
            id=role_id,
            name=role_id.replace("_", " ").title(),
            permissions=permissions_list or [],
        )
    return User(
        uid=uid,
        email=f"{uid}@example.com",
        display_name="Backend Tester",
        role_id=role_id,
        role=role,
    )


def make_client(routers: list, user: User) -> TestClient:
    app = FastAPI()
    for router in routers:
        app.include_router(router)

    async def _override_current_user() -> User:
        return user

    app.dependency_overrides[deps.get_current_user] = _override_current_user
    return TestClient(app)


def workflow_output_doc(request_id: str) -> WorkflowOutput:
    return WorkflowOutput(
        workflow_id="wf-1",
        request_id=request_id,
        tasks=[],
        resource_suggestions=[],
        manpower=None,
        created_at=datetime(2026, 1, 1, 12, 0, 0),
        updated_at=datetime(2026, 1, 1, 12, 0, 0),
    )


def test_parse_authorization_header_missing_token() -> None:
    with pytest.raises(HTTPException) as exc:
        asyncio.run(deps._parse_authorization_header(None))

    assert exc.value.status_code == 401
    assert exc.value.detail == "Auth token missing"


def test_parse_authorization_header_returns_token() -> None:
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token-123")

    token = asyncio.run(deps._parse_authorization_header(creds))

    assert token == "token-123"


def test_get_current_user_existing_user_gets_role(monkeypatch) -> None:
    existing_user = make_user(uid="u-1", role_id="volunteer", with_role=False)
    hydrated_role = Role(id="volunteer", name="Volunteer", permissions=["task:read_own"])

    monkeypatch.setattr(deps, "verify_token", lambda _: {"uid": "u-1", "email": "u-1@example.com"})
    monkeypatch.setattr(deps, "get_user", lambda _: existing_user)
    monkeypatch.setattr(deps, "get_role", lambda _: hydrated_role)

    current = asyncio.run(deps.get_current_user("id-token"))

    assert current.uid == "u-1"
    assert current.role is not None
    assert current.role.permissions == ["task:read_own"]


def test_get_current_user_first_sign_in_creates_user(monkeypatch) -> None:
    created_user = make_user(uid="new-1", role_id="affected_individual", with_role=False)
    hydrated_role = Role(id="affected_individual", name="Affected Individual", permissions=["request:create"])
    calls = {"create_user": 0, "set_claims": 0}

    monkeypatch.setattr(deps, "verify_token", lambda _: {"uid": "new-1", "email": "new@example.com", "name": "New User"})

    state = {"calls": 0}

    def fake_get_user(_):
        state["calls"] += 1
        if state["calls"] == 1:
            return None
        return created_user

    def fake_create_user(**kwargs):
        calls["create_user"] += 1
        assert kwargs["uid"] == "new-1"
        assert kwargs["role_id"] == "affected_individual"

    def fake_set_custom_claims(uid: str, claims: dict):
        calls["set_claims"] += 1
        assert uid == "new-1"
        assert claims == {"role": "affected_individual"}

    monkeypatch.setattr(deps, "get_user", fake_get_user)
    monkeypatch.setattr(deps, "create_user", fake_create_user)
    monkeypatch.setattr(deps, "get_role", lambda _: hydrated_role)
    monkeypatch.setattr(deps.fb_auth, "set_custom_user_claims", fake_set_custom_claims)

    current = asyncio.run(deps.get_current_user("id-token"))

    assert current.uid == "new-1"
    assert calls["create_user"] == 1
    assert calls["set_claims"] == 1
    assert current.role is not None
    assert current.role.id == "affected_individual"


def test_get_current_user_raises_403_when_user_still_missing(monkeypatch) -> None:
    monkeypatch.setattr(deps, "verify_token", lambda _: {"uid": "ghost", "email": "ghost@example.com"})
    monkeypatch.setattr(deps, "get_user", lambda _: None)
    monkeypatch.setattr(deps, "create_user", lambda **kwargs: None)
    monkeypatch.setattr(deps.fb_auth, "set_custom_user_claims", lambda *_args, **_kwargs: None)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(deps.get_current_user("id-token"))

    assert exc.value.status_code == 403
    assert exc.value.detail == "User record not found"


def test_require_perms_allows_wildcard_permission() -> None:
    user = make_user(permissions_list=["task:*"])
    dep = permissions.require_perms("task:assign")
    guard = dep.dependency

    allowed_user = guard(user)

    assert allowed_user.uid == user.uid


def test_require_perms_hydrates_role_if_missing(monkeypatch) -> None:
    user = make_user(role_id="admin", with_role=False)
    monkeypatch.setattr(
        permissions,
        "get_role",
        lambda _: Role(id="admin", name="Admin", permissions=["request:create"]),
    )

    dep = permissions.require_perms("request:create")
    guard = dep.dependency
    allowed_user = guard(user)

    assert allowed_user.role is not None
    assert allowed_user.role.permissions == ["request:create"]


def test_require_perms_denies_missing_permission() -> None:
    user = make_user(permissions_list=["request:read_own"])
    dep = permissions.require_perms("task:assign")
    guard = dep.dependency

    with pytest.raises(HTTPException) as exc:
        guard(user)

    assert exc.value.status_code == 403
    assert "Missing permission(s): task:assign" in str(exc.value.detail)


def test_workflow_output_get_404_when_not_found(monkeypatch) -> None:
    user = make_user(permissions_list=["task:read_all"])
    client = make_client([workflow_outputs_api.router], user)
    monkeypatch.setattr(workflow_outputs_api.crud, "get", lambda _: None)

    response = client.get("/workflow-outputs/req-404")

    assert response.status_code == 404
    assert response.json()["detail"] == "Workflow output not found"


def test_workflow_output_upsert_maps_exception_to_400(monkeypatch) -> None:
    user = make_user(permissions_list=["task:assign"])
    client = make_client([workflow_outputs_api.router], user)

    def fail_upsert(_payload):
        raise RuntimeError("invalid workflow payload")

    monkeypatch.setattr(workflow_outputs_api.crud, "upsert", fail_upsert)

    response = client.post(
        "/workflow-outputs/",
        json={"workflow_run_id": "wf-1", "request_id": "req-1", "tasks": [], "resource_suggestions": []},
    )

    assert response.status_code == 400
    assert "invalid workflow payload" in response.json()["detail"]


def test_workflow_output_delete_maps_value_error_to_404(monkeypatch) -> None:
    user = make_user(permissions_list=["task:assign"])
    client = make_client([workflow_outputs_api.router], user)

    def fail_delete(_request_id):
        raise ValueError("Workflow output not found")

    monkeypatch.setattr(workflow_outputs_api.crud, "delete", fail_delete)

    response = client.delete("/workflow-outputs/req-404")

    assert response.status_code == 404
    assert response.json()["detail"] == "Workflow output not found"


def test_workflow_output_list_success(monkeypatch) -> None:
    user = make_user(permissions_list=["task:read_all"])
    client = make_client([workflow_outputs_api.router], user)
    monkeypatch.setattr(workflow_outputs_api.crud, "list_all", lambda: [workflow_output_doc("req-1")])

    response = client.get("/workflow-outputs/")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_workflow_task_create_maps_value_error_to_400(monkeypatch) -> None:
    user = make_user(permissions_list=["task:assign"])
    client = make_client([workflow_tasks_api.router], user)

    def fail_create_task(_request_id, _payload):
        raise ValueError("Task payload invalid")

    monkeypatch.setattr(workflow_tasks_api.crud, "create_task", fail_create_task)

    response = client.post(
        "/workflow-outputs/req-1/tasks",
        json={"id": "Task-1", "step": "Do work", "priority": "High"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Task payload invalid"


def test_workflow_task_update_maps_value_error_to_404(monkeypatch) -> None:
    user = make_user(permissions_list=["task:assign"])
    client = make_client([workflow_tasks_api.router], user)

    def fail_update_task(_request_id, _task_id, _payload):
        raise ValueError("Task not found")

    monkeypatch.setattr(workflow_tasks_api.crud, "update_task", fail_update_task)

    response = client.patch("/workflow-outputs/req-1/tasks/task-404", json={"step": "Revised"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


def test_workflow_resource_create_maps_value_error_to_400(monkeypatch) -> None:
    user = make_user(permissions_list=["resource:create"])
    client = make_client([workflow_resources_api.router], user)

    def fail_create_resource(_request_id, _payload):
        raise ValueError("Resource payload invalid")

    monkeypatch.setattr(workflow_resources_api.crud, "create_resource", fail_create_resource)

    response = client.post(
        "/workflow-outputs/req-1/resources",
        json={"id": "res-1", "type": "water", "total_quantity": 10},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Resource payload invalid"


def test_workflow_resource_update_maps_value_error_to_404(monkeypatch) -> None:
    user = make_user(permissions_list=["resource:update"])
    client = make_client([workflow_resources_api.router], user)

    def fail_update_resource(_request_id, _resource_id, _payload):
        raise ValueError("Resource not found")

    monkeypatch.setattr(workflow_resources_api.crud, "update_resource", fail_update_resource)

    response = client.patch("/workflow-outputs/req-1/resources/res-404", json={"resource_type": "food"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Resource not found"


def test_workflow_resource_list_denies_missing_permission() -> None:
    user = make_user(permissions_list=[])
    client = make_client([workflow_resources_api.router], user)

    response = client.get("/workflow-outputs/req-1/resources")

    assert response.status_code == 403
    assert "Missing permission(s): resource:read" in response.json()["detail"]
