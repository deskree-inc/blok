# TASK-003: Multi-Platform SDK Ecosystem Expansion
**Master Plan Reference**: Section 🌍 SDK Ecosystem - Community integration acceleration  
**Dependencies**: None (independent SDK development, uses existing remote node execution protocol)
**Estimated Effort**: XL (7 days) - Multi-language SDK development with comprehensive testing
**Assigned To**: [To be assigned]
**Priority**: P1-High (Critical for community adoption and ecosystem expansion)

## Business Value
Expand Blok's reach by creating SDKs for major programming platforms, enabling developers to integrate Blok nodes as "remote microservices" from any tech stack while maintaining their own orchestration logic in their preferred language/framework.

## Acceptance Criteria
- [ ] **TypeScript SDK (Node.js/Bun/Deno)**: Full-featured SDK with type safety for server-side JavaScript runtimes
- [ ] **TypeScript SDK (React/Vue/Frontend)**: Browser-compatible SDK for frontend frameworks
- [ ] **C# SDK (.NET Core)**: Complete SDK for latest .NET ecosystem
- [ ] **Protocol Consistency**: All SDKs use identical remote node execution protocol
- [ ] **Documentation**: Complete usage examples for each SDK and platform
- [ ] **Testing**: Unit + integration tests for all SDKs with real node execution
- [ ] **NPM/NuGet Publishing**: SDKs available via package managers for easy installation

## Business Queries to Validate
1. "Can a React frontend directly call Blok Python nodes for AI processing while managing its own UI state orchestration?"
2. "Can a .NET Core backend integrate Blok nodes as microservices while maintaining C# business logic and Entity Framework workflows?"
3. "Can a Next.js application use Blok nodes for data processing on both server-side (SSR) and client-side components?"

## Current State Analysis

### Existing SDK (JavaScript/Vanilla)
✅ **Current Implementation**: `sdk/javascript/bloksdk.js`
- **Protocol**: HTTP POST with `x-nanoservice-execute-node: true` header
- **Encoding**: BASE64 JSON payload with dynamic workflow structure  
- **Runtimes**: Support for `python3`, `nodejs` (module/local)
- **Response Handling**: Structured response with success/error states
- **Content Types**: JSON, text, PDF, images, blobs

### Protocol Analysis
```javascript
// Current SDK Pattern
const workflow = {
  name: "Remote Node",
  trigger: { http: { method: "POST", path: "*" } },
  steps: [{ name: "node", node: nodeName, type: runtime }],
  nodes: { node: { inputs: inputs } }
};

// BASE64 Encoding
const base64Workflow = btoa(JSON.stringify({ request: {}, workflow: workflow }));

// HTTP Request
POST ${host}/${nodeName}
Headers: {
  "x-nanoservice-execute-node": "true",
  "Authorization": "Bearer ${token}",
  "Content-Type": "application/json"
}
Body: { Name, Message: base64Workflow, Encoding: "BASE64", Type: "JSON" }
```

### Server-Side Compatibility (HTTP Trigger)
✅ **Already Supports**: Remote node execution detection and processing
- **Header Detection**: `req.headers["x-nanoservice-execute-node"] === "true"`
- **Message Decoding**: Automatic BASE64 decode and workflow parsing
- **Runtime Mapping**: python3, local, module node types
- **Dynamic Workflow**: Temporary workflow creation and cleanup
- **Response**: Standard HTTP response with proper content-type handling

## Implementation Approach

### Phase 1: TypeScript SDK (Node.js/Bun/Deno) 
**Target Directory**: `sdk/typescript-node/`

**Core Interface Design**:
```typescript
// Types
interface BlokResponse<T = any> {
  success: boolean;
  data?: T;
  rawData?: any;
  errors?: BlokError[];
  contentType?: string;
  status?: number;
}

interface BlokError {
  status: number;
  message: string;
  code?: string;
}

interface BlokClientConfig {
  host: string;
  token?: string;
  debug?: boolean;
  headers?: Record<string, string>;
}

// Main Classes
class BlokSDK {
  createHttpClient(config: BlokClientConfig): BlokClient;
}

class BlokClient {
  // Runtime-specific methods
  async python3<T>(nodeName: string, inputs: any): Promise<BlokResponse<T>>;
  async nodejs<T>(nodeName: string, inputs: any, type?: 'module' | 'local'): Promise<BlokResponse<T>>;
  
  // Universal method
  async call<T>(runtime: string, nodeName: string, inputs: any): Promise<BlokResponse<T>>;
  
  // Configuration
  setHeaders(headers: Record<string, string>): void;
}
```

