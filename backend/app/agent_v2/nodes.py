from .models import LLMClient, VLMClient
from .utils import fetch_image_as_b64, log
from .config import load_prompt, CONFIG
from .state import WorkflowState

def parse_request(state: WorkflowState) -> WorkflowState:
    text = state.get("request_text", "").strip()
    if not text:
        state.setdefault("errors", {})["request_text"] = "Missing text"
    if state.get("image_url") and not state.get("image_b64"):
        state["image_b64"] = fetch_image_as_b64(state["image_url"])
    log("Parsed request.")
    return state

def caption_image(state: WorkflowState) -> WorkflowState:
    image_url, image_b64 = state.get("image_url"), state.get("image_b64")
    if not (image_url or image_b64):
        state["image_caption"] = None
        return state
    caption = VLMClient().caption_image(load_prompt("caption_image"), image_url=image_url, image_b64=image_b64)
    state["image_caption"] = caption
    log(f"Caption: {caption}")
    return state

def extract_metadata(state: WorkflowState) -> WorkflowState:
    text = state.get("request_text", "")
    caption = state.get("image_caption", "")
    prompt = f"{load_prompt('extract_metadata')}\n\nUser Request:\n{text}\n\nImage Caption:\n{caption}"
    meta = LLMClient().structured_json(prompt)
    state["extracted_metadata"] = meta
    log(f"Extracted metadata: {meta}")
    return state

def validate_metadata(state: WorkflowState) -> WorkflowState:
    meta = state.get("extracted_metadata", {})
    if not isinstance(meta, dict):
        state.setdefault("errors", {})["metadata"] = "Invalid metadata"
    state["normalized_metadata"] = meta
    log("Validated metadata.")
    return state
