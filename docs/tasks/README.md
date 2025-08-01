# Blok Framework - Task Dashboard & Project Context
## Central Command Center for AI-Assisted Development

**Framework**: Blok - Workflow-based Backend Development Platform  
**Methodology**: MCP Business Standard (External Extension Only)  
**Legacy Status**: SACRED_PRODUCTION (Zero Core Modifications)  
**Last Updated**: 2024-01-XX

---

## 🎯 **PROJECT MISSION & VISION**

### **Core Mission**
Enable developers to build robust, scalable backends using visual workflow patterns with multi-language support, built-in observability, and AI-driven development assistance.

### **Vision Statement**
Become the leading open-source workflow-based backend framework that bridges the gap between visual development and production-ready systems.

### **Key Value Propositions**
- **Workflow-First Development**: Backend logic expressed as visual, declarative workflows
- **Multi-Language Support**: Seamless integration of TypeScript, Python, and future runtimes
- **Production Ready**: Built-in observability, monitoring, and enterprise deployment patterns
- **AI-Friendly**: Designed for AI-assisted development with comprehensive documentation
- **Community Driven**: Open source with active community and NPM ecosystem

---

## 🏗️ **ARCHITECTURAL OVERVIEW**

### **Core Architecture Pattern: Node-Workflow Orchestration**
```
HTTP/gRPC Request → Workflow Selection → Node Execution → Response
                         ↓                    ↓
                 Context Management ← Step Orchestration
```

### **System Components (SACRED_PRODUCTION)**
- **Core Engine**: `@blok-ts/runner` v0.1.26 - Workflow execution engine
- **HTTP Trigger**: `@blok-ts/trigger-http` v0.0.34 - Production HTTP server
- **gRPC Trigger**: Protocol Buffers communication layer
- **CLI Tool**: `blokctl` - Project, node, and workflow management
- **Global Nodes**: `@blok-ts/api-call`, `@blok-ts/if-else` - Reusable components

### **Data Flow Patterns**
1. **Request Processing**: HTTP/gRPC → Route matching → Context creation
2. **Workflow Execution**: Workflow loading → Node resolution → Step execution
3. **Context Management**: Stateless injection/return pattern with direct memory access
4. **Error Handling**: Fail-fast architecture → Single node failure terminates workflow
5. **Response Generation**: Output processing → Format detection → HTTP response

### **Advanced Technical Insights**
- **Context Performance**: Direct JavaScript object access, zero string parsing overhead
- **Memory Model**: Context flows through Runner → Node → Runner pattern
- **Error Architecture**: HTTP 500 + JSON details for predictable debugging
- **Remote Consistency**: BASE64 serialization maintains behavior across local/remote nodes

### **Node Types & Loading Mechanisms**
- **`type: "module"`**: Explicitly registered in `Nodes.ts`, supports NPM packages
- **`type: "local"`**: Auto-discovered from `NODES_PATH`, filesystem-based
- **`type: "runtime.python3"`**: Python nodes executed via gRPC communication

---

## 🔒 **LEGACY INTEGRATION STRATEGY**

### **Protection Classification System**

#### **🔴 SACRED_PRODUCTION (ZERO modifications allowed)**
- **Core Engine**: `core/runner/` - Published NPM package, community-critical
- **Triggers**: `triggers/http/`, `triggers/grpc/` - Production servers
- **CLI**: `packages/cli/` - Community development workflow
- **Global NPM Nodes**: Published packages used across projects
- **Reason**: Breaking changes would impact community trust and stability

#### **🟡 PROTECTED (Careful enhancement only)**
- **Documentation**: `blok.md` + community docs - Preserve existing, add complementary
- **Examples**: Workflow and node examples - Add new, don't modify existing
- **Templates**: CLI templates - Enhance without breaking CLI compatibility

#### **🟢 SAFE (External extension allowed)**
- **MCP Trigger**: Currently broken, safe for external wrapper development
- **Demo Infrastructure**: Event configurations, can be overridden for demos

