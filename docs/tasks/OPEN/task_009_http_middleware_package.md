# TASK-009: HTTP Middleware Package for Express.js Integration
**Master Plan Reference**: Section 🔗 Integration Tools - HTTP trigger as middleware for existing applications  
**Dependencies**: TASK-004 (Express to Hono migration simplifies dual framework support)
**Estimated Effort**: M (1.5 days) - Middleware wrapper development with Express + Hono compatibility
**Assigned To**: [To be assigned]
**Priority**: P1-High (Strategic for existing application integration and ecosystem adoption)
**Status**: ✅ **ARCHITECTURE VALIDATED** - Ready for implementation
**Technical Complexity**: **SIMPLE** - HttpTrigger is interface layer over @blok-ts/runner

## Business Value
Create reusable HTTP middleware package that enables existing Express.js applications to integrate Blok workflows seamlessly, facilitating gradual adoption and reducing migration barriers for teams with established codebases.

## Acceptance Criteria
- [ ] **Complete Wrapper**: Middleware wraps entire HTTP trigger functionality
- [ ] **Prefix-based Routing**: Configurable route prefix for workflow access
- [ ] **Full Request Access**: Middleware receives complete Express req/res objects
- [ ] **Runtime + Environment Config**: Support both programmatic and environment-based configuration
- [ ] **Express + Hono Compatibility**: Universal middleware supporting both frameworks
- [ ] **Isolated Operation**: No interference with existing application middleware or routes
- [ ] **NPM Package**: Published as `@blok-ts/http-middleware` for easy installation

## Business Queries to Validate
1. ✅ **CONFIRMED**: "Can an existing Express.js application add Blok workflow capabilities by installing one package and adding one line of middleware?" - YES: `app.use('/workflows', blokMiddleware())`
2. ✅ **CONFIRMED**: "Can the middleware operate alongside existing Express middleware (auth, cors, logging) without conflicts?" - YES: Prefix-based routing ensures isolation
3. ✅ **CONFIRMED**: "Can teams gradually migrate specific routes to Blok workflows while keeping existing endpoints unchanged?" - YES: Progressive migration by route prefix

## ✅ **ARCHITECTURE ANALYSIS COMPLETED**

### **🏗️ Blok Framework True Architecture (From blok.md)**

```
┌─────────────────────────────────┐
│     HTTP Trigger (Interface)   │  ← SOLO parsing HTTP → Blok Context
├─────────────────────────────────┤
│  @blok-ts/runner (Core Logic)   │  ← TODA la lógica de negocio está aquí
│  • Context Management          │  ← TriggerBase.createContext()
│  • Configuration Loading       │  ← TriggerBase.configuration.init()
│  • Node Execution             │  ← TriggerBase.run()
│  • Workflow Orchestration     │  ← Runner handles steps execution
│  • Error Handling             │  ← GlobalError system
│  • OpenTelemetry Integration  │  ← Built into runner
│  • Metrics Collection         │  ← Built into runner
├─────────────────────────────────┤
│     Discovery Registries       │
│  • src/Nodes.ts (Static)      │  ← Solo registration, no lógica
│  • src/Workflows.ts (Static)  │  ← Solo registration, no lógica  
│  • NODES_PATH (Dynamic)       │  ← Auto-discovery filesystem
│  • WORKFLOWS_PATH (Dynamic)   │  ← Auto-discovery filesystem
└─────────────────────────────────┘
```

### **🔧 HTTP Trigger Reality - Simple Interface Layer**

**Analysis of `triggers/http/src/runner/HttpTrigger.ts`:**

#### **What HttpTrigger ACTUALLY Does** (Interface Only):
1. **Parse HTTP → Context**: `req` → Blok `Context` object conversion
2. **Extract Workflow Names**: From `req.path` using routing logic  
3. **Detect Remote Execution**: `x-nanoservice-execute-node` header detection
4. **Call Runner**: `await this.run(ctx)` - **THE RUNNER DOES EVERYTHING**
5. **Format Response**: Blok response → HTTP response with content-type

