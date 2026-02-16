from typing import TypedDict, List, Dict, Any, Optional


ALLOWED_VALUES = {
    "disaster_type": ["flood", "landslide"],
    "doc_type": [
        "SOP", "rescue_guideline", "emergency_alert", "case_study",
        "situation_report", "News", "evacuation_plan", "Medical_protocol", "recovery_plan"
    ],
    "agency": [
        "NDMC", "WHO", "UNICEF", "IFRC", "Local_Gov",
        "Disaster_Response_Team", "Red_Cross", "UN_OCHA", "Null"
    ],
    "language": ["en", "si"],
}

def format_allowed_values(allowed_values: dict) -> str:
    """
    Convert a dictionary of allowed values into a readable string.
    Example:
    {
        "disaster_type": ["flood", "landslide"],
        "language": ["en", "si"]
    }
    ➝
    - disaster_type: 'flood', 'landslide'
    - language: 'en', 'si'
    """
    return "\n".join(
        f"- {field_name}: {', '.join(repr(value) for value in valid_options)}"
        for field_name, valid_options in allowed_values.items()
    )


def has_valid_metadata(metadata: Optional[Dict[str, str]]) -> bool:
    """
    Check whether metadata contains at least one valid and allowed value.
    Rules:
    - Must not be empty or contain the key 'raw'.
    - If 'disaster_type' exists and is allowed → valid.
    - Otherwise, check if any of 'doc_type', 'agency', or 'language'
      exist, are in the allowed values, and are not 'Null'.
    """
    if not metadata or "raw" in metadata:
        return False

    # Direct disaster_type check
    if metadata.get("disaster_type") in ALLOWED_VALUES["disaster_type"]:
        return True

    # Check fallback fields
    for field in ("doc_type", "agency", "language"):
        field_value = metadata.get(field)
        if field_value and field_value in ALLOWED_VALUES[field] and field_value != "Null":
            return True

    return False

