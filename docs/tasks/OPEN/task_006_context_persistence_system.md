# TASK-006: Context Persistence System for Advanced Data Pipelines
**Master Plan Reference**: Section 💾 Data Pipeline Infrastructure - Persistent context for complex workflows  
**Dependencies**: None (extends existing runner context system)
**Estimated Effort**: L (3 days) - Context persistence with multi-datasource support
**Assigned To**: [To be assigned]
**Priority**: P1-High (Critical for advanced data pipeline capabilities)

## Business Value
Implement configurable context persistence system enabling powerful data pipelines with state management, cross-workflow coordination, and resumable processing for complex data engineering scenarios.

## Acceptance Criteria
- [ ] **Multi-DataSource Support**: Redis, PostgreSQL, MongoDB, S3, File System configurable via environment variables
- [ ] **Automatic Persistence**: Context automatically saved after each node execution
- [ ] **Read-Only Access**: `ctx.datasource()` provides secure read access to persisted data
- [ ] **Key Management**: Uses `ctx.request.id` as base for unique persistence keys
- [ ] **Workflow Configuration**: Workflows can specify which datasources are available
- [ ] **Node-Level Control**: Individual nodes can control persistence behavior
- [ ] **Error Handling**: Fail-fast when datasources are misconfigured
- [ ] **Performance Optimization**: Efficient serialization and caching strategies

## Business Queries to Validate
1. "Can a data pipeline process large datasets by persisting intermediate results to S3 and resuming from any failed step?"
2. "Can parallel data processing workflows coordinate through shared Redis state while maintaining data integrity?"
3. "Can workflows access historical results from previous executions stored in PostgreSQL for trend analysis?"

## Current State Analysis

### Existing Context System
**File**: `core/runner/src/shared/types/Context.ts`
```typescript
// Current in-memory context flow
Runner → inject context → Node → modify context → return context → Next Node
```

**Current Limitations**:
- ❌ **Memory Only**: Context lost if workflow fails or restarts
- ❌ **No Persistence**: Cannot resume interrupted workflows
- ❌ **No Sharing**: Cannot coordinate between parallel workflows
- ❌ **No Historical Access**: Cannot access previous execution results

### Required Architecture Enhancement
```typescript
// Enhanced context flow with persistence
Runner → inject context → Node → modify context → persist automatically → return context → Next Node
                                     ↓
                              DataSource Store (Redis/DB/S3/FS)
                                     ↑
                           ctx.datasource('name', 'key') → read access
```

## Implementation Approach

### Phase 1: DataSource Registry and Configuration
**Target**: Global datasource configuration via environment variables

**Environment Variable Pattern**:
```bash
# .env - Global datasource definitions
# Redis for fast caching
DATASOURCE_CACHE_TYPE=redis
DATASOURCE_CACHE_URL=redis://localhost:6379
DATASOURCE_CACHE_TTL=3600
DATASOURCE_CACHE_PREFIX=blok-cache

# PostgreSQL for structured data
DATASOURCE_DB_TYPE=postgresql
DATASOURCE_DB_URL=postgresql://user:pass@localhost:5432/blok_data
DATASOURCE_DB_TABLE=workflow_context

# S3 for large objects
DATASOURCE_STORAGE_TYPE=s3
DATASOURCE_STORAGE_URL=s3://blok-pipeline-data
DATASOURCE_STORAGE_REGION=us-east-1
DATASOURCE_STORAGE_PREFIX=workflows/

# File System for development
DATASOURCE_LOCAL_TYPE=filesystem
DATASOURCE_LOCAL_PATH=/tmp/blok-data
```

**DataSource Registry Implementation**:
```typescript
// core/runner/src/shared/datasources/DataSourceRegistry.ts
interface DataSourceConfig {
  type: 'redis' | 'postgresql' | 'mongodb' | 's3' | 'filesystem';
  url: string;
  options: Record<string, any>;
}

class DataSourceRegistry {
  private datasources: Map<string, DataSourceInterface> = new Map();
  
  constructor() {
    this.loadFromEnvironment();
  }
  
  private loadFromEnvironment(): void {
    const envPrefix = 'DATASOURCE_';
    const datasourceNames = new Set<string>();
    
    // Discover datasource names from environment
    Object.keys(process.env)
      .filter(key => key.startsWith(envPrefix))
      .forEach(key => {
        const parts = key.split('_');
        if (parts.length >= 3) {
          datasourceNames.add(parts[1].toLowerCase());
        }
      });
    
    // Initialize each datasource
    datasourceNames.forEach(name => {
      const config = this.parseDataSourceConfig(name);
      if (config) {
        this.datasources.set(name, this.createDataSource(config));
      }
    });
  }
  
  get(name: string): DataSourceInterface {
    const datasource = this.datasources.get(name);
    if (!datasource) {
      throw new Error(`DataSource '${name}' not configured. Available: ${Array.from(this.datasources.keys()).join(', ')}`);
    }
    return datasource;
  }
}
```

