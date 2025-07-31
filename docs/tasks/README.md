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
3. **Context Management**: Dynamic variable interpolation with `${expression}` and `js/expression`
4. **Response Generation**: Output processing → Format detection → HTTP response

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

### **Production Readiness**
- ✅ **HTTP Trigger**: Production-ready with observability
- ✅ **gRPC Trigger**: Functional but requires manual setup
- ✅ **Core Engine**: Stable, published, community-tested
- ✅ **CLI Tool**: Complete project/node/workflow management
- ❌ **MCP Trigger**: Broken/incomplete, needs external wrapper

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