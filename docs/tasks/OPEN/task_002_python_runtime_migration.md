# TASK-002: Complete Python3 Runtime Migration (nanoservice-ts → blok-ts)
**Master Plan Reference**: Section 🐍 Multi-Runtime Support - Python3 runtime rehabilitation for AI programming  
**Dependencies**: None (independent refactoring task, can run parallel to TASK-001)
**Estimated Effort**: L (3 days) - Systematic refactoring with comprehensive testing
**Assigned To**: [To be assigned]
**Priority**: P1-High (Unlocks critical multi-runtime capability for AI)

## Business Value
Complete the incomplete migration from "nanoservice-ts" to "blok-ts" in the Python3 runtime, enabling AI agents to leverage Python's powerful ecosystem (ML/AI libraries, data processing, scientific computing) alongside TypeScript nodes within unified workflow orchestration.

## Acceptance Criteria
- [ ] **CLI Re-enablement**: Python3 runtime option uncommented and functional in `create project` and `create node` commands
- [ ] **Naming Consistency**: All "nanoservice" references updated to "blok" throughout Python runtime
- [ ] **gRPC Protocol**: Generated protobuf files updated to use `blok.workflow.v1` package
- [ ] **Core Classes**: `NanoService` and `NanoServiceResponse` renamed to `BlokService` and `BlokResponse`
- [ ] **Node Compatibility**: All existing Python nodes work with updated core classes
- [ ] **Test Coverage**: All Python runtime tests pass with updated naming
- [ ] **Documentation**: Python runtime usage documented in blok.md

## Business Queries to Validate
1. "Can an AI create a multi-runtime project with both TypeScript and Python3 nodes working together in a single workflow?"
2. "Can Python3 nodes leverage ML libraries (transformers, torch, milvus) within Blok workflows for AI/ML processing tasks?"
3. "Does the Python3 runtime integrate seamlessly with the HTTP trigger and provide the same context/error handling as TypeScript nodes?"

## Current State Analysis

### CLI Status (Currently Disabled)
```typescript
// packages/cli/src/commands/create/project.ts:110
//{ label: "Python3", value: "python3" },   // COMMENTED OUT

// packages/cli/src/commands/create/node.ts:75  
//{ label: "Python3", value: "python3", hint: "Alpha - Limited to MacOS and Linux" },   // COMMENTED OUT
```

### Migration Completion Status
✅ **Already Migrated**:
- Main proto file: `runtimes/proto/node.proto` uses `package blok.workflow.v1`
- CLI infrastructure: Python3 setup logic exists and functional
- Development server: Python3 runner configured in `packages/cli/src/commands/dev/index.ts`
- Dependencies: `requirements.txt` up-to-date with modern packages

❌ **Needs Migration**:
- Core class names: `NanoService` → `BlokService`/`NodeService`
- Response classes: `NanoServiceResponse` → `BlokResponse`/`NodeResponse`
- File names: `core/nanoservice.py` → `core/blokservice.py`
- Generated gRPC: `gen/node_pb2.py` still references `nanoservice.workflow.v1`
- All node imports: 8 Python nodes importing old class names
- Package metadata: `package.json` keywords still include "nanoservice"
- Test files: `test_nanoservice.py` → `test_blokservice.py`

## Implementation Approach

### Phase 1: Core Class Migration (Foundation)
**Files to update**:
```bash
# Rename core files
runtimes/python3/core/nanoservice.py → runtimes/python3/core/blokservice.py
runtimes/python3/core/types/nanoservice_response.py → runtimes/python3/core/types/blok_response.py
runtimes/python3/tests/test_nanoservice.py → runtimes/python3/tests/test_blokservice.py
```

**Class name changes**:
```python
# OLD naming
class NanoService(NodeBase):
class NanoServiceResponse(ResponseContext):

# NEW naming  
class BlokService(NodeBase):
class BlokResponse(ResponseContext):
```

### Phase 2: Regenerate gRPC Protocol Files
**Commands to execute**:
```bash
cd runtimes/python3
make generate  # Regenerate protobuf files from updated proto
```

**Expected changes**:
```python
# OLD generated code
'/nanoservice.workflow.v1.NodeService/ExecuteNode'

# NEW generated code
'/blok.workflow.v1.NodeService/ExecuteNode'
```

### Phase 3: Update All Node Imports (Systematic)
**Files to update** (8 Python nodes):
```python
# OLD imports in all nodes
from core.nanoservice import NanoService
from core.types.nanoservice_response import NanoServiceResponse

# NEW imports in all nodes
from core.blokservice import BlokService  
from core.types.blok_response import BlokResponse

# Class inheritance updates
class MyNode(NanoService):        # OLD
class MyNode(BlokService):        # NEW

# Response object updates
response = NanoServiceResponse()  # OLD
response = BlokResponse()         # NEW
```

**Affected node files**:
- `nodes/milvus/insert/node.py`
- `nodes/milvus/query/node.py`
- `nodes/image_description/node.py`
- `nodes/embed/node.py`
- `nodes/api_call/node.py`
- `nodes/generate_pdf/node.py`
- `nodes/sentiment/node.py`
- Plus any additional nodes in the directory

### Phase 4: Update Package Metadata
**File to update**: `runtimes/python3/package.json`
```json
// OLD
"keywords": ["nanoservice", "node"],

// NEW
"keywords": ["blok", "node", "workflow", "runtime"],
```

### Phase 5: Re-enable CLI Options (Final Activation)
**Files to update**:
```typescript
// packages/cli/src/commands/create/project.ts:110
{ label: "Python3", value: "python3" },   // UNCOMMENT

// packages/cli/src/commands/create/node.ts:75
{ label: "Python3", value: "python3", hint: "Alpha - Multi-language support" },   // UNCOMMENT & UPDATE HINT
```

