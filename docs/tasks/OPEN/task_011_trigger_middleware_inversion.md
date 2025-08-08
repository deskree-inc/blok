# TASK-011: HTTP Trigger Middleware Inversion Architecture
**Master Plan Reference**: Section 🔗 Architecture Optimization - Invert HttpTrigger to use BlokMiddleware as core
**Dependencies**: TASK-009 (HTTP Middleware Package must be completed first)
**Estimated Effort**: S (4-6 hours) - Refactoring existing triggers to use middleware internally
**Assigned To**: [To be assigned]
**Priority**: P2-Medium (Architecture improvement, not feature addition)
**Status**: ✅ **ARCHITECTURE DESIGNED** - Awaiting TASK-009 completion
**Technical Complexity**: **SIMPLE** - Pure refactoring with established middleware

## Business Value
Transform HttpTrigger and HonoHttpTrigger from complex implementations to thin server layers that leverage BlokMiddleware internally. This eliminates code duplication, ensures consistency between standalone and embedded usage, and creates a single source of truth for workflow execution logic.

## Acceptance Criteria
- [ ] **HttpTrigger Refactored**: HttpTrigger uses BlokMiddleware internally for all workflow logic
- [ ] **HonoHttpTrigger Refactored**: HonoHttpTrigger uses BlokMiddleware internally for all workflow logic
- [ ] **100% Backward Compatibility**: No breaking changes to existing HttpTrigger API
- [ ] **Feature Parity**: All current functionality preserved (health-check, metrics, AppRoutes, etc.)
- [ ] **Code Elimination**: Remove duplicated workflow logic from trigger implementations
- [ ] **Consistency Guaranteed**: Same behavior between triggers and standalone middleware usage
- [ ] **Performance Maintained**: No performance degradation from architectural change

## Business Queries to Validate
1. "Does HttpTrigger behavior remain identical after refactoring?" - Must be YES for backward compatibility
2. "Is there zero code duplication between HttpTrigger and BlokMiddleware?" - Must be YES for maintenance
3. "Can teams upgrade existing HttpTrigger deployments without code changes?" - Must be YES for adoption

## ✅ **ARCHITECTURAL VISION**

### **🏗️ Current Architecture (Post TASK-009)**
```
┌─────────────────────────────────┐
│   HttpTrigger (Complex)         │ ← Complete workflow implementation
│   • Server setup               │
│   • Workflow execution         │
│   • Node management            │
│   • Remote execution           │
│   • Context management         │
│   • Error handling             │
│   • OpenTelemetry integration  │
├─────────────────────────────────┤
│   BlokMiddleware (Copy)         │ ← Duplicated logic from HttpTrigger
│   • Same workflow execution    │ ← CODE DUPLICATION PROBLEM
│   • Same node management       │
│   • Same remote execution      │ 
│   • Same context management    │
│   • Same error handling        │
└─────────────────────────────────┘
```

### **🎯 Target Architecture (After TASK-011)**
```
┌─────────────────────────────────┐
│   HttpTrigger (Thin Server)     │ ← Server setup + infrastructure only
│   • Express server setup       │
│   • Body parsing & CORS        │
│   • Health/metrics endpoints   │
│   • AppRoutes mounting         │
│   • Server lifecycle           │
├─────────────────────────────────┤
│   HonoHttpTrigger (Thin Server) │ ← Server setup + infrastructure only  
│   • Hono server setup          │
│   • Request parsing            │
│   • Health/metrics endpoints   │
│   • Static file serving        │
│   • Server lifecycle           │
├─────────────────────────────────┤
│  BlokMiddleware (Business Logic) │ ← SINGLE source of truth
│  • Workflow execution          │ ← NO DUPLICATION
│  • Node management             │
│  • Remote execution            │
│  • Context management          │
│  • Error handling              │
│  • OpenTelemetry integration   │
├─────────────────────────────────┤
│  @blok-ts/runner (Core Engine)  │ ← Unchanged
└─────────────────────────────────┘
```

## 🔍 **DETAILED TECHNICAL ANALYSIS**

### **📋 Code Elimination Analysis**

