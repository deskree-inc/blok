# TASK-007: Parallel Execution Container Nodes for Data Processing
**Master Plan Reference**: Section 🔄 Advanced Node Types - Parallel processing containers for data pipelines  
**Dependencies**: None (follows existing if-else container node pattern)
**Estimated Effort**: M (2 days) - Container node development with Promise.all pattern
**Assigned To**: [To be assigned]
**Priority**: P1-High (Critical for data pipeline performance and scalability)

## Business Value
Create parallel execution container nodes that enable high-performance data processing pipelines by executing multiple nodes simultaneously, following Promise.all semantics for predictable behavior and maximum throughput.

## Acceptance Criteria
- [ ] **Container Node Pattern**: Follow existing if-else node architecture for consistency
- [ ] **Promise.all Behavior**: Results array in execution order, fail-fast default behavior
- [ ] **Configurable Error Handling**: Fail-fast (default) and continue-partial strategies
- [ ] **Performance Settings**: Timeout, concurrency limits, and batch processing in node inputs
- [ ] **Progress Tracking**: Execution info and metrics in response alongside results
- [ ] **Context Isolation**: Each parallel node receives same initial context, isolated execution
- [ ] **Testing Coverage**: Unit and integration tests with real parallel execution scenarios

## Business Queries to Validate
1. "Can a data processing workflow split large datasets into parallel chunks and process them simultaneously for 3-5x performance improvement?"
2. "Can parallel execution handle mixed node types (TypeScript + Python3) running concurrently with proper error isolation?"
3. "Can developers configure partial failure handling to continue processing when non-critical parallel operations fail?"

## Current State Analysis

### Existing Container Node Pattern (if-else)
**Reference Implementation**: `nodes/control-flow/if-else@1.0.0/index.ts`
```typescript
export default class IfElse extends NodeBlok<Array<Condition>> {
  constructor() {
    super();
    this.flow = true; // ← Marks as flow control node
  }

  async handle(ctx: Context, inputs: Array<Condition>): Promise<NodeBlok<Condition[]>[]> {
    // Evaluates conditions and returns steps to execute
    return steps as unknown as NodeBlok<Condition[]>[];
  }
}
```

**Workflow Usage Pattern**:
```json
{
  "steps": [
    {"name": "filter-request", "node": "@blok-ts/if-else", "type": "module"}
  ],
  "nodes": {
    "filter-request": {
      "conditions": [
        {
          "type": "if",
          "condition": "ctx.request.method === 'GET'",
          "steps": [{"name": "ui-step", "node": "feedback-ui", "type": "module"}]
        }
      ]
    }
  }
}
```

### Required Architecture for Parallel Execution
```typescript
// Enhanced container pattern for parallel processing
export default class ParallelExecution extends NodeBlok<ParallelConfig> {
  constructor() {
    super();
    this.flow = true; // Container node
  }

  async handle(ctx: Context, inputs: ParallelConfig): Promise<any[]> {
    // Execute nodes in parallel using Promise.all pattern
    // Return results array in execution order
  }
}
```

## Implementation Approach

### Phase 1: Core Container Node Structure
**Target Directory**: `nodes/control-flow/parallel-execution@1.0.0/`