### **External Extension Strategy**
All MCP methodology enhancements focus on **Documentation Enhancement**:
- **CLI Tools**: Document existing blokctl functionality (monitor, dev, build)
- **Testing**: Leverage existing Vitest framework and HTTP trigger testing
- **Safety**: No modifications to SACRED_PRODUCTION systems
- **Process**: Enhance documentation and development workflows

---

## 📊 **CURRENT PROJECT STATUS**

### **Task Management Overview**
- **Total Tasks**: 10 (Complete platform transformation roadmap)
- **OPEN**: 9 tasks (strategic enhancements ready for implementation)
- **IN_PROGRESS**: 0 tasks (ready for next task assignment)
- **DONE**: 1 task (CRITICAL BLOCKER resolved - development unblocked)
- **Overall Progress**: ✅ **DEVELOPMENT UNBLOCKED** - NPM publication ready, strategic enhancements can proceed

### **Production Readiness**
- ✅ **HTTP Trigger**: Production-ready with observability
- ✅ **gRPC Trigger**: Functional but requires manual setup
- ✅ **Core Engine**: Stable, published, community-tested
- ✅ **CLI Tool**: Complete project/node/workflow management (⚡ Enhancement planned)
- ❌ **MCP Trigger**: Broken/incomplete, needs external wrapper

### **Current Development Focus**
✅ **CRITICAL BLOCKER RESOLVED**: NPM Publication Cleanup completed successfully
- **TASK-000**: ✅ COMPLETED - All nanoservice-ts references removed, versions reset to 0.1.0, professional publication ready

🎯 **Strategic Evolution** (READY FOR IMPLEMENTATION):
- **TASK-001**: CLI Non-Interactive Mode for AI Programming Automation
- **TASK-002**: Python3 Runtime Migration for Multi-Language AI Programming  
- **TASK-003**: Multi-Platform SDK Ecosystem for Universal Community Access
- **TASK-004**: Express.js → Hono Migration for Edge Performance
- **TASK-005**: MCP Server Development for Enterprise Digital Transformation
- **TASK-006**: Context Persistence System for Advanced Data Pipelines
- **TASK-007**: Parallel Execution Container Nodes for High-Performance Data Processing
- **TASK-008**: Manual Trigger CLI for Workflow Testing and Development
- **TASK-009**: HTTP Middleware Package for Express.js Integration

---

## 🔥 **IMMEDIATE NEXT STEPS (OPEN - Top Priority)**

### **✅ COMPLETED CRITICAL WORK**
| Task ID | Component | Priority | Dependencies | Effort | Status |
|---------|-----------|----------|--------------|--------|--------|
| TASK-000 | NPM Publication Cleanup | P0-CRITICAL | None | S (4h) | ✅ **COMPLETED** - Professional NPM publication ready |
| TASK-001 | CLI Non-Interactive Mode | P1-High | None | M (1d) | ✅ **COMPLETED** - AI automation enabled, 2-second project setup |

### **Ready for Assignment (DEVELOPMENT UNBLOCKED)**
| Task ID | Component | Priority | Dependencies | Effort | Why Important |
|---------|-----------|----------|--------------|--------|---------------|
| TASK-002 | Python3 Runtime Migration | P1-High | None | L (3d) | **CRITICAL**: Unlocks multi-runtime AI programming with ML/AI libraries |
| TASK-003 | Multi-Platform SDK Ecosystem | P1-High | None | XL (7d) | **STRATEGIC**: Enables community adoption from any tech stack |
| TASK-004 | Express.js → Hono Migration | P1-High | None | M (2d) | **PERFORMANCE**: Edge deployment capabilities for global scale |
| TASK-005 | MCP Server Development | P1-High | None | M (2d) | **ENTERPRISE**: Claude Desktop integration for digital transformation |
| TASK-006 | Context Persistence System | P1-High | None | L (3d) | **DATA PIPELINES**: Advanced state management for complex workflows |
| TASK-007 | Parallel Execution Nodes | P1-High | None | M (2d) | **PERFORMANCE**: High-performance data processing with Promise.all pattern |
| TASK-008 | Manual Trigger CLI | P1-High | None | M (2d) | **DEVELOPMENT**: CLI-based workflow testing for rapid iteration |
| TASK-009 | HTTP Middleware Package | P1-High | TASK-004 | M (2d) | **INTEGRATION**: Express.js/Hono integration for existing apps |

