# TASK-005: MCP Server for Enterprise Digital Transformation
**Master Plan Reference**: Section 🔗 MCP Integration - Enterprise AI workflow acceleration  
**Dependencies**: None (uses existing remote execution protocol)
**Estimated Effort**: M (2 days) - MCP wrapper development with enterprise features
**Assigned To**: [To be assigned]
**Priority**: P1-High (Strategic for enterprise adoption and AI integration)

## Business Value
Create MCP Server that enables enterprise programmers and AI agents to rapidly integrate Blok workflows and nodes into Claude Desktop and other MCP-compatible tools, facilitating digital transformation with observable, business-ready solutions.

## Acceptance Criteria
- [ ] **MCP Wrapper Implementation**: Complete MCP server using @modelcontextprotocol SDK with --stdio transport
- [ ] **Dynamic Tool Discovery**: Automatically expose available workflows and nodes as MCP tools
- [ ] **Dual Execution Support**: Execute both individual nodes and complete workflows via existing protocols
- [ ] **Enterprise Security**: Token-based authentication for protected Blok deployments
- [ ] **Metadata Integration**: Rich tool descriptions with business value and usage guidance
- [ ] **Claude Desktop Ready**: Easy configuration for Claude Desktop integration
- [ ] **Observable Integration**: Maintain Blok's built-in observability and metrics

## Business Queries to Validate
1. "Can an enterprise team configure their Blok deployment as MCP tools in Claude Desktop within 5 minutes for immediate AI-powered workflow access?"
2. "Can Claude Desktop execute both individual Python AI nodes and complete multi-step data processing workflows seamlessly?"
3. "Do MCP-executed workflows maintain full observability and metrics tracking for enterprise monitoring requirements?"

## Current State Analysis

### Existing Remote Execution Infrastructure
✅ **Available Protocol**: Proven remote execution system
- **Node Execution**: `x-nanoservice-execute-node: true` header with BASE64 workflow
- **Workflow Execution**: Standard HTTP POST to workflow endpoints
- **Authentication**: Token-based security model
- **Response Handling**: Structured success/error responses with multiple content types

### MCP Architecture Decision
**Chosen Approach**: **MCP Wrapper** (not framework)
- ✅ **Zero Friction**: Existing Blok projects instantly MCP-enabled
- ✅ **Enterprise Ready**: URL + token security model
- ✅ **Reusable**: Single wrapper for all Blok deployments
- ✅ **Fast Business**: Setup in minutes, not hours

## Implementation Approach

### Phase 1: MCP Server Foundation
**Target Directory**: `triggers/mcp/`

**Core MCP Server Structure**:
```typescript
// src/BlokMcpServer.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequest, 
  CallToolResult, 
  ListToolsRequest, 
  Tool 
} from '@modelcontextprotocol/sdk/types.js';

interface BlokMcpConfig {
  host: string;
  token?: string;
  debug?: boolean;
  timeout?: number;
}

class BlokMcpServer {
  private server: Server;
  private config: BlokMcpConfig;
  private blokClient: BlokSDKClient;

  constructor(config: BlokMcpConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: 'blok-server',
        version: '1.0.0',
        description: 'MCP Server for Blok workflow and node execution'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequest, this.handleListTools.bind(this));
    this.server.setRequestHandler(CallToolRequest, this.handleCallTool.bind(this));
  }
}
```

### Phase 2: Dynamic Tool Discovery
**Target**: Automatic tool registration from Blok deployment

**HTTP Trigger Enhancement (Minimal)**:
```typescript
// Only add metadata endpoint for discovery
app.get('/mcp/metadata', authenticateToken, (req, res) => {
  const workflows = this.nodeMap.workflows;
  const nodes = this.getAvailableNodes();
  
  res.json({
    workflows: Object.keys(workflows).map(name => ({
      name,
      description: workflows[name].description || `Execute ${name} workflow`,
      inputs: workflows[name].getInputSchema?.() || {},
      businessValue: workflows[name].businessValue || 'Automated workflow processing',
      category: 'workflow'
    })),
    nodes: nodes.map(node => ({
      name: node.name,
      description: node.description || `Execute ${node.name} node`,
      inputs: node.inputSchema || {},
      runtime: node.runtime || 'module',
      businessValue: node.businessValue || 'Specialized node processing',
      category: 'node'
    }))
  });
});
```

**Tool Discovery Implementation**:
```typescript
async handleListTools(request: ListToolsRequest): Promise<{ tools: Tool[] }> {
  try {
    const metadata = await this.fetchMetadata();
    const tools: Tool[] = [];

    // Workflow tools
    for (const workflow of metadata.workflows) {
      tools.push({
        name: `workflow:${workflow.name}`,
        description: `${workflow.description}\n\nBusiness Value: ${workflow.businessValue}`,
        inputSchema: {
          type: 'object',
          properties: workflow.inputs,
          additionalProperties: true
        }
      });
    }

    // Node tools
    for (const node of metadata.nodes) {
      tools.push({
        name: `node:${node.name}`,
        description: `${node.description} (Runtime: ${node.runtime})\n\nBusiness Value: ${node.businessValue}`,
        inputSchema: {
          type: 'object',
          properties: node.inputs,
          additionalProperties: true
        }
      });
    }

    return { tools };
  } catch (error) {
    this.logError('Failed to fetch tools', error);
    return { tools: [] };
  }
}
```

