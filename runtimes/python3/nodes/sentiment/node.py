from core.blok_service import BlokService
from core.types.context import Context
from core.types.blok_response import BlokResponse
from core.types.global_error import GlobalError
from typing import Any, Dict
import traceback
from textblob import TextBlob # type: ignore

class Sentiment(BlokService):
    def __init__(self):
        BlokService.__init__(self)
        self.input_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Generated schema for Root",
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                },
                "title": {
                    "type": "string",
                },
                "comment": {
                    "type": "string",
                },
                "sentiment": {
                    "type": "string"
                },
                "createdAt": {
                    "type": "string",
                },
            },
            "required": ["id", "title", "comment", "sentiment", "createdAt"],
        }
        self.output_schema = {}

    async def handle(self, ctx: Context, inputs: Dict[str, Any]) -> BlokResponse:

        response = BlokResponse()

        try:
            feedback = {
                "id": inputs["id"],
                "title": inputs["title"],
                "comment": inputs["comment"],
                "sentiment": inputs["sentiment"],
                "createdAt": inputs["createdAt"],
            }

            analysis = TextBlob(feedback["title"] + ": " + feedback["comment"])
            polarity = analysis.sentiment.polarity

            feedback["sentiment"] = ""
            if polarity > 0:
                feedback["sentiment"] = "+"
            elif polarity < 0:
                feedback["sentiment"] = "-"

            response.setSuccess(feedback)
        except Exception as error:
            err = GlobalError(error)
            err.setCode(500)
            err.setName(self.name)

            stack_trace = traceback.format_exc()
            err.setStack(stack_trace)
            response.success = False
            response.setError(err)

        return response