### **🚨 TASK-000 Details: NPM Publication Cleanup (CRITICAL BLOCKER)**
**Objective**: Remove all legacy "nanoservice-ts" references and prepare professional @blok-ts NPM publication

**Critical Discovery**: **ZERO @blok-ts packages are published on NPM** and contain legacy metadata that will cause:
- Professional embarrassment with "nanoservice" references in public NPM listings
- Community confusion between nanoservice-ts and blok-ts branding  
- Broken repository links and incorrect keywords preventing package discovery

**Key Benefits**:
- 🚀 **Professional Launch**: Clean, consistent @blok-ts ecosystem on NPM
- 🎯 **Community Trust**: Accurate metadata and branding for developer adoption
- 🔓 **Unblock Development**: Enables all other tasks requiring published packages
- ⚡ **Quick Fix**: Only 4 hours to solve critical blocking issue

**Critical Files Requiring Cleanup**:
```bash
# PUBLIC PACKAGES (❌ Will appear with legacy metadata on NPM)
nodes/control-flow/if-else@1.0.0/package.json     # "nanoservice if-else"
packages/cli/package.json                          # ["nanoservice", "nanoservice-ts"]

# INFRASTRUCTURE  
infra/metrics/dashboard.json                       # "nanoservice-http" service names
```

**Implementation Strategy**:
- **Phase 1**: Clean public package descriptions and keywords (30 min)
- **Phase 2**: Reset all versions to 0.1.0 for coordinated ecosystem launch (15 min)  
- **Phase 3**: Update infrastructure service names (30 min)
- **Phase 4**: Test and execute NPM publication (2.5 hours)

**Business Validation**: 
1. "Do all @blok-ts packages on NPM show professional, accurate metadata without legacy references?"
2. "Can developers discover blok packages through relevant keywords like 'workflow', 'backend', 'orchestration'?"
3. "Does the published ecosystem reflect a coordinated, professional product launch?"

### **TASK-001 Details: CLI Non-Interactive Mode**
**Objective**: Enable `blokctl create project`, `create node`, and `create workflow` to run without interactive prompts

**Key Benefits**:
- ⚡ **AI Automation**: AI agents can execute CLI commands programmatically
- 🚀 **Developer Scripting**: Enables automated project scaffolding and team onboarding
- 🛡️ **Zero Risk**: Extends existing CLI without touching SACRED_PRODUCTION logic
- 📚 **Documentation Ready**: Integrates seamlessly with existing blok.md AI guidance

**Implementation Approach**:
- **Phase 1**: Add `--non-interactive` and parameter flags to CLI commands
- **Phase 2**: Extend command logic to handle non-interactive mode with validation  
- **Phase 3**: Add robust parameter validation with clear error messages

**Business Validation Queries**:
1. "Can an AI create a complete Blok project setup (project + nodes + workflows) programmatically in under 30 seconds?"
2. "Can developers script automated project scaffolding for team onboarding using blokctl non-interactive commands?"
3. "Does the non-interactive mode provide clear error messages when parameters are missing or invalid?"

**Ready to Start**: ✅ All analysis complete, implementation approach defined, zero dependencies

### **TASK-002 Details: Python3 Runtime Migration**
**Objective**: Complete the incomplete nanoservice-ts → blok-ts migration in Python3 runtime

**Key Benefits**:
- 🐍 **Multi-Runtime AI**: Enable AI agents to use Python ML/AI libraries alongside TypeScript
- 🧠 **ML Integration**: Direct access to transformers, torch, scikit-learn, milvus within workflows
- 📊 **Data Science**: Complex data processing pipelines with pandas, numpy
- 🔄 **Language Flexibility**: Choose the best tool for each workflow step