**Core Implementation**:
```typescript
// nodes/control-flow/parallel-execution@1.0.0/index.ts
import type { Context, NodeBase, INodeBlokResponse } from "@blok-ts/runner";
import { NodeBlok } from "@blok-ts/runner";

interface ParallelNodeConfig {
  name: string;
  node: string;
  type: 'module' | 'local' | 'runtime.python3';
}

interface ParallelExecutionConfig {
  execution: {
    strategy: 'parallel' | 'sequential'; // For debugging
    error_handling: 'fail-fast' | 'continue-partial';
    timeout?: number; // Per node timeout (ms)
    max_concurrent?: number; // Concurrency limit
    global_timeout?: number; // Total execution limit
  };
  nodes: ParallelNodeConfig[];
}

export default class ParallelExecution extends NodeBlok<ParallelExecutionConfig> {
  constructor() {
    super();
    this.flow = true;
    this.contentType = "application/json";
  }

  async handle(ctx: Context, inputs: ParallelExecutionConfig): Promise<INodeBlokResponse> {
    const { execution, nodes } = inputs;
    const results: any[] = [];
    const errors: any[] = [];
    const executionInfo = {
      total: nodes.length,
      completed: 0,
      failed: 0,
      duration_ms: 0,
      concurrent_peak: 0
    };

    const startTime = Date.now();

    try {
      if (execution.strategy === 'sequential') {
        // Sequential execution for debugging
        for (const nodeConfig of nodes) {
          const result = await this.executeNode(nodeConfig, ctx);
          results.push(result);
          executionInfo.completed++;
        }
      } else {
        // Parallel execution (default)
        const parallelPromises = nodes.map(nodeConfig => 
          this.executeNodeWithTimeout(nodeConfig, ctx, execution.timeout)
        );

        if (execution.error_handling === 'fail-fast') {
          // Promise.all behavior - fail if any fails
          const parallelResults = await Promise.all(parallelPromises);
          results.push(...parallelResults);
          executionInfo.completed = nodes.length;
        } else {
          // Continue with partial results
          const settledResults = await Promise.allSettled(parallelPromises);
          
          settledResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              results.push(result.value);
              executionInfo.completed++;
            } else {
              results.push(null); // Maintain array position
              errors.push({
                node: nodes[index].name,
                error: result.reason.message || 'Unknown error'
              });
              executionInfo.failed++;
            }
          });
        }
      }

      executionInfo.duration_ms = Date.now() - startTime;
      executionInfo.concurrent_peak = Math.min(nodes.length, execution.max_concurrent || nodes.length);

      // Return Promise.all style results with execution info
      return {
        success: true,
        data: execution.error_handling === 'continue-partial' && errors.length > 0 
          ? { results, errors, execution_info: executionInfo }
          : { results, execution_info: executionInfo }
      };

    } catch (error) {
      executionInfo.duration_ms = Date.now() - startTime;
      executionInfo.failed = nodes.length - executionInfo.completed;

      return {
        success: false,
        data: null,
        error: {
          message: `Parallel execution failed: ${error.message}`,
          execution_info: executionInfo
        }
      };
    }
  }

  private async executeNodeWithTimeout(
    nodeConfig: ParallelNodeConfig, 
    ctx: Context, 
    timeout?: number
  ): Promise<any> {
    const nodeExecutor = this.getNodeExecutor(nodeConfig.type);
    const execution = nodeExecutor.execute(nodeConfig, ctx);

    if (timeout) {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Node ${nodeConfig.name} timed out after ${timeout}ms`)), timeout)
      );
      
      return Promise.race([execution, timeoutPromise]);
    }

    return execution;
  }

  private async executeNode(nodeConfig: ParallelNodeConfig, ctx: Context): Promise<any> {
    // Execute individual node using existing runner infrastructure
    const nodeExecutor = this.getNodeExecutor(nodeConfig.type);
    return nodeExecutor.execute(nodeConfig, ctx);
  }

  private getNodeExecutor(type: string) {
    // Return appropriate executor based on node type
    // Integration with existing runner infrastructure
  }
}

