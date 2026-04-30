from datetime import datetime
import importlib
from pathlib import Path
import sys
import types

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.api import deps
from app.api import auth as auth_api
from app.api import disaster as disaster_api
from app.api import task as task_api
from app.schemas.common import Location
from app.schemas.request import Media, Request
from app.schemas.user import Coordinates, Role, User


def make_user(
    uid: str = "user-1",
    role_id: str = "admin",
    permissions: list[str] | None = None,
    availability: bool | None = None,
    location: Coordinates | None = None,
) -> User:
    role = Role(
        id=role_id,
        name=role_id.replace("_", " ").title(),
        permissions=permissions or [],
    )
    return User(
        uid=uid,
        email=f"{uid}@example.com",
        display_name="Test User",
        role_id=role_id,
        role=role,
        availability=availability,
        location=location,
    )


def make_client(router, user: User) -> TestClient:
    app = FastAPI()
    app.include_router(router)

    async def _override_current_user() -> User:
        return user

    app.dependency_overrides[deps.get_current_user] = _override_current_user
    return TestClient(app)


def task_doc(task_id: str, assigned_to: str | None = "responder-1") -> dict:
    now = datetime(2026, 1, 1, 12, 0, 0)
    return {
        "id": task_id,
        "source_request_id": "req-1",
        "priority": 2,
        "instructions": "Deliver supplies",
        "role_required": "first_responder",
        "resource_ids": ["res-1"],
        "disaster_id": "dis-1",
        "is_authorized": False,
        "assigned_to": assigned_to,
        "status": "pending",
        "eta_minutes": None,
        "created_at": now,
        "updated_at": now,
    }


def disaster_doc(disaster_id: str) -> dict:
    return {
        "id": disaster_id,
        "name": "Flood in Colombo",
        "description": "River overflow impacted several blocks",
        "location": {"lat": 6.9271, "lng": 79.8612},
        "image_urls": [],
        "type": "flood",
        "severity": "high",
        "affected_count": 150,
        "created_at": datetime(2026, 1, 1, 12, 0, 0),
        "created_by": "admin-1",
        "chat_session_id": "chat-1",
    }


def request_doc(request_id: str, owner_uid: str) -> Request:
    return Request(
        id=request_id,
        title="Need clean water",
        disaster_id="dis-1",
        type_of_need="food",
        description="Family needs urgent supplies",
        media=[Media(url="https://cdn.example.com/image.jpg")],
        location=Location(lat=6.9271, lng=79.8612),
        auto_extract=None,
        created_by=owner_uid,
        status="open",
        assigned_task_id=None,
        created_at=datetime(2026, 1, 1, 12, 0, 0),
        updated_at=datetime(2026, 1, 1, 12, 0, 0),
    )


def load_requests_api():
    if "app.api.requests" in sys.modules:
        return sys.modules["app.api.requests"]

    fake_celery = types.ModuleType("app.celery_config")

    class _NoopTask:
        def apply_async(self, *args, **kwargs):
            return None

    class _ConnCtx:
        def __enter__(self):
            return object()

        def __exit__(self, exc_type, exc, tb):
            return False

    class _NoopCeleryApp:
        def connection_or_acquire(self):
            return _ConnCtx()

    fake_celery.run_agentic_workflow = _NoopTask()
    fake_celery.celery_app = _NoopCeleryApp()
    sys.modules["app.celery_config"] = fake_celery

    return importlib.import_module("app.api.requests")


def test_users_me_returns_current_user() -> None:
    user = make_user(role_id="volunteer", permissions=["request:read_own"], availability=True)
    client = make_client(auth_api.router, user)

    response = client.get("/users/me")

    assert response.status_code == 200
    assert response.json()["uid"] == user.uid


def test_set_my_availability_forbidden_for_non_volunteer() -> None:
    user = make_user(role_id="affected_individual")
    client = make_client(auth_api.router, user)

    response = client.patch("/users/me/availability", json={"availability": True})

    assert response.status_code == 403
    assert response.json()["detail"] == "Only volunteers may update availability"