**Implementation Approach**:
- **Phase 1**: Rename core classes (NanoService → BlokService, NanoServiceResponse → BlokResponse)
- **Phase 2**: Regenerate gRPC protobuf files to use blok.workflow.v1 package
- **Phase 3**: Update all 8 Python nodes to use new class names and imports
- **Phase 4**: Update package metadata and re-enable CLI options

**Business Validation Queries**:
1. "Can an AI create a multi-runtime project with both TypeScript and Python3 nodes working together in a single workflow?"
2. "Can Python3 nodes leverage ML libraries (transformers, torch, milvus) within Blok workflows for AI/ML processing tasks?"
3. "Does the Python3 runtime integrate seamlessly with the HTTP trigger and provide the same context/error handling as TypeScript nodes?"

**Current State**: 70% complete - CLI infrastructure exists but disabled due to naming inconsistencies
**Ready to Start**: ✅ Full analysis complete, systematic migration plan defined, isolated scope

### **TASK-003 Details: Multi-Platform SDK Ecosystem Expansion**
**Objective**: Create SDKs for TypeScript (Node.js/Browser) and C# (.NET Core) to enable community integration from any tech stack

**Key Benefits**:
- 🌍 **Universal Access**: Blok nodes accessible from any major programming platform
- 🔗 **Remote Microservices**: Use Blok nodes as language-agnostic API endpoints
- ⚡ **Framework Integration**: React hooks, Vue composables, .NET dependency injection
- 📈 **Community Growth**: Developers can integrate without changing their tech stack

**Implementation Approach**:
- **Phase 1**: TypeScript SDK for Node.js/Bun/Deno with full type safety
- **Phase 2**: Browser-optimized TypeScript SDK with React/Vue framework integrations
- **Phase 3**: Complete C# .NET Core SDK with async/await and DI container support
- **Phase 4**: NPM + NuGet publishing with comprehensive documentation

**Business Validation Queries**:
1. "Can a React frontend directly call Blok Python nodes for AI processing while managing its own UI state orchestration?"
2. "Can a .NET Core backend integrate Blok nodes as microservices while maintaining C# business logic and Entity Framework workflows?"
3. "Can a Next.js application use Blok nodes for data processing on both server-side (SSR) and client-side components?"

**Current State**: Protocol fully analyzed - existing JavaScript SDK provides perfect foundation pattern
**Ready to Start**: ✅ Complete protocol understanding, systematic multi-language implementation plan

### **TASK-004 Details: Express.js → Hono Migration for Edge Performance**
**Objective**: Migrate HTTP trigger from Express.js to Hono for edge deployment capabilities

**Key Benefits**:
- ⚡ **Edge Performance**: Deploy to Cloudflare Workers for global performance
- 🚀 **Cold Start Optimization**: Significant improvement in serverless startup time
- 🌐 **Multi-Runtime Support**: Node.js, Vercel Edge, Deno Deploy compatibility
- 🔄 **Zero Breaking Changes**: 100% backward compatibility with existing projects and SDKs

**Implementation Approach**:
- **Phase 1**: Core framework migration with Hono equivalents
- **Phase 2**: Request/response adaptation to Hono context
- **Phase 3**: Multi-runtime adapter pattern for different deployment targets
- **Phase 4**: Edge deployment configuration for Cloudflare and Vercel

**Business Validation Queries**:
1. "Can existing Blok projects deploy to Cloudflare Workers for global edge performance without any code changes?"
2. "Do all existing SDKs continue working with the Hono-based HTTP trigger?"
3. "Is there measurable performance improvement in workflow execution response times after migration?"

**Current State**: Express.js implementation analyzed - clear migration path with preserved feature parity
**Ready to Start**: ✅ Framework mapping complete, backward compatibility strategy defined

### **TASK-005 Details: MCP Server for Enterprise Digital Transformation**
**Objective**: Create MCP Server enabling Claude Desktop integration for enterprise workflow access

