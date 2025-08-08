# @blok-ts/http-middleware

HTTP middleware for integrating Blok workflows into Express.js and Hono applications.

[![npm version](https://badge.fury.io/js/@blok-ts%2Fhttp-middleware.svg)](https://badge.fury.io/js/@blok-ts%2Fhttp-middleware)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

The `@blok-ts/http-middleware` package enables existing Express.js and Hono applications to integrate Blok workflow capabilities seamlessly. Add powerful workflow orchestration to your applications without refactoring existing code.

## Features

- ✅ **Express.js & Hono Support**: Universal middleware for both frameworks
- ✅ **Zero Dependencies Conflict**: Optional peer dependencies for framework flexibility
- ✅ **Remote Node Execution**: Support for cross-language workflow execution
- ✅ **OpenTelemetry Integration**: Built-in metrics and tracing
- ✅ **Prefix-based Routing**: Configurable URL prefixes for workflow isolation
- ✅ **Environment Configuration**: Runtime and environment-based setup
- ✅ **TypeScript Support**: Full type safety and IntelliSense

## Quick Start

### Express.js with Registry Pattern (Recommended)

```bash
npm install @blok-ts/http-middleware express @blok-ts/api-call @blok-ts/if-else
```

```typescript
import express from 'express';
import { blokMiddleware } from '@blok-ts/http-middleware';
import ApiCall from '@blok-ts/api-call';
import IfElse from '@blok-ts/if-else';

const app = express();

// Step 1: Create nodes registry (following Express.js pattern)
const nodes = {
  '@blok-ts/api-call': new ApiCall(),
  '@blok-ts/if-else': new IfElse(),
};

// Step 2: Create workflows registry (following Express.js pattern)  
const workflows = {
  'my-workflow': myWorkflowDefinition,
  'data-processor': dataProcessorWorkflow,
};

// Step 3: Add Blok workflow capabilities
app.use('/workflows', blokMiddleware({
  nodes,
  workflows,
  enableMetrics: true
}));

// Your existing routes continue working
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log('Server with Blok workflows running on port 3000');
});
```

### Alternative: Auto-discovery Pattern

```typescript
// For backwards compatibility or CLI-generated projects
app.use('/workflows', blokMiddleware({
  nodesPath: './nodes',      // loads ./nodes/index.js
  workflowsPath: './workflows', // loads ./workflows/index.js
  enableMetrics: true
}));
```

### Hono

```bash
npm install @blok-ts/http-middleware hono
```

```typescript
import { Hono } from 'hono';
import { createHonoBlokMiddleware } from '@blok-ts/http-middleware';

const app = new Hono();

// Add Blok workflow capabilities
app.use('/workflows/*', createHonoBlokMiddleware({
  workflowsPath: './workflows',
  enableMetrics: true
}));

// Your existing routes continue working
app.get('/api/users', (c) => c.json({ users: [] }));

export default app;
```

## Usage Examples

### Basic Workflow Execution

Once the middleware is installed, you can execute workflows via HTTP:

```bash
# Execute a workflow
curl -X POST http://localhost:3000/workflows/data-processor \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello World"}'

# Response
{
  "success": true,
  "data": {
    "processed": "Hello World - Processed"
  },
  "executionId": "uuid-here"
}
```

### Remote Node Execution

Execute individual nodes remotely:

```bash
curl -X POST http://localhost:3000/workflows/my-node \
  -H "Content-Type: application/json" \
  -H "x-nanoservice-execute-node: true" \
  -d '{
    "Name": "my-node",
    "Message": "base64EncodedWorkflow",
    "Encoding": "BASE64",
    "Type": "JSON"
  }'
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `workflowsPath` | `string` | `undefined` | Path to workflows directory |
| `nodesPath` | `string` | `undefined` | Path to custom nodes directory |
| `enableMetrics` | `boolean` | `true` | Enable OpenTelemetry metrics |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `debug` | `boolean` | `false` | Enable debug logging |
| `prefix` | `string` | `''` | URL prefix for workflow routes |
| `env` | `Record<string, string>` | `{}` | Environment variable overrides |

### Advanced Configuration

```typescript
import { blokMiddleware } from '@blok-ts/http-middleware';

app.use('/api/blok', blokMiddleware({
  // Workflow and node paths
  workflowsPath: './custom-workflows',
  nodesPath: './custom-nodes',
  
  // Monitoring
  enableMetrics: true,
  debug: true,
  
  // Performance
  timeout: 60000, // 60 seconds
  
  // Environment overrides
  env: {
    NODE_ENV: 'production',
    CUSTOM_CONFIG: 'value'
  }
}));
```

## Integration Patterns

### Gradual Migration

Add Blok capabilities to existing applications incrementally:

```typescript
const app = express();

// Existing API routes
app.use('/api/v1', existingRoutes);

// New Blok-powered workflows
app.use('/api/workflows', blokMiddleware({
  workflowsPath: './workflows'
}));

// Both work simultaneously
```

### Microservices Pattern

Use Blok workflows as microservices from different applications:

```typescript
// Service A (Node.js + Express)
app.use('/workflows', blokMiddleware());

// Service B (Python + FastAPI) can call Service A workflows
// via HTTP to Service A's /workflows endpoints
```

## Framework Compatibility

### Express.js

- **Minimum Version**: 4.18.0+
- **TypeScript**: Full support with `@types/express`
- **Middleware Order**: Place after body parsing middleware

```typescript
app.use(express.json()); // Body parser first
app.use(cors()); // Other middleware
app.use('/workflows', blokMiddleware()); // Blok middleware
app.use('/api', apiRoutes); // Your routes
```

### Hono

- **Minimum Version**: 4.0.0+
- **Runtime Support**: Node.js, Cloudflare Workers, Vercel Edge
- **Pattern Matching**: Use `/*` for catch-all workflow routing

```typescript
app.use('/workflows/*', createHonoBlokMiddleware());
```

## Error Handling

The middleware provides comprehensive error handling:

```typescript
// Workflow execution errors
{
  "success": false,
  "error": "Node 'missing-node' not found",
  "executionId": "uuid-here"
}

// Middleware configuration errors
{
  "success": false,
  "error": "Invalid workflow configuration",
  "executionId": "uuid-here"
}

// Remote node execution errors
{
  "success": false,
  "error": "Invalid remote node execution request",
  "executionId": "uuid-here"
}
```

## Monitoring & Observability

### OpenTelemetry Metrics

Automatic metrics collection includes:

- `workflow_execution`: Successful workflow runs
- `workflow_errors`: Failed workflow runs  
- Request duration and performance metrics

### Headers

Every workflow execution includes tracking headers:

- `x-blok-execution-id`: Unique execution identifier
- `x-blok-execution-time`: Execution duration in milliseconds

## API Reference

### blokMiddleware(options?)

Creates Express.js middleware for Blok workflow execution.

**Parameters:**
- `options` (`MiddlewareOptions`): Configuration options

**Returns:** Express middleware function

### createHonoBlokMiddleware(options?)

Creates Hono middleware for Blok workflow execution.

**Parameters:**
- `options` (`MiddlewareOptions`): Configuration options

**Returns:** Hono middleware function

### BlokMiddleware Class

Advanced usage with direct class instantiation:

```typescript
import { BlokMiddleware } from '@blok-ts/http-middleware';

const middleware = new BlokMiddleware({
  workflowsPath: './workflows',
  enableMetrics: true
});

// Express
app.use('/workflows', middleware.createExpressMiddleware());

// Hono
app.use('/workflows/*', middleware.createHonoMiddleware());
```

## Migration Guide

### From Standalone Blok Server

If you're migrating from a standalone Blok HTTP trigger:

```typescript
// Before: Standalone server
// const server = new HttpTrigger();
// server.listen(4000);

// After: Integrated middleware
import express from 'express';
import { blokMiddleware } from '@blok-ts/http-middleware';

const app = express();
app.use('/workflows', blokMiddleware({
  // Same configuration as HttpTrigger
  workflowsPath: './workflows',
  nodesPath: './nodes'
}));

app.listen(3000); // Your existing port
```

### Adding to Existing Express App

```typescript
// Step 1: Install
// npm install @blok-ts/http-middleware

// Step 2: Add to existing app
import { blokMiddleware } from '@blok-ts/http-middleware';

// Your existing Express app
const app = express();
app.use(express.json());
app.use('/api', existingRoutes);

// Add Blok workflows
app.use('/workflows', blokMiddleware());

// Everything continues working!
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/deskree-inc/blok/issues)
- **Documentation**: [Blok Framework Docs](https://docs.blok.dev)
- **Community**: [Discord](https://discord.gg/blok)

---

Made with ❤️ by the Blok Framework Team
