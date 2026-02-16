from typing import TypedDict, Optional, Dict, Any

class WorkflowState(TypedDict, total=False):
    request_text: str
    image_url: Optional[str]
    image_b64: Optional[str]
    image_caption: Optional[str]
    extracted_metadata: Dict[str, Any]
    normalized_metadata: Dict[str, Any]
    errors: Dict[str, str]