**Key Benefits**:
- 🤝 **Enterprise AI Integration**: 5-minute setup from Blok deployment to Claude Desktop
- 🔗 **Dual Execution**: Both individual nodes and complete workflows via natural language
- 🏢 **Digital Transformation**: Immediate AI access to existing business processes
- 📊 **Observable AI Operations**: Full metrics tracking for AI-driven workflow execution

**Implementation Approach**:
- **Phase 1**: MCP server foundation using @modelcontextprotocol SDK with --stdio
- **Phase 2**: Dynamic tool discovery from Blok deployments via metadata endpoint
- **Phase 3**: Dual execution engine (workflows + nodes) using existing protocols
- **Phase 4**: Enterprise configuration with token authentication

**Business Validation Queries**:
1. "Can an enterprise team configure their Blok deployment as MCP tools in Claude Desktop within 5 minutes?"
2. "Can Claude Desktop execute both individual Python AI nodes and complete workflows seamlessly?"
3. "Do MCP-executed workflows maintain full observability and metrics tracking?"

**Current State**: MCP wrapper architecture defined - leverages existing remote execution protocol
**Ready to Start**: ✅ Complete understanding of MCP protocol, enterprise integration strategy ready

### **TASK-006 Details: Context Persistence System for Advanced Data Pipelines**
**Objective**: Implement configurable context persistence for stateful workflows and data pipeline capabilities

**Key Benefits**:
- 💾 **State Management**: Resume workflows from any failed step with persistent context
- 🔄 **Cross-Workflow Coordination**: Share state between parallel workflows via datasources
- 📈 **Scalable Data Processing**: Handle large datasets with intermediate result persistence
- 🏗️ **Enterprise Data Pipelines**: Advanced patterns like checkpointing, resumability, and historical access

**Implementation Approach**:
- **Phase 1**: DataSource registry with Redis, PostgreSQL, S3, FileSystem support
- **Phase 2**: Unified DataSource interface with batch operations and performance optimization
- **Phase 3**: Context integration with automatic persistence and read-only access
- **Phase 4**: Workflow configuration for declarative datasource management

**Business Validation Queries**:
1. "Can a data pipeline process large datasets by persisting intermediate results and resuming from any failed step?"
2. "Can parallel workflows coordinate through shared Redis state while maintaining data integrity?"
3. "Can workflows access historical results from previous executions for trend analysis?"

**Current State**: Context system analyzed - clear enhancement path for multi-datasource persistence
**Ready to Start**: ✅ Architecture designed, fail-fast error handling strategy defined

---

## 📈 **COMPLETED WORK (DONE - Recent History)**

### **Foundation & Critical Infrastructure Phase**
| Task ID | Component | Completed | Developer | Business Queries | Impact |
|---------|-----------|-----------|-----------|------------------|--------|
| TASK-000 | NPM Publication Cleanup | 2024-01-15 | AI-Claude | 3/3 ✅ | **CRITICAL**: Professional ecosystem publication ready, development unblocked |
| SETUP-001 | MCP Methodology Integration | 2024-01-XX | AI-Claude | 3/3 ✅ | Task management system established |
| SETUP-002 | Architecture Documentation | 2024-01-XX | AI-Claude | 3/3 ✅ | Complete system analysis and diagrams created |
| SETUP-003 | CLI Analysis | 2024-01-XX | AI-Claude | 3/3 ✅ | Non-interactive enhancement approach validated |

---

## 🎯 **PROJECT COORDINATION**

### **Development Capacity & Coordination**
- **Available for New Tasks**: All capacity available (no IN_PROGRESS tasks)
- **Next Sprint Planning**: TASK-001 ready for immediate assignment
- **No Blocking Dependencies**: CLI enhancement can proceed independently
- **Risk Assessment**: ZERO risk - additive enhancement only

### **Quality Standards for New Tasks**
- **SACRED_PRODUCTION Compliance**: All tasks must preserve existing behavior 100%
- **Business Query Validation**: Each task must demonstrate real business value
- **Testing Requirements**: Unit tests for logic + integration tests for CLI execution
- **Documentation Updates**: CLI help text and blok.md AI programming section

---

