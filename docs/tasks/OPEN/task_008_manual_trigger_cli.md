# TASK-008: Manual Trigger CLI for Workflow Testing and Development
**Master Plan Reference**: Section 🧪 Development Tools - CLI-based workflow execution for testing and debugging  
**Dependencies**: None (uses existing runner infrastructure)
**Estimated Effort**: M (2 days) - CLI command development with enhanced UX
**Assigned To**: [To be assigned]
**Priority**: P1-High (Critical for AI testing and development workflows)

## Business Value
Implement manual trigger CLI commands that enable rapid testing and debugging of workflows and nodes without HTTP dependencies, providing developers and AI agents with efficient tools for validation and iteration.

## Acceptance Criteria
- [ ] **Workflow Execution**: `blokctl workflow execute` command with current directory and project path discovery
- [ ] **Node Execution**: `blokctl node execute` command for individual node testing
- [ ] **Enhanced UX**: Shortcut options (--body, --query, --headers, --params) for common use cases
- [ ] **Output Formats**: JSON, pretty-print, and file output options
- [ ] **Native Context**: Generate proper Blok context objects from CLI inputs
- [ ] **Error Handling**: Clear error messages and exit codes for automation
- [ ] **Performance**: Fast execution suitable for development iteration cycles

## Business Queries to Validate
1. "Can AI agents quickly validate workflow logic using CLI commands before deployment to production?"
2. "Can developers test individual nodes with various input combinations during development without setting up HTTP requests?"
3. "Can the CLI be integrated into CI/CD pipelines for automated workflow validation and testing?"

## Current State Analysis

### Existing CLI Infrastructure
**Base CLI Framework**: `packages/cli/src/index.ts`
```typescript
// Current CLI commands structure
program
  .command('create')
  .command('deploy')
  .command('dev')
  .command('monitor')
// Missing: manual execution commands
```

**Existing Context System**: `core/runner/src/shared/types/Context.ts`
```typescript
interface Context {
  id: string;
  request: RequestContext;
  vars: Record<string, any>;
  logger: Logger;
  response: ResponseContext;
}

interface RequestContext {
  body: any;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  method: string;
}
```

### Required CLI Enhancement
```typescript
// New manual execution commands
program
  .command('workflow')
  .command('execute <name>')
  .option('--body <json>', 'Request body JSON')
  .option('--query <json>', 'Query parameters JSON')  
  .option('--headers <json>', 'Request headers JSON')
  .option('--params <json>', 'Path parameters JSON')
  .option('--json <json>', 'Complete context JSON')
  .option('--project-path <path>', 'Project directory path')
  .option('--output <format>', 'Output format: json|pretty|file')
  .action(executeWorkflow);
```

## Implementation Approach

### Phase 1: Core CLI Command Structure
**Target Directory**: `packages/cli/src/commands/execute/`

**Command Registration**:
```typescript
// packages/cli/src/index.ts
import { executeWorkflow } from './commands/execute/workflow.js';
import { executeNode } from './commands/execute/node.js';

program
  .command('workflow')
  .description('Workflow execution commands')
  .command('execute <workflowName>')
  .description('Execute a workflow manually')
  .option('--body <json>', 'Request body as JSON string')
  .option('--query <json>', 'Query parameters as JSON string')
  .option('--headers <json>', 'Request headers as JSON string') 
  .option('--params <json>', 'Path parameters as JSON string')
  .option('--json <json>', 'Complete context as JSON string')
  .option('--project-path <path>', 'Project directory path', process.cwd())
  .option('--output <format>', 'Output format: json|pretty|file:<path>', 'pretty')
  .option('--timeout <ms>', 'Execution timeout in milliseconds', '30000')
  .action(executeWorkflow);

program
  .command('node')
  .description('Node execution commands')
  .command('execute <nodeName>')
  .description('Execute a node manually')
  .option('--body <json>', 'Request body as JSON string')
  .option('--query <json>', 'Query parameters as JSON string')
  .option('--headers <json>', 'Request headers as JSON string')
  .option('--params <json>', 'Path parameters as JSON string')
  .option('--json <json>', 'Complete context as JSON string')
  .option('--project-path <path>', 'Project directory path', process.cwd())
  .option('--output <format>', 'Output format: json|pretty|file:<path>', 'pretty')
  .option('--runtime <type>', 'Node runtime: module|local|runtime.python3', 'module')
  .action(executeNode);
```

### Phase 2: Workflow Execution Implementation
**Target**: `packages/cli/src/commands/execute/workflow.ts`