**Platform Compatibility**:
```typescript
// Node.js support
import fetch from 'node-fetch';  // For Node.js < 18

// Bun support (native fetch)
// Deno support (native fetch)

// Runtime detection
const isNode = typeof process !== 'undefined' && process.versions?.node;
const isBun = typeof Bun !== 'undefined';
const isDeno = typeof Deno !== 'undefined';
```

### Phase 2: TypeScript SDK (React/Vue/Frontend)
**Target Directory**: `sdk/typescript-browser/`

**Browser-Optimized Features**:
```typescript
// Browser-specific optimizations
class BlokBrowserClient extends BlokClient {
  // File upload support for browser
  async uploadFile(nodeName: string, file: File, inputs?: any): Promise<BlokResponse>;
  
  // Blob response handling
  async downloadFile(nodeName: string, inputs: any): Promise<Blob>;
  
  // CORS configuration
  private configureCORS(): RequestInit;
}

// React Hook
export function useBlokNode<T>(
  nodeName: string, 
  inputs: any, 
  runtime: string = 'module'
): {
  data: T | null;
  loading: boolean;
  error: BlokError | null;
  execute: () => Promise<void>;
  reset: () => void;
}

// Vue Composable
export function useBlokNode<T>(
  nodeName: Ref<string>, 
  inputs: Ref<any>, 
  runtime: Ref<string> = ref('module')
): {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<BlokError | null>;
  execute: () => Promise<void>;
  reset: () => void;
}
```

**Framework Integration Examples**:
```typescript
// React Component
const AIProcessor: React.FC = () => {
  const { data, loading, error, execute } = useBlokNode('sentiment-analysis', {
    text: 'This is amazing!'
  }, 'runtime.python3');

  return (
    <div>
      <button onClick={execute} disabled={loading}>
        {loading ? 'Processing...' : 'Analyze Sentiment'}
      </button>
      {data && <div>Result: {data.sentiment}</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
};

// Vue Component
<template>
  <div>
    <button @click="execute" :disabled="loading">
      {{ loading ? 'Processing...' : 'Analyze Sentiment' }}
    </button>
    <div v-if="data">Result: {{ data.sentiment }}</div>
    <div v-if="error">Error: {{ error.message }}</div>
  </div>
</template>

<script setup>
const { data, loading, error, execute } = useBlokNode(
  'sentiment-analysis',
  { text: 'This is amazing!' },
  'runtime.python3'
);
</script>
```

### Phase 3: C# SDK (.NET Core)
**Target Directory**: `sdk/csharp/`

**C# Implementation Design**:
```csharp
// Core Classes
public class BlokSDK
{
    public BlokClient CreateHttpClient(BlokClientConfig config) => new BlokClient(config);
}

public class BlokClient
{
    private readonly HttpClient _httpClient;
    private readonly BlokClientConfig _config;
    
    public BlokClient(BlokClientConfig config);
    
    // Runtime-specific methods
    public async Task<BlokResponse<T>> Python3Async<T>(string nodeName, object inputs);
    public async Task<BlokResponse<T>> NodeJsAsync<T>(string nodeName, object inputs, string type = "module");
    
    // Universal method
    public async Task<BlokResponse<T>> CallAsync<T>(string runtime, string nodeName, object inputs);
    
    // Configuration
    public void SetHeaders(Dictionary<string, string> headers);
}

// Response Types
public class BlokResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public object? RawData { get; set; }
    public List<BlokError>? Errors { get; set; }
    public string? ContentType { get; set; }
    public int? Status { get; set; }
}

public class BlokError
{
    public int Status { get; set; }
    public string Message { get; set; }
    public string? Code { get; set; }
}

public class BlokClientConfig
{
    public string Host { get; set; }
    public string? Token { get; set; }
    public bool Debug { get; set; } = false;
    public Dictionary<string, string>? Headers { get; set; }
}
```

**Advanced C# Features**:
```csharp
// Async Enumerable for streaming
public async IAsyncEnumerable<BlokResponse<T>> StreamAsync<T>(
    string nodeName, 
    object inputs, 
    string runtime = "module",
    [EnumeratorCancellation] CancellationToken cancellationToken = default)

// Extension Methods
public static class BlokClientExtensions
{
    public static async Task<BlokResponse<T>> CallPython3Async<T>(
        this BlokClient client, 
        string nodeName, 
        object inputs) =>
        await client.Python3Async<T>(nodeName, inputs);
}

// Dependency Injection Support
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddBlokClient(
        this IServiceCollection services, 
        BlokClientConfig config) =>
        services.AddSingleton(provider => new BlokSDK().CreateHttpClient(config));
}
```

## SDK Package Structure