## Migration Script Approach
```bash
#!/bin/bash
# Automated migration script for safe renaming

# Phase 1: Rename core files
cd runtimes/python3
git mv core/nanoservice.py core/blokservice.py
git mv core/types/nanoservice_response.py core/types/blok_response.py
git mv tests/test_nanoservice.py tests/test_blokservice.py

# Phase 2: Update class names in files
find . -name "*.py" -exec sed -i 's/NanoService/BlokService/g' {} \;
find . -name "*.py" -exec sed -i 's/NanoServiceResponse/BlokResponse/g' {} \;
find . -name "*.py" -exec sed -i 's/nanoservice/blokservice/g' {} \;

# Phase 3: Regenerate protobuf
make generate

# Phase 4: Update package.json
sed -i 's/"nanoservice"/"blok"/g' package.json

# Phase 5: Run tests to verify
python -m pytest tests/
```

## Testing Strategy

### Unit Testing (Python Runtime)
```python
# Test core classes work after migration
def test_blok_service_initialization():
    service = BlokService()
    assert service is not None
    assert hasattr(service, 'handle')

def test_blok_response_creation():
    response = BlokResponse()
    assert response is not None
    assert hasattr(response, 'set_data')

def test_schema_validation():
    service = BlokService()
    # Test input/output schema validation works
```

### Integration Testing (gRPC Communication)
```bash
# Test Python3 runtime can communicate with main runner
python3 server.py &  # Start Python gRPC server
# Test gRPC calls work with new protobuf definitions
```

### End-to-End Testing (Multi-Runtime Workflow)
```json
{
  "name": "multi-runtime-test",
  "steps": [
    {
      "name": "typescript-step", 
      "node": "@blok-ts/api-call",
      "type": "module"
    },
    {
      "name": "python-step",
      "node": "sentiment-analysis", 
      "type": "runtime.python3"
    }
  ]
}
```

## Risk Assessment & Mitigation

### Low Risk Factors
- **Isolated Scope**: Python runtime is self-contained, won't affect TypeScript components
- **Existing Infrastructure**: CLI setup logic already exists and works
- **Systematic Changes**: Mostly find-replace operations with clear patterns

### Mitigation Strategies
- **Backup Approach**: Create git branch before migration
- **Incremental Testing**: Test after each phase before proceeding
- **Rollback Plan**: Keep old class names as aliases initially for compatibility
- **Comprehensive Testing**: Run both Python tests and integration tests

## Success Metrics & Validation

### Technical Validation
- **All Python tests pass**: Existing test suite continues to work
- **gRPC communication works**: Python runtime responds to main trigger
- **CLI functionality restored**: Can create Python projects and nodes
- **Node execution successful**: All 8 existing Python nodes execute correctly

### Business Validation Examples
```bash
# Create multi-runtime project
blokctl create project --name "ai-pipeline" --runtimes "node,python3" --non-interactive

# Create Python node
blokctl create node --name "ml-processor" --runtime "python3" --non-interactive

# Test workflow with both runtimes
curl -X POST http://localhost:4000/ai-workflow \
  -H "Content-Type: application/json" \
  -d '{"text": "analyze this sentiment", "model": "transformers"}'
```

## Documentation Integration

### Update blok.md with Python Runtime Section
```markdown
## Multi-Runtime Programming: Python3

### Creating Python Nodes
```bash
# Create Python3 runtime project
blokctl create project --name "ai-backend" --runtimes "node,python3"

# Create Python3 node
blokctl create node --name "ml-model" --runtime "python3"
```

### Python Node Structure
```python
from core.blokservice import BlokService
from core.types.blok_response import BlokResponse

class MLProcessor(BlokService):
    async def handle(self, ctx: Context, inputs: Dict[str, Any]) -> BlokResponse:
        response = BlokResponse()
        # ML processing logic using transformers, torch, etc.
        return response
```

### AI Benefits
- **ML Libraries**: Direct access to transformers, torch, scikit-learn, numpy
- **Data Processing**: pandas, numpy for complex data manipulation
- **Vector Operations**: milvus-lite for embeddings and semantic search
- **Image Processing**: PIL, opencv for computer vision tasks
```

## Definition of Done
- [ ] All acceptance criteria met with test evidence
- [ ] Business queries validated with actual multi-runtime workflow execution
- [ ] CLI options uncommented and functional for both project and node creation
- [ ] All 8 existing Python nodes work with updated class names
- [ ] gRPC protobuf files regenerated and working with blok.workflow.v1
- [ ] Python runtime test suite passes 100%
- [ ] Integration testing with TypeScript nodes successful
- [ ] Documentation updated in blok.md with Python runtime examples
- [ ] Changeset updated with migration completion details

## AI Programming Impact
This task unlocks the full potential of AI programming with Blok by enabling:
- **Language Flexibility**: Choose the best tool for each workflow step
- **ML Integration**: Direct use of Python ML ecosystem within workflows
- **Data Science Workflows**: Complex data processing pipelines
- **Cross-Language Collaboration**: TypeScript + Python in single workflows

## Implementation Timeline
- **Day 1**: Phase 1-2 (Core migration + protobuf regeneration)
- **Day 2**: Phase 3-4 (Node updates + package metadata)
- **Day 3**: Phase 5 + Testing (CLI re-enablement + comprehensive validation)

---

**This task completes the critical Python3 runtime migration, unlocking multi-language AI programming capabilities while maintaining the highest safety standards for the existing codebase.** 