#### **What HttpTrigger Does NOT Do** (All in Runner):
❌ Business logic (está en runner)
❌ Node execution (está en runner)
❌ Configuration management (está en runner)
❌ Context management (está en runner) 
❌ Error handling logic (está en runner)
❌ OpenTelemetry integration (está en runner)
❌ Metrics collection (está en runner)

### **🎯 Key Discovery: HttpTrigger = Express Server - Server**

**The middleware is essentially**:
```typescript
// HttpTrigger.listen() contains:
this.app.use(["/:workflow", "/"], async (req, res) => {
  // This handler code becomes the middleware function
});

// Middleware = Extract this handler logic into standalone function
function blokMiddleware() {
  return async (req, res, next) => {
    // Same code as HttpTrigger handler, but call next() instead of listen()
  };
}
```

## Current State Analysis

### **✅ VALIDATED APPROACH: Direct Code Extraction from HttpTrigger**

**Core Implementation Strategy**:
```typescript
// packages/http-middleware/src/BlokMiddleware.ts
import { TriggerBase } from "@blok-ts/runner";
import type { Express, Request, Response, NextFunction } from "express";
import { NodeMap, DefaultLogger } from "@blok-ts/runner";
import { handleDynamicRoute, validateRoute } from "../utils/Util";  // Copy from HttpTrigger
import MessageDecode from "../utils/MessageDecode";                // Copy from HttpTrigger
import nodes from "../Nodes";      // Same import as HttpTrigger
import workflows from "../Workflows"; // Same import as HttpTrigger

export class BlokMiddleware extends TriggerBase {
  private nodeMap: GlobalOptions;
  private logger = new DefaultLogger();
  protected tracer = trace.getTracer(
    process.env.PROJECT_NAME || "blok-middleware",
    process.env.PROJECT_VERSION || "0.0.1"
  );
  
  constructor(config: MiddlewareConfig) {
    super();
    
    // ✅ EXACT SAME CODE as HttpTrigger constructor
    this.loadNodes();      // Copy from HttpTrigger  
    this.loadWorkflows();  // Copy from HttpTrigger
  }

  // ✅ COPY EXACT FUNCTIONS from HttpTrigger
  loadNodes() {
    this.nodeMap.nodes = new NodeMap();
    const nodeKeys = Object.keys(nodes);
    for (const key of nodeKeys) {
      this.nodeMap.nodes.addNode(key, nodes[key]);
    }
  }

  loadWorkflows() {
    this.nodeMap.workflows = workflows;
  }

  // ✅ CORE: Convert HttpTrigger.listen() handler to middleware
  getExpressMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return async (req: Request, res: Response, next: NextFunction) => {
      // ✅ Check if this request should be handled (middleware-specific)
      if (!this.shouldHandleRequest(req)) {
        return next(); // Pass to next middleware
      }

      // ✅ COPY EXACT CODE from HttpTrigger handler inside listen()
      const id: string = (req.query?.requestId as string) || (uuid() as string);
      req.query.requestId = undefined;
      let workflowNameInPath: string = req.params.workflow;

      // ✅ COPY: Remote node execution detection
      let remoteNodeExecution = false;
      let runtimeWorkflow: RuntimeWorkflow | undefined;
      if (req.headers["x-nanoservice-execute-node"] === "true" && req.method.toLowerCase() === "post") {
        remoteNodeExecution = true;
        const coder = new MessageDecode();
        const messageContext: Context = coder.requestDecode(req.body);
        runtimeWorkflow = messageContext as unknown as RuntimeWorkflow;
      }

      // ✅ COPY: Metrics setup  
      const defaultMeter = metrics.getMeter("default");
      const workflow_runner_errors = defaultMeter.createCounter("workflow_errors", {
        description: "Workflow runner errors",
      });
      const workflow_execution = defaultMeter.createCounter("workflow", {
        description: "Workflow requests",
      });

      // ✅ COPY: Tracer span
      await this.tracer.startActiveSpan(`${workflowNameInPath}`, async (span: Span) => {
        try {
          // ✅ COPY: Exact workflow setup from HttpTrigger
          const start = performance.now();
          
          if (remoteNodeExecution && runtimeWorkflow !== undefined) {
            // ✅ COPY: Complete remote node execution logic
            const workflowModel = runtimeWorkflow.workflow;
            const node_type = (workflowModel.steps[0] as unknown as ParamsDictionary).type;
            // ... (rest of remote execution code)
          }

          // ✅ COPY: Configuration and context setup
          await this.configuration.init(workflowNameInPath, this.nodeMap);
          let ctx: Context = this.createContext(undefined, workflowNameInPath || req.params.workflow, id);
          req.params = handleDynamicRoute(this.configuration.trigger.http.path,

## Testing Strategy

### Unit Testing for Middleware
```typescript
describe('Blok HTTP Middleware', () => {
  let app: express.Application;
  let server: any;

  beforeEach(() => {
    app = express();
    app.use('/workflows', blokMiddleware({
      workflowsPath: './test-workflows',
      nodesPath: './test-nodes',
      enableMetrics: true
    }));
  });

  it('should execute workflow via middleware', async () => {
    const response = await request(app)
      .post('/workflows/test-workflow')
      .send({ data: 'test input' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.headers).toHaveProperty('x-blok-execution-id');
  });

  it('should handle remote node execution', async () => {
    const response = await request(app)
      .post('/workflows/test-node')
      .set('x-nanoservice-execute-node', 'true')
      .send({
        Name: 'test-node',
        Message: 'base64EncodedWorkflow',
        Encoding: 'BASE64',
        Type: 'JSON'
      })
      .expect(200);

    expect(response.body).toBeDefined();
  });

  it('should not interfere with non-workflow routes', async () => {
    app.get('/api/test', (req, res) => res.json({ message: 'original route' }));

    const response = await request(app)
      .get('/api/test')
      .expect(200);

    expect(response.body.message).toBe('original route');
  });
});
```

### Integration Testing with Real Applications
```typescript
describe('Express.js Integration', () => {
  it('should work alongside existing middleware', async () => {
    const app = express();
    
    // Existing middleware
    app.use(express.json());
    app.use(cors());
    app.use(authMiddleware);

    // Blok middleware
    app.use('/workflows', blokMiddleware({
      workflowsPath: './test-workflows'
    }));

    // Existing routes
    app.get('/api/users', getUsersHandler);

    // Test both workflows and existing routes work
    const workflowResponse = await request(app)
      .post('/workflows/test')
      .send({ data: 'test' });

    const apiResponse = await request(app)
      .get('/api/users');

    expect(workflowResponse.status).toBe(200);
    expect(apiResponse.status).toBe(200);
  });
});
```

### Performance Testing
```typescript
describe('Middleware Performance', () => {
  it('should not add significant overhead to requests', async () => {
    const app = express();
    app.use('/workflows', blokMiddleware());

    const startTime = Date.now();
    
    await Promise.all([
      request(app).post('/workflows/fast-workflow').send({}),
      request(app).post('/workflows/fast-workflow').send({}),
      request(app).post('/workflows/fast-workflow').send({})
    ]);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });
});
```

## Documentation and Examples

### Package README.md
```markdown
# @blok-ts/http-middleware

HTTP middleware for integrating Blok workflows into Express.js and Hono applications.

## Installation

```bash
npm install @blok-ts/http-middleware
```

## Quick Start

### Express.js
```typescript
import express from 'express';
import { blokMiddleware } from '@blok-ts/http-middleware';

const app = express();
app.use('/workflows', blokMiddleware());
app.listen(3000);
```

### Configuration
```typescript
app.use('/blok', blokMiddleware({
  workflowsPath: './workflows',
  nodesPath: './nodes',
  enableMetrics: true,
  timeout: 30000
}));
```

## Features
- ✅ Express.js and Hono compatibility
- ✅ Remote node execution support
- ✅ OpenTelemetry metrics integration
- ✅ Environment-based configuration
- ✅ TypeScript support
```

### Migration Guide
```markdown
# Migration Guide: Adding Blok to Existing Express.js App

## Step 1: Install Package
```bash
npm install @blok-ts/http-middleware
```

## Step 2: Add Middleware
```typescript
import { blokMiddleware } from '@blok-ts/http-middleware';
app.use('/workflows', blokMiddleware());
```

## Step 3: Create Workflows
```bash
mkdir workflows
# Add your workflow JSON files
```

## Step 4: Test Integration
```bash
curl -X POST http://localhost:3000/workflows/test-workflow \
  -H "Content-Type: application/json" \
  -d '{"data": "test"}'
```

Your existing routes continue working unchanged!
```

## Risk Assessment & Mitigation

### Technical Risks
- **Framework Coupling**: Tight coupling to Express.js internals
  - *Mitigation*: Adapter pattern allows framework flexibility
- **Performance Overhead**: Middleware adding latency to requests
  - *Mitigation*: Efficient request filtering, lazy loading, benchmarking
- **Configuration Complexity**: Too many configuration options
  - *Mitigation*: Sensible defaults, environment variable support

### Business Risks
- **Migration Resistance**: Teams reluctant to add new dependencies
  - *Mitigation*: Simple installation, non-intrusive operation, clear examples
- **Debugging Complexity**: Issues spanning application and middleware
  - *Mitigation*: Clear logging, error boundaries, isolated operation

## Success Metrics & Validation

### Integration Success Metrics
- **Installation Time**: <5 minutes from npm install to working workflows
- **Performance Impact**: <10ms overhead per request
- **Compatibility**: Works with 95% of existing Express.js applications
- **Error Rate**: <1% of middleware-related issues in production

### Business Validation Examples
```bash
# Gradual Migration Scenario
1. Existing Express.js app with 20 API endpoints
2. Add Blok middleware: app.use('/blok', blokMiddleware())
3. Migrate 1 endpoint to Blok workflow
4. Both old API and new workflow work simultaneously
5. Gradually migrate more endpoints

# Team Adoption Scenario
1. Team has established Express.js + MongoDB + Auth stack
2. Wants to add ML processing capabilities
3. Installs @blok-ts/http-middleware
4. Creates ML workflow using Python3 nodes
5. Existing app gains ML capabilities with zero refactoring
```

## Definition of Done
- [ ] Complete middleware wrapper supporting Express.js and Hono
- [ ] Prefix-based routing with full request access
- [ ] Runtime and environment-based configuration options
- [ ] Universal createBlokMiddleware function for framework support
- [ ] NPM package published as @blok-ts/http-middleware
- [ ] Integration testing with real Express.js applications
- [ ] Performance testing showing minimal overhead
- [ ] Comprehensive documentation with migration examples

## AI Programming Impact
This middleware enables:
- **Gradual AI Integration**: Add AI workflows to existing applications incrementally
- **Zero Migration Cost**: Existing codebases gain Blok capabilities without refactoring
- **Ecosystem Compatibility**: Works with existing Express.js ecosystem and middleware
- **Framework Future-Proofing**: Supports both current (Express.js) and future (Hono) frameworks
- **Rapid Adoption**: Teams can experiment with Blok without major architectural changes

## Implementation Timeline
- **Day 1**: Core middleware wrapper and Express.js adapter
- **Day 2**: Hono adapter, configuration system, testing, and NPM publishing

---

**This HTTP middleware package removes adoption barriers by enabling seamless integration of Blok workflows into existing applications, facilitating gradual migration and ecosystem expansion.**
