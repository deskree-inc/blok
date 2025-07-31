# Blok Framework - AI Programming Guide
## Enterprise Workflow-Based Backend Framework Documentation

**Framework Version**: v3.0.0-pre (Next Week Release)  
**Documentation Version**: v3.0.0-docs.1  
**Last Updated**: 2025-01-27  
**Maintainer**: Blok Framework Team

**⚠️ Important Notes**:
- **gRPC Trigger**: Functional but not available in CLI (HTTP only)
- **MCP Trigger**: Feature incomplete/broken, not production ready

---

## 🎯 **What This Framework Does**

Blok is an enterprise workflow-based backend framework that enables AI-driven development through modular nodes following Single Responsibility Principle. It orchestrates backend logic using JSON/YAML workflows, supports multi-language runtime (TypeScript, Python), and provides native observability with OpenTelemetry and Prometheus integration.

**Key Innovation**: Instead of writing traditional backend APIs, you create reusable nodes and connect them through declarative workflows, enabling visual no-code tools and AI-assisted backend development.

---

## 🗺️ **Core Concept Mapping**

### **This framework is similar to**: 
Apache Airflow (workflow orchestration) + AWS Lambda (serverless functions) + Express.js (HTTP routing) + Microservices orchestration

### **Key differences**:
- **Node-based Architecture**: Every function is a self-contained node with JSON Schema validation
- **Dynamic Context System**: Advanced `js/` expressions allow JavaScript execution within JSON workflows
- **Multi-language Runtime**: Nodes can be written in TypeScript, Python, with more languages planned
- **Native Observability**: OpenTelemetry and Prometheus metrics built-in, no manual setup required
- **Workflow-First Design**: Business logic defined in JSON/YAML, not code files

### **Primary use cases**:
- **AI-Generated Backends**: Perfect for AI agents creating backend logic through workflow composition
- **Visual No-Code Tools**: Drag-and-drop workflow builders for non-technical users
- **Microservices Orchestration**: Node reusability across multiple services and workflows
- **Legacy System Integration**: HTTP-based node calls allow legacy systems to participate in workflows
- **Rapid Prototyping**: Quick backend creation through pre-built node composition

---

## ⚙️ **Installation & Setup**

### **Prerequisites**
```bash
# Required software versions
Node.js >= 18.0.0
npm >= 8.0.0
# Optional: Python 3.8+ (for Python nodes)
```

### **Installation**
```bash
# Create new Blok project
npx blokctl@latest create project

# Follow interactive prompts:
# - Project name: my-blok-project
# - Package manager: npm/yarn/pnpm (auto-detected)
# - Trigger type: http (only option in CLI - gRPC functional but manual setup)
# - Runtime: node (python3 commented out, in Alpha)
# - Install examples: YES/NO (examples require PostgreSQL)
```

### **Basic Configuration**
```bash
# Navigate to project directory
cd my-blok-project

# Critical Environment Variables (automatically created in .env.local)
PROJECT_PATH=/absolute/path/to/your/project
HTTP_PORT=4000
WORKFLOWS_PATH=/absolute/path/to/project/workflows
NODES_PATH=/absolute/path/to/project/src/nodes

# Python runtime (if enabled)
RUNTIME_PYTHON3_HOST=localhost
RUNTIME_PYTHON3_PORT=50051

# Start development server
npm run dev

# Test the setup
curl http://localhost:4000/health-check
```

### **Basic Usage Example**
```json
// workflows/json/hello-world.json
{
  "name": "Hello World Workflow",
  "description": "Simple workflow demonstrating basic node usage",
  "version": "1.0.0",
  "trigger": {
    "http": {
      "method": "GET",
      "path": "/hello",
      "accept": "application/json"
    }
  },
  "steps": [
    {
      "name": "greet-user",
      "node": "mapper",
      "type": "module"
    }
  ],
  "nodes": {
    "greet-user": {
      "inputs": {
        "model": {
          "message": "Hello from Blok Framework!",
          "timestamp": "js/new Date().toISOString()",
          "user": "${ctx.request.query.name || 'Anonymous'}"
        }
      }
    }
  }
}
```

---

## 🏗️ **Framework Architecture**

### **Overall Structure**
```
┌─────────────────────────────────────┐
│           HTTP/gRPC Triggers        │  ← Entry Points (MCP broken)
├─────────────────────────────────────┤
│          Workflow Engine            │  ← JSON/YAML Orchestration
│   ┌─────────────┬─────────────────┐ │
│   │   Steps     │   Context       │ │  ← Sequential Execution
│   │ Execution   │   Management    │ │
│   └─────────────┴─────────────────┘ │
├─────────────────────────────────────┤
│             Node Runtime            │  ← Multi-language Support
│   ┌─────────────┬─────────────────┐ │
│   │ TypeScript  │     Python      │ │  ← Node Implementations
│   │   Nodes     │     Nodes       │ │
│   └─────────────┴─────────────────┘ │
├─────────────────────────────────────┤
│          Observability Layer       │  ← OpenTelemetry + Prometheus
└─────────────────────────────────────┘
```

### **Key Architectural Principles**
- **Single Responsibility Nodes**: Each node performs one specific function with clear inputs/outputs
- **Declarative Workflows**: Business logic defined in JSON/YAML, not imperative code
- **Context-Driven Execution**: Rich context object (`ctx`) carries data through workflow steps
- **Schema Validation**: All node inputs/outputs validated using JSON Schema
- **Runtime Agnostic**: Nodes can be implemented in any supported language

---

## 💡 **Fundamental Concepts**

### **Concept 1: Node Loading System (Critical Architecture)**
**Similar to**: Module systems in Node.js with static imports vs dynamic require()  
**How it works**: Blok has two distinct loading mechanisms for nodes

**Node Types and Loading:**

#### **Type: "module" - Static Loading via Nodes.ts**
**Use Cases**: 
- **🌍 Global NPM packages** (published by Blok team) 
- Third-party NPM packages
- Local nodes created with `npx blokctl create node` (Class type)

```typescript
// triggers/http/src/Nodes.ts - EXPLICIT REGISTRATION REQUIRED
import ApiCall from "@blok-ts/api-call";           // Global NPM package ✅
import IfElse from "@blok-ts/if-else";             // Global NPM package ✅
import MyCustomNode from "./nodes/my-custom-node"; // Local project file
import Examples from "./nodes/examples";           // Local examples

const nodes: { [key: string]: NodeBase } = {
  "@blok-ts/api-call": new ApiCall(),              // Available as "module"
  "@blok-ts/if-else": new IfElse(),                // Available as "module"
  "my-custom-node": new MyCustomNode(),            // Available as "module"
  ...Examples,                                     // Spread multiple nodes
};

export default nodes;
```

##### **🌍 Global NPM Nodes Available for Production**

The Blok framework provides **pre-built, tested nodes** published to NPM:

###### **✅ `@blok-ts/api-call` (v0.1.29)** - Universal HTTP/API Client
```bash
npm install @blok-ts/api-call
```

**Configuration Example**:
```json
{
  "steps": [
    {
      "name": "fetch-user-data",
      "node": "@blok-ts/api-call", 
      "type": "module"
    }
  ],
  "nodes": {
    "fetch-user-data": {
      "inputs": {
        "url": "https://api.github.com/users/${ctx.request.params.username}",
        "method": "GET",
        "headers": {
          "Authorization": "Bearer ${ctx.vars.github_token}",
          "User-Agent": "Blok-Framework/1.0"
        },
        "responseType": "json"
      }
    }
  }
}
```

**Features**:
- ✅ All HTTP methods: GET, POST, PUT, PATCH, DELETE
- ✅ Dynamic URL/headers with context variables
- ✅ Multiple response types: json, text, blob, stream
- ✅ Built-in error handling and retries
- ✅ Body from previous step or explicit data

###### **✅ `@blok-ts/if-else` (v0.0.30)** - Advanced Conditional Logic
```bash
npm install @blok-ts/if-else
```

**Configuration Example**:
```json
{
  "steps": [
    {
      "name": "user-flow-control",
      "node": "@blok-ts/if-else",
      "type": "module"
    }
  ],
  "nodes": {
    "user-flow-control": {
      "inputs": {
        "conditions": [
          {
            "type": "if",
            "condition": "ctx.response.data.user.role === 'admin'",
            "steps": [
              { "name": "admin-dashboard", "node": "admin-panel", "type": "local" },
              { "name": "log-admin-access", "node": "audit-logger", "type": "module" }
            ]
          },
          {
            "type": "else",
            "steps": [
              { "name": "user-dashboard", "node": "user-panel", "type": "local" }
            ]
          }
        ]
      }
    }
  }
}
```

**Features**:
- ✅ JavaScript expressions in conditions
- ✅ Full context access (`ctx.response.data`, `ctx.vars`, `ctx.request`)
- ✅ Multiple if/else if/else branches  
- ✅ Nested step execution with different node types
- ✅ Complex boolean logic support

##### **❌ Nodes Not Available for Production**

###### **`@blok-ts/react`** - Development Template Only
- **Status**: Not published to NPM (`"private": true`)
- **Purpose**: Template/example for React UI nodes
- **Issue**: Incomplete configuration and documentation
- **Recommendation**: Use for learning/reference only

#### **Type: "local" - Dynamic Auto-Discovery**
```bash
# .env - NODES_PATH configuration
NODES_PATH=/absolute/path/to/project/src/nodes

# Directory structure for auto-discovery:
src/nodes/
├── user-validator/
│   └── index.ts          # Export default class
├── email-sender/
│   └── index.ts          # Export default class
└── data-processor/
    └── index.ts          # Export default class
```

```json
// Workflow usage - NO IMPORT NEEDED
{
  "name": "validate-user",
  "node": "user-validator",    // Looks for ${NODES_PATH}/user-validator/index.ts
  "type": "local"              // Auto-discovered, not in Nodes.ts
}
```

#### **Type: "runtime.python3" - External Runtime via gRPC**
```json
// Python nodes run in separate process
{
  "name": "ml-processor", 
  "node": "sentiment-analysis",
  "type": "runtime.python3"     // Communicates via gRPC
}
```

### **Concept 2: Workflow Loading System**
**Similar to**: Static imports vs dynamic file loading  
**How it works**: Workflows can be loaded statically (TypeScript) or dynamically (JSON/YAML/TOML)

#### **File-based Workflows - Dynamic Discovery**
```bash
# .env - WORKFLOWS_PATH configuration  
WORKFLOWS_PATH=/absolute/path/to/project/workflows

# Auto-discovered workflow files:
workflows/
├── json/
│   ├── user-registration.json     # Available at runtime
│   └── data-processing.json       # Available at runtime
├── yaml/
│   └── api-gateway.yaml           # Available at runtime
└── toml/
    └── config-manager.toml        # Available at runtime
```

#### **TypeScript Workflows - Static Registration**
```typescript
// triggers/http/src/Workflows.ts - EXPLICIT IMPORT REQUIRED
import countriesHelper from "./workflows/countries-helper";
import dataProcessor from "./workflows/data-processor";

const workflows: Workflows = {
  "countries-helper": countriesHelper,        // Must be imported
  "data-processor": dataProcessor,            // Must be imported
};

export default workflows;
```

### **Concept 3: Node Implementation (Blok Functions)**
**Similar to**: AWS Lambda functions, Azure Functions, or Google Cloud Functions  
**How it works**: Self-contained units of business logic with typed inputs and outputs

**Code example**:
```typescript
// src/nodes/examples/user-validator.ts
import { type INodeBlokResponse, NodeBlok, NodeBlokResponse } from "@blok-ts/runner";
import { type Context, GlobalError } from "@blok-ts/runner";

type UserValidatorInputs = {
  email: string;
  age: number;
  role?: string;
};

export default class UserValidator extends NodeBlok<UserValidatorInputs> {
  constructor() {
    super();
    
    // Input validation schema
    this.inputSchema = {
      type: "object",
      properties: {
        email: { type: "string", format: "email" },
        age: { type: "number", minimum: 0, maximum: 120 },
        role: { type: "string", enum: ["admin", "user", "guest"], default: "user" }
      },
      required: ["email", "age"]
    };
    
    // Output schema
    this.outputSchema = {
      type: "object",
      properties: {
        isValid: { type: "boolean" },
        errors: { type: "array", items: { type: "string" } },
        normalizedData: { type: "object" }
      }
    };
  }

  async handle(ctx: Context, inputs: UserValidatorInputs): Promise<INodeBlokResponse> {
    const response = new NodeBlokResponse();

    try {
      const errors: string[] = [];
      
      // Validation logic
      if (inputs.age < 18) errors.push("User must be 18 or older");
      if (!inputs.email.includes("@")) errors.push("Invalid email format");
      
      const isValid = errors.length === 0;
      
      response.setSuccess({
        isValid,
        errors,
        normalizedData: {
          email: inputs.email.toLowerCase(),
          age: inputs.age,
          role: inputs.role || "user"
        }
      });
    } catch (error: unknown) {
      const nodeError = new GlobalError((error as Error).message);
      nodeError.setCode(500);
      nodeError.setName("UserValidator");
      response.setError(nodeError);
    }

    return response;
  }
}
```

