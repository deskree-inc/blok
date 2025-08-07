from core.blok_service import BlokService
from core.types.context import Context
from core.types.blok_response import BlokResponse
from core.types.global_error import GlobalError
from typing import Any, Dict
import traceback

from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image # type: ignore
import base64
import io
import torch # type: ignore

import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

class GenerateCaption(BlokService):
    def __init__(self):
        super().__init__()
        self.input_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Generated schema for Root",
            "type": "object",
            "properties": { 
                "image_base64": { "type": "string" }
            },
            "required": [ "image_base64" ],
        }
        self.output_schema = {}

        # Load BLIP model
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        self.model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
        self.model.to(self.device)

    def decode_base64_image(self, base64_str: str) -> Image.Image:
        header, encoded = base64_str.split(",", 1)
        image_data = base64.b64decode(encoded)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        return image

    async def handle(self, ctx: Context, inputs: Dict[str, Any]) -> BlokResponse:
        response = BlokResponse()

        try:
            base64_image = inputs.get("image_base64")
            if not base64_image:
                raise ValueError("Missing 'image_base64' in inputs.")

            image = self.decode_base64_image(base64_image)
            inputs_blip = self.processor(image, return_tensors="pt").to(self.device)

            with torch.no_grad():
                out = self.model.generate(**inputs_blip)
                caption = self.processor.decode(out[0], skip_special_tokens=True)

            response.setSuccess({
                "description": caption
            })

        except Exception as error:
            err = GlobalError(error)
            err.setCode(500)
            err.setName(self.name)
            err.setStack(traceback.format_exc())
            response.success = False
            response.setError(err)

        return response