**From HttpTrigger.ts - Code to REMOVE (delegate to middleware)**:
```typescript
// ❌ REMOVE: Node loading logic (delegate to BlokMiddleware)
loadNodes() {
  this.nodeMap.nodes = new NodeMap();
  const nodeKeys = Object.keys(nodes);
  for (const key of nodeKeys) {
    this.nodeMap.nodes.addNode(key, nodes[key]);
  }
}

// ❌ REMOVE: Workflow loading logic (delegate to BlokMiddleware)  
loadWorkflows() {
  this.nodeMap.workflows = workflows;
}

// ❌ REMOVE: Complex handler logic (delegate to BlokMiddleware)
this.app.use(["/:workflow", "/"], async (req: Request, res: Response): Promise<void> => {
  // 200+ lines of workflow execution logic
  // Remote node execution detection
  // Context creation and management  
  // Error handling and response formatting
  // OpenTelemetry span management
  // Metrics collection
  // All this becomes: middleware.handle(req, res, next)
});
```

**From HttpTrigger.ts - Code to KEEP (server responsibilities)**:
```typescript
// ✅ KEEP: Server setup and infrastructure
this.app.use(express.static("public"));
this.app.use(bodyParser.text({ limit: "150mb" }));
this.app.use(bodyParser.urlencoded({ extended: true }));
this.app.use(bodyParser.json({ limit: "150mb" }));
this.app.use(cors());

// ✅ KEEP: Infrastructure endpoints
this.app.use("/health-check", (req, res) => {
  res.status(200).send("Online and ready for action 💪");
});

this.app.get("/metrics", (req, res) => {
  try {
    metricsHandler(req, res);
  } catch (error) {
    res.status(500).send("Error serving metrics");
  }
});

// ✅ KEEP: Custom routes
this.app.use("/", apps);

// ✅ KEEP: Server lifecycle
this.app.listen(this.port, () => {
  this.logger.log(`Server is running at http://localhost:${this.port}`);
  resolve(this.endCounter(this.initializer));
});
```

### **🎯 Separation of Concerns Matrix**

| Responsibility | Current (HttpTrigger) | After (BlokMiddleware) | After (HttpTrigger) |
|---|---|---|---|
| **Server Setup** | ✅ HttpTrigger | ❌ Not applicable | ✅ HttpTrigger |
| **Body Parsing** | ✅ HttpTrigger | ❌ Not applicable | ✅ HttpTrigger |
| **CORS Handling** | ✅ HttpTrigger | ❌ Not applicable | ✅ HttpTrigger |
| **Health Endpoints** | ✅ HttpTrigger | ❌ Not applicable | ✅ HttpTrigger |
| **Metrics Endpoints** | ✅ HttpTrigger | ❌ Not applicable | ✅ HttpTrigger |
| **Custom Routes** | ✅ HttpTrigger | ❌ Not applicable | ✅ HttpTrigger |
| **Workflow Discovery** | ✅ HttpTrigger | ✅ BlokMiddleware | ❌ Delegated |
| **Node Loading** | ✅ HttpTrigger | ✅ BlokMiddleware | ❌ Delegated |
| **Context Creation** | ✅ HttpTrigger | ✅ BlokMiddleware | ❌ Delegated |
| **Request Parsing** | ✅ HttpTrigger | ✅ BlokMiddleware | ❌ Delegated |
| **Workflow Execution** | ✅ HttpTrigger | ✅ BlokMiddleware | ❌ Delegated |
| **Remote Node Execution** | ✅ HttpTrigger | ✅ BlokMiddleware | ❌ Delegated |
| **Error Handling** | ✅ HttpTrigger | ✅ BlokMiddleware | ❌ Delegated |
| **Response Formatting** | ✅ HttpTrigger | ✅ BlokMiddleware | ❌ Delegated |
| **OpenTelemetry** | ✅ HttpTrigger | ✅ BlokMiddleware | ❌ Delegated |
| **Server Lifecycle** | ✅ HttpTrigger | ❌ Not applicable | ✅ HttpTrigger |

## 📝 **IMPLEMENTATION PLAN**

### **Phase 1: HttpTrigger Refactoring (2-3 hours)**

#### **Step 1.1: Create BlokMiddleware Instance**
```typescript
// triggers/http/src/runner/HttpTrigger.ts
import { BlokMiddleware } from '@blok-ts/http-middleware';

