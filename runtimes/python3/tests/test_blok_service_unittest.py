import unittest
import asyncio
from core.blok_service import BlokService
from core.types.blok_response import BlokResponse
from core.types.context import Context
from core.types.global_error import GlobalError

class TestBlokService(unittest.TestCase):
    """
    TEST SUITE: BlokService migration from NanoService
    Following TDD RED-GREEN-REFACTOR cycle using unittest framework
    """
    
    def test_blok_service_class_exists_and_is_abstract(self):
        """Test that BlokService class exists and is properly abstract"""
        # BlokService should exist but be abstract
        self.assertIsNotNone(BlokService)
        
        # Should not be able to instantiate directly (abstract)
        with self.assertRaises(TypeError):
            BlokService()
    
    def test_concrete_blok_service_inherits_from_node_base(self):
        """Test that concrete BlokService must inherit from NodeBase"""
        from core.node_base import NodeBase
        
        class ConcreteBlokService(BlokService):
            async def handle(self, ctx, inputs):
                return BlokResponse()
        
        service = ConcreteBlokService()
        self.assertIsInstance(service, NodeBase)
        self.assertIsInstance(service, BlokService)
    
    def test_concrete_blok_service_has_required_attributes(self):
        """Test that concrete BlokService has required attributes"""
        class ConcreteBlokService(BlokService):
            async def handle(self, ctx, inputs):
                return BlokResponse()
        
        service = ConcreteBlokService()
        self.assertTrue(hasattr(service, 'input_schema'))
        self.assertTrue(hasattr(service, 'output_schema'))
        self.assertTrue(hasattr(service, 'validator'))
    
    def test_concrete_blok_service_set_schemas_method(self):
        """Test that concrete BlokService has setSchemas method"""
        class ConcreteBlokService(BlokService):
            async def handle(self, ctx, inputs):
                return BlokResponse()
        
        service = ConcreteBlokService()
        input_schema = {"type": "object", "properties": {"test": {"type": "string"}}}
        output_schema = {"type": "object", "properties": {"result": {"type": "string"}}}
        
        service.setSchemas(input_schema, output_schema)
        self.assertEqual(service.input_schema, input_schema)
        self.assertEqual(service.output_schema, output_schema)
    
    def test_concrete_blok_service_get_schemas_method(self):
        """Test that concrete BlokService has getSchemas method"""
        class ConcreteBlokService(BlokService):
            async def handle(self, ctx, inputs):
                return BlokResponse()
        
        service = ConcreteBlokService()
        input_schema = {"type": "object"}
        output_schema = {"type": "object"}
        
        service.setSchemas(input_schema, output_schema)
        schemas = service.getSchemas()
        
        self.assertIn('input', schemas)
        self.assertIn('output', schemas)
        self.assertEqual(schemas['input'], input_schema)
        self.assertEqual(schemas['output'], output_schema)
    
    def test_concrete_blok_service_validate_method(self):
        """Test that concrete BlokService has validate method"""
        class ConcreteBlokService(BlokService):
            async def handle(self, ctx, inputs):
                return BlokResponse()
        
        service = ConcreteBlokService()
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"}
            },
            "required": ["name"]
        }
        
        # Valid data should not raise exception
        valid_data = {"name": "test"}
        try:
            service.validate(valid_data, schema)
        except Exception:
            self.fail("validate() raised exception with valid data")
        
        # Invalid data should raise ValidationError
        invalid_data = {"name": 123}  # Wrong type
        with self.assertRaises(Exception):
            service.validate(invalid_data, schema)
    
    def test_concrete_blok_service_run_method_exists(self):
        """Test that concrete BlokService has async run method"""
        
        class TestConcreteBlokService(BlokService):
            async def handle(self, ctx, inputs):
                return BlokResponse()
        
        service = TestConcreteBlokService()
        ctx = Context()
        ctx.config = {}
        ctx.response = {}
        ctx.request = {"body": {}}
        
        # Run async test
        async def run_test():
            result = await service.run(ctx)
            self.assertIsNotNone(result)
            self.assertTrue(hasattr(result, 'success'))
            self.assertTrue(hasattr(result, 'data'))
            self.assertTrue(hasattr(result, 'error'))
        
        asyncio.run(run_test())
    
    def test_blok_service_handle_method_is_abstract(self):
        """Test that BlokService handle method is abstract"""
        # BlokService should have handle method but be abstract
        self.assertTrue(hasattr(BlokService, 'handle'))
        
        # Direct instantiation should fail due to abstract method
        with self.assertRaises(TypeError):
            BlokService()

if __name__ == '__main__':
    unittest.main()
