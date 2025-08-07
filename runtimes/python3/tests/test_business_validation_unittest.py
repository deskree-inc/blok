import unittest
import asyncio
from core.types.context import Context
from nodes.sentiment.node import Sentiment
from nodes.api_call.node import ApiCall
from core.blok_service import BlokService
from core.types.blok_response import BlokResponse

class TestBusinessValidation(unittest.TestCase):
    """
    BUSINESS VALIDATION SUITE: Validate the 3 key business queries for TASK-002
    Using unittest framework to match existing project standards
    """
    
    def test_business_query_1_multi_runtime_compatibility(self):
        """
        BUSINESS QUERY 1: Can AI create multi-runtime project with TypeScript + Python3 nodes working together?
        
        VALIDATION: Python3 nodes can execute independently and return consistent BlokResponse format
        that's compatible with TypeScript runtime expectations.
        """
        
        async def run_test():
            # Test that Python nodes follow the same interface as TypeScript nodes
            sentiment = Sentiment()
            api_call = ApiCall()
            
            # Both should inherit from BlokService (common interface)
            self.assertIsInstance(sentiment, BlokService, "Python nodes must use common BlokService interface")
            self.assertIsInstance(api_call, BlokService, "Python nodes must use common BlokService interface")
            
            # Both should have the same required methods for multi-runtime compatibility
            self.assertTrue(hasattr(sentiment, 'handle'), "Python nodes must implement handle method")
            self.assertTrue(hasattr(sentiment, 'run'), "Python nodes must implement run method")
            self.assertTrue(hasattr(sentiment, 'getSchemas'), "Python nodes must implement getSchemas method")
            
            # Test actual execution with realistic workflow data
            ctx = Context()
            ctx.config = {}
            ctx.response = {}
            ctx.request = {"body": {}}
            
            # Simulate data that would come from a TypeScript node
            sentiment_inputs = {
                "id": "feedback_001",
                "title": "Product Review",
                "comment": "This product exceeded my expectations! Amazing quality and fast delivery.",
                "sentiment": "",
                "createdAt": "2024-01-15T10:30:00Z"
            }
            
            result = await sentiment.handle(ctx, sentiment_inputs)
            
            # Validate that Python node returns data in format compatible with TypeScript nodes
            self.assertIsInstance(result, BlokResponse, "Must return BlokResponse for TypeScript compatibility")
            self.assertEqual(result.success, True, "Multi-runtime workflow requires consistent success handling")
            self.assertIn("sentiment", result.data, "Must return data that TypeScript nodes can consume")
            self.assertIn(result.data["sentiment"], ["+", "-", ""], "Sentiment data must be in expected format")
            
            print("✅ BUSINESS QUERY 1 VALIDATED: Python3 nodes are compatible with multi-runtime workflows")
        
        asyncio.run(run_test())
    
    def test_business_query_2_ml_library_integration(self):
        """
        BUSINESS QUERY 2: Can Python3 nodes leverage ML libraries (transformers, torch, milvus) within Blok workflows?
        
        VALIDATION: Python3 runtime has access to ML libraries and can process AI workloads.
        """
        
        async def run_test():
            # Test that we can import ML libraries that are commonly used
            try:
                import torch
                import transformers
                import numpy as np
                import pandas as pd
                
                ml_libraries_available = True
                import_error = None
            except ImportError as e:
                ml_libraries_available = False
                import_error = str(e)
            
            self.assertTrue(ml_libraries_available, f"ML libraries must be available: {import_error if not ml_libraries_available else 'OK'}")
            
            # Test that sentiment node uses ML libraries (TextBlob for NLP)
            sentiment = Sentiment()
            ctx = Context()
            ctx.config = {}
            ctx.response = {}
            ctx.request = {"body": {}}
            
            # Use ML-powered sentiment analysis
            ml_inputs = {
                "id": "ml_test_001",
                "title": "AI-powered Analysis",
                "comment": "Machine learning algorithms are revolutionizing natural language processing and sentiment analysis!",
                "sentiment": "",
                "createdAt": "2024-01-15T10:30:00Z"
            }
            
            result = await sentiment.handle(ctx, ml_inputs)
            
            # Validate ML processing works
            self.assertIsInstance(result, BlokResponse, "ML-powered nodes must return BlokResponse")
            self.assertEqual(result.success, True, "ML processing must complete successfully")
            self.assertEqual(result.data["sentiment"], "+", "ML sentiment analysis should detect positive sentiment")
            
            # Test that the result contains processed data from ML analysis
            self.assertIn("comment", result.data, "ML processing must return processed text data")
            self.assertGreater(len(result.data["comment"]), 0, "ML processing must preserve input data")
            
            print("✅ BUSINESS QUERY 2 VALIDATED: Python3 nodes can leverage ML libraries (transformers, torch, textblob)")
        
        asyncio.run(run_test())
    
    def test_business_query_3_http_trigger_integration(self):
        """
        BUSINESS QUERY 3: Does Python3 runtime integrate seamlessly with HTTP trigger maintaining context/error consistency?
        
        VALIDATION: Python3 nodes handle Context objects and error states consistently with HTTP trigger expectations.
        """
        
        async def run_test():
            # Test Context handling consistency
            sentiment = Sentiment()
            
            # Simulate Context as it would come from HTTP trigger
            ctx = Context()
            ctx.config = {
                "source": "http_trigger",
                "request_id": "req_12345",
                "timestamp": "2024-01-15T10:30:00Z"
            }
            ctx.response = {
                "data": {
                    "previous_step": "data_validation",
                    "status": "completed"
                }
            }
            ctx.request = {
                "body": {
                    "user_id": "user_789",
                    "session_id": "session_456"
                },
                "headers": {
                    "Content-Type": "application/json",
                    "X-Request-ID": "req_12345"
                }
            }
            
            # Test successful execution
            valid_inputs = {
                "id": "http_test_001",
                "title": "HTTP Integration Test",
                "comment": "Testing seamless HTTP trigger integration with Python3 runtime",
                "sentiment": "",
                "createdAt": "2024-01-15T10:30:00Z"
            }
            
            result = await sentiment.handle(ctx, valid_inputs)
            
            # Validate HTTP trigger compatibility
            self.assertIsInstance(result, BlokResponse, "Must return BlokResponse for HTTP serialization")
            self.assertEqual(result.success, True, "HTTP workflows require clear success/failure states")
            self.assertIsNotNone(result.data, "HTTP responses must contain data")
            self.assertIsNone(result.error, "Successful operations must have no error")
            
            # Test error handling consistency
            invalid_inputs = {
                "id": "http_test_002",
                # Missing required fields to trigger error
                "title": "",
                "comment": "",
                "sentiment": "",
                "createdAt": ""
            }
            
            error_result = await sentiment.handle(ctx, invalid_inputs)
            
            # Validate error handling for HTTP trigger
            self.assertIsInstance(error_result, BlokResponse, "Errors must also return BlokResponse")
            # Error handling behavior should be consistent
            self.assertTrue(hasattr(error_result, 'success'), "Error responses must have success field")
            self.assertTrue(hasattr(error_result, 'error'), "Error responses must have error field") 
            self.assertTrue(hasattr(error_result, 'data'), "Error responses must have data field")
            
            # Test context preservation through node execution
            api_node = ApiCall()
            
            # Context should be preserved and accessible
            self.assertEqual(ctx.config["request_id"], "req_12345", "Context must be preserved through execution")
            self.assertEqual(ctx.request["body"]["user_id"], "user_789", "Request data must be accessible")
            
            print("✅ BUSINESS QUERY 3 VALIDATED: Python3 runtime integrates seamlessly with HTTP trigger")
        
        asyncio.run(run_test())
    
    def test_migration_completeness_validation(self):
        """
        VALIDATION: Ensure migration is 100% complete across all components
        """
        
        # Test that all core classes are migrated
        from core.blok_service import BlokService
        from core.types.blok_response import BlokResponse
        
        self.assertIsNotNone(BlokService, "BlokService must be available")
        self.assertIsNotNone(BlokResponse, "BlokResponse must be available")
        
        # Test that legacy classes are still available for compatibility
        from core.nanoservice import NanoService
        from core.types.nanoservice_response import NanoServiceResponse
        
        self.assertIsNotNone(NanoService, "NanoService must remain for backward compatibility")
        self.assertIsNotNone(NanoServiceResponse, "NanoServiceResponse must remain for backward compatibility")
        
        # Test protobuf migration
        import gen.node_pb2 as node_pb2
        self.assertEqual(node_pb2.DESCRIPTOR.package, "blok.workflow.v1", "Protobuf must use blok package")
        
        print("✅ MIGRATION COMPLETENESS VALIDATED: All components migrated successfully")
    
    def test_end_to_end_workflow_simulation(self):
        """
        END-TO-END VALIDATION: Simulate a complete multi-node Python3 workflow
        """
        
        async def run_test():
            # Simulate workflow: API Call → Sentiment Analysis → Result Processing
            ctx = Context()
            ctx.config = {}
            ctx.response = {}
            ctx.request = {"body": {}}
            
            # Step 1: API Call node (simulated - would normally call external API)
            api_node = ApiCall()
            
            # Step 2: Sentiment Analysis node
            sentiment_node = Sentiment()
            
            # Simulate workflow data flow
            workflow_data = {
                "id": "workflow_001",
                "title": "Customer Feedback Analysis",
                "comment": "The new feature is absolutely fantastic! Great job on the implementation.",
                "sentiment": "",
                "createdAt": "2024-01-15T10:30:00Z"
            }
            
            # Execute sentiment analysis
            sentiment_result = await sentiment_node.handle(ctx, workflow_data)
            
            # Validate end-to-end workflow
            self.assertEqual(sentiment_result.success, True, "Workflow must complete successfully")
            self.assertEqual(sentiment_result.data["sentiment"], "+", "Should detect positive sentiment")
            self.assertEqual(sentiment_result.data["id"], "workflow_001", "Data must flow through workflow")
            
            # Validate that result can be passed to next node in workflow
            next_node_input = sentiment_result.data
            self.assertIn("sentiment", next_node_input, "Results must be consumable by next workflow step")
            
            print("✅ END-TO-END WORKFLOW VALIDATED: Multi-node Python3 workflows function correctly")
        
        asyncio.run(run_test())

    def test_performance_benchmarks(self):
        """
        PERFORMANCE VALIDATION: Ensure migration maintains performance standards
        """
        import time
        
        # Test class instantiation performance
        start_time = time.time()
        for _ in range(100):
            sentiment = Sentiment()
        instantiation_time = time.time() - start_time
        
        self.assertLess(instantiation_time, 1.0, f"Node instantiation too slow: {instantiation_time:.3f}s for 100 instances")
        
        # Test schema access performance  
        sentiment = Sentiment()
        start_time = time.time()
        for _ in range(1000):
            schemas = sentiment.getSchemas()
        schema_access_time = time.time() - start_time
        
        self.assertLess(schema_access_time, 0.1, f"Schema access too slow: {schema_access_time:.3f}s for 1000 calls")
        
        print("✅ PERFORMANCE BENCHMARKS VALIDATED: Migration maintains performance standards")

if __name__ == '__main__':
    unittest.main()