export default class HttpTrigger extends TriggerBase {
  private app: Express = express();
  private blokMiddleware: BlokMiddleware;
  private port: string | number = process.env.PORT || 4000;
  private initializer = 0;
  private logger = new DefaultLogger();

  constructor() {
    super();
    
    this.initializer = this.startCounter();
    
    // ✅ REPLACE: Complex loading logic with middleware instantiation
    this.blokMiddleware = new BlokMiddleware({
      workflowsPath: process.env.WORKFLOWS_PATH || './workflows',
      nodesPath: process.env.NODES_PATH || './src/nodes',
      enableMetrics: true,
      enableRemoteExecution: true,
      logLevel: 'info'
    });
  }
}
```

#### **Step 1.2: Replace Complex Handler with Middleware**
```typescript
// ❌ REMOVE: Current complex handler (200+ lines)
// this.app.use(["/:workflow", "/"], async (req: Request, res: Response): Promise<void> => {
//   // Complex workflow execution logic
// });

// ✅ REPLACE: With simple middleware delegation
this.app.use(["/:workflow", "/"], this.blokMiddleware.getExpressMiddleware());
```

#### **Step 1.3: Remove Duplicated Methods**
```typescript
// ❌ REMOVE: These methods (now handled by BlokMiddleware)
// loadNodes() { ... }
// loadWorkflows() { ... }
// All context creation and workflow execution logic
```

#### **Step 1.4: Preserve Infrastructure Methods**
```typescript
// ✅ KEEP: Server lifecycle and infrastructure
listen(): Promise<number> {
  return new Promise((resolve) => {
    // ✅ Server setup (HttpTrigger responsibility)
    this.app.use(express.static("public"));
    this.app.use(bodyParser.text({ limit: "150mb" }));
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json({ limit: "150mb" }));
    this.app.use(cors());

    // ✅ Infrastructure endpoints (HttpTrigger responsibility)
    this.app.use("/health-check", (req: Request, res: Response) => {
      res.status(200).send("Online and ready for action 💪");
    });

    this.app.get("/metrics", (req: Request, res: Response) => {
      try {
        metricsHandler(req, res);
      } catch (error) {
        res.status(500).send("Error serving metrics");
      }
    });

    // ✅ Custom routes (HttpTrigger responsibility)
    this.app.use("/", apps);

    // ✅ CORE CHANGE: Delegate workflow handling to middleware
    this.app.use(["/:workflow", "/"], this.blokMiddleware.getExpressMiddleware());

    // ✅ Server lifecycle (HttpTrigger responsibility)
    this.app.listen(this.port, () => {
      this.logger.log(`Server is running at http://localhost:${this.port}`);
      resolve(this.endCounter(this.initializer));
    });
  });
}

// ✅ KEEP: Backward compatibility methods
getApp(): Express {
  return this.app;
}
```

### **Phase 2: HonoHttpTrigger Refactoring (2-3 hours)**

#### **Step 2.1: Create BlokMiddleware Instance for Hono**
```typescript
// triggers/http/src/runner/HonoHttpTrigger.ts
import { BlokMiddleware } from '@blok-ts/http-middleware';

export default class HonoHttpTrigger extends TriggerBase {
  private app: Hono = new Hono();
  private blokMiddleware: BlokMiddleware;
  private port: string | number = process.env.PORT || 4000;
  private initializer = 0;
  private logger = new DefaultLogger();

