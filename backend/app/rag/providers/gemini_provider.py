"""Google Gemini provider implementation."""

import os
from typing import Dict, Tuple
import logging

import google.generativeai as genai

from .base_provider import BaseProvider


class GeminiProvider(BaseProvider):
    """LLM provider for Google's Gemini models."""

    def __init__(self, temperature: float = 0.7, model_name: str | None = None) -> None:
        super().__init__(temperature)
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise EnvironmentError("GEMINI_API_KEY environment variable is required but not set. Please set this environment variable with your Gemini API key.")
        genai.configure(api_key=api_key)
        self.model_name = model_name or "gemini-pro"
        self.model = genai.GenerativeModel(self.model_name)
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.info("Initialized Gemini client with model %s", self.model_name)

    def generate(self, prompt: str) -> Tuple[str, Dict[str, int]]:
        """Generate a response using a Gemini model, returning text and usage."""
        self.logger.debug("Sending prompt to Gemini (length=%d, temperature=%.2f)", len(prompt), self.temperature)
        response = self.model.generate_content(
            prompt,
            generation_config={"temperature": self.temperature},
        )

        text = (response.text or "").strip()
        # Gemini responses expose usage via response.usage_metadata
        meta = getattr(response, "usage_metadata", None)
        usage = {
            "prompt_tokens": getattr(meta, "prompt_token_count", 0) or 0,
            "completion_tokens": getattr(meta, "candidates_token_count", 0) or 0,
            "total_tokens": getattr(meta, "total_token_count", 0) or 0,
        }
        self.logger.debug("Received completion (chars=%d) usage=%s", len(text), usage)
        return text, usage
