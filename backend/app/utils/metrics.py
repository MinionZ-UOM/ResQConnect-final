"""Utility helpers for capturing latency and token usage metrics."""

from __future__ import annotations

import time
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import contextvars


@dataclass
class APICallMetric:
    """Structured representation of a single API call measurement."""

    provider: str
    operation: str
    duration_ms: float
    token_usage: Dict[str, int] = field(default_factory=dict)


@dataclass
class WorkflowMetric:
    """Timing captured for a named workflow section."""

    name: str
    duration_ms: float


class MetricsCollector:
    """Collects latency, token usage and custom metrics for an evaluation run."""

    def __init__(self) -> None:
        self.api_calls: List[APICallMetric] = []
        self.workflow_sections: List[WorkflowMetric] = []
        self.custom_metrics: Dict[str, Any] = {}

    def record_api_call(
        self,
        provider: str,
        operation: str,
        duration_ms: float,
        token_usage: Optional[Dict[str, Any]] = None,
    ) -> None:
        usage: Dict[str, int] = {}
        if token_usage:
            usage = {
                key: int(value)
                for key, value in token_usage.items()
                if isinstance(value, (int, float))
            }
        self.api_calls.append(
            APICallMetric(
                provider=provider,
                operation=operation,
                duration_ms=duration_ms,
                token_usage=usage,
            )
        )

    def record_workflow_section(self, name: str, duration_ms: float) -> None:
        self.workflow_sections.append(WorkflowMetric(name=name, duration_ms=duration_ms))

    def record_custom_metric(self, key: str, value: Any) -> None:
        self.custom_metrics[key] = value

    def add_to_metric_list(self, key: str, value: Any) -> None:
        bucket = self.custom_metrics.setdefault(key, [])
        if isinstance(bucket, list):
            bucket.append(value)
        else:
            # overwrite if previously a scalar to keep type consistent
            self.custom_metrics[key] = [bucket, value]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "workflow": [metric.__dict__ for metric in self.workflow_sections],
            "api_calls": [metric.__dict__ for metric in self.api_calls],
            "custom": self.custom_metrics,
        }


_active_collector: contextvars.ContextVar[Optional[MetricsCollector]] = contextvars.ContextVar(
    "active_metrics_collector", default=None
)


def get_active_collector() -> Optional[MetricsCollector]:
    """Return the MetricsCollector associated with the current context, if any."""

    return _active_collector.get()


@contextmanager
def metrics_session(collector: MetricsCollector):
    """Context manager that activates a MetricsCollector for downstream helpers."""

    token = _active_collector.set(collector)
    try:
        yield collector
    finally:
        _active_collector.reset(token)


@contextmanager
def track_workflow_section(name: str):
    """Context manager that records the elapsed time for a workflow section."""

    start = time.perf_counter()
    try:
        yield
    finally:
        collector = get_active_collector()
        if collector is None:
            return
        end = time.perf_counter()
        collector.record_workflow_section(name, (end - start) * 1000)


@contextmanager
def track_api_call(provider: str, operation: str):
    """Context manager to measure an external API call."""

    start = time.perf_counter()
    usage: Dict[str, Any] = {}
    try:
        yield usage
    finally:
        collector = get_active_collector()
        if collector is None:
            return
        duration_ms = (time.perf_counter() - start) * 1000
        collector.record_api_call(provider, operation, duration_ms, usage)


def record_api_call(
    provider: str,
    operation: str,
    duration_ms: float,
    token_usage: Optional[Dict[str, Any]] = None,
) -> None:
    """Utility to record an API call without using the context manager."""

    collector = get_active_collector()
    if collector is None:
        return
    collector.record_api_call(provider, operation, duration_ms, token_usage)


def record_custom_metric(key: str, value: Any) -> None:
    collector = get_active_collector()
    if collector is None:
        return
    collector.record_custom_metric(key, value)


def append_custom_metric(key: str, value: Any) -> None:
    collector = get_active_collector()
    if collector is None:
        return
    collector.add_to_metric_list(key, value)
