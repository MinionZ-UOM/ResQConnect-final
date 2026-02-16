from langgraph.graph import StateGraph, END
from .state import WorkflowState
from .nodes import parse_request, caption_image, extract_metadata, validate_metadata

def build_graph():
    g = StateGraph(WorkflowState)
    g.add_node("parse_request", parse_request)
    g.add_node("caption_image", caption_image)
    g.add_node("extract_metadata", extract_metadata)
    g.add_node("validate_metadata", validate_metadata)
    g.set_entry_point("parse_request")
    g.add_edge("parse_request", "caption_image")
    g.add_edge("caption_image", "extract_metadata")
    g.add_edge("extract_metadata", "validate_metadata")
    g.add_edge("validate_metadata", END)
    return g.compile()
