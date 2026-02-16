"""Prompt loading helpers for the chatbot."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Dict

import yaml

DEFAULT_PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts.yaml"


@lru_cache(maxsize=None)
def load_prompts(path: str | None = None) -> Dict[str, str]:
    prompt_path = Path(path) if path else DEFAULT_PROMPT_PATH
    data = yaml.safe_load(prompt_path.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        raise ValueError("Chatbot prompts file must be a mapping of strings")
    normalised: Dict[str, str] = {}
    for key, value in data.items():
        if not isinstance(value, str):
            raise ValueError(f"Prompt '{key}' must be a string template")
        normalised[key] = value
    return normalised


def get_prompt(name: str, *, path: str | None = None) -> str:
    prompts = load_prompts(path)
    try:
        return prompts[name]
    except KeyError as exc:
        raise KeyError(f"Prompt '{name}' not found in chatbot prompts") from exc