export type { ParallelExecutionConfig };
```

### Phase 2: Configuration Schema
**Target**: `nodes/control-flow/parallel-execution@1.0.0/config.json`

```json
{
  "name": "parallel-execution",
  "version": "1.0.0",
  "description": "Execute multiple nodes in parallel for high-performance data processing",
  "group": "FLOW_CONTROL",
  "config": {
    "type": "object",
    "properties": {
      "execution": {
        "type": "object",
        "description": "Parallel execution configuration",
        "properties": {
          "strategy": {
            "type": "string",
            "enum": ["parallel", "sequential"],
            "default": "parallel",
            "description": "Execution strategy"
          },
          "error_handling": {
            "type": "string", 
            "enum": ["fail-fast", "continue-partial"],
            "default": "fail-fast",
            "description": "Error handling strategy"
          },
          "timeout": {
            "type": "number",
            "description": "Timeout per node in milliseconds",
            "minimum": 1000,
            "maximum": 300000
          },
          "max_concurrent": {
            "type": "number",
            "description": "Maximum concurrent nodes",
            "minimum": 1,
            "maximum": 20,
            "default": 5
          },
          "global_timeout": {
            "type": "number",
            "description": "Total execution timeout in milliseconds",
            "minimum": 5000,
            "maximum": 600000
          }
        },
        "required": ["strategy", "error_handling"]
      },
      "nodes": {
        "type": "array",
        "description": "List of nodes to execute in parallel",
        "items": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "description": "Unique name for this parallel node"
            },
            "node": {
              "type": "string", 
              "description": "Node identifier to execute"
            },
            "type": {
              "type": "string",
              "enum": ["module", "local", "runtime.python3"],
              "default": "module",
              "description": "Node execution type"
            }
          },
          "required": ["name", "node", "type"]
        },
        "minItems": 2,
        "maxItems": 20
      }
    },
    "required": ["execution", "nodes"],
    "example": {
      "execution": {
        "strategy": "parallel",
        "error_handling": "fail-fast",
        "timeout": 30000,
        "max_concurrent": 3
      },
      "nodes": [
        {"name": "chunk-1", "node": "data-processor", "type": "module"},
        {"name": "chunk-2", "node": "data-processor", "type": "module"},
        {"name": "chunk-3", "node": "data-processor", "type": "module"}
      ]
    }
  },
  "inputs": {
    "type": "object",
    "description": "Parallel execution configuration object"
  },
  "output": {
    "type": "object",
    "description": "Results array with execution info (Promise.all pattern)"
  }
}
```

### Phase 3: Workflow Integration Pattern
**Target**: Standard workflow usage following if-else pattern

**Workflow Configuration**:
```json
{
  "name": "parallel-data-pipeline",
  "description": "High-performance data processing with parallel execution",
  "version": "1.0.0",
  "steps": [
    {
      "name": "load-data",
      "node": "data-loader", 
      "type": "module"
    },
    {
      "name": "parallel-processing",
      "node": "parallel-execution",
      "type": "module"
    },
    {
      "name": "aggregate-results",
      "node": "result-aggregator",
      "type": "module"
    }
  ],
  "nodes": {
    "load-data": {
      "inputs": {
        "dataset_url": "${ctx.request.body.dataset}"
      }
    },
    "parallel-processing": {
      "execution": {
        "strategy": "parallel",
        "error_handling": "fail-fast",
        "timeout": 30000,
        "max_concurrent": 3
      },
      "nodes": [
        {"name": "chunk-1", "node": "data-processor", "type": "module"},
        {"name": "chunk-2", "node": "data-processor", "type": "module"}, 
        {"name": "chunk-3", "node": "data-processor", "type": "module"}
      ]
    },
    "chunk-1": {
      "inputs": {
        "data": "js/ctx.vars.dataset.slice(0, 1000)",
        "chunk_id": 1,
        "processing_config": "${ctx.request.body.config}"
      }
    },
    "chunk-2": {
      "inputs": {
        "data": "js/ctx.vars.dataset.slice(1000, 2000)",
        "chunk_id": 2,
        "processing_config": "${ctx.request.body.config}"
      }
    },
    "chunk-3": {
      "inputs": {
        "data": "js/ctx.vars.dataset.slice(2000, 3000)",
        "chunk_id": 3,
        "processing_config": "${ctx.request.body.config}"
      }
    },
    "aggregate-results": {
      "inputs": {
        "parallel_results": "js/ctx.vars['parallel-processing'].results",
        "execution_info": "js/ctx.vars['parallel-processing'].execution_info"
      }
    }
  }
}
```

### Phase 4: Advanced Use Cases and Patterns

**Pattern 1: Mixed Runtime Parallel Processing**
```json
{
  "nodes": [
    {"name": "ts-processor", "node": "data-validator", "type": "module"},
    {"name": "py-ml-model", "node": "sentiment-analysis", "type": "runtime.python3"},
    {"name": "local-aggregator", "node": "result-merger", "type": "local"}
  ]
}
```

**Pattern 2: Fault-Tolerant Data Processing**
```json
{
  "execution": {
    "strategy": "parallel", 
    "error_handling": "continue-partial",
    "timeout": 45000
  },
  "nodes": [
    {"name": "critical-data", "node": "essential-processor", "type": "module"},
    {"name": "optional-enrichment", "node": "data-enricher", "type": "runtime.python3"},
    {"name": "analytics", "node": "metrics-calculator", "type": "module"}
  ]
}
```

**Pattern 3: Batched Parallel Processing**
```json
{
  "execution": {
    "strategy": "parallel",
    "max_concurrent": 2, // Process in batches of 2
    "global_timeout": 120000
  },
  "nodes": [
    {"name": "batch-1", "node": "heavy-processor", "type": "runtime.python3"},
    {"name": "batch-2", "node": "heavy-processor", "type": "runtime.python3"},
    {"name": "batch-3", "node": "heavy-processor", "type": "runtime.python3"},
    {"name": "batch-4", "node": "heavy-processor", "type": "runtime.python3"}
  ]
}
```

## Testing Strategy

### Unit Testing for Parallel Node
```typescript
describe('ParallelExecution Node', () => {
  it('should execute nodes in parallel and return Promise.all style results', async () => {
    const parallelNode = new ParallelExecution();
    const mockCtx = createMockContext();
    
    const config = {
      execution: { strategy: 'parallel', error_handling: 'fail-fast' },
      nodes: [
        { name: 'test-1', node: 'mock-processor', type: 'module' },
        { name: 'test-2', node: 'mock-processor', type: 'module' }
      ]
    };

    const result = await parallelNode.handle(mockCtx, config);
    
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(2);
    expect(result.data.execution_info.completed).toBe(2);
    expect(result.data.execution_info.failed).toBe(0);
  });

  it('should handle partial failures with continue-partial strategy', async () => {
    const config = {
      execution: { strategy: 'parallel', error_handling: 'continue-partial' },
      nodes: [
        { name: 'success-node', node: 'working-processor', type: 'module' },
        { name: 'failing-node', node: 'failing-processor', type: 'module' }
      ]
    };

    const result = await parallelNode.handle(mockCtx, config);
    
    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(2);
    expect(result.data.results[0]).toBeDefined(); // Success result
    expect(result.data.results[1]).toBeNull(); // Failed result
    expect(result.data.errors).toHaveLength(1);
    expect(result.data.execution_info.completed).toBe(1);
    expect(result.data.execution_info.failed).toBe(1);
  });

  it('should respect timeout limits per node', async () => {
    const config = {
      execution: { 
        strategy: 'parallel', 
        error_handling: 'fail-fast',
        timeout: 1000 // 1 second timeout
      },
      nodes: [
        { name: 'slow-node', node: 'slow-processor', type: 'module' }
      ]
    };

    const start = Date.now();
    
    await expect(parallelNode.handle(mockCtx, config)).rejects.toThrow('timed out');
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1500); // Should timeout around 1000ms
  });
});
```

### Integration Testing with Real Workflows
```typescript
describe('Parallel Execution Integration', () => {
  it('should execute complete parallel data processing workflow', async () => {
    const workflow = {
      name: 'parallel-test',
      steps: [
        { name: 'parallel-step', node: 'parallel-execution', type: 'module' }
      ],
      nodes: {
        'parallel-step': {
          execution: { strategy: 'parallel', error_handling: 'fail-fast' },
          nodes: [
            { name: 'chunk-1', node: 'echo-processor', type: 'module' },
            { name: 'chunk-2', node: 'echo-processor', type: 'module' }
          ]
        },
        'chunk-1': { inputs: { message: 'Hello from chunk 1' } },
        'chunk-2': { inputs: { message: 'Hello from chunk 2' } }
      }
    };

    const runner = new Runner(workflow);
    const result = await runner.execute({ data: 'test' });

    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(2);
    expect(result.data.execution_info.concurrent_peak).toBeGreaterThan(1);
  });
});
```

### Performance Testing
```typescript
describe('Parallel Performance', () => {
  it('should provide significant performance improvement over sequential execution', async () => {
    const heavyNodes = Array.from({ length: 5 }, (_, i) => ({
      name: `heavy-${i}`,
      node: 'cpu-intensive-processor',
      type: 'module'
    }));

    // Test parallel execution
    const parallelConfig = {
      execution: { strategy: 'parallel', error_handling: 'fail-fast' },
      nodes: heavyNodes
    };

    const parallelStart = Date.now();
    const parallelResult = await parallelNode.handle(mockCtx, parallelConfig);
    const parallelDuration = Date.now() - parallelStart;

    // Test sequential execution
    const sequentialConfig = {
      execution: { strategy: 'sequential', error_handling: 'fail-fast' },
      nodes: heavyNodes
    };

    const sequentialStart = Date.now();
    const sequentialResult = await parallelNode.handle(mockCtx, sequentialConfig);
    const sequentialDuration = Date.now() - sequentialStart;

    // Parallel should be significantly faster
    expect(parallelDuration).toBeLessThan(sequentialDuration * 0.6);
    expect(parallelResult.data.execution_info.concurrent_peak).toBe(5);
    expect(sequentialResult.data.execution_info.concurrent_peak).toBe(1);
  });
});
```

## Risk Assessment & Mitigation

### Technical Risks
- **Memory Usage**: Multiple concurrent nodes consuming significant memory
  - *Mitigation*: Configurable concurrency limits, memory monitoring
- **Error Propagation**: Complex error scenarios in parallel execution
  - *Mitigation*: Clear error handling strategies, comprehensive testing
- **Context Sharing**: Potential race conditions with shared context
  - *Mitigation*: Context isolation, immutable context passing

### Business Risks
- **Performance Regression**: Overhead from parallel coordination
  - *Mitigation*: Performance benchmarking, optional sequential mode
- **Debugging Complexity**: Harder to debug parallel execution issues
  - *Mitigation*: Sequential mode for debugging, detailed execution info

## Success Metrics & Validation

### Performance Metrics
- **Throughput Improvement**: 3-5x performance increase for parallelizable workloads
- **Concurrency Efficiency**: Proper utilization of available resources
- **Error Handling**: <1% error propagation issues in production
- **Memory Stability**: No memory leaks during extended parallel processing

### Business Validation Examples
```bash
# High-Performance Data Processing
1. Load 10MB dataset into workflow
2. Configure 5 parallel processing chunks
3. Measure execution time vs sequential processing
4. Verify 70-80% reduction in processing time