### Phase 2: DataSource Interface Abstraction
**Target**: Unified interface for all datasource types

**DataSource Interface**:
```typescript
// core/runner/src/shared/datasources/DataSourceInterface.ts
interface DataSourceInterface {
  // Core persistence operations
  save(key: string, data: any, ttl?: number): Promise<void>;
  load(key: string): Promise<any>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  
  // Batch operations for performance
  saveBatch(entries: Array<{key: string, data: any, ttl?: number}>): Promise<void>;
  loadBatch(keys: string[]): Promise<Map<string, any>>;
  
  // Metadata operations
  keys(pattern?: string): Promise<string[]>;
  size(): Promise<number>;
  
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}
```

**Redis Implementation**:
```typescript
// core/runner/src/shared/datasources/RedisDataSource.ts
import Redis from 'ioredis';

class RedisDataSource implements DataSourceInterface {
  private redis: Redis;
  private prefix: string;
  private defaultTTL: number;
  
  constructor(config: RedisConfig) {
    this.redis = new Redis(config.url);
    this.prefix = config.prefix || 'blok:';
    this.defaultTTL = config.ttl || 3600;
  }
  
  async save(key: string, data: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(data);
    const fullKey = `${this.prefix}${key}`;
    
    if (ttl || this.defaultTTL) {
      await this.redis.setex(fullKey, ttl || this.defaultTTL, serialized);
    } else {
      await this.redis.set(fullKey, serialized);
    }
  }
  
  async load(key: string): Promise<any> {
    const fullKey = `${this.prefix}${key}`;
    const data = await this.redis.get(fullKey);
    return data ? JSON.parse(data) : null;
  }
  
  async saveBatch(entries: Array<{key: string, data: any, ttl?: number}>): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    entries.forEach(({ key, data, ttl }) => {
      const serialized = JSON.stringify(data);
      const fullKey = `${this.prefix}${key}`;
      
      if (ttl || this.defaultTTL) {
        pipeline.setex(fullKey, ttl || this.defaultTTL, serialized);
      } else {
        pipeline.set(fullKey, serialized);
      }
    });
    
    await pipeline.exec();
  }
}
```

**PostgreSQL Implementation**:
```typescript
// core/runner/src/shared/datasources/PostgreSQLDataSource.ts
import { Pool } from 'pg';

class PostgreSQLDataSource implements DataSourceInterface {
  private pool: Pool;
  private table: string;
  
  constructor(config: PostgreSQLConfig) {
    this.pool = new Pool({ connectionString: config.url });
    this.table = config.table || 'workflow_context';
    this.initializeTable();
  }
  
  private async initializeTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        key VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        workflow_id VARCHAR(255),
        step_name VARCHAR(255)
      )
    `;
    await this.pool.query(query);
  }
  
  async save(key: string, data: any, ttl?: number): Promise<void> {
    const expiresAt = ttl ? new Date(Date.now() + ttl * 1000) : null;
    const query = `
      INSERT INTO ${this.table} (key, data, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (key) DO UPDATE SET
        data = $2,
        expires_at = $3,
        created_at = NOW()
    `;
    await this.pool.query(query, [key, JSON.stringify(data), expiresAt]);
  }
  
  async load(key: string): Promise<any> {
    const query = `
      SELECT data FROM ${this.table}
      WHERE key = $1 AND (expires_at IS NULL OR expires_at > NOW())
    `;
    const result = await this.pool.query(query, [key]);
    return result.rows.length > 0 ? JSON.parse(result.rows[0].data) : null;
  }
}
```

### Phase 3: Context Integration and Automatic Persistence
**Target**: Seamless integration with existing context system

**Context Enhancement**:
```typescript
// core/runner/src/shared/types/Context.ts
interface Context {
  // Existing properties
  id: string;
  request: RequestContext;
  vars: Record<string, any>;
  logger: Logger;
  
  // New persistence capabilities
  persistence: ContextPersistence;
  datasource: (name: string, key: string) => Promise<any>;
}

