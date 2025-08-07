import base64
from core.blok_service import BlokService
from core.types.context import Context
from core.types.blok_response import BlokResponse
from core.types.global_error import GlobalError
from typing import Any, Dict
import traceback
from fpdf import FPDF # type: ignore

class GeneratePDF(BlokService):
    def __init__(self):
        BlokService.__init__(self)
        self.input_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Generated schema for Root",
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "sales_data": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "product": {"type": "string"},
                            "quantity": {"type": "number"},
                            "price": {"type": "number"},
                            "total": {"type": "number"}
                        },
                        "required": ["product", "quantity", "price", "total"]
                    }
                }
            },
            "required": ["title", "sales_data"]
        }
        self.output_schema = {}
        self.contentType = "application/pdf"

    async def handle(self, ctx: Context, inputs: Dict[str, Any]) -> BlokResponse:

        response = BlokResponse()

        try:
            title = inputs["title"]
            sales_data = inputs["sales_data"]
            pdf = FPDF()
            pdf.set_auto_page_break(auto=True, margin=15)
            pdf.add_page()
            pdf.set_font("Arial", "B", 16)
            pdf.cell(200, 10, title, ln=True, align="C")
            
            # Table Headers
            pdf.set_font("Arial", "B", 12)
            pdf.cell(50, 10, "Product", 1)
            pdf.cell(30, 10, "Quantity", 1)
            pdf.cell(30, 10, "Price", 1)
            pdf.cell(30, 10, "Total", 1)
            pdf.ln()

            # Table Data
            pdf.set_font("Arial", "", 12)
            for item in sales_data:
                pdf.cell(50, 10, item["product"], 1)
                pdf.cell(30, 10, str(item["quantity"]), 1)
                pdf.cell(30, 10, f"${item['price']:.2f}", 1)
                pdf.cell(30, 10, f"${item['total']:.2f}", 1)
                pdf.ln()

            # Save PDF File
            file_path = "sales_report.pdf"
            pdf.output(file_path)

            # Read PDF File
            with open(file_path, "rb") as file:
                pdf_data = file.read()

            # Transformation to Base64
            pdf_data = base64.b64encode(pdf_data).decode("utf-8")

            # Return File URL
            response.setSuccess({ "pdf_base64": pdf_data })
        except Exception as error:
            err = GlobalError(error)
            err.setCode(500)
            err.setName(self.name)

            stack_trace = traceback.format_exc()
            err.setStack(stack_trace)
            response.success = False
            response.setError(err)

        return response