### **Concept 2: Workflows (Orchestration)**
**Similar to**: GitHub Actions workflows, Apache Airflow DAGs, AWS Step Functions  
**How it works**: JSON/YAML files that define the sequence and configuration of node execution

**Code example**:
```json
{
  "name": "User Registration Workflow",
  "description": "Complete user registration with validation and storage",
  "version": "1.0.0",
  "trigger": {
    "http": {
      "method": "POST",
      "path": "/register",
      "accept": "application/json"
    }
  },
  "steps": [
    {
      "name": "validate-user",
      "node": "user-validator",
      "type": "module",
      "set_var": true
    },
    {
      "name": "conditional-save",
      "node": "@blok-ts/if-else",
      "type": "module"
    }
  ],
  "nodes": {
    "validate-user": {
      "inputs": {
        "email": "${ctx.request.body.email}",
        "age": "${ctx.request.body.age}",
        "role": "${ctx.request.body.role}"
      }
    },
    "conditional-save": {
      "conditions": [
        {
          "type": "if",
          "condition": "ctx.vars['validate-user'].isValid === true",
          "steps": [
            {
              "name": "save-user",
              "node": "database-save",
              "type": "module"
            }
          ]
        },
        {
          "type": "else",
          "steps": [
            {
              "name": "return-errors",
              "node": "error-response",
              "type": "module"
            }
          ]
        }
      ]
    },
    "save-user": {
      "inputs": {
        "table": "users",
        "data": "js/ctx.vars['validate-user'].normalizedData"
      }
    },
    "return-errors": {
      "inputs": {
        "status": 400,
        "errors": "js/ctx.vars['validate-user'].errors"
      }
    }
  }
}
```

### **Concept 3: Dynamic Context System**
**Similar to**: Handlebars/Mustache templating + JavaScript eval functionality  
**How it works**: **Stateless injection/return pattern** with direct memory access for maximum performance

#### **Context Flow Architecture**
```
Runner → injects context → Node → modifies context → returns context → Runner
         ↓ Next Step ↓
Runner → passes updated context → Next Node → modifies → returns → Runner
```

**Key Performance Insights**:
- **Direct Memory Access**: Context expressions work on JavaScript objects in memory, not string parsing
- **Zero Parsing Overhead**: `${}` and `js/` evaluate native JavaScript objects directly  
- **Stateless Design**: Each node receives complete context, processes, and returns modified version
- **Remote Consistency**: Context serialization via BASE64 maintains identical behavior for remote nodes

**Code example**:
```json
{
  "nodes": {
    "example-context-usage": {
      "inputs": {
        // String interpolation - Direct memory access (strings only)
        "user_id": "${ctx.request.body.id}",
        "greeting": "Hello ${ctx.request.body.name}!",
        "deep_nested": "${ctx.request.body.user.profile.settings.theme}",
        
        // JavaScript execution - Full object manipulation (any type)
        "user_data": "js/ctx.request.body",
        "formatted_date": "js/new Date().toISOString()",
        "conditional_value": "js/ctx.request.body.premium ? 'premium_user' : 'regular_user'",
        "processed_array": "js/ctx.response.data.users.map(u => u.id)",
        "validated_json": "js/JSON.parse(ctx.request.body.config || '{}')",
        "safe_access": "js/ctx.vars['previous-step']?.data?.results || []",
        
        // Complex logic with native JavaScript performance
        "calculated_discount": "js/ctx.request.body.age > 65 ? 0.1 : (ctx.request.body.student ? 0.05 : 0)",
        "environment_config": "js/process.env.NODE_ENV === 'production' ? ctx.config.prod : ctx.config.dev",
        "complex_transformation": "js/ctx.data.results.filter(r => r.status === 'active').map(r => ({ id: r.id, score: r.metrics.performance * 0.8 }))"
      }
    }
  }
}
```

#### **Context Memory Efficiency**
- **No String Parsing**: Context evaluation uses direct JavaScript object access
- **Native Performance**: Nested object access has standard JavaScript performance
- **Memory Safe**: Objects remain in memory during workflow execution
- **Type Preservation**: `js/` expressions return actual JavaScript types (objects, arrays, primitives)

---

## 🛠️ **Essential Tasks for AI Programming**

### **Task 1: Creating Nodes - Understanding the CLI Options**
**Equivalent to**: Creating serverless functions with different deployment strategies  
**When to use**: Building reusable business logic components  

**CLI Command Analysis**:
```bash
# Generate node template
npx blokctl@latest create node

# Interactive prompts:
# 1. Node name: "my-validator"
# 2. Package manager: npm/yarn/pnpm (auto-detected)
# 3. Runtime: "Typescript" (Python3 in Alpha, commented out)
# 4. Type: "Module" or "Class" 
# 5. Template: "Class" or "UI" (EJS + ReactJS + TailwindCSS)
```

**Understanding CLI Options**:

#### **Node Type: "Module" vs "Class"**
```bash
# Type: "Module" - Creates complete module structure
src/nodes/my-validator/
├── package.json          # Individual package
├── tsconfig.json         # TypeScript config
├── index.ts              # Main node file
├── test/
│   └── index.test.ts     # Test files
└── dist/                 # Build output

# Type: "Class" - Creates only class files
src/nodes/my-validator/
└── index.ts              # Just the node class file
```

#### **Template: "Class" vs "UI"**
```bash
# Template: "Class" - Basic node
├── index.ts              # NodeBlok class only

# Template: "UI" - Node with interface
├── index.ts              # NodeBlok class
├── inputSchema.ts        # Input validation
├── index.html            # HTML template
└── app/
    └── index.jsx         # React component
```

**Implementation Example**:

```typescript
// src/nodes/api-client/index.ts
import { type INodeBlokResponse, NodeBlok, NodeBlokResponse } from "@blok-ts/runner";
import { type Context, GlobalError } from "@blok-ts/runner";

type ApiClientInputs = {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
};

export default class ApiClient extends NodeBlok<ApiClientInputs> {
  constructor() {
    super();
    
    this.inputSchema = {
      type: "object",
      properties: {
        url: { type: "string", format: "uri" },
        method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE"] },
        headers: { type: "object" },
        body: {},
        timeout: { type: "number", minimum: 1000, maximum: 30000, default: 5000 }
      },
      required: ["url", "method"]
    };
    
    this.outputSchema = {
      type: "object",
      properties: {
        status: { type: "number" },
        data: {},
        headers: { type: "object" }
      }
    };
  }

  async handle(ctx: Context, inputs: ApiClientInputs): Promise<INodeBlokResponse> {
    const response = new NodeBlokResponse();

    try {
      const fetchOptions: RequestInit = {
        method: inputs.method,
        headers: {
          'Content-Type': 'application/json',
          ...inputs.headers
        },
        signal: AbortSignal.timeout(inputs.timeout || 5000)
      };

      if (inputs.body && inputs.method !== 'GET') {
        fetchOptions.body = JSON.stringify(inputs.body);
      }

      const apiResponse = await fetch(inputs.url, fetchOptions);
      const data = await apiResponse.json();

      response.setSuccess({
        status: apiResponse.status,
        data: data,
        headers: Object.fromEntries(apiResponse.headers.entries())
      });
    } catch (error: unknown) {
      const nodeError = new GlobalError(`API call failed: ${(error as Error).message}`);
      nodeError.setCode(500);
      nodeError.setName("ApiClient");
      response.setError(nodeError);
    }

    return response;
  }
}
```

### **Task 2: Choosing Node Types - Module vs Local**
**Equivalent to**: Deciding between static linking vs dynamic loading  
**When to use**: Based on distribution, performance, and development needs  

**Decision Matrix**:

#### **Use Type: "module" when:**
- ✅ Node will be reused across multiple projects (NPM packages)
- ✅ Node requires complex dependencies or build process
- ✅ Performance is critical (faster loading, pre-instantiated)
- ✅ Node is stable and rarely changes
- ✅ You want strong typing and IDE support

```typescript
// Step 1: Create and register in Nodes.ts
import MyReusableNode from "@company/my-reusable-node"; // NPM package
import LocalValidator from "./nodes/user-validator";     // Local file

const nodes = {
  "@company/my-reusable-node": new MyReusableNode(),
  "user-validator": new LocalValidator(),
};

// Step 2: Use in workflow
{
  "name": "validate-input",
  "node": "user-validator",    // Must be registered in Nodes.ts
  "type": "module"             // Static loading
}
```

#### **Use Type: "local" when:**
- ✅ **Multi-container deployments** (Docker/Kubernetes environments)
- ✅ **Shared node folders** (HTTP + gRPC triggers sharing same nodes)
- ✅ **Monolithic modular installations** (single deployment, multiple triggers)
- ✅ **Continuous deployment** (GitHub Actions deploying only nodes/workflows)
- ✅ **Test environments** (where triggers stay running, only nodes update)
- ✅ **Rapid prototyping** and development
- ✅ **Hot-reloading** during development
- ✅ **Dynamic plugin architecture**

```bash
# Step 1: Create node (no registration needed)
src/nodes/
└── shared-processor/
    └── index.ts              # Auto-discovered

# Step 2: Use in workflows from ANY trigger
# HTTP Trigger Container:
{
  "name": "process-via-http",
  "node": "shared-processor",   # Auto-discovered from NODES_PATH
  "type": "local"               # Dynamic loading
}

# gRPC Trigger Container (same nodes folder):
{
  "name": "process-via-grpc", 
  "node": "shared-processor",   # Same node, different trigger
  "type": "local"               # Dynamic loading
}
```

**Production Deployment Pattern**:
```yaml
# docker-compose.yml - Multiple triggers, shared nodes
version: '3.8'
services:
  http-trigger:
    image: blok-http-trigger
    volumes:
      - ./src/nodes:/app/nodes     # Shared nodes folder
      - ./workflows:/app/workflows # Shared workflows folder
    environment:
      - NODES_PATH=/app/nodes
      
  grpc-trigger:
    image: blok-grpc-trigger  
    volumes:
      - ./src/nodes:/app/nodes     # Same nodes folder
      - ./workflows:/app/workflows # Same workflows folder
    environment:
      - NODES_PATH=/app/nodes
```

### **Task 3: Creating Workflows - File vs TypeScript**
**Equivalent to**: Choosing between configuration files vs programmatic APIs  
**When to use**: Based on complexity, tooling, and team preferences  

#### **File-based Workflows (JSON/YAML/TOML) - Recommended for AI**
```bash
# Create workflow file
npx blokctl@latest create workflow
# Creates: workflows/json/workflow-name.json

# Uses this template:
{
  "name": "",
  "description": "",
  "version": "1.0.0",
  "trigger": {
    "http": {
      "method": "GET",
      "path": "/",
      "accept": "application/json"
    }
  },
  "steps": [
    {
      "name": "node-name",
      "node": "node-module-name",
      "type": "module"
    }
  ],
  "nodes": {
    "name": {
      "inputs": {}
    }
  }
}
```

**When to use File-based Workflows:**
- ✅ **AI-Generated Workflows** (easier for AI to create/modify JSON)
- ✅ **Visual/No-code Tools** (can read/write JSON directly)
- ✅ **Dynamic Configuration** (can be modified without rebuilds)
- ✅ **Simple to Complex Workflows** (declarative approach)

#### **TypeScript Workflows - Programmatic Control**
```typescript
// Must be registered in triggers/http/src/Workflows.ts
import { AddElse, AddIf, type StepHelper, Workflow } from "@blok-ts/runner";

const userApiWorkflow: StepHelper = Workflow({
  name: "User Management API",
  version: "1.0.0",
  description: "RESTful user operations"
})
.addTrigger("http", {
  method: "*",
  path: "/users/:action?/:id?",
  accept: "application/json"
})
.addStep({
  name: "validate-request",
  node: "request-validator",
  type: "local",                    // Can use local nodes
  inputs: {
    required_fields: ["action"],
    allowed_actions: ["create", "update", "delete", "list"]
  }
});

export default userApiWorkflow;
```

**When to use TypeScript Workflows:**
- ✅ **Complex Conditional Logic** (easier with helper classes)
- ✅ **Dynamic Workflow Generation** (programmatic construction)
- ✅ **Strong Typing** (compile-time validation)
- ✅ **IDE Support** (autocomplete, refactoring)
- ✅ **Code Reuse** (workflow templates and inheritance)

### **Task 4: Complete Workflow Implementation Example**

