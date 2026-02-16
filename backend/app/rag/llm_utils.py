"""Utilities for invoking the configured LLM provider."""

from collections.abc import Sequence
from typing import Any

from langchain_core.messages import HumanMessage


def call_llm(prompt: Any, *, role: str = "user") -> str:
    """Invoke the active LLM provider and return the text content.

    Args:
        prompt: Either a single prompt string or a sequence of chat messages.
        role:   Role to use when constructing a single-message chat prompt.

    Returns:
        The textual content produced by the model, with surrounding
        whitespace trimmed.
    """

    from .state import Provider, llm  # Imported lazily to avoid circular deps.

    if isinstance(prompt, Sequence) and not isinstance(prompt, (str, bytes)):
        request = list(prompt)
    else:
        request = prompt

    if Provider == "OPEN_AI":
        if isinstance(request, Sequence) and not isinstance(request, (str, bytes)):
            normalised = []
            for item in request:
                if isinstance(item, dict):
                    role_value = item.get("role", role)
                    normalised.append({"role": role_value, "content": str(item.get("content", ""))})
                elif hasattr(item, "content"):
                    role_value = getattr(item, "role", role) or role
                    normalised.append({"role": role_value, "content": str(getattr(item, "content", ""))})
                else:
                    normalised.append({"role": role, "content": str(item)})
            request = normalised
        else:
            request = [{"role": role, "content": str(request)}]
    else:
        if not (isinstance(request, Sequence) and not isinstance(request, (str, bytes))):
            request = [HumanMessage(content=str(request))]

    response = llm.invoke(request)

    if isinstance(response, str):
        return response.strip()

    content = getattr(response, "content", None)
    if content is not None:
        return str(content).strip()

    return str(response).strip()