def test_set_my_availability_updates_and_returns_user(monkeypatch) -> None:
    user = make_user(uid="vol-1", role_id="volunteer", availability=False)
    updated_user = make_user(uid="vol-1", role_id="volunteer", availability=True)
    client = make_client(auth_api.router, user)

    captured: dict[str, object] = {}

    def fake_update_user_availability(uid: str, availability: bool, location):
        captured["uid"] = uid
        captured["availability"] = availability
        captured["location"] = location

    monkeypatch.setattr(auth_api, "update_user_availability", fake_update_user_availability)
    monkeypatch.setattr(auth_api, "get_user", lambda _: updated_user)

    response = client.patch(
        "/users/me/availability",
        json={"availability": True, "location": {"lat": 6.9, "lng": 79.85}},
    )

    assert response.status_code == 200
    assert captured["uid"] == "vol-1"
    assert captured["availability"] is True
    assert captured["location"].latitude == 6.9
    assert captured["location"].longitude == 79.85
    assert response.json()["availability"] is True


def test_set_my_location_forbidden_for_volunteer() -> None:
    user = make_user(role_id="volunteer")
    client = make_client(auth_api.router, user)

    response = client.patch("/users/me/location", json={"lat": 6.9, "lng": 79.85})

    assert response.status_code == 403
    assert response.json()["detail"] == "Only affected individuals or first responders may update location"


def test_set_my_location_updates_and_returns_user(monkeypatch) -> None:
    user = make_user(uid="aff-1", role_id="affected_individual")
    updated_user = make_user(
        uid="aff-1",
        role_id="affected_individual",
        location=Coordinates(lat=7.1, lng=80.1),
    )
    client = make_client(auth_api.router, user)

    captured: dict[str, object] = {}

    def fake_update_user_location(uid: str, coords: Coordinates):
        captured["uid"] = uid
        captured["coords"] = coords

    monkeypatch.setattr(auth_api, "update_user_location", fake_update_user_location)
    monkeypatch.setattr(auth_api, "get_user", lambda _: updated_user)

    response = client.patch("/users/me/location", json={"lat": 7.1, "lng": 80.1})

    assert response.status_code == 200
    assert captured["uid"] == "aff-1"
    assert captured["coords"].latitude == 7.1
    assert captured["coords"].longitude == 80.1
    assert response.json()["uid"] == "aff-1"