```typescript
import { Runner } from '@blok-ts/runner';
import { createContext, loadWorkflow } from '../utils/execution-utils.js';
import { formatOutput } from '../utils/output-formatter.js';
import type { OptionValues } from 'commander';

export async function executeWorkflow(
  workflowName: string, 
  options: OptionValues
): Promise<void> {
  try {
    const { projectPath, timeout } = options;
    
    // Load workflow from project
    const workflow = await loadWorkflow(workflowName, projectPath);
    if (!workflow) {
      console.error(`❌ Workflow '${workflowName}' not found in ${projectPath}`);
      process.exit(1);
    }

    // Create context from CLI options
    const context = createContext(options);
    
    // Execute workflow
    console.log(`🚀 Executing workflow: ${workflowName}`);
    const startTime = Date.now();
    
    const runner = new Runner(workflow);
    const result = await Promise.race([
      runner.execute(context),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Execution timeout')), parseInt(timeout))
      )
    ]);

    const duration = Date.now() - startTime;
    
    // Format and output results
    const output = {
      workflow: workflowName,
      success: true,
      duration_ms: duration,
      result: result.data,
      context_id: context.id,
      execution_info: {
        steps_executed: result.stepsExecuted || 0,
        final_context: {
          vars: result.ctx?.vars || {},
          response: {
            contentType: result.ctx?.response?.contentType,
            status: 200
          }
        }
      }
    };

    await formatOutput(output, options.output);
    
    console.log(`✅ Workflow completed in ${duration}ms`);
    process.exit(0);

  } catch (error) {
    const errorOutput = {
      workflow: workflowName,
      success: false,
      error: {
        message: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString()
      }
    };

    await formatOutput(errorOutput, options.output);
    
    console.error(`❌ Workflow failed: ${error.message}`);
    process.exit(1);
  }
}
```

### Phase 3: Node Execution Implementation  
**Target**: `packages/cli/src/commands/execute/node.ts`

```typescript
import { NodeExecutor } from '@blok-ts/runner';
import { createContext, loadNode } from '../utils/execution-utils.js';
import { formatOutput } from '../utils/output-formatter.js';
import type { OptionValues } from 'commander';

export async function executeNode(
  nodeName: string,
  options: OptionValues
): Promise<void> {
  try {
    const { projectPath, runtime, timeout } = options;

    // Load node from project
    const node = await loadNode(nodeName, runtime, projectPath);
    if (!node) {
      console.error(`❌ Node '${nodeName}' not found in ${projectPath}`);
      process.exit(1);
    }

    // Create context from CLI options
    const context = createContext(options);

    // Get node inputs (if configured in project)
    const nodeInputs = await getNodeInputs(nodeName, projectPath);
    
    // Execute node
    console.log(`🔧 Executing node: ${nodeName} (${runtime})`);
    const startTime = Date.now();

    const executor = new NodeExecutor(runtime);
    const result = await Promise.race([
      executor.execute(node, context, nodeInputs),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Node execution timeout')), parseInt(timeout))
      )
    ]);

    const duration = Date.now() - startTime;

    // Format and output results
    const output = {
      node: nodeName,
      runtime,
      success: true,
      duration_ms: duration,
      result: result.data,
      context_id: context.id,
      execution_info: {
        inputs_used: nodeInputs,
        output_type: typeof result.data,
        context_changes: {
          vars_added: Object.keys(result.ctx?.vars || {}),
          response_content_type: result.ctx?.response?.contentType
        }
      }
    };

    await formatOutput(output, options.output);
    
    console.log(`✅ Node completed in ${duration}ms`);
    process.exit(0);

  } catch (error) {
    const errorOutput = {
      node: nodeName,
      runtime: options.runtime,
      success: false,
      error: {
        message: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString()
      }
    };

    await formatOutput(errorOutput, options.output);
    
    console.error(`❌ Node failed: ${error.message}`);
    process.exit(1);
  }
}
```

### Phase 4: Enhanced UX Utilities
**Target**: `packages/cli/src/commands/utils/execution-utils.ts`

