# TASK-009: HTTP Middleware Package for Express.js Integration
**Master Plan Reference**: Section 🔗 Integration Tools - HTTP trigger as middleware for existing applications  
**Dependencies**: TASK-004 (Express to Hono migration simplifies dual framework support)
**Estimated Effort**: M (2 days) - Middleware wrapper development with Express + Hono compatibility
**Assigned To**: [To be assigned]
**Priority**: P1-High (Strategic for existing application integration and ecosystem adoption)

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
1. "Can an existing Express.js application add Blok workflow capabilities by installing one package and adding one line of middleware?"
2. "Can the middleware operate alongside existing Express middleware (auth, cors, logging) without conflicts?"
3. "Can teams gradually migrate specific routes to Blok workflows while keeping existing endpoints unchanged?"

## Current State Analysis

### Existing HTTP Trigger Architecture
**Base Implementation**: `triggers/http/src/runner/HttpTrigger.ts`
```typescript
export default class HttpTrigger extends TriggerBase {
  private app: Express = express();
  
  listen(): Promise<number> {
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(express.static("public"));
    this.app.use(["/:workflow", "/"], async (req: Request, res: Response) => {
      // Complete workflow execution logic
    });
  }
}
```

**Key Components to Extract**:
- Workflow resolution and execution
- Remote node execution detection
- Context creation from Express request
- Response formatting and error handling
- OpenTelemetry metrics integration

### Target Middleware Architecture
```typescript
// Express.js application integration
import express from 'express';
import { blokMiddleware } from '@blok-ts/http-middleware';

const app = express();

// Existing middleware
app.use(cors());
app.use(authMiddleware);

// Add Blok workflows
app.use('/workflows', blokMiddleware({
  workflowsPath: './workflows',
  nodesPath: './nodes',
  enableMetrics: true
}));

// Existing routes continue unchanged
app.get('/api/users', getUsersHandler);
```

## Implementation Approach

### Phase 1: Core Middleware Wrapper
**Target Directory**: `packages/http-middleware/`

**Package Structure**:
```
packages/http-middleware/
├── src/
│   ├── BlokMiddleware.ts
│   ├── adapters/
│   │   ├── ExpressAdapter.ts
│   │   └── HonoAdapter.ts
│   ├── config/
│   │   ├── MiddlewareConfig.ts
│   │   └── EnvironmentConfig.ts
│   ├── utils/
│   │   ├── RequestProcessor.ts
│   │   └── ResponseHandler.ts
│   └── index.ts
├── tests/
│   ├── express/
│   ├── hono/
│   └── integration/
├── examples/
│   ├── express-example/
│   ├── hono-example/
│   └── migration-guide/
├── package.json
├── tsconfig.json
└── README.md
```

**Core Middleware Implementation**:
```typescript
// packages/http-middleware/src/BlokMiddleware.ts
import type { Request, Response, NextFunction } from 'express';
import type { Context as HonoContext } from 'hono';
import { HttpTrigger } from '@blok-ts/http-trigger';
import type { MiddlewareConfig } from './config/MiddlewareConfig.js';
import { ExpressAdapter } from './adapters/ExpressAdapter.js';
import { HonoAdapter } from './adapters/HonoAdapter.js';

export class BlokMiddleware {
  private httpTrigger: HttpTrigger;
  private config: MiddlewareConfig;
  private adapter: ExpressAdapter | HonoAdapter;

  constructor(config: MiddlewareConfig, framework: 'express' | 'hono' = 'express') {
    this.config = this.resolveConfig(config);
    this.httpTrigger = new HttpTrigger({
      port: 0, // Not used in middleware mode
      nodeMap: this.loadNodeMap(),
      workflowsPath: this.config.workflowsPath,
      nodesPath: this.config.nodesPath
    });

    // Initialize appropriate adapter
    if (framework === 'express') {
      this.adapter = new ExpressAdapter(this.httpTrigger, this.config);
    } else {
      this.adapter = new HonoAdapter(this.httpTrigger, this.config);
    }
  }

  // Express.js middleware function
  getExpressMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      return this.adapter.handle(req, res, next);
    };
  }

  // Hono middleware function  
  getHonoMiddleware() {
    return (c: HonoContext, next: Function) => {
      return this.adapter.handle(c, next);
    };
  }

  private resolveConfig(config: MiddlewareConfig): MiddlewareConfig {
    // Merge provided config with environment variables
    return {
      workflowsPath: config.workflowsPath || process.env.BLOK_WORKFLOWS_PATH || './workflows',
      nodesPath: config.nodesPath || process.env.BLOK_NODES_PATH || './nodes',
      enableMetrics: config.enableMetrics !== false,
      enableRemoteExecution: config.enableRemoteExecution !== false,
      timeout: config.timeout || 30000,
      ...config
    };
  }

  private loadNodeMap() {
    // Load nodes and workflows from configured paths
    // Integration with existing HTTP trigger node loading logic
  }
}
```