```json
// workflows/json/user-onboarding.json
{
  "name": "User Onboarding Process",
  "description": "Complete user onboarding with email verification and profile setup",
  "version": "1.0.0",
  "trigger": {
    "http": {
      "method": "POST",
      "path": "/onboard",
      "accept": "application/json"
    }
  },
  "steps": [
    {
      "name": "validate-input",
      "node": "input-validator",
      "type": "module",
      "set_var": true
    },
    {
      "name": "check-existing-user",
      "node": "database-query",
      "type": "module",
      "set_var": true
    },
    {
      "name": "process-registration",
      "node": "@blok-ts/if-else",
      "type": "module"
    }
  ],
  "nodes": {
    "validate-input": {
      "inputs": {
        "email": "${ctx.request.body.email}",
        "password": "${ctx.request.body.password}",
        "firstName": "${ctx.request.body.firstName}",
        "lastName": "${ctx.request.body.lastName}"
      }
    },
    "check-existing-user": {
      "inputs": {
        "query": "SELECT id FROM users WHERE email = ?",
        "params": ["${ctx.request.body.email}"]
      }
    },
    "process-registration": {
      "conditions": [
        {
          "type": "if",
          "condition": "ctx.vars['check-existing-user'].data.length === 0 && ctx.vars['validate-input'].isValid",
          "steps": [
            {
              "name": "create-user",
              "node": "database-insert",
              "type": "module",
              "set_var": true
            },
            {
              "name": "send-welcome-email",
              "node": "email-sender",
              "type": "module"
            },
            {
              "name": "generate-response",
              "node": "mapper",
              "type": "module"
            }
          ]
        },
        {
          "type": "else",
          "steps": [
            {
              "name": "error-response",
              "node": "error-handler",
              "type": "module"
            }
          ]
        }
      ]
    },
    "create-user": {
      "inputs": {
        "table": "users",
        "data": {
          "email": "${ctx.request.body.email}",
          "password_hash": "js/hashPassword(ctx.request.body.password)",
          "first_name": "${ctx.request.body.firstName}",
          "last_name": "${ctx.request.body.lastName}",
          "created_at": "js/new Date().toISOString()",
          "status": "pending_verification"
        }
      }
    },
    "send-welcome-email": {
      "inputs": {
        "to": "${ctx.request.body.email}",
        "template": "welcome",
        "data": {
          "user_name": "${ctx.request.body.firstName}",
          "verification_link": "js/generateVerificationLink(ctx.vars['create-user'].insertId)"
        }
      }
    },
    "generate-response": {
      "inputs": {
        "model": {
          "success": true,
          "message": "User registered successfully",
          "user_id": "js/ctx.vars['create-user'].insertId",
          "next_step": "email_verification"
        }
      }
    },
    "error-response": {
      "inputs": {
        "status": 400,
        "error": "js/ctx.vars['check-existing-user'].data.length > 0 ? 'Email already registered' : 'Invalid input data'",
        "details": "js/ctx.vars['validate-input'].errors || []"
      }
    }
  }
}
```

### **Task 5: Using TypeScript Workflow Helpers**
**Equivalent to**: Programmatic workflow builders like Serverless Framework or Pulumi  
**When to use**: When you need dynamic workflows or complex conditional logic  

**Implementation**:
```typescript
// src/workflows/user-management.ts
import { AddElse, AddIf, type StepHelper, Workflow } from "@blok-ts/runner";

const userManagementWorkflow: StepHelper = Workflow({
  name: "User Management API",
  version: "1.0.0",
  description: "RESTful user management with CRUD operations"
})
.addTrigger("http", {
  method: "*",
  path: "/users/:action?/:id?",
  accept: "application/json"
})
.addCondition({
  node: {
    name: "route-handler",
    node: "@blok-ts/if-else",
    type: "module"
  },
  conditions: () => {
    return [
      // GET /users - List all users
      new AddIf('ctx.request.method === "GET" && !ctx.request.params.action')
        .addStep({
          name: "list-users",
          node: "database-query",
          type: "module",
          inputs: {
            query: "SELECT id, email, first_name, last_name, created_at FROM users WHERE status = 'active'",
            params: []
          }
        })
        .build(),
        
      // GET /users/:id - Get specific user  
      new AddIf('ctx.request.method === "GET" && ctx.request.params.action && !isNaN(Number(ctx.request.params.action))')
        .addStep({
          name: "get-user",
          node: "database-query", 
          type: "module",
          inputs: {
            query: "SELECT * FROM users WHERE id = ? AND status = 'active'",
            params: ["${ctx.request.params.action}"]
          }
        })
        .build(),
        
      // POST /users - Create new user
      new AddIf('ctx.request.method === "POST"')
        .addStep({
          name: "validate-user-data",
          node: "user-validator",
          type: "module",
          set_var: true
        })
        .addStep({
          name: "create-user-conditional",
          node: "@blok-ts/if-else",
          type: "module"
        })
        .build(),
        
      // PUT /users/:id - Update user
      new AddIf('ctx.request.method === "PUT" && ctx.request.params.action')
        .addStep({
          name: "update-user",
          node: "database-update",
          type: "module",
          inputs: {
            table: "users",
            where: { id: "${ctx.request.params.action}" },
            data: "js/ctx.request.body"
          }
        })
        .build(),
        
      // DELETE /users/:id - Soft delete user
      new AddIf('ctx.request.method === "DELETE" && ctx.request.params.action')
        .addStep({
          name: "delete-user",
          node: "database-update",
          type: "module",
          inputs: {
            table: "users",
            where: { id: "${ctx.request.params.action}" },
            data: { status: "deleted", deleted_at: "js/new Date().toISOString()" }
          }
        })
        .build(),
        
      // Default - Method not allowed
      new AddElse()
        .addStep({
          name: "method-not-allowed",
          node: "error-handler",
          type: "module",
          inputs: {
            status: 405,
            error: "Method not allowed",
            allowed_methods: ["GET", "POST", "PUT", "DELETE"]
          }
        })
        .build()
    ];
  }
});

export default userManagementWorkflow;
```

### **Task 6: Advanced Context Manipulation**
**Equivalent to**: Middleware processing in Express.js or transformation steps in ETL pipelines  
**When to use**: When you need to transform, filter, or manipulate data between workflow steps  

**Implementation**:
```json
{
  "name": "Data Processing Pipeline",
  "description": "Advanced data transformation and filtering workflow",
  "version": "1.0.0",
  "trigger": {
    "http": {
      "method": "POST",
      "path": "/process-data",
      "accept": "application/json"
    }
  },
  "steps": [
    {
      "name": "fetch-raw-data",
      "node": "api-client",
      "type": "module",
      "set_var": true
    },
    {
      "name": "transform-data",
      "node": "mapper",
      "type": "module",
      "set_var": true
    },
    {
      "name": "filter-and-process",
      "node": "array-processor",
      "type": "module",
      "set_var": true
    },
    {
      "name": "generate-report",
      "node": "report-generator",
      "type": "module"
    }
  ],
  "nodes": {
    "fetch-raw-data": {
      "inputs": {
        "url": "${ctx.request.body.source_url}",
        "method": "GET",
        "headers": {
          "Authorization": "Bearer ${ctx.request.body.api_token}",
          "Accept": "application/json"
        },
        "timeout": 10000
      }
    },
    "transform-data": {
      "inputs": {
        "model": {
          "raw_count": "js/ctx.vars['fetch-raw-data'].data.length",
          "transformed_items": "js/ctx.vars['fetch-raw-data'].data.map(item => ({...item, processed_at: new Date().toISOString(), category: item.type?.toUpperCase() || 'UNKNOWN'}))",
          "metadata": {
            "source": "${ctx.request.body.source_url}",
            "processed_by": "blok-framework",
            "timestamp": "js/new Date().toISOString()"
          }
        }
      }
    },
    "filter-and-process": {
      "inputs": {
        "items": "js/ctx.vars['transform-data'].transformed_items",
        "filters": {
          "min_date": "${ctx.request.body.min_date}",
          "categories": "js/ctx.request.body.categories || []",
          "status": "active"
        },
        "operations": [
          {
            "type": "filter",
            "condition": "js/item => item.status === 'active' && (!ctx.request.body.min_date || new Date(item.created_at) >= new Date(ctx.request.body.min_date))"
          },
          {
            "type": "group_by",
            "field": "category"
          },
          {
            "type": "aggregate",
            "functions": ["count", "sum:amount", "avg:score"]
          }
        ]
      }
    },
    "generate-report": {
      "inputs": {
        "template": "data_processing_report",
        "data": {
          "summary": {
            "total_items": "js/ctx.vars['transform-data'].raw_count",
            "processed_items": "js/ctx.vars['filter-and-process'].filtered_count",
            "categories": "js/Object.keys(ctx.vars['filter-and-process'].grouped_data)",
            "processing_time": "js/Date.now() - ctx.start_time"
          },
          "details": "js/ctx.vars['filter-and-process'].grouped_data",
          "metadata": "js/ctx.vars['transform-data'].metadata"
        },
        "format": "${ctx.request.body.output_format || 'json'}"
      }
    }
  }
}
```

### **Task 7: Error Handling and Recovery Patterns**
**Equivalent to**: Try-catch blocks with circuit breakers and retry logic  
**When to use**: Building resilient workflows that handle failures gracefully

#### **Core Error Handling Architecture**
Blok uses a **fail-fast architecture** for predictable and debuggable error handling:

```
Node.execute() → throws error → Workflow terminates → HTTP 500 + JSON details
```

**Key Error Handling Principles**:
- **Fail-Fast**: Single node failure terminates entire workflow immediately
- **No Automatic Recovery**: No built-in retry mechanisms or error recovery
- **Structured Responses**: HTTP 500 status code with detailed JSON error information
- **Clean State**: Failed workflows don't leave partial state changes
- **Debugging Friendly**: Clear error propagation with node identification

**Basic Error Response Format**:
```json
{
  "error": {
    "message": "API call failed: Connection timeout",
    "code": 500,
    "name": "ApiClient",
    "step": "external-api-call",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```  

**Implementation**:
```json
{
  "name": "Resilient API Integration",
  "description": "API integration with error handling, retries, and fallback strategies",
  "version": "1.0.0",
  "trigger": {
    "http": {
      "method": "POST", 
      "path": "/integrate/:service",
      "accept": "application/json"
    }
  },
  "steps": [
    {
      "name": "validate-request",
      "node": "request-validator",
      "type": "module",
      "set_var": true
    },
    {
      "name": "primary-integration",
      "node": "@blok-ts/if-else",
      "type": "module"
    }
  ],
  "nodes": {
    "validate-request": {
      "inputs": {
        "service": "${ctx.request.params.service}",
        "payload": "js/ctx.request.body",
        "required_fields": ["endpoint", "method"],
        "allowed_services": ["payment", "notification", "analytics"]
      }
    },
    "primary-integration": {
      "conditions": [
        {
          "type": "if",
          "condition": "ctx.vars['validate-request'].isValid",
          "steps": [
            {
              "name": "attempt-primary-call",
              "node": "api-client-with-retry",
              "type": "module",
              "set_var": true
            },
            {
              "name": "handle-response",
              "node": "@blok-ts/if-else",
              "type": "module"
            }
          ]
        },
        {
          "type": "else",
          "steps": [
            {
              "name": "validation-error",
              "node": "error-handler",
              "type": "module"
            }
          ]
        }
      ]
    },
    "attempt-primary-call": {
      "inputs": {
        "url": "${ctx.request.body.endpoint}",
        "method": "${ctx.request.body.method}",
        "headers": "js/ctx.request.body.headers || {}",
        "body": "js/ctx.request.body.payload",
        "retry_config": {
          "max_attempts": 3,
          "backoff_multiplier": 2,
          "initial_delay": 1000,
          "max_delay": 10000
        },
        "timeout": 15000
      }
    },
    "handle-response": {
      "conditions": [
        {
          "type": "if",
          "condition": "ctx.vars['attempt-primary-call'].status >= 200 && ctx.vars['attempt-primary-call'].status < 300",
          "steps": [
            {
              "name": "success-response",
              "node": "mapper",
              "type": "module"
            },
            {
              "name": "log-success",
              "node": "logger",
              "type": "module"
            }
          ]
        },
        {
          "type": "if", 
          "condition": "ctx.vars['attempt-primary-call'].status >= 500",
          "steps": [
            {
              "name": "try-fallback",
              "node": "fallback-handler",
              "type": "module",
              "set_var": true
            },
            {
              "name": "fallback-response",
              "node": "@blok-ts/if-else",
              "type": "module"
            }
          ]
        },
        {
          "type": "else",
          "steps": [
            {
              "name": "client-error-response",
              "node": "error-handler",
              "type": "module"
            }
          ]
        }
      ]
    },
    "success-response": {
      "inputs": {
        "model": {
          "success": true,
          "service": "${ctx.request.params.service}",
          "data": "js/ctx.vars['attempt-primary-call'].data",
          "response_time": "js/ctx.vars['attempt-primary-call'].response_time",
          "attempts": "js/ctx.vars['attempt-primary-call'].attempts_made"
        }
      }
    },
    "try-fallback": {
      "inputs": {
        "fallback_endpoints": "js/getFallbackEndpoints(ctx.request.params.service)",
        "original_payload": "js/ctx.request.body.payload",
        "error_context": "js/ctx.vars['attempt-primary-call'].error"
      }
    },
    "fallback-response": {
      "conditions": [
        {
          "type": "if",
          "condition": "ctx.vars['try-fallback'].success",
          "steps": [
            {
              "name": "fallback-success",
              "node": "mapper", 
              "type": "module"
            }
          ]
        },
        {
          "type": "else",
          "steps": [
            {
              "name": "complete-failure",
              "node": "error-handler",
              "type": "module"
            }
          ]
        }
      ]
    },
    "validation-error": {
      "inputs": {
        "status": 400,
        "error": "Request validation failed",
        "details": "js/ctx.vars['validate-request'].errors"
      }
    },
    "client-error-response": {
      "inputs": {
        "status": "js/ctx.vars['attempt-primary-call'].status",
        "error": "External service error",
        "service": "${ctx.request.params.service}",
        "details": "js/ctx.vars['attempt-primary-call'].data"
      }
    }
  }
}
```