```typescript
import { v4 as uuid } from 'uuid';
import type { Context, RequestContext } from '@blok-ts/runner';
import type { OptionValues } from 'commander';
import path from 'path';
import fs from 'fs/promises';

export function createContext(options: OptionValues): Context {
  // Generate unique execution ID
  const executionId = `manual-${uuid()}`;

  // If complete JSON context provided, use it
  if (options.json) {
    try {
      const contextData = JSON.parse(options.json);
      return {
        id: executionId,
        request: contextData.request || {},
        vars: contextData.vars || {},
        logger: createCliLogger(),
        response: { data: null, contentType: 'application/json' },
        ...contextData
      };
    } catch (error) {
      throw new Error(`Invalid JSON context: ${error.message}`);
    }
  }

  // Build context from individual options (enhanced UX)
  const request: RequestContext = {
    body: options.body ? JSON.parse(options.body) : {},
    query: options.query ? JSON.parse(options.query) : {},
    headers: options.headers ? JSON.parse(options.headers) : {},
    params: options.params ? JSON.parse(options.params) : {},
    method: determineHttpMethod(options)
  };

  return {
    id: executionId,
    request,
    vars: {},
    logger: createCliLogger(),
    response: { data: null, contentType: 'application/json' }
  };
}

function determineHttpMethod(options: OptionValues): string {
  // Smart method detection based on provided options
  if (options.body) return 'POST';
  if (options.query) return 'GET';
  if (options.params) return 'GET';
  return 'POST'; // Default
}

export async function loadWorkflow(
  workflowName: string, 
  projectPath: string
): Promise<any> {
  const possiblePaths = [
    path.join(projectPath, 'workflows', `${workflowName}.json`),
    path.join(projectPath, 'workflows', `${workflowName}.yaml`),
    path.join(projectPath, 'workflows', 'json', `${workflowName}.json`),
    path.join(projectPath, 'workflows', 'yaml', `${workflowName}.yaml`)
  ];

  for (const workflowPath of possiblePaths) {
    try {
      const content = await fs.readFile(workflowPath, 'utf8');
      
      if (workflowPath.endsWith('.json')) {
        return JSON.parse(content);
      } else if (workflowPath.endsWith('.yaml') || workflowPath.endsWith('.yml')) {
        const yaml = await import('yaml');
        return yaml.parse(content);
      }
    } catch (error) {
      // Continue to next path
      continue;
    }
  }

  return null;
}

export async function loadNode(
  nodeName: string,
  runtime: string, 
  projectPath: string
): Promise<any> {
  const possiblePaths = [
    path.join(projectPath, 'nodes', nodeName, 'index.ts'),
    path.join(projectPath, 'nodes', nodeName, 'index.js'),
    path.join(projectPath, 'nodes', `${nodeName}.ts`),
    path.join(projectPath, 'nodes', `${nodeName}.js`)
  ];

  for (const nodePath of possiblePaths) {
    try {
      await fs.access(nodePath);
      return { path: nodePath, name: nodeName, runtime };
    } catch (error) {
      continue;
    }
  }

  return null;
}

function createCliLogger() {
  return {
    log: (message: string) => console.log(`[LOG] ${message}`),
    error: (message: string) => console.error(`[ERROR] ${message}`),
    warn: (message: string) => console.warn(`[WARN] ${message}`),
    debug: (message: string) => process.env.DEBUG && console.log(`[DEBUG] ${message}`)
  };
}
```

**Output Formatter**: `packages/cli/src/commands/utils/output-formatter.ts`

```typescript
import fs from 'fs/promises';
import path from 'path';

export async function formatOutput(
  data: any, 
  outputFormat: string
): Promise<void> {
  if (outputFormat === 'json') {
    console.log(JSON.stringify(data, null, 0));
  } else if (outputFormat === 'pretty') {
    console.log(JSON.stringify(data, null, 2));
  } else if (outputFormat.startsWith('file:')) {
    const filePath = outputFormat.replace('file:', '');
    const dir = path.dirname(filePath);
    
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });
    
    // Write formatted JSON to file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`📄 Output written to: ${filePath}`);
  } else {
    throw new Error(`Invalid output format: ${outputFormat}. Use: json|pretty|file:<path>`);
  }
}
```

## Usage Examples and Developer Experience

### Basic Workflow Execution
```bash
# Simple workflow with body data
blokctl workflow execute "data-pipeline" --body '{"dataset": [1,2,3,4,5], "config": "prod"}'

# Workflow with query parameters  
blokctl workflow execute "search-api" --query '{"q": "test", "limit": 10}'

# Workflow with multiple parameters
blokctl workflow execute "api-endpoint" \
  --body '{"name": "test"}' \
  --headers '{"Authorization": "Bearer token123"}' \
  --params '{"userId": "123"}'
```

### Advanced Context Usage
```bash
# Complete custom context
blokctl workflow execute "complex-flow" --json '{
  "request": {
    "body": {"data": "test"},
    "query": {"filter": "active"},
    "headers": {"X-Custom": "value"}
  },
  "vars": {
    "environment": "development",
    "feature_flags": {"new_algorithm": true}
  }
}'
```