### Phase 2: Express.js Adapter Implementation
**Target**: `packages/http-middleware/src/adapters/ExpressAdapter.ts`

```typescript
import type { Request, Response, NextFunction } from 'express';
import type { HttpTrigger } from '@blok-ts/http-trigger';
import type { MiddlewareConfig } from '../config/MiddlewareConfig.js';
import { RequestProcessor } from '../utils/RequestProcessor.js';
import { ResponseHandler } from '../utils/ResponseHandler.js';

export class ExpressAdapter {
  private requestProcessor: RequestProcessor;
  private responseHandler: ResponseHandler;

  constructor(
    private httpTrigger: HttpTrigger,
    private config: MiddlewareConfig
  ) {
    this.requestProcessor = new RequestProcessor(config);
    this.responseHandler = new ResponseHandler(config);
  }

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if request should be handled by Blok
      if (!this.shouldHandle(req)) {
        return next();
      }

      // Process request and create Blok context
      const context = await this.requestProcessor.createContextFromExpress(req);
      
      // Extract workflow name from path
      const workflowName = this.extractWorkflowName(req.path);
      
      // Check for remote node execution
      const isRemoteExecution = req.headers['x-nanoservice-execute-node'] === 'true';
      
      if (isRemoteExecution) {
        // Handle remote node execution
        const result = await this.httpTrigger.executeRemoteNode(context, req.body);
        await this.responseHandler.sendExpressResponse(res, result, context);
      } else {
        // Handle workflow execution
        const result = await this.httpTrigger.executeWorkflow(workflowName, context);
        await this.responseHandler.sendExpressResponse(res, result, context);
      }

    } catch (error) {
      // Error handling with proper HTTP status codes
      const errorResponse = this.responseHandler.formatError(error);
      res.status(errorResponse.status || 500).json(errorResponse);
    }
  }

  private shouldHandle(req: Request): boolean {
    // Determine if this request should be processed by Blok
    // Based on path matching and configuration
    return true; // Simplified - actual implementation would check path patterns
  }

  private extractWorkflowName(path: string): string {
    // Extract workflow name from request path
    // Remove middleware prefix and get workflow identifier
    const pathSegments = path.split('/').filter(Boolean);
    return pathSegments[pathSegments.length - 1] || 'default';
  }
}
```

### Phase 3: Hono Adapter Implementation
**Target**: `packages/http-middleware/src/adapters/HonoAdapter.ts`

```typescript
import type { Context as HonoContext } from 'hono';
import type { HttpTrigger } from '@blok-ts/http-trigger';
import type { MiddlewareConfig } from '../config/MiddlewareConfig.js';
import { RequestProcessor } from '../utils/RequestProcessor.js';
import { ResponseHandler } from '../utils/ResponseHandler.js';

export class HonoAdapter {
  private requestProcessor: RequestProcessor;
  private responseHandler: ResponseHandler;

  constructor(
    private httpTrigger: HttpTrigger,
    private config: MiddlewareConfig
  ) {
    this.requestProcessor = new RequestProcessor(config);
    this.responseHandler = new ResponseHandler(config);
  }

  async handle(c: HonoContext, next: Function): Promise<Response | void> {
    try {
      // Check if request should be handled by Blok
      if (!this.shouldHandle(c)) {
        return await next();
      }

      // Process request and create Blok context
      const context = await this.requestProcessor.createContextFromHono(c);
      
      // Extract workflow name from path
      const workflowName = this.extractWorkflowName(c.req.path);
      
      // Check for remote node execution
      const isRemoteExecution = c.req.header('x-nanoservice-execute-node') === 'true';
      
      if (isRemoteExecution) {
        // Handle remote node execution
        const requestBody = await c.req.json();
        const result = await this.httpTrigger.executeRemoteNode(context, requestBody);
        return this.responseHandler.sendHonoResponse(c, result, context);
      } else {
        // Handle workflow execution
        const result = await this.httpTrigger.executeWorkflow(workflowName, context);
        return this.responseHandler.sendHonoResponse(c, result, context);
      }

    } catch (error) {
      // Error handling with proper HTTP status codes
      const errorResponse = this.responseHandler.formatError(error);
      return c.json(errorResponse, errorResponse.status || 500);
    }
  }

  private shouldHandle(c: HonoContext): boolean {
    // Determine if this request should be processed by Blok
    return true; // Simplified - actual implementation would check path patterns
  }

  private extractWorkflowName(path: string): string {
    // Extract workflow name from request path
    const pathSegments = path.split('/').filter(Boolean);
    return pathSegments[pathSegments.length - 1] || 'default';
  }
}
```

