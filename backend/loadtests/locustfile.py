from __future__ import annotations

import os
import random
import uuid
from typing import Any, Iterable

from locust import HttpUser, between, task


def env_flag(name: str, default: str = "0") -> bool:
    value = os.getenv(name, default).strip().lower()
    return value in {"1", "true", "yes", "on"}


def env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


LOADTEST_TOKEN = os.getenv("LOADTEST_BEARER_TOKEN", "").strip()
FIXED_DISASTER_ID = os.getenv("LOADTEST_DISASTER_ID", "").strip()
FIXED_REQUEST_ID = os.getenv("LOADTEST_REQUEST_ID", "").strip()
FIXED_OBSERVATION_ID = os.getenv("LOADTEST_OBSERVATION_ID", "").strip()
FIXED_TASK_ID = os.getenv("LOADTEST_TASK_ID", "").strip()

ENABLE_PRIVILEGED_READS = env_flag("LOADTEST_ENABLE_PRIVILEGED_READS", "0")
ENABLE_WRITES = env_flag("LOADTEST_ENABLE_WRITES", "0")
ENABLE_CHATBOT = env_flag("LOADTEST_ENABLE_CHATBOT", "0")
ENABLE_CHAT_WRITES = env_flag("LOADTEST_ENABLE_CHAT_WRITES", "0")
DELETE_CREATED_REQUESTS = env_flag("LOADTEST_DELETE_CREATED_REQUESTS", "1")

CHAT_HISTORY_LIMIT = env_int("LOADTEST_CHAT_HISTORY_LIMIT", 50)
WAIT_MIN = env_float("LOADTEST_WAIT_MIN_SEC", 0.5)
WAIT_MAX = env_float("LOADTEST_WAIT_MAX_SEC", 2.0)
if WAIT_MIN > WAIT_MAX:
    WAIT_MIN, WAIT_MAX = WAIT_MAX, WAIT_MIN


class ResQBaseUser(HttpUser):
    abstract = True
    wait_time = between(WAIT_MIN, WAIT_MAX)

    def on_start(self) -> None:
        self.auth_headers: dict[str, str] = {}
        if LOADTEST_TOKEN:
            self.auth_headers = {"Authorization": f"Bearer {LOADTEST_TOKEN}"}
        self.disaster_ids: list[str] = []
        self.request_ids: list[str] = []
        self.observation_ids: list[str] = []
        self.task_ids: list[str] = []

    def _expect(self, response: Any, expected: Iterable[int]) -> bool:
        expected_set = set(expected)
        if response.status_code not in expected_set:
            response.failure(f"Expected {sorted(expected_set)}, got {response.status_code}")
            return False
        return True

    def _json(self, response: Any) -> Any | None:
        try:
            return response.json()
        except Exception:
            response.failure("Response was not valid JSON")
            return None

    def _remember_ids(self, payload: Any, target: list[str]) -> None:
        if not isinstance(payload, list):
            return
        ids: list[str] = []
        for item in payload:
            if isinstance(item, dict):
                item_id = item.get("id")
                if isinstance(item_id, str) and item_id:
                    ids.append(item_id)
        if ids:
            target[:] = ids

    def _choose_disaster_id(self) -> str:
        return FIXED_DISASTER_ID or (random.choice(self.disaster_ids) if self.disaster_ids else "")

    def _choose_request_id(self) -> str:
        return FIXED_REQUEST_ID or (random.choice(self.request_ids) if self.request_ids else "")

    def _choose_observation_id(self) -> str:
        return FIXED_OBSERVATION_ID or (
            random.choice(self.observation_ids) if self.observation_ids else ""
        )

    def _choose_task_id(self) -> str:
        return FIXED_TASK_ID or (random.choice(self.task_ids) if self.task_ids else "")