### TypeScript Node SDK
```
sdk/typescript-node/
├── src/
│   ├── BlokSDK.ts
│   ├── BlokClient.ts
│   ├── types/
│   │   ├── BlokResponse.ts
│   │   ├── BlokError.ts
│   │   └── BlokClientConfig.ts
│   └── utils/
│       ├── encoding.ts
│       └── runtime-detection.ts
├── tests/
│   ├── unit/
│   └── integration/
├── examples/
│   ├── node-js-example.ts
│   ├── bun-example.ts
│   └── deno-example.ts
├── package.json
├── tsconfig.json
└── README.md
```

### TypeScript Browser SDK
```
sdk/typescript-browser/
├── src/
│   ├── BlokSDK.ts
│   ├── BlokBrowserClient.ts
│   ├── hooks/
│   │   ├── react.ts
│   │   └── vue.ts
│   └── types/ (shared with node)
├── tests/
├── examples/
│   ├── react-example/
│   ├── vue-example/
│   └── vanilla-example/
├── package.json
├── webpack.config.js
└── README.md
```

### C# SDK
```
sdk/csharp/
├── Blok.SDK/
│   ├── BlokSDK.cs
│   ├── BlokClient.cs
│   ├── Models/
│   │   ├── BlokResponse.cs
│   │   ├── BlokError.cs
│   │   └── BlokClientConfig.cs
│   └── Extensions/
│       └── ServiceCollectionExtensions.cs
├── Blok.SDK.Tests/
│   ├── Unit/
│   └── Integration/
├── Examples/
│   ├── ConsoleApp/
│   ├── WebApi/
│   └── BlazorApp/
├── Blok.SDK.csproj
└── README.md
```

## Testing Strategy

### Unit Testing (All SDKs)
```typescript
// TypeScript Example
describe('BlokClient', () => {
  it('should create valid BASE64 workflow', () => {
    const client = new BlokClient({ host: 'http://localhost:4000' });
    const workflow = client.createWorkflow('test-node', { input: 'test' }, 'module');
    expect(workflow).toBeDefined();
    expect(workflow.steps[0].name).toBe('node');
  });
  
  it('should handle different content types', async () => {
    const mockResponse = createMockResponse('application/json', { result: 'success' });
    const result = await client.handleResponse(mockResponse);
    expect(result.success).toBe(true);
    expect(result.data.result).toBe('success');
  });
});
```

```csharp
// C# Example
[Test]
public async Task CallAsync_ShouldReturnValidResponse_WhenNodeExecutesSuccessfully()
{
    // Arrange
    var client = new BlokClient(new BlokClientConfig { Host = "http://localhost:4000" });
    var inputs = new { text = "test input" };
    
    // Act
    var response = await client.CallAsync<dynamic>("module", "test-node", inputs);
    
    // Assert
    Assert.IsTrue(response.Success);
    Assert.IsNotNull(response.Data);
}
```

### Integration Testing (Real Node Execution)
```bash
# Setup test environment
docker run -d -p 4000:4000 blok-http-trigger
blokctl create node --name "test-echo" --runtime "typescript" --non-interactive

# Run SDK integration tests
npm test -- --integration  # TypeScript SDKs
dotnet test --filter="Category=Integration"  # C# SDK
```

### End-to-End Testing (Framework Integration)
```typescript
// React Testing Library
test('useBlokNode hook executes successfully', async () => {
  const { result } = renderHook(() => useBlokNode('echo', { message: 'test' }));
  
  await act(async () => {
    await result.current.execute();
  });
  
  expect(result.current.data).toEqual({ message: 'test' });
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBeNull();
});
```

## Package Publishing Strategy

### NPM Packages (TypeScript)
```json
// package.json for @blok-ts/sdk-node
{
  "name": "@blok-ts/sdk-node",
  "version": "1.0.0",
  "description": "Blok SDK for Node.js, Bun, and Deno",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "engines": {
    "node": ">=16.0.0",
    "bun": ">=1.0.0"
  },
  "keywords": ["blok", "workflow", "sdk", "nodejs", "bun", "deno", "remote-execution"]
}

// package.json for @blok-ts/sdk-browser  
{
  "name": "@blok-ts/sdk-browser",
  "version": "1.0.0",
  "description": "Blok SDK for React, Vue, and browser applications",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "browser": "dist/browser.js",
  "peerDependencies": {
    "react": ">=16.8.0",
    "vue": ">=3.0.0"
  }
}
```

### NuGet Package (C#)
```xml
<!-- Blok.SDK.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <PackageId>Blok.SDK</PackageId>
    <Version>1.0.0</Version>
    <Description>Blok SDK for .NET Core applications</Description>
    <PackageTags>blok;workflow;sdk;dotnet;remote-execution</PackageTags>
    <RepositoryUrl>https://github.com/blok-ts/blok</RepositoryUrl>
  </PropertyGroup>
</Project>
```

