import os, yaml
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class ModelSettings(BaseModel):
    text_model: str = os.getenv("OPENAI_TEXT_MODEL", "gpt-4o-mini")
    vision_model: str = os.getenv("OPENAI_VISION_MODEL", "gpt-4o-mini")

class MetadataField(BaseModel):
    name: str
    type: Literal["string", "integer", "number", "boolean", "enum"]
    description: str
    enum: Optional[List[str]] = None
    required: bool = False

class ExtractionConfig(BaseModel):
    fields: List[MetadataField] = Field(default_factory=lambda: [
        MetadataField(name="disaster_type", type="enum",
                      enum=["flood", "landslide", "other"],
                      description="Type of disaster", required=True),
        MetadataField(name="urgency", type="enum",
                      enum=["low", "medium", "high", "critical"],
                      description="Urgency of the request", required=True),
        MetadataField(name="affected_people", type="integer",
                      description="Number of affected people"),
        MetadataField(name="location", type="string",
                      description="Location mentioned in the request"),
    ])

def load_prompt(name: str) -> str:
    with open(os.path.join(os.path.dirname(__file__), "prompts", f"{name}.yaml"), "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
        return data.get("prompt", "")

class AppConfig(BaseModel):
    openai_api_key: str = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY", "").strip())
    models: ModelSettings = ModelSettings()
    extraction: ExtractionConfig = ExtractionConfig()

CONFIG = AppConfig()