class PublicReadUser(ResQBaseUser):
    """
    Safe unauthenticated traffic for the most common public discovery flows.
    These tasks should be safe against production-like read-only environments.
    """

    abstract = False
    weight = 8

    @task(8)
    def health_root(self) -> None:
        with self.client.get("/", name="GET /", catch_response=True) as response:
            self._expect(response, {200})

    @task(12)
    def list_disasters(self) -> None:
        with self.client.get("/disasters", name="GET /disasters", catch_response=True) as response:
            if not self._expect(response, {200}):
                return
            payload = self._json(response)
            if not isinstance(payload, list):
                response.failure("Expected list payload")
                return
            self._remember_ids(payload, self.disaster_ids)

    @task(5)
    def list_disaster_locations(self) -> None:
        with self.client.get(
            "/disasters/location",
            name="GET /disasters/location",
            catch_response=True,
        ) as response:
            self._expect(response, {200})

    @task(2)
    def list_agent_suggested_disasters(self) -> None:
        with self.client.get(
            "/disasters/agent-suggested",
            name="GET /disasters/agent-suggested",
            catch_response=True,
        ) as response:
            self._expect(response, {200})

    @task(8)
    def list_observations(self) -> None:
        disaster_id = self._choose_disaster_id()
        path = f"/observations?disaster_id={disaster_id}" if disaster_id else "/observations"
        with self.client.get(path, name="GET /observations", catch_response=True) as response:
            if not self._expect(response, {200}):
                return
            self._remember_ids(self._json(response), self.observation_ids)

    @task(3)
    def get_disaster_detail(self) -> None:
        disaster_id = self._choose_disaster_id()
        if not disaster_id:
            return
        with self.client.get(
            f"/disasters/{disaster_id}",
            name="GET /disasters/{id}",
            catch_response=True,
        ) as response:
            self._expect(response, {200})

    @task(2)
    def get_observation_detail(self) -> None:
        observation_id = self._choose_observation_id()
        if not observation_id:
            return
        with self.client.get(
            f"/observations/{observation_id}",
            name="GET /observations/{id}",
            catch_response=True,
        ) as response:
            self._expect(response, {200})

    @task(2)
    def list_requests_for_disaster(self) -> None:
        disaster_id = self._choose_disaster_id()
        if not disaster_id:
            return
        with self.client.get(
            f"/requests/disaster/{disaster_id}",
            name="GET /requests/disaster/{id}",
            catch_response=True,
        ) as response:
            if not self._expect(response, {200}):
                return
            self._remember_ids(self._json(response), self.request_ids)

    @task(3)
    def list_disaster_chat_messages(self) -> None:
        disaster_id = self._choose_disaster_id()
        if not disaster_id:
            return
        with self.client.get(
            f"/disasters/{disaster_id}/chat/messages?limit={CHAT_HISTORY_LIMIT}",
            name="GET /disasters/{id}/chat/messages",
            catch_response=True,
        ) as response:
            self._expect(response, {200})


class AuthenticatedReadUser(ResQBaseUser):
    """
    Authenticated user traffic. Privileged collection-wide reads are disabled
    unless LOADTEST_ENABLE_PRIVILEGED_READS=1 to avoid false failures with a
    normal affected-individual token.
    """

    abstract = not bool(LOADTEST_TOKEN)
    weight = 3

    @task(5)
    def get_current_user(self) -> None:
        if not self.auth_headers:
            return
        with self.client.get(
            "/users/me",
            headers=self.auth_headers,
            name="GET /users/me",
            catch_response=True,
        ) as response:
            self._expect(response, {200})

    @task(5)
    def list_my_requests(self) -> None:
        if not self.auth_headers:
            return
        with self.client.get(
            "/requests/me",
            headers=self.auth_headers,
            name="GET /requests/me",
            catch_response=True,
        ) as response:
            if not self._expect(response, {200}):
                return
            self._remember_ids(self._json(response), self.request_ids)

    @task(4)
    def list_my_tasks(self) -> None:
        if not self.auth_headers:
            return
        with self.client.get(
            "/tasks/me",
            headers=self.auth_headers,
            name="GET /tasks/me",
            catch_response=True,
        ) as response:
            if not self._expect(response, {200}):
                return
            self._remember_ids(self._json(response), self.task_ids)

    @task(3)
    def check_joined_disaster(self) -> None:
        if not self.auth_headers:
            return
        disaster_id = self._choose_disaster_id()
        if not disaster_id:
            return
        with self.client.get(
            f"/disasters/{disaster_id}/joined",
            headers=self.auth_headers,
            name="GET /disasters/{id}/joined",
            catch_response=True,
        ) as response:
            self._expect(response, {200})

    @task(2)
    def get_request_detail(self) -> None:
        if not self.auth_headers:
            return
        request_id = self._choose_request_id()
        if not request_id:
            return
        with self.client.get(
            f"/requests/{request_id}",
            headers=self.auth_headers,
            name="GET /requests/{id}",
            catch_response=True,
        ) as response:
            self._expect(response, {200})

    @task(2)
    def get_task_detail(self) -> None:
        if not self.auth_headers:
            return
        task_id = self._choose_task_id()
        if not task_id:
            return
        with self.client.get(
            f"/tasks/{task_id}",
            headers=self.auth_headers,
            name="GET /tasks/{id}",
            catch_response=True,
        ) as response:
            self._expect(response, {200})

    @task(2)
    def list_all_tasks_privileged(self) -> None:
        if not self.auth_headers or not ENABLE_PRIVILEGED_READS:
            return
        with self.client.get(
            "/tasks",
            headers=self.auth_headers,
            name="GET /tasks",
            catch_response=True,
        ) as response:
            if not self._expect(response, {200}):
                return
            self._remember_ids(self._json(response), self.task_ids)

    @task(2)
    def list_workflow_outputs_privileged(self) -> None:
        if not self.auth_headers or not ENABLE_PRIVILEGED_READS:
            return
        with self.client.get(
            "/workflow-outputs/",
            headers=self.auth_headers,
            name="GET /workflow-outputs",
            catch_response=True,
        ) as response:
            if not self._expect(response, {200}):
                return
            self._remember_ids(self._json(response), self.request_ids)

    @task(2)
    def get_workflow_output_privileged(self) -> None:
        if not self.auth_headers or not ENABLE_PRIVILEGED_READS:
            return
        request_id = self._choose_request_id()
        if not request_id:
            return
        with self.client.get(
            f"/workflow-outputs/{request_id}",
            headers=self.auth_headers,
            name="GET /workflow-outputs/{request_id}",
            catch_response=True,
        ) as response:
            self._expect(response, {200})

    @task(1)
    def list_workflow_tasks_privileged(self) -> None:
        if not self.auth_headers or not ENABLE_PRIVILEGED_READS:
            return
        request_id = self._choose_request_id()
        if not request_id:
            return
        with self.client.get(
            f"/workflow-outputs/{request_id}/tasks",
            headers=self.auth_headers,
            name="GET /workflow-outputs/{request_id}/tasks",
            catch_response=True,
        ) as response:
            self._expect(response, {200})

    @task(1)
    def list_workflow_resources_privileged(self) -> None:
        if not self.auth_headers or not ENABLE_PRIVILEGED_READS:
            return
        request_id = self._choose_request_id()
        if not request_id:
            return
        with self.client.get(
            f"/workflow-outputs/{request_id}/resources",
            headers=self.auth_headers,
            name="GET /workflow-outputs/{request_id}/resources",
            catch_response=True,
        ) as response:
            self._expect(response, {200})


