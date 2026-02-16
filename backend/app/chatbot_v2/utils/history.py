"""Utilities for handling chat history formatting."""
from __future__ import annotations

from typing import Iterable, List

from app.chatbot_v2.schemas import ChatHistoryItem


def truncate_chat_history(
    history: Iterable[ChatHistoryItem],
    limit: int,
) -> List[ChatHistoryItem]:
    """Return the most recent ``limit`` chat history items.

    A non-positive ``limit`` yields an empty list. The function always returns a
    new list to avoid mutating the caller's data structure.
    """

    if limit <= 0:
        return []

    messages = list(history)
    if len(messages) <= limit:
        return messages

    return messages[-limit:]


def format_chat_history(history: Iterable[ChatHistoryItem]) -> str:
    """Return a readable transcript from the structured chat history."""
    messages = list(history)
    if not messages:
        return "No prior conversation."

    lines: list[str] = []
    for item in messages:
        role = item.role.strip().capitalize() or "User"
        content = item.content.strip()
        if not content:
            continue
        lines.append(f"{role}: {content}")

    return "\n".join(lines) if lines else "No prior conversation."
