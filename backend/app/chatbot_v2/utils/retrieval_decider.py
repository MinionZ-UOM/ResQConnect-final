"""Retrieval decision helpers for the chatbot service.

This module encapsulates the heuristics that determine whether the knowledge
base should be queried for a given prompt. Keeping the logic in a dedicated
module makes it easy to swap in a different implementation in the future,
including one backed by a dedicated decision model.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Iterable, Protocol, Sequence

from app.chatbot_v2.schemas import ChatHistoryItem
from app.utils.logger import get_logger

logger = get_logger(__name__)


class RetrievalDecider(Protocol):
    """Protocol for deciding when to fetch external knowledge."""

    def should_use_retrieval(
        self, prompt: str, history: Sequence[ChatHistoryItem]
    ) -> bool:
        """Return ``True`` when the knowledge base should be queried."""


@dataclass(slots=True)
class HeuristicRetrievalDecider:
    """Default heuristic-based retrieval decider."""

    small_talk_patterns: Iterable[re.Pattern[str]]
    domain_keywords: Iterable[str]

    def should_use_retrieval(
        self, prompt: str, history: Sequence[ChatHistoryItem]
    ) -> bool:
        text = prompt.strip()
        if not text:
            return False

        lowered = text.lower()

        for pattern in self.small_talk_patterns:
            if pattern.fullmatch(lowered):
                return False

        if lowered.endswith("?"):
            return True

        if any(keyword in lowered for keyword in self.domain_keywords):
            return True

        if len(lowered.split()) <= 3:
            return False

        return True


_DEFAULT_SMALL_TALK_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"^(hi|hello|hey|good (morning|afternoon|evening))!?$", re.IGNORECASE),
    re.compile(r"^(thanks|thank you|thx|ty)!?$", re.IGNORECASE),
    re.compile(r"^(bye|goodbye|see you( later)?|take care)!?$", re.IGNORECASE),
    re.compile(r"^(ok|okay|sure|sounds good|great|awesome|understood|noted)\.?$", re.IGNORECASE),
)

_DEFAULT_DOMAIN_KEYWORDS: tuple[str, ...] = (
    "evac",
    "shelter",
    "logistic",
    "supply",
    "resource",
    "medical",
    "incident",
    "status",
    "damage",
    "response",
    "coordinate",
    "plan",
    "procedure",
    "safety",
    "report",
    "assist",
    "help",
)


def _build_heuristic_decider() -> RetrievalDecider:
    return HeuristicRetrievalDecider(
        small_talk_patterns=_DEFAULT_SMALL_TALK_PATTERNS,
        domain_keywords=_DEFAULT_DOMAIN_KEYWORDS,
    )


def get_retrieval_decider() -> RetrievalDecider:
    """Return the configured retrieval decider implementation.

    The implementation can be selected via the ``CHATBOT_V2_RETRIEVAL_DECIDER``
    environment variable. For now only the ``heuristic`` option is available,
    but the indirection ensures the service can be switched to a model-based
    decision maker without changing the call sites.
    """

    name = os.getenv("CHATBOT_V2_RETRIEVAL_DECIDER", "heuristic").strip().lower()

    if name in {"heuristic", "default"}:
        return _build_heuristic_decider()

    logger.warning(
        "Unknown CHATBOT_V2_RETRIEVAL_DECIDER=%s; falling back to heuristic implementation",
        name,
    )
    return _build_heuristic_decider()