## Documentation Integration

### Update blok.md with Multi-Platform SDK Section
```markdown
## Multi-Platform SDK Integration

### Node.js/TypeScript Applications
```typescript
import { BlokSDK } from '@blok-ts/sdk-node';

const blok = new BlokSDK().createHttpClient({
  host: 'http://localhost:4000',
  token: 'your-api-token'
});

// Call Python AI node from TypeScript
const sentiment = await blok.python3('sentiment-analysis', {
  text: 'This integration is amazing!'
});

console.log(sentiment.data); // { sentiment: 'positive', confidence: 0.95 }
```

### React Frontend Applications
```typescript
import { useBlokNode } from '@blok-ts/sdk-browser/react';

function AIComponent() {
  const { data, loading, execute } = useBlokNode('image-description', {
    image_url: 'https://example.com/image.jpg'
  }, 'runtime.python3');

  return (
    <div>
      <button onClick={execute} disabled={loading}>
        Analyze Image
      </button>
      {data && <p>Description: {data.description}</p>}
    </div>
  );
}
```

### .NET Core Applications
```csharp
using Blok.SDK;

var blok = new BlokSDK().CreateHttpClient(new BlokClientConfig {
    Host = "http://localhost:4000",
    Token = "your-api-token"
});

// Call Blok node from C#
var response = await blok.Python3Async<dynamic>("ml-model", new {
    data = new[] { 1.0, 2.0, 3.0 },
    model_type = "classification"
});

Console.WriteLine($"Prediction: {response.Data.prediction}");
```
```

## Risk Assessment & Mitigation

### Technical Risks
- **Protocol Changes**: SDK compatibility if remote execution protocol evolves
  - *Mitigation*: Version the protocol, maintain backward compatibility
- **Cross-Platform Consistency**: Different behavior across runtimes
  - *Mitigation*: Comprehensive cross-platform testing, shared test suites
- **Dependency Management**: Package conflicts in different ecosystems
  - *Mitigation*: Minimal dependencies, peer dependencies for framework integrations

### Business Risks
- **Maintenance Overhead**: Multiple SDKs to maintain
  - *Mitigation*: Shared protocol implementation, automated testing, community contributions
- **Documentation Drift**: SDKs and docs getting out of sync
  - *Mitigation*: Generated documentation, integrated examples

## Success Metrics & Validation

### Technical Validation
- **All SDKs pass integration tests**: Real node execution from each platform
- **Framework integration works**: React/Vue hooks, .NET DI container
- **Performance consistency**: Similar response times across SDKs
- **Error handling parity**: Consistent error structures and handling

### Business Validation Examples
```bash
# Multi-platform workflow validation
# React → Blok Python AI → .NET backend → TypeScript API

# Frontend (React)
const analysis = await blok.python3('sentiment-analysis', { text: userInput });

# Backend (.NET)
var processed = await blok.NodeJsAsync<ProcessedData>("data-processor", rawData);

# API (Node.js)
const result = await blok.call('local', 'business-logic', { analysis, processed });
```

### Community Adoption Metrics
- **Package Downloads**: NPM + NuGet download statistics
- **GitHub Activity**: Stars, forks, issues, PRs on SDK repositories
- **Integration Examples**: Community-created examples and tutorials
- **Stack Overflow**: Questions and answers about Blok SDK usage

## Definition of Done
- [ ] All 3 SDKs implemented with full feature parity
- [ ] Unit + integration tests passing for all SDKs
- [ ] Framework integrations (React hooks, Vue composables, .NET DI) working
- [ ] All packages published to NPM and NuGet
- [ ] Comprehensive documentation with examples for each platform
- [ ] Business queries validated with real multi-platform workflows
- [ ] Performance benchmarks completed across all SDKs
- [ ] Community contribution guidelines established for SDK maintenance

## AI Programming Impact
This task dramatically expands Blok's accessibility by enabling:
- **Language Freedom**: Use Blok from any major programming platform
- **Hybrid Architecture**: Frontend + Backend + AI nodes in single application
- **Ecosystem Growth**: Community can integrate Blok into existing applications
- **Rapid Adoption**: Developers don't need to change their tech stack
- **Remote Microservices**: Blok nodes as language-agnostic API endpoints

## Implementation Timeline
- **Day 1-2**: TypeScript Node SDK (core implementation + testing)
- **Day 3-4**: TypeScript Browser SDK (framework integrations + testing)
- **Day 5-6**: C# .NET Core SDK (implementation + testing)
- **Day 7**: Package publishing, documentation, and final validation

---

**This task establishes Blok as a truly universal platform, enabling seamless integration from any programming language or framework while maintaining the power of remote node execution and multi-runtime workflows.** 