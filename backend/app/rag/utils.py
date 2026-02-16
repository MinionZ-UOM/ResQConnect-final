import json
from .metadata import ALLOWED_VALUES
from typing import TypedDict, List, Dict, Any, Optional
from pathlib import Path
from typing import Any, Dict, Optional
from langchain_tavily import TavilySearch
import os

# Define a function to load data from JSON files
def load_data_from_json(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    docs = []
    metadatas = []

    for entry in data:
        # Extract the chunk and metadata
        docs.append(entry["chunk"])
        metadatas.append(entry["metadata"])

    return docs, metadatas


def get_collection_and_filter(metadata: Optional[Dict[str, str]]) -> tuple[str, Dict[str, Any]]:

    disaster_type = (metadata or {}).get("disaster_type")
    if disaster_type not in ALLOWED_VALUES["disaster_type"]:
        disaster_type = "flood"

    if not metadata:
        return disaster_type, {}

    conditions = []
    for field in ("doc_type", "agency", "language"):
        val = metadata.get(field)
        if val and val in ALLOWED_VALUES[field] and val != "Null":
            conditions.append({field: {"$eq": val}})

    if len(conditions) > 1:
        metadata_filter = {"$and": conditions}
    elif len(conditions) == 1:
        metadata_filter = conditions[0]
    else:
        metadata_filter = {}

    return disaster_type, metadata_filter


def create_search_tool(api_key: str | None = None):
    """
    Create a TavilySearch tool with a dynamically provided API key.
    Falls back to environment variable if not explicitly passed.
    """
    key = api_key or os.getenv("TAVILY_API_KEY", "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")
    if not key:
        raise ValueError("Tavily API key must be provided either directly or via environment variable.")
    return TavilySearch(tavily_api_key=key)


try:
    import yaml  # type: ignore
except Exception as e:
    raise RuntimeError(
        "PyYAML is required to load prompts.yaml. Install with `pip install pyyaml`."
    ) from e

_PROMPTS_CACHE: Optional[Dict[str, str]] = None

def load_prompts(path: Optional[str | Path] = None) -> Dict[str, str]:
    """
    Load prompts.yaml once and cache it. Default path is next to this file.
    """
    global _PROMPTS_CACHE
    if _PROMPTS_CACHE is not None:
        return _PROMPTS_CACHE

    if path is None:
        path = Path(__file__).with_name("prompts.yaml")

    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}

    if not isinstance(data, dict):
        raise ValueError("prompts.yaml must be a mapping of {name: template}.")

    # Ensure all values are strings
    for k, v in data.items():
        if not isinstance(v, str):
            raise ValueError(f"Prompt '{k}' must be a string template.")
    _PROMPTS_CACHE = data
    return _PROMPTS_CACHE

def get_prompt(name: str) -> str:
    prompts = load_prompts()
    try:
        return prompts[name]
    except KeyError as e:
        raise KeyError(f"Prompt '{name}' not found in prompts.yaml.") from e

def render_prompt(name: str, **vars: Any) -> str:
    """
    Render a prompt by name using Python str.format(**vars).
    """
    template = get_prompt(name)
    try:
        return template.format(**vars)
    except KeyError as e:
        missing = e.args[0]
        raise KeyError(f"Missing variable '{missing}' rendering prompt '{name}'.") from e