# Mixed Runtime Processing
1. Create workflow with TypeScript + Python3 parallel nodes
2. Execute simultaneous data validation and ML processing
3. Verify both runtimes execute concurrently
4. Confirm proper error isolation between runtimes

# Fault-Tolerant Processing
1. Configure parallel workflow with continue-partial strategy
2. Simulate failure in 1 of 3 parallel nodes
3. Verify workflow completes with partial results
4. Confirm failed node error details in response
```

## Documentation Integration

### Update blok.md with Parallel Execution Section
```markdown
## Advanced Node Types: Parallel Execution

### Creating High-Performance Data Pipelines
```bash
# Add parallel execution node to project
blokctl create node --name "parallel-processor" --type "module" --template "parallel-execution"
```

### Parallel Processing Configuration
```json
{
  "name": "data-pipeline",
  "steps": [
    {"name": "parallel-step", "node": "parallel-execution", "type": "module"}
  ],
  "nodes": {
    "parallel-step": {
      "execution": {
        "strategy": "parallel",
        "error_handling": "fail-fast",
        "timeout": 30000,
        "max_concurrent": 3
      },
      "nodes": [
        {"name": "chunk-1", "node": "data-processor", "type": "module"},
        {"name": "chunk-2", "node": "ml-processor", "type": "runtime.python3"}
      ]
    }
  }
}
```

