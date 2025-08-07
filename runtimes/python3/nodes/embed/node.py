from core.blok_service import BlokService
from core.types.context import Context
from core.types.blok_response import BlokResponse
from core.types.global_error import GlobalError
from typing import Any, Dict
import traceback

import torch # type: ignore
import clip # type: ignore
from PIL import Image # type: ignore
import base64
import io

class EmbeddingClip(BlokService):
    def __init__(self):
        super().__init__()
        self.input_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Generated schema for Root",
            "type": "object",
            "properties": { 
                "description": { "type": "string" },
                "image_base64": { "type": "string" }
            },
            "required": [],
        }
        self.output_schema = {}

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model, self.preprocess = clip.load("ViT-B/32", device=self.device)

    def decode_base64_image(self, data_url: str) -> Image.Image:
        header, encoded = data_url.split(",", 1)
        image_data = base64.b64decode(encoded)
        return Image.open(io.BytesIO(image_data)).convert("RGB")

    def embed_text(self, text: str):
        tokens = clip.tokenize(text).to(self.device)
        with torch.no_grad():
            return self.model.encode_text(tokens).squeeze().cpu().tolist()

    def embed_image(self, image: Image.Image):
        tensor_image = self.preprocess(image).unsqueeze(0).to(self.device)
        with torch.no_grad():
            return self.model.encode_image(tensor_image).squeeze().cpu().tolist()

    async def handle(self, ctx: Context, inputs: Dict[str, Any]) -> BlokResponse:
        response = BlokResponse()

        try:
            description = inputs.get("description", "")
            image_base64 = inputs.get("image_base64", "")

            text_vector = self.embed_text(description)

            model = {
                "text_vector": text_vector,
            }

            if image_base64 != "":
                image = self.decode_base64_image(image_base64)
                image_vector = self.embed_image(image)
                model["image_vector"] = image_vector
            
            response.setSuccess(model)

        except Exception as error:
            err = GlobalError(error)
            err.setCode(500)
            err.setName(self.name)
            err.setStack(traceback.format_exc())
            response.success = False
            response.setError(err)

        return response