### **Task 8: Multi-Language Node Integration**
**Equivalent to**: Polyglot microservices with gRPC communication  
**When to use**: Leveraging Python libraries for ML/AI while maintaining TypeScript orchestration  

**Implementation**:

**Python Node:**
```python
# runtimes/python3/nodes/ml_processor/node.py
from core.nanoservice import NanoService
from core.types.context import Context
from core.types.response import NanoServiceResponse
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from typing import Dict, Any, List

class MLProcessor(NanoService):
    def __init__(self):
        super().__init__()
        self.input_schema = {
            "type": "object",
            "properties": {
                "data": {
                    "type": "array",
                    "items": {"type": "object"}
                },
                "target_column": {"type": "string"},
                "feature_columns": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "model_type": {
                    "type": "string",
                    "enum": ["classification", "regression", "clustering"]
                }
            },
            "required": ["data", "model_type"]
        }
        
        self.output_schema = {
            "type": "object",
            "properties": {
                "processed_data": {"type": "array"},
                "model_metrics": {"type": "object"},
                "predictions": {"type": "array"},
                "feature_importance": {"type": "object"}
            }
        }

    async def handle(self, ctx: Context, inputs: Dict[str, Any]) -> NanoServiceResponse:
        response = NanoServiceResponse()
        
        try:
            # Convert input data to DataFrame
            df = pd.DataFrame(inputs['data'])
            
            # Process based on model type
            if inputs['model_type'] == 'classification':
                result = self._process_classification(df, inputs)
            elif inputs['model_type'] == 'regression':
                result = self._process_regression(df, inputs)
            else:
                result = self._process_clustering(df, inputs)
            
            response.set_success(result)
            
        except Exception as error:
            response.set_error({
                "message": f"ML processing failed: {str(error)}",
                "code": 500,
                "type": "MLProcessingError"
            })
        
        return response
    
    def _process_classification(self, df: pd.DataFrame, inputs: Dict[str, Any]) -> Dict[str, Any]:
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score, classification_report
        
        feature_cols = inputs.get('feature_columns', df.columns.tolist()[:-1])
        target_col = inputs.get('target_column', df.columns[-1])
        
        X = df[feature_cols]
        y = df[target_col]
        
        # Split and train
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train_scaled, y_train)
        
        predictions = model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, predictions)
        
        return {
            "processed_data": df.to_dict('records'),
            "model_metrics": {
                "accuracy": accuracy,
                "feature_count": len(feature_cols),
                "sample_count": len(df)
            },
            "predictions": predictions.tolist(),
            "feature_importance": dict(zip(feature_cols, model.feature_importances_.tolist()))
        }

# Register the node
def get_node():
    return MLProcessor()
```

**Workflow integrating Python node:**
```json
{
  "name": "ML Data Pipeline",
  "description": "Complete ML pipeline using Python processing with TypeScript orchestration",
  "version": "1.0.0",
  "trigger": {
    "http": {
      "method": "POST",
      "path": "/ml/process",
      "accept": "application/json"
    }
  },
  "steps": [
    {
      "name": "validate-ml-request",
      "node": "ml-request-validator",
      "type": "module",
      "set_var": true
    },
    {
      "name": "fetch-training-data",
      "node": "database-query",
      "type": "module", 
      "set_var": true
    },
    {
      "name": "process-with-python",
      "node": "ml-processor",
      "type": "python",
      "set_var": true
    },
    {
      "name": "store-results",
      "node": "result-storage",
      "type": "module"
    }
  ],
  "nodes": {
    "validate-ml-request": {
      "inputs": {
        "model_type": "${ctx.request.body.model_type}",
        "dataset_id": "${ctx.request.body.dataset_id}",
        "feature_columns": "js/ctx.request.body.features || []",
        "target_column": "${ctx.request.body.target}"
      }
    },
    "fetch-training-data": {
      "inputs": {
        "query": "SELECT * FROM datasets WHERE id = ? AND status = 'ready'",
        "params": ["${ctx.request.body.dataset_id}"],
        "format": "json"
      }
    },
    "process-with-python": {
      "inputs": {
        "data": "js/ctx.vars['fetch-training-data'].data",
        "model_type": "${ctx.request.body.model_type}",
        "feature_columns": "js/ctx.request.body.features",
        "target_column": "${ctx.request.body.target}",
        "hyperparameters": "js/ctx.request.body.hyperparameters || {}"
      }
    },
    "store-results": {
      "inputs": {
        "table": "ml_results",
        "data": {
          "dataset_id": "${ctx.request.body.dataset_id}",
          "model_type": "${ctx.request.body.model_type}",
          "accuracy": "js/ctx.vars['process-with-python'].model_metrics.accuracy",
          "feature_importance": "js/JSON.stringify(ctx.vars['process-with-python'].feature_importance)",
          "predictions": "js/JSON.stringify(ctx.vars['process-with-python'].predictions)",
          "created_at": "js/new Date().toISOString()",
          "status": "completed"
        }
      }
    }
  }
}
```

### **Task 9: Real-time Data Processing with Observability**
**Equivalent to**: Apache Kafka + Prometheus monitoring + distributed tracing  
**When to use**: Building production workflows that need monitoring and real-time capabilities  

**Implementation**:
```json
{
  "name": "Real-time Event Processing",
  "description": "High-throughput event processing with full observability",
  "version": "1.0.0",
  "trigger": {
    "http": {
      "method": "POST",
      "path": "/events/process",
      "accept": "application/json"
    }
  },
  "steps": [
    {
      "name": "event-ingestion",
      "node": "event-processor",
      "type": "module",
      "set_var": true
    },
    {
      "name": "parallel-processing",
      "node": "parallel-executor",
      "type": "module",
      "set_var": true
    },
    {
      "name": "aggregate-results",
      "node": "aggregator",
      "type": "module",
      "set_var": true
    },
    {
      "name": "emit-metrics",
      "node": "metrics-emitter",
      "type": "module"
    }
  ],
  "nodes": {
    "event-ingestion": {
      "inputs": {
        "events": "js/Array.isArray(ctx.request.body.events) ? ctx.request.body.events : [ctx.request.body]",
        "batch_size": "${ctx.request.body.batch_size || 100}",
        "processing_mode": "${ctx.request.body.mode || 'async'}",
        "priority": "${ctx.request.body.priority || 'normal'}",
        "trace_id": "js/ctx.id",
        "metrics": {
          "events_received": "js/Array.isArray(ctx.request.body.events) ? ctx.request.body.events.length : 1",
          "ingestion_timestamp": "js/Date.now()"
        }
      }
    },
    "parallel-processing": {
      "inputs": {
        "event_batches": "js/ctx.vars['event-ingestion'].batches",
        "processors": [
          {
            "name": "validation",
            "node": "event-validator",
            "parallel": true
          },
          {
            "name": "enrichment", 
            "node": "event-enricher",
            "parallel": true
          },
          {
            "name": "transformation",
            "node": "event-transformer", 
            "parallel": true
          }
        ],
        "concurrency_limit": 10,
        "timeout_ms": 30000
      }
    },
    "aggregate-results": {
      "inputs": {
        "processed_events": "js/ctx.vars['parallel-processing'].results",
        "aggregation_rules": [
          {
            "field": "event_type",
            "operation": "count"
          },
          {
            "field": "processing_time_ms",
            "operation": "avg"
          },
          {
            "field": "status",
            "operation": "group_count"
          }
        ],
        "output_format": "detailed"
      }
    },
    "emit-metrics": {
      "inputs": {
        "metrics": {
          "events_processed": "js/ctx.vars['aggregate-results'].summary.total_processed",
          "events_failed": "js/ctx.vars['aggregate-results'].summary.failed_count",
          "processing_duration_ms": "js/Date.now() - ctx.vars['event-ingestion'].metrics.ingestion_timestamp",
          "throughput_events_per_sec": "js/ctx.vars['aggregate-results'].summary.total_processed / ((Date.now() - ctx.vars['event-ingestion'].metrics.ingestion_timestamp) / 1000)",
          "error_rate": "js/ctx.vars['aggregate-results'].summary.failed_count / ctx.vars['aggregate-results'].summary.total_processed"
        },
        "prometheus_labels": {
          "workflow": "real-time-event-processing",
          "version": "1.0.0",
          "priority": "${ctx.request.body.priority || 'normal'}"
        },
        "trace_context": {
          "trace_id": "js/ctx.id",
          "span_count": "js/ctx.vars['parallel-processing'].span_count",
          "root_span_duration": "js/Date.now() - ctx.start_time"
        }
      }
    }
  }
}
```

### **Task 10: Building UI-Enabled Nodes**
**Equivalent to**: Creating admin interfaces or dashboards for backend services  
**When to use**: When you need visual interfaces for workflow management or data visualization  

**Implementation**:
```bash
# Create UI node
npx blokctl@latest create node
# Select: module > ui template > TypeScript
```

```typescript
// src/nodes/dashboard/index.ts
import { type INodeBlokResponse, NodeBlok, NodeBlokResponse } from "@blok-ts/runner";
import { type Context, GlobalError } from "@blok-ts/runner";

type DashboardInputs = {
  title?: string;
  data_source?: string;
  chart_types?: string[];
  refresh_interval?: number;
};

export default class DashboardNode extends NodeBlok<DashboardInputs> {
  constructor() {
    super();
    
    this.inputSchema = {
      type: "object",
      properties: {
        title: { type: "string", default: "Blok Dashboard" },
        data_source: { type: "string", default: "default" },
        chart_types: { 
          type: "array", 
          items: { type: "string", enum: ["line", "bar", "pie", "scatter"] },
          default: ["line", "bar"]
        },
        refresh_interval: { type: "number", minimum: 1000, default: 5000 }
      }
    };
    
    this.outputSchema = {
      type: "object",
      properties: {
        html: { type: "string" },
        assets: { type: "object" }
      }
    };
  }

  async handle(ctx: Context, inputs: DashboardInputs): Promise<INodeBlokResponse> {
    const response = new NodeBlokResponse();

    try {
      // Generate dashboard HTML with embedded React/Vue component
      const dashboardHtml = this.generateDashboardHTML(inputs);
      
      response.setSuccess({
        html: dashboardHtml,
        assets: {
          scripts: ['/sdk/bloksdk.js'],
          styles: ['/sdk/bootstrap.min.css'],
          data_endpoint: '/api/dashboard/data'
        }
      });
      
      // Set content type for HTML response
      response.setContentType('text/html');
      
    } catch (error: unknown) {
      const nodeError = new GlobalError(`Dashboard generation failed: ${(error as Error).message}`);
      nodeError.setCode(500);
      nodeError.setName("DashboardNode");
      response.setError(nodeError);
    }

    return response;
  }
  
  private generateDashboardHTML(inputs: DashboardInputs): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${inputs.title}</title>
    <link href="/sdk/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <div class="col-12">
                <h1 class="mt-3">${inputs.title}</h1>
                <div class="row">
                    <div class="col-md-6">
                        <canvas id="chart1"></canvas>
                    </div>
                    <div class="col-md-6">
                        <canvas id="chart2"></canvas>
                    </div>
                </div>
                <div class="mt-3">
                    <button class="btn btn-primary" onclick="refreshData()">Refresh Data</button>
                    <button class="btn btn-secondary" onclick="exportData()">Export</button>
                </div>
            </div>
        </div>
    </div>
    
    <script src="/sdk/bloksdk.js"></script>
    <script>
        const dashboard = new BlokDashboard({
            dataSource: '${inputs.data_source}',
            refreshInterval: ${inputs.refresh_interval},
            chartTypes: ${JSON.stringify(inputs.chart_types)}
        });
        
        dashboard.init();
        
        function refreshData() {
            dashboard.refresh();
        }
        
        function exportData() {
            dashboard.export('csv');
        }
    </script>
</body>
</html>`;
  }
}
```

### **Task 11: Database Integration Patterns**
**Equivalent to**: ORM patterns, repository patterns, and database abstraction layers  
**When to use**: Building data-driven workflows with proper database connectivity  

**Implementation**:
```typescript
// src/nodes/database/advanced-query.ts
import { type INodeBlokResponse, NodeBlok, NodeBlokResponse } from "@blok-ts/runner";
import { type Context, GlobalError } from "@blok-ts/runner";

type AdvancedQueryInputs = {
  operation: 'select' | 'insert' | 'update' | 'delete' | 'transaction';
  table?: string;
  query?: string;
  data?: any;
  where?: Record<string, any>;
  joins?: Array<{table: string, on: string, type?: 'INNER' | 'LEFT' | 'RIGHT'}>;
  pagination?: {page: number, limit: number};
  transactions?: Array<{operation: string, table: string, data?: any, where?: any}>;
};