def test_create_task_returns_201(monkeypatch) -> None:
    user = make_user(role_id="admin", permissions=["task:assign"])
    client = make_client(task_api.router, user)
    monkeypatch.setattr(task_api.crud, "create_task", lambda payload: task_doc("task-1", "fr-9"))

    payload = {
        "source_request_id": "req-1",
        "priority": 2,
        "instructions": "Deliver clean water",
        "role_required": "first_responder",
        "resource_ids": ["res-1"],
        "disaster_id": "dis-1",
        "is_authorized": False,
        "assigned_to": "fr-9",
    }
    response = client.post("/tasks/", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == "task-1"
    assert body["assigned_to"] == "fr-9"


def test_list_tasks_returns_items(monkeypatch) -> None:
    user = make_user(role_id="admin", permissions=["task:read_all"])
    client = make_client(task_api.router, user)
    monkeypatch.setattr(task_api.crud, "list_tasks", lambda: [task_doc("task-1"), task_doc("task-2")])

    response = client.get("/tasks")

    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == ["task-1", "task-2"]


def test_update_task_status_returns_404_for_missing_task(monkeypatch) -> None:
    user = make_user(role_id="first_responder")
    client = make_client(task_api.router, user)
    monkeypatch.setattr(task_api.crud, "get_task", lambda _: None)

    response = client.patch("/tasks/task-404/status", json={"status": "completed"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


def test_assign_task_returns_404_for_missing_task(monkeypatch) -> None:
    user = make_user(role_id="admin", permissions=["task:assign"])
    client = make_client(task_api.router, user)
    monkeypatch.setattr(task_api, "get_task", lambda _: None)

    response = client.patch("/tasks/task-404/assign", json={"assigned_to": "fr-2"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


def test_list_disasters_returns_items(monkeypatch) -> None:
    user = make_user(role_id="affected_individual")
    client = make_client(disaster_api.router, user)
    monkeypatch.setattr(disaster_api.crud, "list_disasters", lambda: [disaster_doc("dis-1")])

    response = client.get("/disasters")

    assert response.status_code == 200
    assert response.json()[0]["id"] == "dis-1"


def test_join_disaster_returns_404_when_missing(monkeypatch) -> None:
    user = make_user(uid="u-11", role_id="volunteer")
    client = make_client(disaster_api.router, user)
    monkeypatch.setattr(disaster_api.crud, "join_disaster", lambda disaster_id, uid, role: None)

    response = client.post("/disasters/dis-404/join", json={"role": "volunteer"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Disaster not found"


def test_join_disaster_returns_updated_disaster(monkeypatch) -> None:
    user = make_user(uid="u-12", role_id="volunteer")
    client = make_client(disaster_api.router, user)
    monkeypatch.setattr(
        disaster_api.crud,
        "join_disaster",
        lambda disaster_id, uid, role: disaster_doc("dis-1"),
    )

    response = client.post("/disasters/dis-1/join", json={"role": "volunteer"})

    assert response.status_code == 200
    assert response.json()["id"] == "dis-1"


def test_discard_disaster_returns_204(monkeypatch) -> None:
    user = make_user(role_id="admin")
    client = make_client(disaster_api.router, user)
    monkeypatch.setattr(disaster_api, "discard_disaster", lambda _: True)

    response = client.delete("/disasters/dis-1/discard")

    assert response.status_code == 204


def test_create_request_enqueues_agentic_workflow(monkeypatch) -> None:
    requests_api = load_requests_api()
    user = make_user(uid="owner-1", role_id="affected_individual", permissions=["request:create"])
    client = make_client(requests_api.router, user)
    created_request = request_doc("req-1", owner_uid="owner-1")

    monkeypatch.setattr(requests_api.crud, "create", lambda owner_uid, payload: created_request)

    captured: dict[str, object] = {}

    class DummyTask:
        def apply_async(self, args, connection):
            captured["args"] = args
            captured["connection"] = connection

    class ConnCtx:
        def __enter__(self):
            return "conn-1"

        def __exit__(self, exc_type, exc, tb):
            return False

    class DummyCeleryApp:
        def connection_or_acquire(self):
            return ConnCtx()

    monkeypatch.setattr(requests_api, "run_agentic_workflow", DummyTask())
    monkeypatch.setattr(requests_api, "celery_app", DummyCeleryApp())

    payload = {
        "title": "Need clean water",
        "disaster_id": "dis-1",
        "type_of_need": "food",
        "description": "Family needs urgent supplies",
        "media": [{"url": "https://cdn.example.com/image.jpg"}],
        "location": {"lat": 6.9271, "lng": 79.8612},
    }
    response = client.post("/requests", json=payload)

    assert response.status_code == 201
    assert response.json()["id"] == "req-1"
    task_payload = captured["args"][0]
    assert task_payload["request_id"] == "req-1"
    assert task_payload["metadata"]["type_of_need"] == "food"
    assert captured["connection"] == "conn-1"


def test_create_request_returns_500_when_enqueue_fails(monkeypatch) -> None:
    requests_api = load_requests_api()
    user = make_user(uid="owner-2", role_id="affected_individual", permissions=["request:create"])
    client = make_client(requests_api.router, user)

    monkeypatch.setattr(requests_api.crud, "create", lambda owner_uid, payload: request_doc("req-2", owner_uid))

    class BrokenConnCtx:
        def __enter__(self):
            raise RuntimeError("redis unavailable")

        def __exit__(self, exc_type, exc, tb):
            return False

    class BrokenCeleryApp:
        def connection_or_acquire(self):
            return BrokenConnCtx()

    monkeypatch.setattr(requests_api, "celery_app", BrokenCeleryApp())

    payload = {
        "title": "Need medicine",
        "disaster_id": "dis-2",
        "type_of_need": "medical",
        "description": "Urgent medicine required",
        "media": [],
        "location": {"lat": 7.0, "lng": 80.0},
    }
    response = client.post("/requests", json=payload)

    assert response.status_code == 500
    assert "Failed to enqueue agentic task" in response.json()["detail"]


def test_list_requests_by_disaster_returns_empty_list(monkeypatch) -> None:
    requests_api = load_requests_api()
    user = make_user(uid="owner-3", role_id="affected_individual")
    client = make_client(requests_api.router, user)
    monkeypatch.setattr(requests_api.crud, "list_by_disaster", lambda _: [])

    response = client.get("/requests/disaster/dis-77")

    assert response.status_code == 200
    assert response.json() == []
