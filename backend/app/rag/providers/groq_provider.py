"""Groq provider implementation."""

import os
from typing import Dict, Tuple
import logging

from groq import Groq

from .base_provider import BaseProvider


class GroqProvider(BaseProvider):
    """LLM provider for Groq models."""

    def __init__(self, temperature: float = 0.7, model_name: str | None = None) -> None:
        super().__init__(temperature)
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise EnvironmentError("GROQ_API_KEY environment variable is required but not set. Please set this environment variable with your Groq API key.")
        self.client = Groq(api_key=api_key)
        self.model_name = model_name or "llama3-8b-8192"
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.info("Initialized Groq client with model %s", self.model_name)

    def generate(self, prompt: str) -> Tuple[str, Dict[str, int]]:
        """Generate a response using a Groq chat model, returning text and usage."""
        self.logger.debug("Sending prompt to Groq (length=%d, temperature=%.2f)", len(prompt), self.temperature)
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=self.temperature,
        )
        text = response.choices[0].message.content.strip()
        usage = {
            "prompt_tokens": getattr(response.usage, "prompt_tokens", 0) or 0,
            "completion_tokens": getattr(response.usage, "completion_tokens", 0) or 0,
            "total_tokens": getattr(response.usage, "total_tokens", 0) or 0,
        }
        self.logger.debug("Received completion (chars=%d) usage=%s", len(text), usage)
        return text, usage