export default class AdvancedQuery extends NodeBlok<AdvancedQueryInputs> {
  constructor() {
    super();
    
    this.inputSchema = {
      type: "object",
      properties: {
        operation: { 
          type: "string", 
          enum: ["select", "insert", "update", "delete", "transaction"] 
        },
        table: { type: "string" },
        query: { type: "string" },
        data: { type: "object" },
        where: { type: "object" },
        joins: {
          type: "array",
          items: {
            type: "object",
            properties: {
              table: { type: "string" },
              on: { type: "string" },
              type: { type: "string", enum: ["INNER", "LEFT", "RIGHT"], default: "INNER" }
            },
            required: ["table", "on"]
          }
        },
        pagination: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1, default: 1 },
            limit: { type: "number", minimum: 1, maximum: 1000, default: 100 }
          }
        },
        transactions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              operation: { type: "string" },
              table: { type: "string" },
              data: { type: "object" },
              where: { type: "object" }
            },
            required: ["operation", "table"]
          }
        }
      },
      required: ["operation"]
    };
  }

  async handle(ctx: Context, inputs: AdvancedQueryInputs): Promise<INodeBlokResponse> {
    const response = new NodeBlokResponse();

    try {
      let result;
      
      switch (inputs.operation) {
        case 'select':
          result = await this.handleSelect(inputs);
          break;
        case 'insert':
          result = await this.handleInsert(inputs);
          break;
        case 'update':
          result = await this.handleUpdate(inputs);
          break;
        case 'delete':
          result = await this.handleDelete(inputs);
          break;
        case 'transaction':
          result = await this.handleTransaction(inputs);
          break;
        default:
          throw new Error(`Unsupported operation: ${inputs.operation}`);
      }
      
      response.setSuccess(result);
      
    } catch (error: unknown) {
      const nodeError = new GlobalError(`Database operation failed: ${(error as Error).message}`);
      nodeError.setCode(500);
      nodeError.setName("AdvancedQuery");
      response.setError(nodeError);
    }

    return response;
  }
  
  private async handleSelect(inputs: AdvancedQueryInputs) {
    // Implementation would use your database client
    // This is pseudocode showing the pattern
    let query = `SELECT * FROM ${inputs.table}`;
    
    if (inputs.joins) {
      for (const join of inputs.joins) {
        query += ` ${join.type || 'INNER'} JOIN ${join.table} ON ${join.on}`;
      }
    }
    
    if (inputs.where) {
      const whereClause = Object.entries(inputs.where)
        .map(([key, value]) => `${key} = ?`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
    }
    
    if (inputs.pagination) {
      const offset = (inputs.pagination.page - 1) * inputs.pagination.limit;
      query += ` LIMIT ${inputs.pagination.limit} OFFSET ${offset}`;
    }
    
    // Execute query with your database client
    // const result = await db.query(query, Object.values(inputs.where || {}));
    
    return {
      data: [], // result.rows,
      total: 0, // result.total,
      page: inputs.pagination?.page || 1,
      limit: inputs.pagination?.limit || 100,
      query: query
    };
  }
  
  private async handleTransaction(inputs: AdvancedQueryInputs) {
    // Begin transaction
    // await db.beginTransaction();
    
    try {
      const results = [];
      
      for (const operation of inputs.transactions || []) {
        // Execute each operation in transaction
        // const result = await this.executeOperation(operation);
        // results.push(result);
      }
      
      // await db.commit();
      
      return {
        success: true,
        operations_executed: results.length,
        results: results
      };
      
    } catch (error) {
      // await db.rollback();
      throw error;
    }
  }
}
```

### **Task 12: Node and Workflow Testing (Complete Testing Strategy)**
**Equivalent to**: Unit testing, integration testing, and API testing  
**When to use**: Ensuring node and workflow reliability before deployment  

**Three Testing Approaches**:

#### **1. Unit Testing Individual Nodes**
**Use Case**: Test node logic in isolation with mocked dependencies

```typescript
// test/nodes/my-validator.test.ts
import { describe, expect, it, vi } from "vitest";
import { NodeBlokResponse } from "@blok-ts/runner";
import type { Context } from "@blok-ts/runner";
import MyValidator from "../src/nodes/my-validator";

describe("MyValidator Node", () => {
  const mockContext: Context = {
    request: {
      method: "POST",
      body: { email: "test@example.com", age: 25 },
      headers: {},
      params: {},
      query: {},
    },
    response: { data: {} },
    vars: {},
    logger: { log: vi.fn(), error: vi.fn() }
  } as unknown as Context;

  it("should validate correct user data", async () => {
    const validator = new MyValidator();
    const inputs = {
      email: "test@example.com",
      age: 25,
      role: "user"
    };

    const result = await validator.handle(mockContext, inputs);
    
    expect(result).toBeInstanceOf(NodeBlokResponse);
    expect(result.success).toBe(true);
    expect(result.data.isValid).toBe(true);
    expect(result.data.errors).toEqual([]);
  });

  it("should return validation errors for invalid data", async () => {
    const validator = new MyValidator();
    const inputs = {
      email: "invalid-email",
      age: -5,
      role: "admin"
    };

    const result = await validator.handle(mockContext, inputs);
    
    expect(result.success).toBe(true);
    expect(result.data.isValid).toBe(false);
    expect(result.data.errors).toContain("Invalid email format");
    expect(result.data.errors).toContain("Age must be positive");
  });

  it("should handle errors gracefully", async () => {
    const validator = new MyValidator();
    const inputs = null; // Invalid input

    const result = await validator.handle(mockContext, inputs as any);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

#### **2. Remote Node Execution (HTTP Testing)**
**Use Case**: Test individual nodes via HTTP without creating full workflows  
**Key Feature**: Uses the **same protocol as the Blok SDK JavaScript** for vanilla JS integration

**Request Format** (following SDK pattern):
```bash
# Test any node individually via HTTP POST
curl -X POST http://localhost:4000/user-validator \
  -H "Content-Type: application/json" \
  -H "x-nanoservice-execute-node: true" \
  -d '{
    "Name": "user-validator",
    "Message": "eyJyZXF1ZXN0Ijoge30sICJ3b3JrZmxvdyI6IHsibmFtZSI6ICJSZW1vdGUgTm9kZSIsICJkZXNjcmlwdGlvbiI6ICJFeGVjdXRpb24gb2YgcmVtb3RlIG5vZGUiLCAidmVyc2lvbiI6ICIxLjAuMCIsICJ0cmlnZ2VyIjogeyJodHRwIjogeyJtZXRob2QiOiAiUE9TVCIsICJwYXRoIjogIioiLCAiYWNjZXB0IjogImFwcGxpY2F0aW9uL2pzb24ifX0sICJzdGVwcyI6IFt7Im5hbWUiOiAibm9kZSIsICJub2RlIjogInVzZXItdmFsaWRhdG9yIiwgInR5cGUiOiAibG9jYWwifV0sICJub2RlcyI6IHsibm9kZSI6IHsiaW5wdXRzIjogeyJlbWFpbCI6ICJ0ZXN0QGV4YW1wbGUuY29tIiwgImFnZSI6IDI1fX19fX0=",
    "Encoding": "BASE64",
    "Type": "JSON"
  }'
```

**Blok SDK JavaScript Implementation** (Official Reference):
```javascript
// Using the official Blok SDK (sdk/javascript/bloksdk.js)
const sdk = new BlokSDK();
const client = sdk.createHttpClient("http://localhost:4000", "", true);

// Test TypeScript/Local nodes
const result1 = await client.nodejs("user-validator", {
  email: "test@example.com",
  age: 25
}, "local");

// Test Python nodes  
const result2 = await client.python3("sentiment-analyzer", {
  text: "I love this framework!"
});

// Test Module nodes (NPM packages or registered in Nodes.ts)
const result3 = await client.nodejs("@blok-ts/api-call", {
  url: "https://api.example.com/users",
  method: "GET"
}, "module");

console.log("Results:", { result1, result2, result3 });
```

**TypeScript Helper for Testing** (Based on SDK):
```typescript
// test/helpers/remote-node-tester.ts
export class BlokRemoteNodeTester {
  constructor(
    private host = "http://localhost:4000",
    private token = "",
    private debug = false
  ) {}

  async testNode(
    nodeName: string,
    nodeType: 'module' | 'local' | 'runtime.python3',
    inputs: any
  ) {
    // Create workflow definition (same as SDK)
    const workflow = {
      name: "Remote Node",
      description: "Execution of remote node",
      version: "1.0.0",
      trigger: {
        http: {
          method: "POST",
          path: "*",
          accept: "application/json"
        }
      },
      steps: [{
        name: "node",
        node: nodeName,
        type: nodeType
      }],
      nodes: {
        node: { inputs }
      }
    };

    // Encode as BASE64 (same format as SDK)
    const base64Workflow = btoa(JSON.stringify({ 
      request: {}, 
      workflow 
    }));

    const message = {
      Name: nodeName,
      Message: base64Workflow,
      Encoding: "BASE64",
      Type: "JSON"
    };

    const response = await fetch(`${this.host}/${nodeName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nanoservice-execute-node': 'true',
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error(`Remote test failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Convenience methods (matching SDK)
  async testLocalNode(nodeName: string, inputs: any) {
    return this.testNode(nodeName, 'local', inputs);
  }

  async testModuleNode(nodeName: string, inputs: any) {
    return this.testNode(nodeName, 'module', inputs);
  }

  async testPythonNode(nodeName: string, inputs: any) {
    return this.testNode(nodeName, 'runtime.python3', inputs);
  }
}

// Usage in tests:
const tester = new BlokRemoteNodeTester();

it("should validate user via remote call", async () => {
  const result = await tester.testLocalNode("user-validator", {
    email: "test@example.com",
    age: 25
  });
  
  expect(result.isValid).toBe(true);
});

it("should call API via remote module node", async () => {
  const result = await tester.testModuleNode("@blok-ts/api-call", {
    url: "https://jsonplaceholder.typicode.com/posts/1",
    method: "GET"
  });
  
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
});

it("should analyze sentiment via Python node", async () => {
  const result = await tester.testPythonNode("sentiment", {
    text: "This is amazing!"
  });
  
  expect(result.sentiment).toBe("positive");
});
```

**Key Insights from SDK Analysis**:
- ✅ **URL Pattern**: `${host}/${nodeName}` (not workflow name)
- ✅ **BASE64 Encoding**: Message contains `{ request: {}, workflow: workflowDefinition }`
- ✅ **Multiple Runtimes**: `local`, `module`, `runtime.python3`
- ✅ **Response Handling**: Supports JSON, text, PDF, images, blobs
- ✅ **Error Handling**: Structured error responses with status codes
- ✅ **Vanilla JS Compatible**: Works in browsers and Node.js

#### **3. Integration Testing Complete Workflows**
**Use Case**: Test full workflow execution end-to-end

```typescript
// test/integration/user-registration.test.ts
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('User Registration Workflow Integration', () => {
  const baseUrl = 'http://localhost:4000';
  
  beforeAll(async () => {
    // Ensure server is running
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('should complete full user registration workflow', async () => {
    const userData = {
      email: 'integration.test@example.com',
      password: 'securePassword123',
      firstName: 'Integration',
      lastName: 'Test'
    };

    const response = await request(baseUrl)
      .post('/user-registration')
      .send(userData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.user_id).toBeDefined();
    expect(response.body.message).toContain('registered successfully');
  });

  it('should handle validation errors in workflow', async () => {
    const invalidData = {
      email: 'invalid-email',
      password: '123', // Too short
      firstName: '',
      lastName: 'Test'
    };

    const response = await request(baseUrl)
      .post('/user-registration')
      .send(invalidData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toContain('Invalid email format');
    expect(response.body.errors).toContain('Password too short');
  });

  it('should handle existing user workflow branch', async () => {
    const existingUserData = {
      email: 'existing@example.com',
      password: 'securePassword123',
      firstName: 'Existing',
      lastName: 'User'
    };

    // First registration should succeed
    await request(baseUrl)
      .post('/user-registration')
      .send(existingUserData)
      .expect(200);

    // Second registration should fail
    const response = await request(baseUrl)
      .post('/user-registration')
      .send(existingUserData)
      .expect(400);

    expect(response.body.error).toContain('Email already registered');
  });
});
```

### **Testing Setup and Configuration**

#### **Package.json Test Scripts**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:unit": "vitest run test/nodes",
    "test:integration": "vitest run test/integration",
    "test:remote": "vitest run test/remote-nodes"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "supertest": "^6.3.0"
  }
}
```

#### **Vitest Configuration**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'test/**',
        'dist/**'
      ]
    }
  }
});
```

#### **Test Setup File**:
```typescript
// test/setup.ts
import { beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';

let serverProcess: any;

beforeAll(async () => {
  // Start development server for integration tests
  serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'test' }
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
});

afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
```

### **Testing Best Practices for Blok Framework**

#### **1. Node Testing Strategy**:
```typescript
// ✅ Good: Test node logic directly
describe("UserValidator", () => {
  it("should validate email format", async () => {
    const validator = new UserValidator();
    const result = await validator.handle(mockContext, { 
      email: "invalid-email" 
    });
    expect(result.data.errors).toContain("Invalid email format");
  });
});

// ❌ Bad: Testing implementation details
describe("UserValidator", () => {
  it("should call validateEmail method", async () => {
    const validator = new UserValidator();
    const spy = vi.spyOn(validator, 'validateEmail');
    await validator.handle(mockContext, { email: "test@example.com" });
    expect(spy).toHaveBeenCalled(); // Testing implementation, not behavior
  });
});
```

#### **2. Context Testing Patterns**:
```typescript
// ✅ Good: Test with realistic context
const createTestContext = (overrides: Partial<Context> = {}): Context => ({
  id: 'test-123',
  request: {
    method: 'POST',
    body: {},
    headers: {},
    params: {},
    query: {}
  },
  response: { data: {} },
  vars: {},
  logger: { log: vi.fn(), error: vi.fn() },
  ...overrides
} as Context);

// ✅ Good: Test context variable usage
it("should use previous step data from context", async () => {
  const context = createTestContext({
    vars: {
      'previous-step': { userId: '123', email: 'test@example.com' }
    }
  });
  
  const result = await processor.handle(context, { useFromContext: true });
  expect(result.data.processedUserId).toBe('123');
});
```

#### **3. Remote Testing Utilities**:
```typescript
// test/utils/remote-tester.ts
export class RemoteNodeTester {
  constructor(private baseUrl = 'http://localhost:4000') {}

  async testNode(
    nodeName: string,
    inputs: any,
    nodeType: 'module' | 'local' | 'runtime.python3' = 'local'
  ) {
    const workflow = {
      trigger: { http: { method: "POST", path: "/test" } },
      steps: [{ name: "test", node: nodeName, type: nodeType }],
      nodes: { node: { inputs } }
    };

    const response = await fetch(`${this.baseUrl}/${nodeName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nanoservice-execute-node': 'true'
      },
      body: JSON.stringify({
        Name: `${nodeName}-test`,
        Encoding: "STRING",
        Type: "JSON",
        Message: JSON.stringify({ workflow })
      })
    });

    if (!response.ok) {
      throw new Error(`Remote test failed: ${response.statusText}`);
    }

    return response.json();
  }

  async testLocalNode(nodeName: string, inputs: any) {
    return this.testNode(nodeName, inputs, 'local');
  }

  async testModuleNode(nodeName: string, inputs: any) {
    return this.testNode(nodeName, inputs, 'module');
  }

  async testPythonNode(nodeName: string, inputs: any) {
    return this.testNode(nodeName, inputs, 'runtime.python3');
  }
}

