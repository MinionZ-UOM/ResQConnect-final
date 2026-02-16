"""Base class for all LLM providers."""

from abc import ABC, abstractmethod
from typing import Dict, Tuple


class BaseProvider(ABC):
    """Abstract provider defining the generate interface.

    Implementations must return both the generated text and a usage metrics dict.
    """

    def __init__(self, temperature: float = 0.7) -> None:
        self.temperature = temperature

    @abstractmethod
    def generate(self, prompt: str) -> Tuple[str, Dict[str, int]]:
        """Return (text, usage) for the given prompt.

        The usage dict should include available fields such as:
        - prompt_tokens
        - completion_tokens
        - total_tokens
        Missing fields can be set to 0 or omitted.
        """
        raise NotImplementedError

    def invoke(self, prompt: str) -> Tuple[str, Dict[str, int]]:
        """
        Optional helper for providers that return both text and token usage.

        Subclasses can override this if they want to expose usage details.
        """
        text = self.generate(prompt)
        usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
        return text, usage