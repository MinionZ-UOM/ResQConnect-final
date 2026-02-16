"""OpenAI provider implementation."""

import os
import time
from typing import Dict, Tuple
from openai import OpenAI
from .base_provider import BaseProvider
from app.utils.metrics import record_api_call

class OpenAIProvider(BaseProvider):
    """LLM provider for OpenAI models."""

    def __init__(self, temperature: float = 0.7, model_name: str | None = None) -> None:
        super().__init__(temperature)
        api_key = "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"
        if not api_key:
            raise EnvironmentError(
                "OPENAI_API_KEY environment variable is required but not set."
            )
        self.client = OpenAI(api_key=api_key)
        self.model_name = model_name or "gpt-4o-mini"

    def invoke(self, prompt: str) -> str:
        """
        Generate a response using an OpenAI chat model.
        Accepts either a string or list of messages.
        Returns only the text output (no usage dict).
        """
        if isinstance(prompt, list):
            messages = []
            for m in prompt:
                if hasattr(m, "role") and hasattr(m, "content"):
                    messages.append({"role": getattr(m, "role", "user"), "content": m.content})
                elif isinstance(m, dict):
                    if "role" not in m:
                        m["role"] = "user"
                    messages.append(m)
                else:
                    messages.append({"role": "user", "content": str(m)})
        elif isinstance(prompt, str):
            messages = [{"role": "user", "content": prompt}]
        else:
            # keep fallback for totally invalid types
            raise TypeError(f"Unsupported prompt type: {type(prompt)}")

        start = time.perf_counter()
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=self.temperature,
        )
        duration_ms = (time.perf_counter() - start) * 1000

        usage_payload = {}
        usage = getattr(response, "usage", None)
        if usage:
            usage_payload = {
                "prompt_tokens": getattr(usage, "prompt_tokens", 0),
                "completion_tokens": getattr(usage, "completion_tokens", 0),
                "total_tokens": getattr(usage, "total_tokens", 0),
            }

        record_api_call(
            provider="openai",
            operation="chat.completions.create",
            duration_ms=duration_ms,
            token_usage=usage_payload,
        )
        text = response.choices[0].message.content.strip()
        return text


    def generate(self, prompt: str) -> str:
        """Implements abstract method from BaseProvider — returns only text."""
        return self.invoke(prompt)