// Usage:
const tester = new RemoteNodeTester();

it("should validate user via remote call", async () => {
  const result = await tester.testLocalNode("user-validator", {
    email: "test@example.com",
    age: 25
  });
  
  expect(result.isValid).toBe(true);
});
```

### **Testing Command Reference**

#### **Run Different Test Types**:
```bash
# Run all tests
npm test

# Run only unit tests (individual nodes)
npm run test:unit

# Run only integration tests (full workflows)  
npm run test:integration

# Run remote node tests
npm run test:remote

# Run tests in watch mode during development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

#### **Test File Organization**:
```
project/
├── test/
│   ├── setup.ts                    # Global test setup
│   ├── nodes/                      # Unit tests for individual nodes
│   │   ├── user-validator.test.ts  # Node-specific tests
│   │   └── email-sender.test.ts    # More node tests
│   ├── integration/                # End-to-end workflow tests
│   │   ├── user-registration.test.ts
│   │   └── data-processing.test.ts
│   ├── remote-nodes/               # Remote execution tests
│   │   ├── local-nodes.test.ts     # Test local nodes remotely
│   │   └── python-nodes.test.ts    # Test Python nodes remotely
│   └── utils/
│       ├── remote-tester.ts        # Remote testing utilities
│       └── mock-context.ts         # Context mocking helpers
├── src/
├── workflows/
└── vitest.config.ts
```

**Key Benefits of This Testing Strategy**:
- ✅ **Comprehensive Coverage**: Unit, integration, and remote testing
- ✅ **Fast Feedback**: Unit tests run quickly during development
- ✅ **Real Environment**: Remote tests use actual HTTP trigger
- ✅ **CI/CD Ready**: All test types can run in automated pipelines
- ✅ **Node Isolation**: Test individual nodes without complex workflow setup

---

## 📚 **Complete API Reference**

### **Core Class: NodeBlok<T>**
**Purpose**: Base class for all Blok nodes providing structure, validation, and execution framework

**Constructor Parameters**: None (override in subclass)

**Required Methods**:
```typescript
constructor() {
  super();
  this.inputSchema = {}; // JSON Schema for input validation
  this.outputSchema = {}; // JSON Schema for output validation
}

async handle(ctx: Context, inputs: T): Promise<INodeBlokResponse> {
  // Your node logic here
}
```

**Usage Example**:
```typescript
import { type INodeBlokResponse, NodeBlok, NodeBlokResponse } from "@blok-ts/runner";
import { type Context, GlobalError } from "@blok-ts/runner";

type MyNodeInputs = {
  message: string;
  count?: number;
};

export default class MyNode extends NodeBlok<MyNodeInputs> {
  constructor() {
    super();
    this.inputSchema = {
      type: "object",
      properties: {
        message: { type: "string" },
        count: { type: "number", default: 1 }
      },
      required: ["message"]
    };
  }

  async handle(ctx: Context, inputs: MyNodeInputs): Promise<INodeBlokResponse> {
    const response = new NodeBlokResponse();
    response.setSuccess({ 
      result: inputs.message.repeat(inputs.count || 1) 
    });
    return response;
  }
}
```

### **Interface: Context**
**Purpose**: Workflow execution context containing request data, response data, and variables

**Properties**:
- `id` (string): Unique identifier for the workflow execution
- `workflow_name` (string): Name of the executing workflow
- `request` (RequestContext): HTTP request data (body, query, params, headers)
- `response` (ResponseContext): Current response data from previous steps
- `vars` (VarsContext): Variables stored from previous steps with `set_var: true`
- `config` (ConfigContext): Node configuration from workflow definition
- `logger` (LoggerContext): Logging interface for the workflow
- `env` (EnvContext): Environment variables

**Usage Examples**:
```typescript
// Accessing request data
const userId = ctx.request.body.id;
const queryParam = ctx.request.query.filter;
const pathParam = ctx.request.params.userId;

// Accessing previous step results
const previousData = ctx.vars['previous-step-name'];
const responseData = ctx.response.data;

// Logging
ctx.logger.log('Processing user data');
ctx.logger.error('Validation failed');

// Environment variables
const apiUrl = ctx.env.API_BASE_URL;
```

### **Class: NodeBlokResponse**
**Purpose**: Standard response object for all node operations

**Methods**:
- `setSuccess(data: any)`: Set successful response with data
- `setError(error: GlobalError)`: Set error response  
- `setContentType(type: string)`: Set response content type

**Usage Example**:
```typescript
const response = new NodeBlokResponse();

// Success response
response.setSuccess({
  users: userList,
  total: userList.length,
  page: 1
});

// Error response
const error = new GlobalError('User not found');
error.setCode(404);
response.setError(error);

// Custom content type
response.setContentType('text/html');
```

### **Workflow Helper: Workflow()**
**Purpose**: TypeScript helper for building workflows programmatically

**Methods**:
- `addTrigger(type, config)`: Add trigger configuration
- `addStep(stepConfig)`: Add a workflow step
- `addCondition(conditionConfig)`: Add conditional logic

**Usage Example**:
```typescript
import { Workflow, AddIf, AddElse } from "@blok-ts/runner";

const workflow = Workflow({
  name: "API Workflow",
  version: "1.0.0",
  description: "RESTful API endpoint"
})
.addTrigger("http", {
  method: "GET",
  path: "/api/users",
  accept: "application/json"
})
.addStep({
  name: "fetch-users",
  node: "database-query",
  type: "module",
  inputs: {
    query: "SELECT * FROM users WHERE active = true"
  }
});
```

### **CLI Command: blokctl**
**Purpose**: Command-line interface for Blok project and node management

**Available Commands**:
```bash
# Create new project
npx blokctl@latest create project [name]
# Options: name (optional), creates in current dir if provided

# Create new node  
npx blokctl@latest create node [name]
# Options: name (optional)
# Interactive: runtime, type, template

# Create new workflow
npx blokctl@latest create workflow [name] 
# Options: name (optional)
# Creates JSON workflow in workflows/json/

# Development server (in project directory)
npm run dev
# Starts HTTP trigger on port 4000

# Note: Deploy command exists but implementation varies by environment
```

**Detailed CLI Options**:

#### **Create Project**:
```bash
npx blokctl@latest create project
# Prompts:
# - Project name (default: "nano-service")
# - Package manager (auto-detected: npm/yarn/pnpm)
# - Trigger: "HTTP" (only option in CLI, gRPC available manually)
# - Runtimes: ["NodeJS"] (Python3 commented out)
# - Install examples: YES/NO (requires PostgreSQL)
```

#### **Create Node**:
```bash
npx blokctl@latest create node
# Prompts:
# - Node name (required)
# - Package manager (auto-detected)
# - Runtime: "Typescript" (Python3 in Alpha, commented out)
# - Type: "Module" or "Class"
# - Template: "Class" or "UI"
```

#### **Create Workflow**:
```bash
npx blokctl@latest create workflow
# Prompts:
# - Workflow name (required)
# Creates: workflows/json/[name].json
```

**Project Structure Created**:
```
my-blok-project/
├── src/
│   ├── Nodes.ts                # Node registration (for type: module)
│   ├── Workflows.ts            # Workflow registration (for TypeScript)
│   ├── nodes/                  # Local nodes (for type: local)
│   │   └── examples/           # Example nodes (if selected)
│   └── workflows/              # TypeScript workflows
├── workflows/
│   ├── json/                   # JSON workflows (auto-discovered)
│   ├── yaml/                   # YAML workflows (auto-discovered)  
│   └── toml/                   # TOML workflows (auto-discovered)
├── infra/
│   ├── metrics/                # Prometheus + Grafana configuration
│   ├── postgresql/             # PostgreSQL setup (if examples)
│   └── milvus/                 # Milvus vector DB (if examples)
├── public/
│   └── sdk/                    # BlokSDK for UI nodes
├── .env.local                  # Environment variables
├── package.json
├── supervisord.conf            # Multi-process management
└── README.md
```

---

## 🔗 **Integration with Other Systems**

### **Database Integration**
```typescript
// Built-in database node usage
{
  "name": "database-operations",
  "node": "database-query",
  "type": "module",
  "inputs": {
    "connection": {
      "host": "js/process.env.DB_HOST",
      "port": 5432,
      "database": "js/process.env.DB_NAME",
      "username": "js/process.env.DB_USER",
      "password": "js/process.env.DB_PASSWORD"
    },
    "query": "SELECT * FROM users WHERE created_at > ?",
    "params": ["${ctx.request.body.since_date}"],
    "options": {
      "timeout": 30000,
      "pool_size": 10
    }
  }
}
```

### **External API Integration**
```json
{
  "name": "external-service-call",
  "node": "@blok-ts/api-call", 
  "type": "module",
  "inputs": {
    "url": "https://api.external-service.com/v1/data",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer ${ctx.env.EXTERNAL_API_TOKEN}",
      "Content-Type": "application/json"
    },
    "body": "js/ctx.request.body",
    "timeout": 15000,
    "retry": {
      "attempts": 3,
      "delay": 1000
    }
  }
}
```

### **Authentication Integration**
```json
{
  "name": "jwt-authentication",
  "node": "jwt-validator",
  "type": "module",
  "inputs": {
    "token": "js/ctx.request.headers.authorization?.split(' ')[1]",
    "secret": "js/process.env.JWT_SECRET",
    "algorithms": ["HS256"],
    "verify_options": {
      "issuer": "blok-framework",
      "audience": "api-users"
    }
  }
}
```

### **File Storage Integration**
```json
{
  "name": "file-upload",
  "node": "file-storage",
  "type": "module", 
  "inputs": {
    "provider": "s3",
    "bucket": "js/process.env.S3_BUCKET",
    "key": "uploads/${ctx.request.body.filename}",
    "content": "js/ctx.request.body.file_data",
    "content_type": "js/ctx.request.body.mime_type",
    "metadata": {
      "uploaded_by": "${ctx.request.body.user_id}",
      "uploaded_at": "js/new Date().toISOString()"
    }
  }
}
```

---

## 🚨 **Error Handling & Debugging**

### **Common Errors and Solutions**

#### **Error: "Node not found: [node-name]"**
**Cause**: Node is not registered or path is incorrect  
**Solution**:
```typescript
// Ensure node is exported in src/Nodes.ts
import MyCustomNode from "./nodes/my-custom-node";

const Nodes = {
  "my-custom-node": new MyCustomNode(),
  // ... other nodes
};

export default Nodes;
```

#### **Error: "JSON Schema validation failed"**
**Cause**: Input data doesn't match node's inputSchema  
**Solution**:
```typescript
// Check your inputSchema matches the actual inputs
this.inputSchema = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" }, // Make sure format is correct
    age: { type: "number", minimum: 0 }         // Check data types
  },
  required: ["email"] // Ensure required fields are provided
};
```

