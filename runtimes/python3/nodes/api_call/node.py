from core.blok_service import BlokService
from core.types.context import Context
from core.types.blok_response import BlokResponse
from core.types.global_error import GlobalError
from typing import Any, Dict
import aiohttp # type: ignore
import traceback

class ApiCall(BlokService):
    def __init__(self):
        BlokService.__init__(self)
        self.input_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Generated schema for Root",
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                },
                "method": {
                    "type": "string",
                },
                "body": {
                    "type": "object",
                    "properties": {},
                },
                "headers": {
                    "type": "object",
                    "properties": {},
                },
                "responseType": {
                    "type": "string",
                },
            },
            "required": ["url", "method"],
        }
        self.output_schema = {}

    async def handle(self, ctx: Context, inputs: Dict[str, Any]) -> BlokResponse:

        response = BlokResponse()

        try:
            method = inputs.get('method', 'GET')
            url = inputs.get('url', '')
            headers = inputs.get('headers', {})
            responseType = inputs.get('responseType', 'application/json')
            body = inputs.get('body', None)
            if body is None:
                if ctx.response is not None:
                    body = ctx.response.get('data', {})

            async with aiohttp.ClientSession() as session:
                if method == "GET" or method == "DELETE":
                    async with session.get(url, headers=headers) as resp:
                        if responseType == "application/json":
                            if resp.status != 200:
                                throw_error = await resp.text()
                                raise Exception(throw_error)
                            
                            result = await resp.json()
                        else:
                            result = await resp.text()
                        response.setSuccess(result)
                else:
                    async with session.request(method, url, headers=headers, json=body) as resp:
                        if responseType == "application/json":
                            if resp.status != 200:
                                throw_error = await resp.text()
                                raise Exception(throw_error)
                            
                            result = await resp.json()
                        else:
                            result = await resp.text()
                        response.setSuccess(result)
        except Exception as error:
            err = GlobalError(error)
            err.setCode(500)
            err.setName(self.name)

            stack_trace = traceback.format_exc()
            err.setStack(stack_trace)
            response.success = False
            response.setError(err)

        return response