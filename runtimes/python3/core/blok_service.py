"""
BlokService module - Core service class for Blok framework nodes.

Migrated from NanoService to maintain 100% backward compatibility
while using Blok naming convention.
"""

import logging
import time
from abc import abstractmethod
from copy import deepcopy
from typing import Any, Dict, List, Union

from jsonschema import Draft7Validator, ValidationError  # type: ignore

from core.node_base import NodeBase
from core.types.blok_response import BlokResponse
from core.types.context import Context
from core.types.response import ResponseContext


class BlokService(NodeBase):
    """
    BlokService - Migrated from NanoService.
    
    Maintains 100% backward compatibility while using Blok naming convention.
    """

    def __init__(self):
        NodeBase.__init__(self)
        self.input_schema: Any = {}
        self.output_schema: Any = {}
        self.validator = Draft7Validator(self.input_schema)

    def set_schemas(self, input_schema: Any, output_schema: Any) -> None:
        """Set input and output schemas for validation."""
        self.input_schema = input_schema
        self.output_schema = output_schema
        self.validator = Draft7Validator(self.input_schema)

    def get_schemas(self) -> Dict[str, Any]:
        """Get current input and output schemas."""
        return {
            'input': self.input_schema,
            'output': self.output_schema,
        }

    async def run(self, ctx: Context) -> ResponseContext:
        """
        Main execution method - maintains exact same logic as NanoService
        """
        response: ResponseContext = ResponseContext()
        response.success = True
        response.data = {}
        response.error = None

        start = time.time()
        logging.info("Running node: %s [%s]", self.name, ctx.config)

        config = deepcopy(ctx.config)
        data = ctx.response.get('data') or ctx.request.get('body')

        config = self.blueprintMapper(config, ctx, data)
        self.validate(config, self.input_schema)

        # Process node custom logic
        result = await self.handle(ctx, config)
        Draft7Validator(self.output_schema).validate(result)
        end = time.time()

        execution_time = (end - start) * 1000
        logging.info("Executed node: %s in %.2fms", self.name, execution_time)

        if result.error is not None:
            response.error = result.error.to_dict()
            response.success = False
        else:
            response.data = result.data

        return response

    def validate(self, obj: Dict[str, Any], schema: Any) -> None:
        """Validate object against JSON schema"""
        try:
            validator = Draft7Validator(schema)
            validator.validate(obj)
        except ValidationError as e:
            errors: List[str] = []
            for error in sorted(Draft7Validator(schema).iter_errors(obj), key=str):
                errors.append(f"{error.path} {error.message}")

            raise ValidationError(", ".join(errors)) from e

    @abstractmethod
    async def handle(
        self,
        ctx: 'Context',
        inputs: Dict[str, Any]
    ) -> Union[BlokResponse, List['BlokService[Dict[str, Any]]']]:
        """Abstract method that must be implemented by concrete node classes."""