#### **Error: "Context variable not found: [var-name]"**
**Cause**: Trying to access a variable from a step that hasn't run or wasn't set  
**Solution**:
```json
{
  "steps": [
    {
      "name": "data-fetch",
      "node": "api-call",
      "type": "module",
      "set_var": true  // Make sure this is set to save the variable
    },
    {
      "name": "use-data",
      "node": "processor",
      "type": "module"
    }
  ],
  "nodes": {
    "use-data": {
      "inputs": {
        "data": "js/ctx.vars['data-fetch']?.data || []" // Safe access with fallback
      }
    }
  }
}
```

#### **Error: "Workflow timeout"**
**Cause**: Node execution exceeded timeout limits  
**Solution**:
```json
{
  "name": "long-running-task",
  "node": "data-processor",
  "type": "module",
  "inputs": {
    "timeout": 60000,  // Increase timeout for long operations
    "batch_size": 100  // Process in smaller batches
  }
}
```

### **Debugging Techniques**

1. **Enable Debug Logging**:
```bash
# Set environment variable
DEBUG=blok:* npm run dev

# Or in .env.local
DEBUG=blok:*
LOG_LEVEL=debug
```

2. **Use Logger in Nodes**:
```typescript
async handle(ctx: Context, inputs: MyInputs): Promise<INodeBlokResponse> {
  ctx.logger.log('Starting node execution with inputs:', inputs);
  
  try {
    const result = await processData(inputs);
    ctx.logger.log('Node execution successful:', result);
    
    const response = new NodeBlokResponse();
    response.setSuccess(result);
    return response;
  } catch (error) {
    ctx.logger.error('Node execution failed:', error);
    throw error;
  }
}
```

3. **Workflow Variable Inspection**:
```json
{
  "name": "debug-inspector",
  "node": "mapper",
  "type": "module",
  "inputs": {
    "model": {
      "debug_context": "js/ctx",
      "debug_vars": "js/ctx.vars",
      "debug_request": "js/ctx.request"
    }
  }
}
```

### **Error Recovery Patterns**
```json
{
  "name": "error-recovery-example", 
  "node": "@blok-ts/if-else",
  "type": "module",
  "conditions": [
    {
      "type": "if",
      "condition": "ctx.response.error === null",
      "steps": [
        {
          "name": "success-handler",
          "node": "success-processor",
          "type": "module"
        }
      ]
    },
    {
      "type": "else",
      "steps": [
        {
          "name": "error-recovery",
          "node": "fallback-processor",
          "type": "module"
        },
        {
          "name": "log-error",
          "node": "error-logger",
          "type": "module"
        }
      ]
    }
  ]
}
```

---

## ✅ **Best Practices & Anti-Patterns**

### **Recommended Patterns**

#### **1. Single Responsibility Nodes**
```typescript
// ✅ Good: Node does one thing well
export default class EmailValidator extends NodeBlok<{email: string}> {
  async handle(ctx: Context, inputs: {email: string}) {
    // Only validates email format and existence
    const isValid = this.validateEmailFormat(inputs.email);
    const exists = await this.checkEmailExists(inputs.email);
    
    return new NodeBlokResponse().setSuccess({
      is_valid_format: isValid,
      email_exists: exists,
      email: inputs.email.toLowerCase()
    });
  }
}

// ❌ Bad: Node does too many things
export default class UserProcessor extends NodeBlok<any> {
  async handle(ctx: Context, inputs: any) {
    // Validates email, creates user, sends email, logs activity, updates stats
    // This should be split into multiple nodes
  }
}
```

#### **2. Proper Error Handling**
```typescript
// ✅ Good: Comprehensive error handling
async handle(ctx: Context, inputs: MyInputs): Promise<INodeBlokResponse> {
  const response = new NodeBlokResponse();
  
  try {
    // Input validation
    if (!inputs.required_field) {
      throw new Error('Required field missing');
    }
    
    // Main logic with specific error handling
    const result = await this.processData(inputs);
    response.setSuccess(result);
    
  } catch (error: unknown) {
    const nodeError = new GlobalError((error as Error).message);
    nodeError.setCode(500);
    nodeError.setStack((error as Error).stack);
    nodeError.setName(this.constructor.name);
    
    // Add context for debugging
    nodeError.setJson({
      inputs: inputs,
      context_id: ctx.id,
      timestamp: new Date().toISOString()
    });
    
    response.setError(nodeError);
  }
  
  return response;
}
```

#### **3. Schema-Driven Development**
```typescript
// ✅ Good: Comprehensive schemas
this.inputSchema = {
  type: "object",
  properties: {
    user_id: { 
      type: "string", 
      pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
      description: "UUID of the user"
    },
    email: { 
      type: "string", 
      format: "email",
      description: "User's email address" 
    },
    preferences: {
      type: "object",
      properties: {
        theme: { type: "string", enum: ["light", "dark"], default: "light" },
        notifications: { type: "boolean", default: true }
      },
      additionalProperties: false
    }
  },
  required: ["user_id", "email"],
  additionalProperties: false
};

this.outputSchema = {
  type: "object", 
  properties: {
    success: { type: "boolean" },
    user_data: { type: "object" },
    timestamp: { type: "string", format: "date-time" }
  },
  required: ["success"]
};
```

#### **4. Context-Aware Workflows**
```json
// ✅ Good: Leverages context effectively
{
  "nodes": {
    "smart-processor": {
      "inputs": {
        "user_id": "${ctx.request.body.user_id}",
        "user_data": "js/ctx.vars['fetch-user']?.data",
        "processing_mode": "js/ctx.request.body.batch ? 'batch' : 'single'",
        "retry_count": "js/ctx.vars['retry-tracker']?.count || 0",
        "environment": "js/process.env.NODE_ENV",
        "request_id": "js/ctx.id"
      }
    }
  }
}
```

### **Anti-Patterns to Avoid**

#### **❌ Don't: Hardcode Configuration Values**
```json
// ❌ Bad: Hardcoded values
{
  "inputs": {
    "api_url": "https://production-api.company.com",
    "timeout": 5000,
    "api_key": "abc123def456"
  }
}

// ✅ Good: Environment-based configuration
{
  "inputs": {
    "api_url": "js/process.env.API_BASE_URL",
    "timeout": "js/parseInt(process.env.API_TIMEOUT) || 5000", 
    "api_key": "js/process.env.API_KEY"
  }
}
```

#### **❌ Don't: Ignore Schema Validation**
```typescript
// ❌ Bad: No input validation
export default class UnsafeNode extends NodeBlok<any> {
  constructor() {
    super();
    // No inputSchema defined
  }
  
  async handle(ctx: Context, inputs: any) {
    // Directly using inputs without validation
    const result = await someOperation(inputs.data.user.email);
  }
}

// ✅ Good: Proper validation
export default class SafeNode extends NodeBlok<UserInputs> {
  constructor() {
    super();
    this.inputSchema = { /* proper schema */ };
  }
  
  async handle(ctx: Context, inputs: UserInputs) {
    // Inputs are validated by framework
    const result = await someOperation(inputs.user_email);
  }
}
```

#### **❌ Don't: Create Overly Complex Workflows**
```json
// ❌ Bad: Monolithic workflow
{
  "name": "everything-workflow",
  "steps": [
    "validate", "fetch-user", "check-permissions", "update-profile", 
    "send-email", "log-activity", "update-analytics", "send-notification",
    "update-cache", "trigger-webhooks", "generate-report"
  ]
}

// ✅ Good: Focused workflows that can be composed
{
  "name": "user-profile-update",
  "steps": ["validate", "update-profile", "send-confirmation"]
}
```

#### **❌ Don't: Ignore Error Context**
```typescript
// ❌ Bad: Generic error handling
catch (error) {
  response.setError(new GlobalError('Something went wrong'));
}

// ✅ Good: Contextual error handling
catch (error: unknown) {
  const nodeError = new GlobalError(`User validation failed: ${(error as Error).message}`);
  nodeError.setCode(400);
  nodeError.setJson({
    user_id: inputs.user_id,
    validation_step: 'email_format',
    attempted_email: inputs.email
  });
  response.setError(nodeError);
}
```

### **Performance Considerations**

#### **1. Efficient Context Usage**
```json
// ✅ Good: Minimize data copying
{
  "inputs": {
    "user_id": "${ctx.request.body.user_id}",  // Extract only what's needed
    "specific_field": "js/ctx.vars['large-dataset'].summary"  // Use specific fields
  }
}

// ❌ Bad: Copying large objects
{
  "inputs": {
    "all_data": "js/ctx.vars"  // Copies entire context
  }
}
```

#### **2. Conditional Execution**
```json
// ✅ Good: Skip expensive operations when possible
{
  "conditions": [
    {
      "type": "if",
      "condition": "ctx.request.body.force_refresh !== true && ctx.vars['cache-check']?.is_fresh",
      "steps": [
        {
          "name": "return-cached-data",
          "node": "cache-retriever",
          "type": "module"
        }
      ]
    },
    {
      "type": "else",
      "steps": [
        {
          "name": "expensive-computation",
          "node": "heavy-processor",
          "type": "module"
        }
      ]
    }
  ]
}
```

#### **3. Batch Processing**
```typescript
// ✅ Good: Process items in batches
async handle(ctx: Context, inputs: BatchInputs): Promise<INodeBlokResponse> {
  const response = new NodeBlokResponse();
  const batchSize = inputs.batch_size || 100;
  const results = [];
  
  for (let i = 0; i < inputs.items.length; i += batchSize) {
    const batch = inputs.items.slice(i, i + batchSize);
    const batchResult = await this.processBatch(batch);
    results.push(...batchResult);
    
    // Allow other operations between batches
    await new Promise(resolve => setImmediate(resolve));
  }
  
  response.setSuccess({ processed_items: results });
  return response;
}
```

---

## 🧪 **Testing Patterns**

### **Node Testing**
```typescript
// test/nodes/my-node.test.ts
import MyNode from '../src/nodes/my-node';
import { Context } from '@blok-ts/runner';

describe('MyNode', () => {
  let node: MyNode;
  let mockContext: Context;
  
  beforeEach(() => {
    node = new MyNode();
    mockContext = {
      id: 'test-123',
      request: { body: {} },
      response: { data: null },
      vars: {},
      logger: { log: jest.fn(), error: jest.fn() }
    } as any;
  });
  
  test('should process valid input correctly', async () => {
    const inputs = { message: 'Hello World' };
    const result = await node.handle(mockContext, inputs);
    
    expect(result.success).toBe(true);
    expect(result.data.message).toBe('Hello World');
  });
  
  test('should handle invalid input gracefully', async () => {
    const inputs = { message: '' };
    const result = await node.handle(mockContext, inputs);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### **Workflow Testing**
```bash
# Test workflow endpoints
curl -X POST http://localhost:4000/test-endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Load testing
npx autocannon -c 10 -d 30 http://localhost:4000/health-check
```

### **Integration Testing**
```typescript
// test/integration/workflow.test.ts
import request from 'supertest';
import app from '../src/index';

describe('User Registration Workflow', () => {
  test('complete user registration flow', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'securePassword123',
      firstName: 'John',
      lastName: 'Doe'
    };
    
    const response = await request(app)
      .post('/register')
      .send(userData)
      .expect(200);
      
    expect(response.body.success).toBe(true);
    expect(response.body.user_id).toBeDefined();
  });
});
```

---

## 📦 **Deployment & Production**

### **Enterprise Deployment Patterns**

#### **Multi-Trigger Architecture (Recommended)**
**Use Case**: Production environments requiring both HTTP and gRPC access to same business logic

```yaml
# docker-compose.yml - Enterprise multi-trigger setup
version: '3.8'
services:
  # HTTP API Gateway
  blok-http:
    image: blok-http-trigger:latest
    ports:
      - "4000:4000"
    volumes:
      - ./src/nodes:/app/nodes:ro          # Shared read-only nodes
      - ./workflows:/app/workflows:ro      # Shared read-only workflows
    environment:
      # ⚠️ CRITICAL: Runner Discovery Variables (Required)
      - PROJECT_PATH=/app
      - NODES_PATH=/app/nodes
      - WORKFLOWS_PATH=/app/workflows
      
      # HTTP Trigger Configuration
      - HTTP_PORT=4000
      - NODE_ENV=production
      
      # Python Runtime Communication (if using Python nodes)
      - RUNTIME_PYTHON3_HOST=blok-python3
      - RUNTIME_PYTHON3_PORT=50052
      
      # Observability & Logging
      - CONSOLE_LOG_ACTIVE=true
      - PROJECT_NAME=blok-http-production
      - PROJECT_VERSION=1.0.0
      
  # gRPC Internal Services  
  blok-grpc:
    image: blok-grpc-trigger:latest
    ports:
      - "50051:50051"
    volumes:
      - ./src/nodes:/app/nodes:ro          # Same nodes folder
      - ./workflows:/app/workflows:ro      # Same workflows folder
    environment:
      # ⚠️ CRITICAL: Runner Discovery Variables (Required)
      - PROJECT_PATH=/app
      - NODES_PATH=/app/nodes
      - WORKFLOWS_PATH=/app/workflows
      
      # gRPC Trigger Configuration
      - GRPC_PORT=50051
      - NODE_ENV=production
      
      # Python Runtime Communication (if using Python nodes)
      - RUNTIME_PYTHON3_HOST=blok-python3
      - RUNTIME_PYTHON3_PORT=50052
      
      # Observability & Logging
      - CONSOLE_LOG_ACTIVE=true
      - PROJECT_NAME=blok-grpc-production
      - PROJECT_VERSION=1.0.0
      
    # Python3 Runtime Container (if using Python nodes)
  blok-python3:
    image: blok-python3-runtime:latest
    ports:
      - "50052:50052"
    volumes:
      - ./src/nodes:/app/nodes:ro          # Access to Python nodes
    environment:
      - GRPC_PORT=50052
      - NODES_PATH=/app/nodes
      - NODE_ENV=production
      
  # Continuous Deployment via GitHub Actions
  # Only deploys nodes and workflows, triggers stay running