### Phase 4: Configuration and Utilities
**Configuration Interface**: `packages/http-middleware/src/config/MiddlewareConfig.ts`

```typescript
export interface MiddlewareConfig {
  // Path configuration
  workflowsPath?: string;
  nodesPath?: string;
  
  // Feature toggles
  enableMetrics?: boolean;
  enableRemoteExecution?: boolean;
  
  // Performance settings
  timeout?: number;
  maxRequestSize?: string;
  
  // Security settings
  allowedOrigins?: string[];
  authenticationRequired?: boolean;
  
  // Logging configuration
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  logRequests?: boolean;
}

export interface EnvironmentConfig {
  BLOK_WORKFLOWS_PATH?: string;
  BLOK_NODES_PATH?: string;
  BLOK_ENABLE_METRICS?: string;
  BLOK_ENABLE_REMOTE_EXECUTION?: string;
  BLOK_TIMEOUT?: string;
  BLOK_LOG_LEVEL?: string;
}
```

**Request Processor**: `packages/http-middleware/src/utils/RequestProcessor.ts`

```typescript
import type { Request } from 'express';
import type { Context as HonoContext } from 'hono';
import type { Context as BlokContext } from '@blok-ts/runner';
import { v4 as uuid } from 'uuid';

export class RequestProcessor {
  constructor(private config: MiddlewareConfig) {}

  async createContextFromExpress(req: Request): Promise<BlokContext> {
    return {
      id: `middleware-${uuid()}`,
      request: {
        body: req.body || {},
        query: req.query as Record<string, string>,
        params: req.params || {},
        headers: req.headers as Record<string, string>,
        method: req.method,
        path: req.path,
        url: req.url
      },
      vars: {},
      logger: this.createLogger(),
      response: {
        data: null,
        contentType: 'application/json'
      }
    };
  }

  async createContextFromHono(c: HonoContext): Promise<BlokContext> {
    const body = c.req.header('content-type')?.includes('application/json')
      ? await c.req.json()
      : {};

    return {
      id: `middleware-${uuid()}`,
      request: {
        body,
        query: Object.fromEntries(c.req.queries()),
        params: c.req.param() as Record<string, string>,
        headers: Object.fromEntries(c.req.raw.headers.entries()),
        method: c.req.method,
        path: c.req.path,
        url: c.req.url
      },
      vars: {},
      logger: this.createLogger(),
      response: {
        data: null,
        contentType: 'application/json'
      }
    };
  }

  private createLogger() {
    const logLevel = this.config.logLevel || 'info';
    
    return {
      debug: (msg: string) => logLevel === 'debug' && console.debug(`[BLOK] ${msg}`),
      info: (msg: string) => ['debug', 'info'].includes(logLevel) && console.info(`[BLOK] ${msg}`),
      warn: (msg: string) => ['debug', 'info', 'warn'].includes(logLevel) && console.warn(`[BLOK] ${msg}`),
      error: (msg: string) => console.error(`[BLOK] ${msg}`)
    };
  }
}
```

**Response Handler**: `packages/http-middleware/src/utils/ResponseHandler.ts`