### Node Testing
```bash
# Test individual nodes
blokctl node execute "sentiment-analysis" --body '{"text": "This is amazing!"}'
blokctl node execute "data-processor" --body '{"dataset": [1,2,3,4,5]}' --runtime "module"
blokctl node execute "ml-model" --body '{"features": [0.1, 0.2]}' --runtime "runtime.python3"
```

### Output Options
```bash
# Pretty print (default)
blokctl workflow execute "test" --body '{}' --output pretty

# JSON output for scripts
blokctl workflow execute "test" --body '{}' --output json

# File output  
blokctl workflow execute "test" --body '{}' --output file:./results/test-output.json
```

### Project Path Discovery
```bash
# Current directory (default)
blokctl workflow execute "my-workflow" --body '{}'

# Specific project
blokctl workflow execute "my-workflow" --body '{}' --project-path ./my-blok-project
```

## Integration with Development Workflow

### CI/CD Pipeline Integration
```yaml
# .github/workflows/test-workflows.yml
name: Test Blok Workflows
on: [push, pull_request]

jobs:
  test-workflows:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Blok CLI
        run: npm install -g blokctl
      
      - name: Test Data Pipeline
        run: |
          blokctl workflow execute "data-pipeline" \
            --body '{"test_data": [1,2,3]}' \
            --output json > pipeline-result.json
      
      - name: Test ML Workflow  
        run: |
          blokctl workflow execute "ml-processor" \
            --body '{"model": "test", "data": [0.1, 0.2]}' \
            --timeout 60000 \
            --output file:./test-results/ml-output.json
      
      - name: Validate Results
        run: |
          # Validate output files exist and contain expected data
          test -f pipeline-result.json
          test -f ./test-results/ml-output.json
```

### Development Scripts Integration
```json
// package.json
{
  "scripts": {
    "test:workflows": "npm run test:data-pipeline && npm run test:ml-workflow",
    "test:data-pipeline": "blokctl workflow execute data-pipeline --body '{\"dataset\": [1,2,3]}' --output json",
    "test:ml-workflow": "blokctl workflow execute ml-processor --body '{\"model\": \"test\"}' --runtime runtime.python3",
    "validate:sentiment": "blokctl node execute sentiment-analysis --body '{\"text\": \"Test sentiment\"}' --runtime runtime.python3"
  }
}
```

## Testing Strategy

### CLI Command Testing
```typescript
describe('Manual Trigger CLI', () => {
  it('should execute workflow with body input', async () => {
    const mockWorkflow = createMockWorkflow();
    const result = await executeWorkflow('test-workflow', {
      body: '{"data": "test"}',
      projectPath: './test-project',
      output: 'json'
    });

    expect(result.success).toBe(true);
    expect(result.workflow).toBe('test-workflow');
  });

  it('should handle timeout correctly', async () => {
    const slowWorkflow = createSlowMockWorkflow();
    
    await expect(
      executeWorkflow('slow-workflow', {
        body: '{}',
        timeout: '1000', // 1 second
        projectPath: './test-project'
      })
    ).rejects.toThrow('Execution timeout');
  });

  it('should create proper context from CLI options', () => {
    const context = createContext({
      body: '{"name": "test"}',
      query: '{"filter": "active"}',
      headers: '{"Authorization": "Bearer token"}'
    });

    expect(context.request.body).toEqual({ name: 'test' });
    expect(context.request.query).toEqual({ filter: 'active' });
    expect(context.request.headers).toEqual({ Authorization: 'Bearer token' });
    expect(context.request.method).toBe('POST');
  });
});
```

### Integration Testing
```typescript
describe('CLI Integration Tests', () => {
  it('should execute real workflow end-to-end', async () => {
    // Setup test project with real workflow
    const testProject = await createTestProject();
    
    const result = await executeWorkflow('echo-workflow', {
      body: '{"message": "Hello World"}',
      projectPath: testProject.path,
      output: 'json'
    });

    expect(result.success).toBe(true);
    expect(result.result.message).toBe('Hello World');
    
    // Cleanup
    await cleanupTestProject(testProject);
  });
});
```

## Error Handling and User Experience

