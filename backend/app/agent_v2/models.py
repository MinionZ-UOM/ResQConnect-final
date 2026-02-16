from openai import OpenAI
from .config import CONFIG
import json

class LLMClient:
    def __init__(self, model_name=None):
        self.model_name = model_name or CONFIG.models.text_model
        self.client = OpenAI(api_key=CONFIG.openai_api_key)

    def structured_json(self, prompt: str):
        resp = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": "Extract JSON accurately."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0
        )
        return json.loads(resp.choices[0].message.content)

class VLMClient:
    def __init__(self, model_name=None):
        self.model_name = model_name or CONFIG.models.vision_model
        self.client = OpenAI(api_key=CONFIG.openai_api_key)

    def caption_image(self, prompt: str, image_url=None, image_b64=None) -> str:
        """
        Works with current OpenAI SDK (>=1.40).
        Accepts either an image URL or a base64 image string.
        """
        if not (image_url or image_b64):
            return ""

        if image_b64:
            # inline base64 format (must wrap in {"url": ...})
            image_content = {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}
            }
        else:
            # normal remote URL
            image_content = {
                "type": "image_url",
                "image_url": {"url": image_url}
            }

        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        image_content,
                    ],
                },
            ],
            temperature=0,
        )

        return response.choices[0].message.content.strip()