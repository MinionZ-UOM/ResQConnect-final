from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.crud import workflow_output, workflow_resources
from app.schemas.workflow import WorkflowResourceCreate, WorkflowResourceUpdate


class _StubDocRef:
    def __init__(self) -> None:
        self.last_update = None

    def update(self, payload):
        self.last_update = payload


def test_to_output_normalizes_missing_resource_id() -> None:
    output = workflow_output._to_output(
        "req-1",
        {
            "workflow_run_id": "wf-1",
            "tasks": [],
            "resource_suggestions": [
                {
                    "resource_id": None,
                    "resource_type": "water",
                    "total_quantity": 3,
                    "breakdown": [],
                }
            ],
        },
    )

    assert output.resource_suggestions[0].resource_id == "req-1-resource-1"


def test_to_output_ignores_malformed_resource_entries() -> None:
    output = workflow_output._to_output(
        "req-1",
        {
            "workflow_run_id": "wf-1",
            "tasks": [],
            "resource_suggestions": ["unexpected-string"],
        },
    )

    assert len(output.resource_suggestions) == 0


def test_create_resource_generates_id_when_none(monkeypatch) -> None:
    doc_ref = _StubDocRef()

    def _fake_snapshot(_request_id: str):
        return doc_ref, {"resource_suggestions": []}

    monkeypatch.setattr(workflow_resources, "get_snapshot", _fake_snapshot)

    created = workflow_resources.create_resource(
        "req-2",
        WorkflowResourceCreate(
            id=None,
            type="food",
            total_quantity=5,
            breakdown=[],
        ),
    )

    assert created.resource_id
    assert doc_ref.last_update is not None
    saved = doc_ref.last_update["resource_suggestions"][0]
    assert saved["resource_id"] == created.resource_id


def test_update_resource_supports_legacy_null_resource_id(monkeypatch) -> None:
    doc_ref = _StubDocRef()

    def _fake_snapshot(_request_id: str):
        return doc_ref, {
            "resource_suggestions": [
                {
                    "resource_id": None,
                    "resource_type": "blankets",
                    "total_quantity": 2,
                    "breakdown": [],
                }
            ]
        }

    monkeypatch.setattr(workflow_resources, "get_snapshot", _fake_snapshot)

    updated = workflow_resources.update_resource(
        "req-3",
        "req-3-resource-1",
        WorkflowResourceUpdate(total_quantity=4),
    )

    assert updated.resource_id == "req-3-resource-1"
    assert updated.total_quantity == 4
    saved = doc_ref.last_update["resource_suggestions"][0]
    assert saved["resource_id"] == "req-3-resource-1"


def test_delete_resource_supports_legacy_null_resource_id(monkeypatch) -> None:
    doc_ref = _StubDocRef()

    def _fake_snapshot(_request_id: str):
        return doc_ref, {
            "resource_suggestions": [
                {
                    "resource_id": None,
                    "resource_type": "tents",
                    "total_quantity": 1,
                    "breakdown": [],
                },
                {
                    "resource_id": "res-2",
                    "resource_type": "water",
                    "total_quantity": 6,
                    "breakdown": [],
                },
            ]
        }

    monkeypatch.setattr(workflow_resources, "get_snapshot", _fake_snapshot)

    workflow_resources.delete_resource("req-4", "req-4-resource-1")

    assert doc_ref.last_update is not None
    remaining = doc_ref.last_update["resource_suggestions"]
    assert len(remaining) == 1
    assert remaining[0]["resource_id"] == "res-2"