### Error Messages and Exit Codes
```typescript
// Exit codes for automation
const EXIT_CODES = {
  SUCCESS: 0,
  WORKFLOW_NOT_FOUND: 1,
  INVALID_INPUT: 2,
  EXECUTION_ERROR: 3,
  TIMEOUT: 4,
  CONFIGURATION_ERROR: 5
};

// User-friendly error messages
function formatError(error: Error, context: string): string {
  const errorMessages = {
    'Workflow not found': `❌ Workflow '${context}' not found. Check the name and project path.`,
    'Invalid JSON': `❌ Invalid JSON input. Please check your --body, --query, or --json parameters.`,
    'Execution timeout': `⏱️ Workflow execution timed out. Consider increasing --timeout or optimizing your workflow.`,
    'Node not found': `❌ Node '${context}' not found. Verify the node exists and the runtime is correct.`
  };

  return errorMessages[error.message] || `❌ Unexpected error: ${error.message}`;
}
```

### Help and Documentation
```bash
# Built-in help
blokctl workflow execute --help
blokctl node execute --help

# Examples in help text
Examples:
  blokctl workflow execute "data-pipeline" --body '{"data": [1,2,3]}'
  blokctl workflow execute "api-workflow" --query '{"q": "search"}' --headers '{"Auth": "token"}'
  blokctl node execute "sentiment" --body '{"text": "happy"}' --runtime "runtime.python3"
  blokctl workflow execute "complex" --json '{"request": {"body": {}}, "vars": {"env": "prod"}}'
```

## Performance Optimization

### Fast Execution Requirements
```typescript
// Lazy loading for faster startup
const lazyLoadRunner = async () => {
  const { Runner } = await import('@blok-ts/runner');
  return Runner;
};

// Caching for repeated executions
const workflowCache = new Map<string, any>();

async function loadWorkflowWithCache(name: string, path: string) {
  const cacheKey = `${path}:${name}`;
  
  if (workflowCache.has(cacheKey)) {
    return workflowCache.get(cacheKey);
  }
  
  const workflow = await loadWorkflow(name, path);
  workflowCache.set(cacheKey, workflow);
  return workflow;
}
```

## Risk Assessment & Mitigation

### Technical Risks
- **CLI Complexity**: Too many options confusing users
  - *Mitigation*: Progressive disclosure, clear examples, good defaults
- **Context Creation**: Invalid context causing runtime errors
  - *Mitigation*: Input validation, clear error messages, schema validation
- **Performance**: Slow CLI startup impacting developer experience
  - *Mitigation*: Lazy loading, caching, optimized imports

### Business Risks
- **Development Workflow**: CLI not fitting existing developer practices
  - *Mitigation*: Integration examples, documentation, community feedback
- **CI/CD Integration**: Complex setup for automated testing
  - *Mitigation*: Simple JSON output format, clear exit codes, examples

## Success Metrics & Validation

### Developer Experience Metrics
- **Command Execution Time**: <2 seconds for typical workflows
- **Error Rate**: <5% of executions result in CLI-related errors
- **Adoption**: Developers prefer CLI testing over HTTP setup for development
- **Integration Success**: CI/CD pipelines successfully using CLI commands

### Business Validation Examples
```bash
# Rapid Development Iteration
1. Developer creates new workflow
2. Tests with: blokctl workflow execute "new-flow" --body '{"test": "data"}'
3. Identifies issue, fixes code
4. Re-tests immediately with same command
5. Iteration cycle: <30 seconds

# AI Agent Validation
1. AI generates workflow configuration
2. Validates with: blokctl workflow execute --json '{"complete": "context"}'
3. Receives structured output for analysis
4. Iterates based on results

# CI/CD Integration
1. Pull request includes workflow changes
2. CI runs: blokctl workflow execute for all affected workflows
3. Results saved as artifacts
4. Automated validation of workflow behavior
```

## Definition of Done
- [ ] Complete CLI commands for workflow and node execution
- [ ] Enhanced UX with shortcut options (--body, --query, etc.)
- [ ] Multiple output formats (JSON, pretty, file)
- [ ] Proper context creation from CLI inputs
- [ ] Comprehensive error handling with user-friendly messages
- [ ] Integration testing with real workflows and nodes
- [ ] Documentation with usage examples and CI/CD integration
- [ ] Performance optimization for fast development cycles

## AI Programming Impact
This manual trigger CLI enables:
- **Rapid AI Validation**: Quick testing of AI-generated workflows without deployment
- **Development Acceleration**: Fast iteration cycles for workflow development
- **Automated Testing**: CI/CD integration for continuous workflow validation
- **Debugging Capability**: Isolated testing of individual nodes and workflows
- **Script Integration**: Programmable workflow execution for automation scenarios

## Implementation Timeline
- **Day 1**: Core CLI commands and context creation utilities
- **Day 2**: Enhanced UX features, output formatting, testing, and documentation

---

**This manual trigger CLI transforms the development experience by providing fast, flexible, and developer-friendly tools for workflow testing and validation.** 