### AI Programming Benefits
- **Scalable Processing**: Handle large datasets through parallel chunk processing
- **Multi-Runtime Coordination**: Combine TypeScript and Python processing simultaneously
- **Fault Tolerance**: Continue processing when non-critical components fail
- **Performance Optimization**: Achieve 3-5x throughput improvement for parallelizable workloads
```

## Definition of Done
- [ ] Complete parallel execution container node following if-else pattern
- [ ] Promise.all behavior with results array and execution info
- [ ] Configurable error handling (fail-fast and continue-partial)
- [ ] Performance settings (timeout, concurrency) in node inputs
- [ ] Unit testing with mock parallel execution scenarios
- [ ] Integration testing with real multi-node workflows
- [ ] Performance benchmarking showing measurable improvements
- [ ] Documentation with configuration examples and best practices

## AI Programming Impact
This parallel execution capability enables:
- **High-Performance AI Workflows**: Process large datasets through parallel AI nodes
- **Multi-Runtime Intelligence**: Simultaneous TypeScript + Python ML processing
- **Scalable Data Pipelines**: Handle enterprise-scale data processing requirements
- **Resilient Processing**: Fault-tolerant workflows that continue despite partial failures
- **Optimized Resource Usage**: Maximize throughput through intelligent parallel coordination

## Implementation Timeline
- **Day 1**: Core container node implementation and configuration schema
- **Day 2**: Testing, performance validation, and documentation

---

**This parallel execution system transforms Blok into a high-performance data processing platform capable of handling enterprise-scale workloads with intelligent parallel coordination and fault tolerance.** 