interface ContextPersistence {
  enabled: boolean;
  datasources: string[];
  autoSave: boolean;
  keyPattern: string;
}
```

**Context Datasource Access (Read-Only)**:
```typescript
// core/runner/src/shared/utils/ContextDataSource.ts
class ContextDataSourceAccess {
  constructor(
    private registry: DataSourceRegistry,
    private allowedDataSources: string[]
  ) {}
  
  async get(datasourceName: string, key: string): Promise<any> {
    // Validate datasource is allowed for this workflow
    if (!this.allowedDataSources.includes(datasourceName)) {
      throw new Error(`DataSource '${datasourceName}' not available for this workflow. Available: ${this.allowedDataSources.join(', ')}`);
    }
    
    // Get datasource and load data
    const datasource = this.registry.get(datasourceName);
    return await datasource.load(key);
  }
}

// Enhanced Context creation
function createContext(workflowId: string, config: WorkflowConfig): Context {
  const registry = DataSourceRegistry.getInstance();
  const datasourceAccess = new ContextDataSourceAccess(
    registry,
    config.datasources || []
  );
  
  return {
    // ... existing context properties
    datasource: (name: string, key: string) => datasourceAccess.get(name, key),
    persistence: {
      enabled: config.persistence?.enabled || false,
      datasources: config.datasources || [],
      autoSave: config.persistence?.autoSave !== false,
      keyPattern: config.persistence?.keyPattern || '${ctx.request.id}-${stepName}'
    }
  };
}
```

**Automatic Persistence in Runner**:
```typescript
// core/runner/src/Runner.ts
class Runner {
  async executeStep(stepConfig: StepConfig, ctx: Context): Promise<Context> {
    // Execute node as normal
    const resultCtx = await this.nodeExecutor.execute(stepConfig, ctx);
    
    // Auto-persist if enabled
    if (ctx.persistence.enabled && ctx.persistence.autoSave) {
      await this.persistContext(stepConfig.name, resultCtx);
    }
    
    return resultCtx;
  }
  
  private async persistContext(stepName: string, ctx: Context): Promise<void> {
    const registry = DataSourceRegistry.getInstance();
    
    // Generate persistence key
    const key = this.generatePersistenceKey(ctx.persistence.keyPattern, {
      'ctx.request.id': ctx.request.id,
      stepName
    });
    
    // Save to all configured datasources
    const persistencePromises = ctx.persistence.datasources.map(async datasourceName => {
      try {
        const datasource = registry.get(datasourceName);
        await datasource.save(key, {
          stepName,
          timestamp: new Date().toISOString(),
          vars: ctx.vars,
          metadata: {
            workflowId: ctx.workflow?.name,
            requestId: ctx.request.id
          }
        });
      } catch (error) {
        ctx.logger.error(`Failed to persist to ${datasourceName}: ${error.message}`);
        throw error; // Fail-fast on persistence errors
      }
    });
    
    await Promise.all(persistencePromises);
  }
  
  private generatePersistenceKey(pattern: string, variables: Record<string, any>): string {
    let key = pattern;
    Object.entries(variables).forEach(([name, value]) => {
      key = key.replace(`\${${name}}`, String(value));
    });
    return key;
  }
}
```

### Phase 4: Workflow Configuration Integration
**Target**: Declarative datasource configuration in workflows

**Workflow Configuration Enhancement**:
```json
{
  "name": "advanced-data-pipeline",
  "description": "Multi-step data processing with persistence",
  "version": "1.0.0",
  "datasources": ["cache", "db", "storage"],
  "persistence": {
    "enabled": true,
    "autoSave": true,
    "keyPattern": "${ctx.request.id}-${stepName}",
    "targets": ["cache", "db"]
  },
  "steps": [
    {
      "name": "load-data",
      "node": "data-loader",
      "type": "module",
      "persistence": {
        "target": "storage",
        "key": "raw-data-${ctx.request.id}"
      }
    },
    {
      "name": "process-chunks",
      "node": "parallel-processor", 
      "type": "module",
      "inputs": {
        "cached_metadata": "${ctx.datasource('cache', 'metadata-key')}",
        "previous_results": "${ctx.datasource('db', 'results-${ctx.request.id}')}"
      }
    }
  ]
}
```

**Workflow Parser Enhancement**:
```typescript
// core/runner/src/Configuration.ts
interface WorkflowConfig {
  // Existing properties
  name: string;
  steps: StepConfig[];
  
  // New persistence properties
  datasources?: string[];
  persistence?: {
    enabled: boolean;
    autoSave?: boolean;
    keyPattern?: string;
    targets?: string[];
  };
}

