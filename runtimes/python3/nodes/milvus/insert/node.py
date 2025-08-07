from core.blok_service import BlokService
from core.types.context import Context
from core.types.blok_response import BlokResponse
from core.types.global_error import GlobalError
from typing import Any, Dict
import traceback

from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType # type: ignore
from pymilvus import list_collections # type: ignore

class StoreInMilvus(BlokService):
    def __init__(self):
        super().__init__()
        self.input_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Generated schema for Root",
            "type": "object",
            "properties":{
                "description": {"type": "string"},
                "image_url": {"type": "string"},
                "text_vector": {"type": "array"},
                "image_vector": {"type": "array"}
            },
            "required": ["description", "image_url", "text_vector", "image_vector"],
        }
        self.output_schema = {}

        connections.connect(alias="default", host="localhost", port="19530")
        self.collection_name = "multimodal_index"
        self.ensure_collection_exists()

    def ensure_collection_exists(self):
        if self.collection_name in list_collections():
            return

        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=512),
            FieldSchema(name="image_url", dtype=DataType.VARCHAR, max_length=512),
            FieldSchema(name="text_vector", dtype=DataType.FLOAT_VECTOR, dim=512),
            FieldSchema(name="image_vector", dtype=DataType.FLOAT_VECTOR, dim=512),
        ]
        schema = CollectionSchema(fields, description="Multi-modal embedding index")
        collection = Collection(name=self.collection_name, schema=schema)
        collection.create_index(field_name="text_vector", index_params={"metric_type": "COSINE", "index_type": "IVF_FLAT", "params": {"nlist": 1024}})
        collection.create_index(field_name="image_vector", index_params={"metric_type": "COSINE", "index_type": "IVF_FLAT", "params": {"nlist": 1024}})
        collection.load()

    async def handle(self, ctx: Context, inputs: Dict[str, Any]) -> BlokResponse:
        response = BlokResponse()

        try:
            description = inputs["description"]
            image_url = inputs["image_url"]
            text_vector = inputs["text_vector"]
            image_vector = inputs["image_vector"]

            collection = Collection(self.collection_name)
            collection.insert([
                [description],
                [image_url],
                [text_vector],
                [image_vector]
            ])

            response.setSuccess({"inserted": True})

        except Exception as error:
            err = GlobalError(error)
            err.setCode(500)
            err.setName(self.name)
            err.setStack(traceback.format_exc())
            response.success = False
            response.setError(err)

        return response