### Phase 3: Dual Execution Engine
**Target**: Execute both workflows and nodes using existing protocols

**Execution Router**:
```typescript
async handleCallTool(request: CallToolRequest): Promise<CallToolResult> {
  const { name, arguments: args } = request.params;
  
  try {
    if (name.startsWith('workflow:')) {
      return await this.executeWorkflow(name.replace('workflow:', ''), args);
    } else if (name.startsWith('node:')) {
      return await this.executeNode(name.replace('node:', ''), args);
    } else {
      throw new Error(`Unknown tool type: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error executing ${name}: ${error.message}`
      }],
      isError: true
    };
  }
}
```

**Workflow Execution (Standard Protocol)**:
```typescript
async executeWorkflow(workflowName: string, inputs: any): Promise<CallToolResult> {
  const response = await fetch(`${this.config.host}/${workflowName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': this.config.token ? `Bearer ${this.config.token}` : ''
    },
    body: JSON.stringify(inputs)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Workflow execution failed: ${error}`);
  }

  const result = await this.parseResponse(response);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}
```

**Node Execution (Remote Protocol)**:
```typescript
async executeNode(nodeName: string, inputs: any): Promise<CallToolResult> {
  // Use existing BlokSDK for remote node execution
  const result = await this.blokClient.call('module', nodeName, inputs);
  
  if (!result.success) {
    throw new Error(`Node execution failed: ${result.errors?.[0]?.message || 'Unknown error'}`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result.data, null, 2)
    }]
  };
}
```

### Phase 4: Enterprise Configuration
**Target**: Easy setup for enterprise teams

**Configuration File Pattern**:
```json
// blok-mcp-config.json
{
  "host": "https://my-company-blok.herokuapp.com",
  "token": "enterprise-auth-token-12345",
  "debug": false,
  "timeout": 30000,
  "metadata": {
    "refresh_interval": 300,
    "cache_tools": true
  }
}
```

**Claude Desktop Integration**:
```json
// claude_desktop_config.json
{
  "mcpServers": {
    "blok-enterprise": {
      "command": "npx",
      "args": ["@blok-ts/mcp-server", "--config", "blok-mcp-config.json"],
      "env": {}
    }
  }
}
```

## Package Structure

### MCP Server Package
```
triggers/mcp/
├── src/
│   ├── BlokMcpServer.ts
│   ├── BlokSDKClient.ts (reuse existing)
│   ├── types/
│   │   ├── McpConfig.ts
│   │   └── BlokMetadata.ts
│   ├── utils/
│   │   ├── authentication.ts
│   │   └── response-parser.ts
│   └── index.ts
├── bin/
│   └── blok-mcp-server
├── examples/
│   ├── claude-desktop-config.json
│   └── enterprise-setup.md
├── package.json
├── tsconfig.json
└── README.md
```

### CLI Integration
```bash
# Add MCP server as global package
npm install -g @blok-ts/mcp-server

# Quick setup command
blok-mcp-server --init
# → Creates blok-mcp-config.json template

# Start MCP server
blok-mcp-server --config blok-mcp-config.json
```

## Testing Strategy

### MCP Protocol Testing
```typescript
describe('Blok MCP Server', () => {
  it('should list available tools from Blok deployment', async () => {
    const server = new BlokMcpServer({
      host: 'http://localhost:4000',
      token: 'test-token'
    });

    const tools = await server.handleListTools({});
    expect(tools.tools).toHaveLength(greaterThan(0));
    expect(tools.tools[0]).toHaveProperty('name');
    expect(tools.tools[0]).toHaveProperty('description');
  });

  it('should execute workflow via MCP', async () => {
    const result = await server.handleCallTool({
      params: {
        name: 'workflow:test-pipeline',
        arguments: { data: 'test input' }
      }
    });

    expect(result.content[0].type).toBe('text');
    expect(result.isError).toBeFalsy();
  });

  it('should execute node via MCP', async () => {
    const result = await server.handleCallTool({
      params: {
        name: 'node:sentiment-analysis',
        arguments: { text: 'This is amazing!' }
      }
    });

    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text)).toHaveProperty('sentiment');
  });
});
```

### Integration Testing with Claude Desktop
```bash
# Manual integration test
1. Start Blok HTTP trigger: npm run dev
2. Configure Claude Desktop with MCP server
3. Test workflow execution: "Analyze sentiment of this text"
4. Test node execution: "Process this data using the ml-model node"
5. Verify observability: Check Prometheus metrics endpoint
```