  constructor() {
    super();
    
    this.initializer = this.startCounter();
    
    // ✅ REPLACE: Complex loading logic with middleware instantiation
    this.blokMiddleware = new BlokMiddleware({
      workflowsPath: process.env.WORKFLOWS_PATH || './workflows',
      nodesPath: process.env.NODES_PATH || './src/nodes', 
      enableMetrics: true,
      enableRemoteExecution: true,
      logLevel: 'info'
    });
    
    this.setupRoutes(); // Configure Hono-specific routes
  }
}
```

#### **Step 2.2: Refactor setupRoutes() Method**
```typescript
private setupRoutes(): void {
  // ✅ KEEP: Hono server setup
  this.app.use("*", cors());
  this.app.use("/public/*", serveStatic({ root: "./" }));

  // ✅ KEEP: Infrastructure endpoints
  this.app.get("/health-check", (c: HonoContext) => {
    return c.text("Online and ready for action 💪");
  });

  this.app.get("/metrics", async (c: HonoContext) => {
    try {
      // Create Express-like req/res for metrics handler
      const mockReq = {
        method: "GET",
        url: "/metrics",
        headers: Object.fromEntries(c.req.raw.headers.entries()),
      };

      let responseData = "";
      let responseStatus = 200;
      const mockRes = {
        status: (code: number) => {
          responseStatus = code;
          return mockRes;
        },
        send: (data: string) => {
          responseData = data;
        },
        setHeader: () => {},
        set: () => {},
      };

      await metricsHandler(mockReq as never, mockRes as never);

      return new Response(responseData, {
        status: responseStatus,
        headers: { "Content-Type": "text/plain" },
      });
    } catch (error) {
      return new Response("Error serving metrics", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }
  });

  // ✅ KEEP: Custom routes (welcome page)
  this.mountExpressApps();

  // ✅ CORE CHANGE: Replace complex handler with middleware
  // ❌ REMOVE: this.app.all("/:workflow{.+}", async (c: HonoContext) => {
  //   return await this.handleWorkflow(c); // 300+ lines of complex logic
  // });

  // ✅ REPLACE: With middleware delegation
  this.app.all("/:workflow{.+}", this.blokMiddleware.getHonoMiddleware());
}
```

#### **Step 2.3: Remove Complex Methods**
```typescript
// ❌ REMOVE: These methods (now handled by BlokMiddleware)
// loadNodes() { ... }
// loadWorkflows() { ... } 
// handleWorkflow() { ... } // 300+ lines of workflow execution logic
// parseBody() { ... }      // Request parsing logic
```

#### **Step 2.4: Preserve Infrastructure Methods**
```typescript
// ✅ KEEP: Backward compatibility
getApp(): Express {
  // Return minimal Express-like interface for backward compatibility
  return {
    use: () => {},
    listen: (port: number | string, callback?: () => void) => {
      if (callback) callback();
      return {} as unknown;
    },
    get: () => {},
    post: () => {},
    put: () => {},
    delete: () => {},
  } as unknown as Express;
}

// ✅ KEEP: Hono-specific methods
getHonoApp(): Hono {
  return this.app;
}

get handler() {
  return this.app.fetch;
}

// ✅ KEEP: Server lifecycle
listen(): Promise<number> {
  return new Promise((resolve) => {
    if (typeof process !== "undefined") {
      serve(
        {
          fetch: this.app.fetch,
          port: this.port as number,
        },
        () => {
          this.logger.log(`Server is running at http://localhost:${this.port}`);
          resolve(this.endCounter(this.initializer));
        },
      );
    } else {
      this.logger.log(`Edge runtime initialized on port ${this.port}`);
      resolve(this.port as number);
    }
  });
}
```

### **Phase 3: HttpTriggerAdapter Simplification (1 hour)**

#### **Update HttpTriggerAdapter.ts**
```typescript
// triggers/http/src/runner/HttpTriggerAdapter.ts
import type { Express } from "express";
import HonoHttpTrigger from "./HonoHttpTrigger";
import HttpTrigger from "./HttpTrigger";

export default class HttpTriggerAdapter {
  private useHono: boolean;
  private expressTrigger?: HttpTrigger;
  private honoTrigger?: HonoHttpTrigger;

  constructor(useHono = false) {
    this.useHono = useHono || process.env.USE_HONO === "true";

    // ✅ SIMPLIFIED: Both triggers now use BlokMiddleware internally
    if (this.useHono) {
      this.honoTrigger = new HonoHttpTrigger(); // Uses BlokMiddleware internally
    } else {
      this.expressTrigger = new HttpTrigger();   // Uses BlokMiddleware internally
    }
  }
  
  // ✅ All existing methods remain unchanged
  // Both triggers now share same business logic via BlokMiddleware
}
```

## 🧪 **TESTING STRATEGY**

### **Phase 1: Backward Compatibility Testing**
```typescript
// test/triggers/backward-compatibility.test.ts
describe('HttpTrigger Backward Compatibility', () => {
  let httpTrigger: HttpTrigger;
  let originalBehavior: any;
  
  beforeAll(async () => {
    // Test against baseline behavior before refactoring
    originalBehavior = await captureHttpTriggerBehavior();
  });
  
  beforeEach(() => {
    httpTrigger = new HttpTrigger(); // Now uses BlokMiddleware internally
  });

  it('should preserve exact same workflow execution behavior', async () => {
    const testWorkflow = {
      name: "test-workflow",
      trigger: { http: { method: "POST", path: "/test" } },
      steps: [{ name: "test", node: "mapper", type: "module" }],
      nodes: { test: { inputs: { model: { message: "Hello World" } } } }
    };
    
    const response = await request(httpTrigger.getApp())
      .post('/test-workflow')
      .send({ data: 'test' })
      .expect(200);
    
    expect(response.body).toEqual(originalBehavior.workflowResponse);
  });

  it('should preserve exact same remote node execution', async () => {
    const remoteNodeRequest = {
      Name: 'test-node',
      Message: 'base64EncodedWorkflow',
      Encoding: 'BASE64',
      Type: 'JSON'
    };
    
    const response = await request(httpTrigger.getApp())
      .post('/test-node')
      .set('x-nanoservice-execute-node', 'true')
      .send(remoteNodeRequest)
      .expect(200);
    
    expect(response.body).toEqual(originalBehavior.remoteNodeResponse);
  });

  it('should preserve exact same error handling behavior', async () => {
    const response = await request(httpTrigger.getApp())
      .post('/non-existent-workflow')
      .send({ data: 'test' })
      .expect(500);
    
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toEqual(originalBehavior.errorMessage);
  });

  it('should preserve all infrastructure endpoints', async () => {
    // Health check
    await request(httpTrigger.getApp())
      .get('/health-check')
      .expect(200)
      .expect('Online and ready for action 💪');
    
    // Metrics endpoint  
    await request(httpTrigger.getApp())
      .get('/metrics')
      .expect(200);
    
    // Static files
    await request(httpTrigger.getApp())
      .get('/public/test.txt')
      .expect(200);
  });
});
```

### **Phase 2: Consistency Testing**
```typescript
// test/triggers/consistency.test.ts  
describe('HttpTrigger vs BlokMiddleware Consistency', () => {
  let httpTrigger: HttpTrigger;
  let standaloneMiddleware: BlokMiddleware;
  let expressApp: Express;
  
  beforeEach(() => {
    httpTrigger = new HttpTrigger();
    
    standaloneMiddleware = new BlokMiddleware({
      workflowsPath: './test-workflows',
      nodesPath: './test-nodes'
    });
    
    expressApp = express();
    expressApp.use(express.json());
    expressApp.use('/workflows', standaloneMiddleware.getExpressMiddleware());
  });

  it('should produce identical workflow results', async () => {
    const testData = { message: 'test' };
    
    // HttpTrigger response (using middleware internally)
    const triggerResponse = await request(httpTrigger.getApp())
      .post('/test-workflow')
      .send(testData);
    
    // Standalone middleware response
    const middlewareResponse = await request(expressApp)
      .post('/workflows/test-workflow')
      .send(testData);
    
    expect(triggerResponse.body).toEqual(middlewareResponse.body);
    expect(triggerResponse.status).toEqual(middlewareResponse.status);
  });

  it('should handle remote node execution identically', async () => {
    const remoteRequest = createRemoteNodeRequest();
    
    const triggerResponse = await request(httpTrigger.getApp())
      .post('/test-node')
      .set('x-nanoservice-execute-node', 'true')
      .send(remoteRequest);
    
    const middlewareResponse = await request(expressApp)
      .post('/workflows/test-node')
      .set('x-nanoservice-execute-node', 'true')
      .send(remoteRequest);
    
    expect(triggerResponse.body).toEqual(middlewareResponse.body);
  });
});
```

### **Phase 3: Performance Testing**
```typescript
// test/triggers/performance.test.ts
describe('HttpTrigger Performance Impact', () => {
  it('should maintain same performance after refactoring', async () => {
    const httpTrigger = new HttpTrigger();
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 100; i++) {
      promises.push(
        request(httpTrigger.getApp())
          .post('/fast-workflow')
          .send({ iteration: i })
      );
    }
    
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    // Should complete 100 requests in reasonable time
    expect(duration).toBeLessThan(10000); // 10 seconds max
  });
});
```

## 📋 **MIGRATION GUIDE**

### **For Framework Users (Zero Changes Required)**
```typescript
// ✅ Existing code continues to work exactly the same
import App from '@blok-ts/http-trigger';