class ConfigurationResolver {
  validateDataSources(config: WorkflowConfig): void {
    const registry = DataSourceRegistry.getInstance();
    const availableDataSources = registry.getAvailableNames();
    
    (config.datasources || []).forEach(name => {
      if (!availableDataSources.includes(name)) {
        throw new Error(`DataSource '${name}' not configured. Available: ${availableDataSources.join(', ')}`);
      }
    });
  }
}
```

## Advanced Use Cases and Patterns

### Pattern 1: Large Dataset Processing
```json
{
  "name": "large-dataset-pipeline",
  "datasources": ["storage", "cache"],
  "steps": [
    {
      "name": "upload-data",
      "node": "s3-uploader",
      "persistence": {"target": "storage", "key": "dataset-${ctx.timestamp}"}
    },
    {
      "name": "process-batch",
      "node": "batch-processor",
      "inputs": {
        "dataset_url": "${ctx.datasource('storage', 'dataset-${ctx.timestamp}')}"
      }
    }
  ]
}
```

### Pattern 2: Cross-Workflow Coordination
```json
{
  "name": "data-extractor",
  "persistence": {"enabled": true, "targets": ["cache"]},
  "steps": [
    {
      "name": "extract",
      "persistence": {"key": "latest-extraction-${ctx.date}"}
    }
  ]
}

{
  "name": "data-processor", 
  "datasources": ["cache"],
  "steps": [
    {
      "name": "process",
      "inputs": {
        "latest_data": "${ctx.datasource('cache', 'latest-extraction-${ctx.date}')}"
      }
    }
  ]
}
```

### Pattern 3: Resumable Workflows
```typescript
// Workflow resume capability
class WorkflowResumer {
  async resumeFromLastStep(workflowId: string, originalRequestId: string): Promise<Context> {
    const registry = DataSourceRegistry.getInstance();
    const cache = registry.get('cache');
    
    // Find last successful step
    const steps = await cache.keys(`${originalRequestId}-*`);
    const lastStep = steps.sort().pop();
    
    if (lastStep) {
      const savedContext = await cache.load(lastStep);
      return this.reconstructContext(savedContext);
    }
    
    throw new Error('No resumable state found');
  }
}
```

## Testing Strategy

### Unit Testing for DataSources
```typescript
describe('DataSource Implementations', () => {
  describe('RedisDataSource', () => {
    it('should save and load data correctly', async () => {
      const redis = new RedisDataSource({ url: 'redis://localhost:6379' });
      const testData = { message: 'test', timestamp: Date.now() };
      
      await redis.save('test-key', testData);
      const loaded = await redis.load('test-key');
      
      expect(loaded).toEqual(testData);
    });
    
    it('should handle TTL expiration', async () => {
      const redis = new RedisDataSource({ url: 'redis://localhost:6379' });
      
      await redis.save('expiring-key', { data: 'test' }, 1); // 1 second TTL
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const loaded = await redis.load('expiring-key');
      expect(loaded).toBeNull();
    });
  });
});
```

### Integration Testing with Workflows
```typescript
describe('Context Persistence Integration', () => {
  it('should persist context automatically after each step', async () => {
    const workflow = {
      name: 'test-persistence',
      datasources: ['cache'],
      persistence: { enabled: true, targets: ['cache'] },
      steps: [
        { name: 'step1', node: 'test-node' },
        { name: 'step2', node: 'test-node' }
      ]
    };
    
    const runner = new Runner(workflow);
    const ctx = await runner.execute({ data: 'test' });
    
    // Verify persistence happened
    const cache = DataSourceRegistry.getInstance().get('cache');
    const step1Data = await cache.load(`${ctx.request.id}-step1`);
    const step2Data = await cache.load(`${ctx.request.id}-step2`);
    
    expect(step1Data).toBeDefined();
    expect(step2Data).toBeDefined();
  });
  
  it('should provide read-only access to datasources', async () => {
    const ctx = createContext('test-workflow', {
      datasources: ['cache'],
      persistence: { enabled: true }
    });
    
    // Pre-populate test data
    const cache = DataSourceRegistry.getInstance().get('cache');
    await cache.save('test-key', { result: 'cached-data' });
    
    // Test read access
    const data = await ctx.datasource('cache', 'test-key');
    expect(data.result).toBe('cached-data');
  });
});
```

### Performance Testing
```typescript
describe('Persistence Performance', () => {
  it('should handle batch operations efficiently', async () => {
    const redis = new RedisDataSource({ url: 'redis://localhost:6379' });
    const entries = Array.from({ length: 1000 }, (_, i) => ({
      key: `batch-${i}`,
      data: { index: i, data: `test-data-${i}` }
    }));
    
    const start = Date.now();
    await redis.saveBatch(entries);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });
});
```

## Risk Assessment & Mitigation

### Technical Risks
- **DataSource Failures**: Network issues or datasource unavailability
  - *Mitigation*: Connection pooling, retry logic, health checks
- **Serialization Overhead**: Large context objects impacting performance
  - *Mitigation*: Selective persistence, compression, async operations
- **Key Conflicts**: Different workflows using same persistence keys
  - *Mitigation*: Namespacing with request IDs, configurable key patterns

### Business Risks
- **Data Consistency**: Partial failures leaving inconsistent state
  - *Mitigation*: Transactional operations where possible, rollback mechanisms
- **Storage Costs**: Excessive persistence increasing infrastructure costs
  - *Mitigation*: TTL configuration, selective persistence, cleanup strategies

## Success Metrics & Validation

### Functionality Metrics
- **Persistence Success Rate**: >99% successful context saves
- **Read Performance**: <100ms for cache access, <500ms for database access
- **Data Integrity**: Zero data corruption incidents
- **Error Recovery**: Proper error handling for all datasource failures

### Business Validation Examples
```bash
# Large Dataset Pipeline
1. Upload 1GB dataset to workflow
2. Process in chunks with intermediate persistence
3. Simulate failure at step 3 of 5
4. Resume from last successful step
5. Verify complete pipeline execution

