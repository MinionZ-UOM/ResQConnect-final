from __future__ import annotations

from time import perf_counter

from fastapi import APIRouter

from app.chatbot_v2 import ChatbotService
from app.chatbot_v2.schemas import ChatInput
from app.utils.logger import get_logger

router = APIRouter(prefix="/chatbot", tags=["chatbot"])
_service = ChatbotService()
logger = get_logger(__name__)


@router.post("/ask")
async def ask(body: ChatInput):
    """Generate a chatbot response for the provided prompt."""
    start_time = perf_counter()
    prompt_length = len(body.prompt.strip())
    history_items = len(body.chat_history)
    logger.info(
        "Chatbot API request received (user=%s, prompt_length=%d, history_items=%d)",
        body.user.id,
        prompt_length,
        history_items,
    )
    response = await _service.ask(body)
    elapsed = perf_counter() - start_time
    logger.info(
        "Chatbot API request completed in %.2fs (user=%s)",
        elapsed,
        body.user.id,
    )
    return response