### Enterprise Security Testing
```typescript
describe('Enterprise Security', () => {
  it('should require valid token for protected deployments', async () => {
    const server = new BlokMcpServer({
      host: 'https://protected-blok.com',
      token: 'invalid-token'
    });

    await expect(server.fetchMetadata()).rejects.toThrow('Authentication failed');
  });

  it('should handle token refresh scenarios', async () => {
    // Test token expiration and refresh logic
  });
});
```

## Business Deployment Scenarios

### Scenario 1: Enterprise AI Team Setup
```bash
# 5-minute setup for enterprise team
1. Deploy Blok project: blokctl deploy --target production
2. Install MCP server: npm install -g @blok-ts/mcp-server  
3. Initialize config: blok-mcp-server --init
4. Configure token: edit blok-mcp-config.json
5. Add to Claude Desktop: copy config to claude_desktop_config.json
6. Start using: "Claude, analyze this customer feedback using our sentiment-analysis workflow"
```

### Scenario 2: Multi-Team Deployment
```json
// Multiple Blok deployments in single Claude Desktop
{
  "mcpServers": {
    "blok-ml-team": {
      "command": "npx",
      "args": ["@blok-ts/mcp-server", "--config", "ml-team-config.json"]
    },
    "blok-data-team": {
      "command": "npx", 
      "args": ["@blok-ts/mcp-server", "--config", "data-team-config.json"]
    }
  }
}
```

### Scenario 3: Development to Production Pipeline
```bash
# Development
blok-mcp-server --config dev-config.json

# Staging  
blok-mcp-server --config staging-config.json

# Production
blok-mcp-server --config prod-config.json
```

## Risk Assessment & Mitigation

### Technical Risks
- **MCP Protocol Changes**: SDK compatibility if MCP specification evolves
  - *Mitigation*: Use official @modelcontextprotocol SDK, version pinning
- **Authentication Complexity**: Token management across environments
  - *Mitigation*: Clear documentation, environment-specific configs
- **Performance Overhead**: MCP layer adding latency
  - *Mitigation*: Direct protocol usage, minimal abstraction

### Business Risks
- **Enterprise Security**: Token exposure in configuration files
  - *Mitigation*: Environment variable support, secure token storage guides
- **Tool Proliferation**: Too many tools confusing Claude Desktop
  - *Mitigation*: Smart categorization, tool filtering options

## Success Metrics & Validation

### Adoption Metrics
- **Setup Time**: Target <5 minutes from deployment to Claude Desktop integration
- **Tool Discovery**: All available workflows and nodes automatically exposed
- **Execution Success Rate**: >95% successful tool calls
- **Enterprise Adoption**: Multiple teams using MCP integration

### Performance Metrics
- **Response Time**: MCP calls complete within 5-10 seconds
- **Tool Refresh**: Metadata updates within 1 minute of deployment changes
- **Concurrent Usage**: Support multiple Claude Desktop instances

## Documentation Integration

### Enterprise Setup Guide
```markdown
# Blok MCP Server: Enterprise AI Integration

## Quick Start (5 minutes)
1. **Deploy your Blok project**
   ```bash
   blokctl deploy --target production
   ```

2. **Install MCP server globally**
   ```bash
   npm install -g @blok-ts/mcp-server
   ```

3. **Initialize configuration**
   ```bash
   blok-mcp-server --init
   # Edit blok-mcp-config.json with your deployment URL and token
   ```

4. **Add to Claude Desktop**
   ```json
   {
     "mcpServers": {
       "blok-enterprise": {
         "command": "blok-mcp-server",
         "args": ["--config", "blok-mcp-config.json"]
       }
     }
   }
   ```

5. **Start using in Claude**
   ```
   "Claude, execute our customer-sentiment-analysis workflow on this feedback data"
   ```

## Business Value
- **Instant AI Integration**: Your workflows available in Claude Desktop immediately
- **Zero Learning Curve**: Natural language access to your business logic
- **Full Observability**: All executions tracked via Blok's built-in metrics
- **Enterprise Security**: Token-based authentication with your existing infrastructure
```

## Definition of Done
- [ ] Complete MCP server implementation with dual execution capabilities
- [ ] Automatic tool discovery from any Blok deployment
- [ ] Enterprise-ready configuration and authentication
- [ ] Claude Desktop integration working with real workflows
- [ ] Comprehensive testing including enterprise security scenarios
- [ ] Documentation enabling 5-minute enterprise setup
- [ ] NPM package published for global installation

## AI Programming Impact
This MCP integration enables:
- **Natural Language Workflows**: Execute complex business logic through conversation
- **Enterprise AI Acceleration**: Immediate AI access to existing business processes
- **Observable AI Operations**: Full metrics and monitoring for AI-driven workflows
- **Democratized Automation**: Non-technical users accessing technical workflows
- **Rapid Digital Transformation**: Existing systems instantly AI-enabled

## Implementation Timeline
- **Day 1**: Core MCP server and tool discovery implementation
- **Day 2**: Dual execution engine, enterprise configuration, and Claude Desktop integration testing

---

**This MCP server positions Blok as the bridge between enterprise business logic and AI agents, enabling rapid digital transformation through conversational workflow access.** 