### **Community Health**
- ✅ **NPM Packages**: Published and maintained
- ✅ **Documentation**: Comprehensive AI programming guide (`blok.md`)
- ✅ **Examples**: Working demo workflows and nodes
- ✅ **Monorepo**: Coordinated development across packages

### **Observability & Monitoring**
- ✅ **OpenTelemetry**: Integrated tracing and metrics
- ✅ **Prometheus**: `/metrics` endpoint available
- ✅ **Health Checks**: `/health-check` endpoint operational
- ✅ **Structured Logging**: Context-aware logging system

---

## 🎯 **BUSINESS QUERIES & USE CASES**

### **Primary Developer Questions**
1. **"How do I create a workflow that processes API calls sequentially?"**
   - Use JSON workflow with steps array, `@blok-ts/api-call` nodes
   - Context chaining with `${ctx.response}` between steps

2. **"Can I write a node in Python and use it in a TypeScript workflow?"**
   - Yes, use `type: "runtime.python3"` with gRPC communication
   - Python runtime in `runtimes/python3/` handles cross-language execution

3. **"What's the fastest way to get started with Blok development?"**
   - `npx blokctl@latest create project` with examples enabled
   - Provides HTTP trigger + demo workflows + local development setup

4. **"How do I deploy Blok applications to production?"**
   - Multi-trigger architecture with shared node/workflow volumes
   - Container orchestration with proper environment variables

5. **"Can I test individual nodes without running full workflows?"**
   - Yes, remote node execution via HTTP with special headers
   - Base64 encoded JSON payload for node-specific testing

### **Enterprise Integration Scenarios**
- **Microservices**: Multiple Blok instances with gRPC communication
- **Legacy Integration**: HTTP API calls to existing systems via `@blok-ts/api-call`
- **Event-Driven**: Webhook endpoints triggering workflow execution
- **Multi-Language Teams**: TypeScript and Python developers collaborating

---

## 🛠️ **DEVELOPMENT WORKFLOW & STANDARDS**

### **Current Development Process (PRESERVE)**
```yaml
project_creation:
  command: "npx blokctl@latest create project"
  options: ["trigger", "runtimes", "package_manager", "examples"]
  
node_creation:
  command: "npx blokctl@latest create node"
  options: ["runtime", "type", "template"]
  
workflow_creation:
  command: "npx blokctl@latest create workflow"
  format: "JSON template generation"
  
testing:
  framework: "Vitest"
  types: ["unit", "integration", "remote_node_execution"]
  coverage: "Existing levels maintained"
```

### **Quality Standards (MAINTAIN)**
- **TypeScript**: Full type safety across all components
- **Testing**: Vitest framework with comprehensive coverage
- **Linting**: Existing code style standards preserved
- **Documentation**: AI-focused documentation in `blok.md`

### **Release Management**
- **NPM Publishing**: Coordinated releases across monorepo
- **Semantic Versioning**: Consistent versioning strategy
- **Backward Compatibility**: Strict compatibility requirements
- **Community Communication**: Transparent change communication

---

## 🚀 **MCP METHODOLOGY INTEGRATION PLAN**

### **Phase 1: Documentation & Process Enhancement (COMPLETED)**
- ✅ Legacy analysis and classification
- ✅ Architecture diagrams and documentation
- ✅ Task management system setup
- ✅ External extension strategy defined

### **Phase 2: CLI Tools Documentation (IN PROGRESS)**
- 📚 **blokctl monitor**: Comprehensive documentation for real-time metrics dashboard
- 📚 **Development Workflow**: Document existing dev, build, and testing procedures
- 📚 **Testing Patterns**: Document Vitest + HTTP trigger testing best practices
- 📚 **Production Monitoring**: Document remote Prometheus integration

### **Phase 3: Community Process Enhancement (PLANNED)**
- 📚 Enhanced contribution guidelines
- 📚 Plugin development documentation
- 📚 Testing standards and validation procedures
- 📚 Community onboarding improvements