```typescript
import type { Response } from 'express';
import type { Context as HonoContext } from 'hono';
import type { Context as BlokContext } from '@blok-ts/runner';

export class ResponseHandler {
  constructor(private config: MiddlewareConfig) {}

  async sendExpressResponse(
    res: Response, 
    result: any, 
    context: BlokContext
  ): Promise<void> {
    // Set content type from context
    const contentType = context.response.contentType || 'application/json';
    res.setHeader('Content-Type', contentType);

    // Add custom headers if configured
    if (this.config.enableMetrics) {
      res.setHeader('X-Blok-Execution-Id', context.id);
      res.setHeader('X-Blok-Execution-Time', `${Date.now() - parseInt(context.id.split('-')[1])}`);
    }

    // Send response based on content type
    if (contentType === 'application/json') {
      res.status(200).json(result);
    } else {
      res.status(200).send(result);
    }
  }

  sendHonoResponse(
    c: HonoContext, 
    result: any, 
    context: BlokContext
  ): Response {
    const contentType = context.response.contentType || 'application/json';

    // Set headers
    const headers: Record<string, string> = {
      'Content-Type': contentType
    };

    if (this.config.enableMetrics) {
      headers['X-Blok-Execution-Id'] = context.id;
      headers['X-Blok-Execution-Time'] = `${Date.now() - parseInt(context.id.split('-')[1])}`;
    }

    // Return appropriate response
    if (contentType === 'application/json') {
      return c.json(result, 200, headers);
    } else {
      return c.body(result, 200, headers);
    }
  }

  formatError(error: Error) {
    return {
      success: false,
      error: {
        message: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString()
      },
      status: this.getHttpStatusFromError(error)
    };
  }

  private getHttpStatusFromError(error: Error): number {
    // Map common error types to HTTP status codes
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('timeout')) return 408;
    if (error.message.includes('validation')) return 400;
    return 500;
  }
}
```

## Package Integration and Usage

### Main Package Export
**Target**: `packages/http-middleware/src/index.ts`

```typescript
import { BlokMiddleware } from './BlokMiddleware.js';
import type { MiddlewareConfig } from './config/MiddlewareConfig.js';

// Simple function exports for easy usage
export function blokMiddleware(config: MiddlewareConfig = {}) {
  const middleware = new BlokMiddleware(config, 'express');
  return middleware.getExpressMiddleware();
}

export function createBlokMiddleware(
  framework: 'express' | 'hono',
  config: MiddlewareConfig = {}
) {
  const middleware = new BlokMiddleware(config, framework);
  
  if (framework === 'express') {
    return middleware.getExpressMiddleware();
  } else {
    return middleware.getHonoMiddleware();
  }
}

// Class exports for advanced usage
export { BlokMiddleware } from './BlokMiddleware.js';
export type { MiddlewareConfig } from './config/MiddlewareConfig.js';

// Framework-specific exports
export const express = {
  blokMiddleware: (config: MiddlewareConfig = {}) => blokMiddleware(config)
};

export const hono = {
  blokMiddleware: (config: MiddlewareConfig = {}) => createBlokMiddleware('hono', config)
};
```

### Usage Examples

**Basic Express.js Integration**:
```typescript
import express from 'express';
import { blokMiddleware } from '@blok-ts/http-middleware';

const app = express();

// Existing middleware
app.use(express.json());
app.use(cors());

// Add Blok workflows under /workflows prefix
app.use('/workflows', blokMiddleware({
  workflowsPath: './workflows',
  nodesPath: './nodes',
  enableMetrics: true,
  logLevel: 'info'
}));

// Existing routes continue unchanged
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(3000);
```

**Advanced Express.js Configuration**:
```typescript
import express from 'express';
import { createBlokMiddleware } from '@blok-ts/http-middleware';

const app = express();

// Authentication middleware
app.use('/workflows', authenticationMiddleware);

// Blok middleware with advanced config
app.use('/workflows', createBlokMiddleware('express', {
  workflowsPath: process.env.WORKFLOWS_PATH || './workflows',
  nodesPath: process.env.NODES_PATH || './nodes',
  enableMetrics: true,
  enableRemoteExecution: true,
  timeout: 45000,
  logLevel: 'debug',
  authenticationRequired: true
}));

// Different Blok instance for admin workflows
app.use('/admin/workflows', createBlokMiddleware('express', {
  workflowsPath: './admin-workflows',
  nodesPath: './admin-nodes',
  enableMetrics: false,
  timeout: 60000
}));
```

**Hono Integration** (future compatibility):
```typescript
import { Hono } from 'hono';
import { createBlokMiddleware } from '@blok-ts/http-middleware';

const app = new Hono();

// Add Blok workflows
app.use('/workflows/*', createBlokMiddleware('hono', {
  workflowsPath: './workflows',
  enableMetrics: true
}));

// Existing Hono routes
app.get('/api/health', (c) => c.json({ status: 'ok' }));
```

**Environment-based Configuration**:
```bash
# .env file
BLOK_WORKFLOWS_PATH=./production-workflows
BLOK_NODES_PATH=./production-nodes
BLOK_ENABLE_METRICS=true
BLOK_LOG_LEVEL=warn
BLOK_TIMEOUT=30000
```

```typescript
import { blokMiddleware } from '@blok-ts/http-middleware';

// Auto-detects configuration from environment
app.use('/blok', blokMiddleware());
```

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