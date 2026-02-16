"""Service object that powers the v2 chatbot endpoints."""
from __future__ import annotations

import asyncio
import os
from time import perf_counter

from app.chatbot_v2.schemas import ChatInput, User
from app.chatbot_v2.utils import (
    build_knowledge_context,
    format_chat_history,
    RetrievalDecider,
    get_retrieval_decider,
    get_prompt,
    retrieve_knowledge,
    truncate_chat_history,
)
from app.rag.llm_utils import call_llm
from app.utils.logger import get_logger

logger = get_logger(__name__)


DEFAULT_HISTORY_LIMIT = 12


class ChatbotService:
    """High level orchestration for chatbot interactions."""

    def __init__(self, *, retrieval_decider: RetrievalDecider | None = None) -> None:
        self._system_prompt = get_prompt("system_message")
        self._response_template = get_prompt("response_template")
        self._history_limit = self._load_history_limit()
        self._retrieval_decider = retrieval_decider or get_retrieval_decider()

    async def ask(self, payload: ChatInput) -> dict:
        """Public async interface for the chatbot."""
        user = payload.user
        prompt_text = payload.prompt.strip()
        raw_history = payload.chat_history
        chat_history = truncate_chat_history(raw_history, self._history_limit)
        if len(raw_history) != len(chat_history):
            logger.debug(
                "Truncated chat history from %d to %d messages for user=%s",
                len(raw_history),
                len(chat_history),
                user.id,
            )

        request_start = perf_counter()
        logger.info(
            "Generating chatbot response for user: %s (prompt_length=%d, history_items=%d)",
            user.id,
            len(prompt_text),
            len(chat_history),
        )
        logger.debug("Prompt: %s", prompt_text)

        history_text = format_chat_history(chat_history)
        should_use_retrieval = self._retrieval_decider.should_use_retrieval(
            prompt_text, chat_history
        )

        docs: list[dict[str, str]] = []
        rag_answer = ""
        knowledge_context = (
            "Knowledge retrieval was skipped because this exchange was conversational "
            "and did not require external references."
        )

        if should_use_retrieval:
            retrieval_start = perf_counter()
            docs, rag_answer = await asyncio.to_thread(retrieve_knowledge, prompt_text)
            retrieval_elapsed = perf_counter() - retrieval_start
            logger.info(
                "Chatbot knowledge retrieval finished in %.2fs for user=%s (documents=%d)",
                retrieval_elapsed,
                user.id,
                len(docs),
            )
            knowledge_context = build_knowledge_context(docs)
            if rag_answer:
                rag_answer = rag_answer.strip()
                if knowledge_context and not knowledge_context.startswith(
                    "No relevant knowledge"
                ):
                    knowledge_context = (
                        f"{knowledge_context}\n\nStandard RAG summary:\n{rag_answer}"
                    )
                else:
                    knowledge_context = f"Standard RAG summary:\n{rag_answer}"
        else:
            logger.info(
                "Skipping knowledge retrieval for user=%s; prompt classified as conversational",
                user.id,
            )

        rendered_prompt = self._render_prompt(
            user=user,
            prompt=prompt_text,
            history_text=history_text,
            knowledge_context=knowledge_context,
        )

        logger.debug("Rendered prompt for model: %s", rendered_prompt)

        llm_start = perf_counter()
        response_text = await asyncio.to_thread(call_llm, rendered_prompt)
        llm_elapsed = perf_counter() - llm_start

        total_elapsed = perf_counter() - request_start
        logger.info(
            "Chatbot response generated in %.2fs (llm_time=%.2fs, user=%s)",
            total_elapsed,
            llm_elapsed,
            user.id,
        )

        logger.debug("Chatbot response: %s", response_text)

        return {
            "response": response_text,
        }

    def _render_prompt(
        self,
        *,
        user: User,
        prompt: str,
        history_text: str,
        knowledge_context: str,
    ) -> str:
        location = f"lat {user.location.latitude}, lon {user.location.longitude}"
        template_variables = {
            "system_message": self._system_prompt,
            "user_name": user.name,
            "user_role": user.role,
            "user_location": location,
            "chat_history": history_text,
            "knowledge_context": knowledge_context,
            "user_prompt": prompt,
        }
        try:
            return self._response_template.format(**template_variables)
        except KeyError as exc:
            missing = exc.args[0]
            raise KeyError(f"Missing template variable '{missing}' in chatbot response prompt")

    def _load_history_limit(self) -> int:
        """Read the configurable history limit from the environment."""

        raw_limit = os.getenv("CHATBOT_V2_HISTORY_LIMIT")
        if not raw_limit:
            return DEFAULT_HISTORY_LIMIT

        try:
            limit = int(raw_limit)
        except ValueError:
            logger.warning(
                "Invalid CHATBOT_V2_HISTORY_LIMIT=%s; falling back to default=%d",
                raw_limit,
                DEFAULT_HISTORY_LIMIT,
            )
            return DEFAULT_HISTORY_LIMIT

        if limit < 0:
            logger.warning(
                "CHATBOT_V2_HISTORY_LIMIT must be non-negative; using default=%d",
                DEFAULT_HISTORY_LIMIT,
            )
            return DEFAULT_HISTORY_LIMIT

        return limit