class SafeWriteUser(ResQBaseUser):
    """
    Mutating traffic is off by default. Enable only against a disposable
    staging database with a valid token and Celery/Redis capacity prepared.
    """

    abstract = not bool(LOADTEST_TOKEN and (ENABLE_WRITES or ENABLE_CHAT_WRITES))
    weight = 1

    @task(5)
    def create_and_optionally_delete_request(self) -> None:
        if not self.auth_headers or not ENABLE_WRITES:
            return

        disaster_id = self._choose_disaster_id()
        payload: dict[str, Any] = {
            "title": f"Load Test Request {uuid.uuid4().hex[:10]}",
            "type_of_need": random.choice(["food", "medical", "rescue", "other"]),
            "description": "Automated load-test request. Safe to delete.",
            "media": [],
            "location": {
                "lat": 6.9271 + random.uniform(-0.02, 0.02),
                "lng": 79.8612 + random.uniform(-0.02, 0.02),
            },
        }
        if disaster_id:
            payload["disaster_id"] = disaster_id

        with self.client.post(
            "/requests",
            headers=self.auth_headers,
            json=payload,
            name="POST /requests",
            catch_response=True,
        ) as response:
            if not self._expect(response, {201}):
                return

            body = self._json(response)
            created_id = body.get("id") if isinstance(body, dict) else ""
            if isinstance(created_id, str) and created_id:
                self.request_ids.append(created_id)

        if not DELETE_CREATED_REQUESTS or not created_id:
            return

        with self.client.delete(
            f"/requests/{created_id}",
            headers=self.auth_headers,
            name="DELETE /requests/{id}",
            catch_response=True,
        ) as delete_response:
            self._expect(delete_response, {204})

    @task(2)
    def post_chat_message(self) -> None:
        if not self.auth_headers or not ENABLE_CHAT_WRITES:
            return
        disaster_id = self._choose_disaster_id()
        if not disaster_id:
            return
        payload = {"text": f"Load-test chat message {uuid.uuid4().hex[:8]}"}
        with self.client.post(
            f"/disasters/{disaster_id}/chat/messages",
            headers=self.auth_headers,
            json=payload,
            name="POST /disasters/{id}/chat/messages",
            catch_response=True,
        ) as response:
            self._expect(response, {201})

    @task(1)
    def update_my_location(self) -> None:
        if not self.auth_headers or not ENABLE_WRITES:
            return
        payload = {
            "latitude": 6.9271 + random.uniform(-0.02, 0.02),
            "longitude": 79.8612 + random.uniform(-0.02, 0.02),
        }
        with self.client.patch(
            "/users/me/location",
            headers=self.auth_headers,
            json=payload,
            name="PATCH /users/me/location",
            catch_response=True,
        ) as response:
            self._expect(response, {200})


class ChatbotUser(ResQBaseUser):
    """
    Optional LLM/RAG traffic. Keep disabled for normal load tests because it
    can consume API credits and stress external providers rather than only
    this backend.
    """

    abstract = not ENABLE_CHATBOT
    weight = 1

    @task
    def ask_chatbot(self) -> None:
        if not ENABLE_CHATBOT:
            return

        payload = {
            "user": {
                "id": f"loadtest-{uuid.uuid4().hex[:8]}",
                "name": "Load Tester",
                "role": "affected_individual",
                "location": {"latitude": 6.9271, "longitude": 79.8612},
            },
            "prompt": random.choice(
                [
                    "What are the immediate flood safety steps?",
                    "How should volunteers prioritize rescue requests?",
                    "What should I do after a landslide warning?",
                ]
            ),
            "chat_history": [],
        }

        with self.client.post(
            "/chatbot/ask",
            json=payload,
            name="POST /chatbot/ask",
            catch_response=True,
        ) as response:
            self._expect(response, {200})