# Cross-Workflow Coordination
1. Run data extraction workflow
2. Verify data persisted to shared cache
3. Run processing workflow using cached data
4. Confirm data consistency across workflows

# Performance Under Load
1. Execute 100 parallel workflows with persistence
2. Monitor datasource performance
3. Verify no data corruption or key conflicts
```

## Documentation Updates

### Configuration Guide
```markdown
# Context Persistence Configuration

## DataSource Setup
Configure datasources via environment variables:

```bash
# Redis for fast caching
DATASOURCE_CACHE_TYPE=redis
DATASOURCE_CACHE_URL=redis://localhost:6379

# PostgreSQL for structured data  
DATASOURCE_DB_TYPE=postgresql
DATASOURCE_DB_URL=postgresql://user:pass@localhost/db
```

## Workflow Configuration
```json
{
  "name": "my-pipeline",
  "datasources": ["cache", "db"],
  "persistence": {
    "enabled": true,
    "targets": ["cache"]
  },
  "steps": [
    {
      "inputs": {
        "cached_data": "${ctx.datasource('cache', 'my-key')}"
      }
    }
  ]
}
```
```

### Best Practices Guide
```markdown
# Context Persistence Best Practices

## Performance Optimization
- Use Redis for fast, temporary data
- Use PostgreSQL for structured, queryable data
- Use S3 for large objects and long-term storage
- Configure appropriate TTLs to manage storage costs

## Data Pipeline Patterns
- **Checkpoint Pattern**: Save state at critical points for resumability
- **Shared State Pattern**: Use cache for cross-workflow coordination
- **Large Data Pattern**: Persist references/URLs, not raw data

## Security Considerations
- Use read-only context access to prevent data corruption
- Configure datasource authentication via environment variables
- Implement proper access control for shared datasources
```

## Definition of Done
- [ ] Multi-datasource support with Redis, PostgreSQL, S3, and FileSystem implementations
- [ ] Automatic context persistence after each node execution
- [ ] Read-only datasource access via ctx.datasource() function
- [ ] Workflow-level datasource configuration and validation
- [ ] Comprehensive error handling with fail-fast behavior
- [ ] Performance testing with batch operations and concurrent access
- [ ] Integration testing with complex data pipeline scenarios
- [ ] Documentation for configuration and best practices

## AI Programming Impact
This persistence system enables:
- **Resilient Data Pipelines**: Workflows that can resume from failures
- **Stateful AI Processing**: Long-running AI workflows with intermediate results
- **Cross-Workflow Intelligence**: AI workflows sharing state and coordination
- **Scalable Data Processing**: Handle large datasets through persistent intermediate storage
- **Observable Data Flow**: Track data progression through complex pipelines

## Implementation Timeline
- **Day 1**: DataSource registry and interface implementations
- **Day 2**: Context integration and automatic persistence
- **Day 3**: Workflow configuration, testing, and documentation

---

**This context persistence system transforms Blok into a powerful data pipeline platform capable of handling enterprise-scale data processing workflows with full state management and resumability.** 