```

**Benefits**:
- ✅ **Zero Downtime Deployments**: Update nodes/workflows without restarting triggers
- ✅ **Multi-Protocol Access**: HTTP for web, gRPC for internal services
- ✅ **Shared Business Logic**: Same nodes available via both protocols
- ✅ **Scalable Architecture**: Scale triggers independently
- ✅ **CI/CD Friendly**: Deploy only business logic, not infrastructure

#### **Monolithic Modular Installation**
**Use Case**: Test environments or smaller deployments

```yaml
# Single container, multiple triggers
version: '3.8'
services:
  blok-unified:
    image: blok-unified:latest
    ports:
      - "4000:4000"    # HTTP
      - "50051:50051"  # gRPC
    volumes:
      - ./src/nodes:/app/nodes
      - ./workflows:/app/workflows
    environment:
      # ⚠️ CRITICAL: Runner Discovery Variables (Required)
      - PROJECT_PATH=/app
      - NODES_PATH=/app/nodes
      - WORKFLOWS_PATH=/app/workflows
      
      # Trigger Configuration
      - ENABLE_HTTP=true
      - ENABLE_GRPC=true
      - HTTP_PORT=4000
      - GRPC_PORT=50051
      
      # Python Runtime (embedded mode)
      - RUNTIME_PYTHON3_HOST=localhost
      - RUNTIME_PYTHON3_PORT=50052
      
      # Environment
      - NODE_ENV=production
      - CONSOLE_LOG_ACTIVE=true
```

### **Docker Deployment**
```dockerfile
# Dockerfile (updated with required environment variables)
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY workflows/ ./workflows/
COPY .env.local ./.env.local

# ⚠️ CRITICAL: Set discovery paths for runner
ENV PROJECT_PATH=/app
ENV NODES_PATH=/app/nodes
ENV WORKFLOWS_PATH=/app/workflows

# Default configuration
ENV NODE_ENV=production
ENV HTTP_PORT=4000
ENV CONSOLE_LOG_ACTIVE=true

# Python runtime (update based on your architecture)
ENV RUNTIME_PYTHON3_HOST=localhost
ENV RUNTIME_PYTHON3_PORT=50052

EXPOSE 4000
EXPOSE 50052

CMD ["npm", "start"]
```

### **Environment Configuration**
```bash
# ⚠️ CRITICAL: Runner Discovery Variables (REQUIRED for all deployments)
PROJECT_PATH=/app
NODES_PATH=/app/nodes
WORKFLOWS_PATH=/app/workflows

# Trigger Configuration
NODE_ENV=production
HTTP_PORT=4000
GRPC_PORT=50051

# Python Runtime Communication (if using Python nodes)
RUNTIME_PYTHON3_HOST=localhost  # or container name in Docker
RUNTIME_PYTHON3_PORT=50052

# Observability & Logging
CONSOLE_LOG_ACTIVE=true
LOG_LEVEL=info
PROJECT_NAME=blok-production
PROJECT_VERSION=1.0.0

# Database (if needed by nodes)
DB_HOST=production-db.company.com
DB_PORT=5432
DB_NAME=blok_production
DB_USER=blok_user
DB_PASSWORD=secure_password

# API Keys (if needed by nodes)
OPENAI_API_KEY=your_openai_key
MONGODB_URI=your_mongodb_connection_string
```

### **⚠️ Critical Environment Variables Explained**

#### **Runner Discovery Variables** (REQUIRED)
```bash
PROJECT_PATH=/app          # Root project directory
NODES_PATH=/app/nodes      # Where runner discovers local nodes  
WORKFLOWS_PATH=/app/workflows  # Where runner discovers file-based workflows
```

**What happens without these**:
- ❌ `type: "local"` nodes won't be found → Runtime errors
- ❌ JSON/YAML workflows won't load → 404 errors  
- ❌ Auto-discovery features break → Manual registration only

#### **Python Runtime Variables** (Required for Python nodes)
```bash
RUNTIME_PYTHON3_HOST=blok-python3    # Python runtime container/host
RUNTIME_PYTHON3_PORT=50052           # Python runtime gRPC port
```

**What happens without these**:
- ❌ `type: "runtime.python3"` nodes fail → Connection errors
- ❌ Cannot execute Python nodes → Workflow breaks
- ❌ Runtime communication fails → gRPC timeouts

#### **Observability Variables** (Recommended)
```bash
PROJECT_NAME=blok-production     # OpenTelemetry service name
PROJECT_VERSION=1.0.0           # Version for metrics/tracing
CONSOLE_LOG_ACTIVE=true         # Enable console logging
```

**Benefits**:
- ✅ Proper service identification in monitoring
- ✅ Version tracking in metrics
- ✅ Structured logging output

# External services
API_BASE_URL=https://api.company.com
JWT_SECRET=production_jwt_secret
REDIS_URL=redis://redis.company.com:6379

# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
TRACING_ENABLED=true
```

### **Monitoring & Observability**
```yaml
# docker-compose.yml (auto-generated in infra/)
version: '3.8'
services:
  app:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    depends_on:
      - prometheus
      - grafana
      
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./infra/metrics/prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    volumes:
      - ./infra/metrics/grafana:/var/lib/grafana
```

**Built-in Metrics Available**:
- `blok_workflow_executions_total` - Total workflow executions
- `blok_workflow_duration_seconds` - Workflow execution time
- `blok_node_executions_total` - Individual node executions
- `blok_errors_total` - Error count by type
- `blok_active_workflows` - Currently executing workflows

### **Scaling Strategies**
```bash
# Horizontal scaling
docker-compose up --scale app=3

# Load balancer configuration (nginx)
upstream blok_backend {
  server app1:4000;
  server app2:4000; 
  server app3:4000;
}
```

---

## 📞 **Support & Resources**

### **Getting Help**
- **Documentation**: https://blok.build/
- **GitHub Repository**: https://github.com/deskree/blok-framework
- **Community Discord**: [Coming with public release]
- **Issue Tracker**: GitHub Issues

### **Environment Variables (Auto-configured)**
**Purpose**: Critical configuration for node and workflow loading

**Automatically created in .env.local**:
```bash
# Project paths (absolute paths required)
PROJECT_PATH=/absolute/path/to/your/project
NODES_PATH=/absolute/path/to/project/src/nodes
WORKFLOWS_PATH=/absolute/path/to/project/workflows

# HTTP trigger configuration
HTTP_PORT=4000

# Python runtime (if enabled)
RUNTIME_PYTHON3_HOST=localhost
RUNTIME_PYTHON3_PORT=50051

# Development settings
NODE_ENV=development
DEBUG=blok:*
```

**How the framework uses these**:
- `NODES_PATH`: Auto-discovery for `type: "local"` nodes
- `WORKFLOWS_PATH`: Auto-discovery for JSON/YAML/TOML workflows  
- `PROJECT_PATH`: Base path for relative file operations
- `RUNTIME_PYTHON3_*`: gRPC communication with Python nodes

### **CLI Reference**
```bash
# Available commands
npx blokctl@latest --help

# Project commands
npx blokctl@latest create project [name]
# Note: deploy command exists but varies by environment

# Node commands  
npx blokctl@latest create node [name]
# Note: build command handled by npm run build in project

# Workflow commands
npx blokctl@latest create workflow [name]
# Note: validation happens at runtime

# Development commands
npm run dev                      # Start dev server (in project)
# Note: monitor command not yet implemented
```

### **Migration from V2 to V3**
When upgrading from previous versions:

1. **Update CLI**: `npm install -g blokctl@latest`
2. **Update Dependencies**: `npm update @blok-ts/runner`
3. **Review Breaking Changes**: Check CHANGELOG.md
4. **Update Workflows**: New context syntax may require updates
5. **Test Thoroughly**: Validate all workflows in staging environment

---

## 📝 **Framework Changelog**

### **Version 3.0.0-pre - [Next Week Release]**
**Added**:
- Enhanced context system with `js/` expressions supporting full JavaScript execution
- Multi-language runtime support (TypeScript + Python, more languages planned)
- Native observability with OpenTelemetry and Prometheus integration
- Advanced workflow testing and validation tools
- UI-enabled nodes for dashboard and admin interface creation
- Improved CLI with better project scaffolding

**Changed**:
- Context syntax enhanced from simple string interpolation to full JavaScript evaluation
- Node base class simplified with better error handling patterns
- Workflow definition format expanded to support more complex conditional logic
- CLI name: `blokctl` (current and stable)

**Fixed**:
- Improved error propagation through workflow steps
- Better memory management for large dataset processing
- Enhanced schema validation performance

**Breaking Changes**:
- Some context access patterns from v2.x may need updates
- Node interface slightly modified for better type safety
- Workflow schema validation more strict

---

## 🎯 **AI Programming Quick Reference**

### **Key Decision Matrix for AI Agents**

#### **When creating nodes:**
```bash
# For global/production-ready nodes (RECOMMENDED):
type: "module" + use @blok-ts/* NPM packages

# For reusable/stable custom nodes:
type: "module" + register in Nodes.ts

# For rapid development/shared deployments:
type: "local" + place in NODES_PATH
# ↳ IDEAL for Docker/Kubernetes multi-trigger deployments

# For Python ML/AI functionality:
type: "runtime.python3"
```

#### **🌍 Global NPM Nodes (Ready for Immediate Use)**
```json
// HTTP/API calls - Universal web integration
{
  "name": "api-call",
  "node": "@blok-ts/api-call",
  "type": "module"
}

// Conditional logic - Smart workflow branching  
{
  "name": "flow-control", 
  "node": "@blok-ts/if-else",
  "type": "module"
}
```

**Installation**: `npm install @blok-ts/api-call @blok-ts/if-else`  
**Status**: ✅ Production-ready, tested, maintained by Blok team

#### **When creating workflows:**
```bash
# For AI-generated/visual tools (RECOMMENDED):
File-based (JSON/YAML/TOML) → auto-discovered from WORKFLOWS_PATH

# For complex logic/programmatic control:
TypeScript → must register in Workflows.ts
```

#### **Context syntax:**
```json
{
  "string_interpolation": "${ctx.request.body.id}",
  "javascript_execution": "js/ctx.request.body",
  "conditional_logic": "js/ctx.user.age > 18 ? 'adult' : 'minor'",
  "safe_access": "js/ctx.vars['previous-step']?.data || {}"
}
```

### **Critical Architecture Points**

1. **Loading System**: Static (imports required) vs Dynamic (auto-discovery)
2. **Environment Variables**: `NODES_PATH`, `WORKFLOWS_PATH` are essential
3. **Trigger Availability**: HTTP (CLI available), gRPC (functional, manual setup), MCP (broken)
4. **Deployment Pattern**: `type: "local"` ideal for multi-container shared node folders
5. **CLI Reality**: Many options commented out, focus on available features
6. **Context Power**: `js/` prefix enables full JavaScript execution in JSON
7. **Multi-language**: TypeScript native, Python via gRPC, more planned

### **Common AI Mistakes to Avoid**

❌ **Don't**: Create custom nodes when global NPM nodes exist  
✅ **Do**: Use `@blok-ts/api-call` for HTTP and `@blok-ts/if-else` for conditionals first

❌ **Don't**: Assume all CLI options from help text are available  
✅ **Do**: Use the specific options documented here

❌ **Don't**: Mix node types without understanding loading mechanisms  
✅ **Do**: Choose type based on use case (reusable vs prototype)

❌ **Don't**: Forget to register `type: "module"` nodes in Nodes.ts  
✅ **Do**: Use `type: "local"` for rapid development without registration

❌ **Don't**: Use complex logic in JSON without `js/` prefix  
✅ **Do**: Leverage full JavaScript execution with `js/` prefix

❌ **Don't**: Assume MCP trigger is functional  
✅ **Do**: Use HTTP (CLI) or gRPC (manual setup) triggers only

❌ **Don't**: Overlook `type: "local"` for production deployments  
✅ **Do**: Use `type: "local"` for Docker/Kubernetes shared node architectures

---

**This documentation enables AI agents to understand and program effectively with the Blok Framework's unique loading architecture, context system, and CLI tooling. The framework's workflow-based approach combined with static/dynamic loading creates a powerful platform for AI-driven backend development.** 