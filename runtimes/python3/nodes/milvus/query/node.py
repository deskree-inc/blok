from core.blok_service import BlokService
from core.types.context import Context
from core.types.blok_response import BlokResponse
from core.types.global_error import GlobalError
from typing import Any, Dict
import traceback
from pymilvus import connections, Collection  # type: ignore

class SearchInMilvus(BlokService):
    def __init__(self):
        super().__init__()
        self.input_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Generated schema for Root",
            "type": "object",
            "properties": {
                "text_vector": {"type": "array", "optional": True},
                "image_vector": {"type": "array", "optional": True},
                "top_k": {"type": "integer", "optional": True}
            },
            "required": [],
        }
        self.output_schema = {}

        connections.connect(alias="default", host="localhost", port="19530")
        self.collection = Collection("multimodal_index")
        self.collection.load()

    async def handle(self, ctx: Context, inputs: Dict[str, Any]) -> BlokResponse:
        response = BlokResponse()

        try:
            text_vector = inputs.get("text_vector")
            image_vector = inputs.get("image_vector")
            top_k = inputs.get("top_k", 5)

            if not text_vector and not image_vector:
                raise ValueError("At least 'text_vector' or 'image_vector' must be provided.")

            combined_results = []

            if text_vector:
                res_text = self.collection.search(
                    data=[text_vector],
                    anns_field="text_vector",
                    param={"metric_type": "COSINE", "params": {"nprobe": 10}},
                    limit=top_k,
                    output_fields=["description", "image_url"]
                )
                res_img = self.collection.search(
                    data=[text_vector],
                    anns_field="image_vector",
                    param={"metric_type": "COSINE", "params": {"nprobe": 10}},
                    limit=top_k,
                    output_fields=["description", "image_url"]
                )

                combined_results = self._merge_results(res_text[0], res_img[0], top_k)

            elif image_vector:
                res_img = self.collection.search(
                    data=[image_vector],
                    anns_field="image_vector",
                    param={"metric_type": "COSINE", "params": {"nprobe": 10}},
                    limit=top_k,
                    output_fields=["description", "image_url"]
                )
                combined_results = res_img[0]

            formatted = [
                {
                    "description": hit.entity.get("description"),
                    "image_url": hit.entity.get("image_url"),
                    "score": float(hit.distance)
                }
                for hit in combined_results
            ]

            response.setSuccess({"results": formatted})

        except Exception as error:
            err = GlobalError(error)
            err.setCode(500)
            err.setName(self.name)
            err.setStack(traceback.format_exc())
            response.success = False
            response.setError(err)

        return response

    def _merge_results(self, r1, r2, top_k):
        merged = {}
        for hit in r1 + r2:
            id_ = hit.id
            if id_ not in merged:
                merged[id_] = {
                    "entity": hit.entity,
                    "score_sum": float(hit.distance),
                    "count": 1
                }
            else:
                merged[id_]["score_sum"] += float(hit.distance)
                merged[id_]["count"] += 1

        sorted_hits = sorted(
            merged.values(),
            key=lambda x: x["score_sum"] / x["count"]
        )

        class FakeHit:
            def __init__(self, entity, score):
                self.entity = entity
                self.distance = score

        return [FakeHit(m["entity"], m["score_sum"] / m["count"]) for m in sorted_hits[:top_k]]
