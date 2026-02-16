import textwrap
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.utils.workflow_output_parser import build_workflow_output_payload


def _build_payload(yaml_text: str):
    return build_workflow_output_payload(
        workflow_id="wf-123",
        request_id="req-456",
        tasks_yaml=textwrap.dedent(yaml_text),
    )


def test_build_workflow_output_payload_parses_structured_requirements() -> None:
    payload = _build_payload(
        """
        tasks:
          - id: Task1
            step: Provide aid
            priority: High
        requirements:
          manpower:
            total_volunteers: 6
            breakdown:
              - task_id: Task1
                volunteers: 4
              - task_id: Task2
                volunteers: 2
          resources:
            - type: water
              total_quantity: 5
              breakdown:
                - task_id: Task1
                  quantity: 3
                - task_id: Task2
                  quantity: 2
              substitution_for: bottled_water
        """
    )

    assert payload.workflow_id == "wf-123"
    assert payload.request_id == "req-456"

    assert len(payload.tasks) == 1
    assert payload.tasks[0].task_id == "Task1"

    assert payload.manpower is not None
    assert payload.manpower.total_volunteers == 6
    assert [(b.task_id, b.volunteers) for b in payload.manpower.breakdown] == [
        ("Task1", 4),
        ("Task2", 2),
    ]

    assert len(payload.resource_suggestions) == 1
    resource = payload.resource_suggestions[0]
    assert resource.resource_type == "water"
    assert resource.total_quantity == 5
    assert resource.substitution_for == "bottled_water"
    assert [(b.task_id, b.quantity) for b in resource.breakdown] == [
        ("Task1", 3),
        ("Task2", 2),
    ]
    assert resource.quantity is None


def test_build_workflow_output_payload_recomputes_totals_from_breakdown() -> None:
    payload = _build_payload(
        """
        requirements:
          manpower:
            total_volunteers: 1
            breakdown:
              - task_id: TaskX
                volunteers: 3
          resources:
            - type: food
              total_quantity: 1
              breakdown:
                - task_id: TaskX
                  quantity: 2
                - task_id: TaskY
                  quantity: 1
            - type: shelter
              total_quantity: 4
              breakdown: []
              quantity: "legacy text"
        """
    )

    assert payload.manpower is not None
    assert payload.manpower.total_volunteers == 3
    assert [(b.task_id, b.volunteers) for b in payload.manpower.breakdown] == [
        ("TaskX", 3),
    ]

    assert len(payload.resource_suggestions) == 2
    food, shelter = payload.resource_suggestions

    assert food.total_quantity == 3
    assert [(b.task_id, b.quantity) for b in food.breakdown] == [
        ("TaskX", 2),
        ("TaskY", 1),
    ]

    assert shelter.total_quantity == 4
    assert shelter.breakdown == []
    assert shelter.quantity == "legacy text"