const app = new App();
await app.run();

// All behavior is identical - users see no difference
```

### **For Framework Developers**
```typescript
// Before: Complex HttpTrigger implementation
class HttpTrigger extends TriggerBase {
  // 500+ lines of workflow execution logic
}

// After: Simple HttpTrigger using BlokMiddleware
class HttpTrigger extends TriggerBase {
  private blokMiddleware: BlokMiddleware;
  
  constructor() {
    this.blokMiddleware = new BlokMiddleware(config);
  }
  
  listen() {
    // Server setup only
    this.app.use(this.blokMiddleware.getExpressMiddleware());
  }
}
```

## 🎯 **SUCCESS METRICS**

### **Code Quality Metrics**
- **Lines of Code Reduction**: Expect 40-60% reduction in HttpTrigger.ts and HonoHttpTrigger.ts
- **Code Duplication**: 0% duplication between triggers and middleware
- **Complexity Reduction**: Cyclomatic complexity reduced by ~50%

### **Maintenance Metrics**
- **Single Point of Change**: Business logic changes require updates in only one place
- **Test Coverage**: Maintain 95%+ test coverage with fewer total tests needed
- **Bug Consistency**: Fixes in BlokMiddleware automatically apply to all triggers

### **Performance Metrics**
- **Response Time**: ±2ms difference (within measurement variance)
- **Memory Usage**: Slight reduction due to code sharing
- **Cold Start**: No measurable impact

## 🚨 **RISK MITIGATION**

### **Backward Compatibility Risk**
- **Risk**: HttpTrigger API changes break existing deployments
- **Mitigation**: Comprehensive backward compatibility test suite
- **Validation**: All existing HttpTrigger functionality preserved

### **Performance Risk**
- **Risk**: Additional abstraction layer degrades performance  
- **Mitigation**: Performance benchmarking before and after
- **Validation**: Performance maintained within 2ms variance

### **Feature Parity Risk**
- **Risk**: Some edge cases not handled by middleware
- **Mitigation**: Exhaustive feature comparison and testing
- **Validation**: 100% feature parity validated

## 📅 **IMPLEMENTATION TIMELINE**

| Phase | Duration | Description |
|-------|----------|-------------|
| **Setup** | 30min | Project setup, dependency verification |
| **HttpTrigger Refactor** | 2h | Replace implementation with middleware |
| **HonoHttpTrigger Refactor** | 2h | Replace implementation with middleware |
| **Adapter Simplification** | 30min | Update HttpTriggerAdapter |
| **Testing** | 1h | Backward compatibility and consistency tests |
| **Documentation** | 30min | Update code comments and README |
| **TOTAL** | **6 hours** | **Single day implementation** |

## 💡 **LONG-TERM BENEFITS**

### **Framework Evolution**
- **New Server Types**: Easy to add FastAPI, Koa, Express v5, etc.
- **Edge Deployment**: BlokMiddleware works directly with edge runtimes
- **Protocol Support**: HTTP/3, WebSockets, Server-Sent Events become simpler

### **Developer Experience**  
- **Consistency**: Same behavior across all deployment modes
- **Testing**: Test business logic independently of server setup
- **Debugging**: Single codebase for workflow execution logic

### **Architecture Quality**
- **SOLID Principles**: Better separation of concerns
- **DRY Compliance**: Single source of truth for workflow logic
- **Maintainability**: Changes in one place benefit entire framework

## Definition of Done
- [ ] HttpTrigger refactored to use BlokMiddleware internally
- [ ] HonoHttpTrigger refactored to use BlokMiddleware internally  
- [ ] HttpTriggerAdapter updated to leverage shared middleware
- [ ] 100% backward compatibility maintained and tested
- [ ] All existing functionality preserved and validated
- [ ] Performance impact measured and within acceptable range
- [ ] Code duplication eliminated between triggers and middleware
- [ ] Comprehensive test coverage for consistency and compatibility

---

**This architectural inversion transforms the Blok framework from having duplicated workflow logic to a clean, maintainable architecture with a single source of truth for business logic while preserving complete backward compatibility.**
