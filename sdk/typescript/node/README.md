# @blok-ts/sdk-node

Official TypeScript SDK for Blok Framework - Node.js/Bun/Deno runtime

## 🚀 Installation

```bash
npm install @blok-ts/sdk-node
# or
yarn add @blok-ts/sdk-node
# or
pnpm add @blok-ts/sdk-node
```

## 📦 Usage

### Basic Setup

```typescript
import { BlokClient, createBlokClient } from '@blok-ts/sdk-node';

// Create client instance
const client = new BlokClient({
  host: 'http://localhost:4000',
  token: 'your-auth-token', // optional
  debug: false, // optional
  timeout: 30000 // optional, in milliseconds
});

// Or use factory function
const client = createBlokClient({
  host: 'https://your-blok-deployment.com'
});
```

### Execute Python Nodes

```typescript
interface AIResponse {
  answer: string;
  confidence: number;
}

const result = await client.python3<AIResponse>('my-ai-node', {
  prompt: 'What is the capital of France?',
  model: 'gpt-4'
});

if (result.success) {
  console.log('AI Response:', result.data.answer);
  console.log('Confidence:', result.data.confidence);
} else {
  console.error('Error:', result.errors);
}
```

### Execute TypeScript/Node.js Nodes

```typescript
// Execute published npm package node
const apiResult = await client.nodejs('@blok-ts/api-call', {
  url: 'https://api.github.com/users/octocat',
  method: 'GET',
  headers: {
    'User-Agent': 'Blok-SDK'
  }
});

// Execute local node
const localResult = await client.nodejs('my-local-node', {
  input: 'process this data'
}, 'local');
```

### Execute Complete Workflows

```typescript
import type { WorkflowDefinition } from '@blok-ts/sdk-node';

const workflow: WorkflowDefinition = {
  name: 'Data Processing Pipeline',
  description: 'Process user data through multiple steps',
  version: '1.0.0',
  trigger: {
    http: {
      method: 'POST',
      path: '/process',
      accept: 'application/json'
    }
  },
  steps: [
    {
      name: 'validate',
      node: 'data-validator',
      type: 'local'
    },
    {
      name: 'transform',
      node: 'data-transformer',
      type: 'runtime.python3'
    },
    {
      name: 'save',
      node: '@blok-ts/api-call',
      type: 'module'
    }
  ],
  nodes: {
    validate: {
      inputs: { schema: 'user-schema.json' }
    },
    transform: {
      inputs: { 
        format: 'normalized',
        rules: ['remove_pii', 'validate_email']
      }
    },
    save: {
      inputs: {
        url: 'https://api.myapp.com/users',
        method: 'POST'
      }
    }
  }
};

const result = await client.executeWorkflow(workflow, {
  userData: {
    name: 'John Doe',
    email: 'john@example.com'
  }
});
```

### Advanced Configuration

```typescript
// Set custom headers
client.setHeaders({
  'x-correlation-id': 'req-123',
  'x-user-id': 'user-456'
});

// Use timeout and custom headers per request
const result = await client.python3('slow-node', { data: 'large-dataset' }, {
  timeout: 60000, // 60 seconds
  headers: {
    'x-priority': 'high'
  }
});
```

## 🧩 TypeScript Support

Full TypeScript support with generic types:

```typescript
interface CustomResponse {
  processed: boolean;
  result: {
    id: string;
    status: 'success' | 'error';
    data: any[];
  };
}

const response = await client.python3<CustomResponse>('data-processor', {
  input: 'raw-data'
});

// response.data is fully typed as CustomResponse
if (response.success && response.data) {
  console.log('Processed:', response.data.processed);
  console.log('Result ID:', response.data.result.id);
}
```

## 🔄 Response Format

All SDK methods return a consistent response object:

```typescript
interface BlokResponse<T = any> {
  success: boolean;
  data: T | null;                    // Parsed JSON response
  rawData?: string | Blob;           // Raw response for non-JSON
  errors?: BlokError[] | BlokError;  // Error details if failed
  contentType?: string;              // Response content type
  status?: number;                   // HTTP status code
}
```

## 🌍 Cross-Platform Compatibility

This SDK works seamlessly across multiple JavaScript runtimes:

- **Node.js** 16+ (CommonJS and ES modules)
- **Bun** (native compatibility)
- **Deno** (with npm: specifier)

```typescript
// Node.js
import { BlokClient } from '@blok-ts/sdk-node';

// Bun
import { BlokClient } from '@blok-ts/sdk-node';

// Deno
import { BlokClient } from 'npm:@blok-ts/sdk-node';
```

## 🔧 Error Handling

```typescript
try {
  const result = await client.python3('my-node', { input: 'data' });
  
  if (!result.success) {
    // Handle API errors
    if (Array.isArray(result.errors)) {
      result.errors.forEach(error => {
        console.error(`Error ${error.status}: ${error.message}`);
      });
    } else if (result.errors) {
      console.error(`Error: ${result.errors.message}`);
    }
    return;
  }
  
  // Handle success
  console.log('Success:', result.data);
} catch (error) {
  // Handle network or unexpected errors
  console.error('Unexpected error:', error);
}
```

## 🔐 Authentication

```typescript
// Bearer token authentication
const client = new BlokClient({
  host: 'https://secure-blok.example.com',
  token: process.env.BLOK_API_TOKEN
});

// Custom authentication headers
const client = new BlokClient({
  host: 'https://custom-auth.example.com'
});

client.setHeaders({
  'Authorization': 'ApiKey your-api-key',
  'x-tenant-id': 'tenant-123'
});
```

## 📊 Business Use Cases

### AI/ML Processing

```typescript
const aiResult = await client.python3('sentiment-analyzer', {
  text: 'Customer feedback text here',
  model: 'bert-base-uncased',
  return_confidence: true
});
```

### Data Transformation

```typescript
const transformResult = await client.nodejs('csv-processor', {
  file_path: 'data/sales.csv',
  transformations: ['normalize_dates', 'calculate_totals'],
  output_format: 'json'
});
```

### API Integration

```typescript
const apiResult = await client.nodejs('@blok-ts/api-call', {
  url: 'https://api.stripe.com/v1/charges',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
  },
  data: {
    amount: 2000,
    currency: 'usd',
    source: 'tok_visa'
  }
});
```

## 🧪 Testing

```typescript
import { BlokClient } from '@blok-ts/sdk-node';

describe('Blok Integration', () => {
  const client = new BlokClient({
    host: process.env.BLOK_TEST_HOST || 'http://localhost:4000'
  });

  it('should process data successfully', async () => {
    const result = await client.python3('test-node', { input: 'test' });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

## 📋 Requirements

- Node.js 16.0.0 or higher
- TypeScript 4.5+ (for TypeScript projects)

## 🤝 Contributing

This SDK is part of the [Blok Framework](https://github.com/deskree-inc/blok) ecosystem.

## 📄 License

MIT License - see the [LICENSE](../../../LICENSE) file for details.
