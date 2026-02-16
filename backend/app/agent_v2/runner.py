from functools import lru_cache
from typing import Optional, Dict, Any

from .graph import build_graph
from app.rag.run_agentic import run_workflow as run_rag_workflow


@lru_cache(maxsize=1)
def _cached_graph_app():
    """Compile the LangGraph graph once per worker process."""
    return build_graph()


def run_workflow(
    request_text: str,
    image_url: Optional[str] = None,
    image_b64: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    1. Run VLM + metadata extraction workflow
    2. Combine extracted image caption with original request
    3. Run downstream RAG workflow using the combined query
    """

    # Run VLM/metadata extraction workflow
    app = _cached_graph_app()
    result = app.invoke({
        "request_text": request_text,
        "image_url": image_url,
        "image_b64": image_b64,
    })

    caption = result.get("image_caption", "")
    normalized_metadata = result.get("normalized_metadata", {})
    raw_metadata = result.get("extracted_metadata", {})
    errors = result.get("errors", [])

    # Combine query + image caption
    combined_query = request_text.strip()
    if caption:
        combined_query = f"{combined_query} <{caption.strip()}>"

    # Run the RAG workflow with combined query
    rag_result = run_rag_workflow(query=combined_query, metadata=metadata)

    # Merge both results
    return {
        "caption": caption,
        "metadata": normalized_metadata,
        "raw_metadata": raw_metadata,
        "rag_output": rag_result,
        "errors": errors,
    }