### **Success Metrics**
- **Core Stability**: 100% existing test suite pass rate maintained
- **API Compatibility**: Zero breaking changes to HTTP API
- **Community Impact**: Positive feedback on enhanced tools and documentation
- **CLI Tool Accuracy**: Monitoring tools provide accurate metrics within 5% variance

---

## 🧭 **NAVIGATION & QUICK REFERENCE**

### **Essential Documentation**
- **`blok.md`**: Comprehensive AI programming guide (3,900+ lines)
- **`docs/methodology/features_list.md`**: Complete feature requirements
- **`docs/methodology/complete_plan.md`**: Architecture and implementation plan
- **`docs/diagrams/`**: Visual architecture maps (service topology, data flow, integrations)

### **Key Directories**
```
core/runner/                 # Core workflow engine (SACRED)
triggers/http/               # HTTP trigger implementation (SACRED)
triggers/grpc/               # gRPC trigger implementation (SACRED)
packages/cli/                # blokctl CLI tool (SACRED)
nodes/                       # Global NPM node examples (PROTECTED)
workflows/                   # Example workflows (PROTECTED)
tools/                       # External MCP tools (NEW - SAFE)
docs/                        # Enhanced documentation (NEW - SAFE)
```

### **Critical Endpoints**
- **HTTP Server**: `http://localhost:4000`
- **Metrics**: `http://localhost:9091/metrics`
- **Health Check**: `http://localhost:4000/health-check`
- **Remote Node Execution**: `POST /{nodeName}` with `x-nanoservice-execute-node: true`

### **Development Commands**
```bash
# Project management
npx blokctl@latest create project
npx blokctl@latest create node
npx blokctl@latest create workflow

# Testing
npm run test                 # Unit tests
npm run test:integration     # Integration tests
npm run build               # TypeScript compilation
npm run dev                 # Development server

# Validation (Enhanced)
npm run validate-workflows   # External validation tool
npm run analyze-metrics     # External metrics analysis
npm run test-business-queries # Business query validation
```

---

## 🤖 **AI AGENT GUIDANCE**

### **For AI Programming with Blok**
1. **Always reference `blok.md`** for comprehensive framework understanding
2. **Respect the SACRED_PRODUCTION classification** - never modify core systems
3. **Document existing functionality** rather than creating new tools
4. **Test against HTTP API** rather than internal implementation
5. **Follow existing patterns** when creating nodes or workflows

### **Common AI Mistakes to Avoid**
- ❌ Modifying `core/runner/` or `triggers/` source code
- ❌ Breaking existing CLI command interfaces
- ❌ Changing published NPM package APIs
- ❌ Ignoring the node type system (`module` vs `local` vs `runtime.python3`)
- ❌ Not understanding context interpolation patterns (`${expression}` vs `js/expression`)

### **Recommended AI Workflow**
1. **Understand Requirements**: Reference business queries and use cases
2. **Check Architecture**: Review diagrams and component classifications
3. **Design Solution**: Document existing tools and leverage built-in functionality
4. **Implement**: Follow existing patterns and test against stable APIs
5. **Validate**: Ensure zero impact on SACRED_PRODUCTION systems

---

## 📞 **ESCALATION & SUPPORT**

### **When to Escalate to Human**
- **SACRED system modifications**: Any changes to protected components
- **API contract changes**: Modifications to existing HTTP/gRPC interfaces
- **Community impact**: Changes that might affect existing users
- **Architecture decisions**: Major structural or design decisions

### **Self-Service Resources**
- **Architecture Diagrams**: `docs/diagrams/` for visual system understanding
- **Business Queries**: Use cases and scenarios in features list
- **CLI Tool Documentation**: blokctl command reference and examples
- **Testing Patterns**: Existing test suites for validation approaches

### **Community Resources**
- **Documentation**: Public docs via Mintlify deployment
- **NPM Packages**: Published packages for stable APIs
- **GitHub**: Community contributions and issue tracking
- **Examples**: Working workflows and nodes for reference

---

**This task dashboard provides complete context for AI-assisted development on the Blok Framework. All development work must respect the SACRED_PRODUCTION classification and follow the external extension pattern to preserve community trust and system stability.** 