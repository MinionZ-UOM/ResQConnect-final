"""Utility wrappers for retrieving knowledge via the standard RAG pipeline."""
from __future__ import annotations

from threading import Lock
from time import perf_counter
from typing import Dict, List, Tuple

from app.rag.run_standard import initialize_retrieval_system, run_workflow
from app.utils.logger import get_logger

logger = get_logger(__name__)

_retriever_lock = Lock()
_retriever_ready = False


def _ensure_retriever_ready() -> None:
    """Initialise the standard retrieval pipeline once per process."""

    global _retriever_ready
    if _retriever_ready:
        return

    with _retriever_lock:
        if _retriever_ready:
            return
        logger.debug("Initialising standard retrieval system for chatbot usage")
        success = initialize_retrieval_system()
        if not success:
            logger.warning("Standard retrieval system failed to initialise; proceeding without it")
        _retriever_ready = True


def retrieve_knowledge(
    query: str,
    *,
    k: int = 3,
) -> Tuple[List[Dict[str, str]], str]:
    """Retrieve knowledge via the refactored standard workflow used by the chatbot."""

    _ensure_retriever_ready()
    logger.debug("Retrieving knowledge for chatbot query: %s", query)
    start_time = perf_counter()
    result = run_workflow(query=query, k=k)
    elapsed = perf_counter() - start_time
    documents = result.get("documents") or []
    answer = result.get("answer") or ""
    logger.info(
        "Chatbot knowledge retrieval completed in %.2fs (documents=%d, answer_length=%d)",
        elapsed,
        len(documents),
        len(answer),
    )
    if answer:
        logger.debug("Received synthesized RAG answer of length %d", len(answer))
    return documents, answer


def build_knowledge_context(docs: List[Dict[str, str]], *, max_chars: int = 2000) -> str:
    """Join retrieved knowledge into a bounded text context."""
    if not docs:
        return "No relevant knowledge was found in the knowledge base."

    parts: list[str] = []
    current_length = 0
    for doc in docs:
        content = str(doc.get("content", "")).strip()
        if not content:
            continue
        if current_length + len(content) > max_chars:
            remaining = max_chars - current_length
            if remaining <= 0:
                break
            content = content[:remaining]
        parts.append(content)
        current_length += len(content)
        if current_length >= max_chars:
            break

    return "\n\n".join(parts) if parts else "No relevant knowledge was found in the knowledge base."
