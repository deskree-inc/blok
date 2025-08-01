# TASK-001: Non-Interactive CLI Mode for Core blokctl Commands
**Master Plan Reference**: Section 🔧 CLI Tools - `blokctl` command enhancement for AI programming automation  
**Dependencies**: None (extends existing SACRED_PRODUCTION CLI without modifications)
**Estimated Effort**: M (1 day) - CLI extension with backward compatibility
**Assigned To**: [To be assigned]
**Priority**: P1-High (Enables AI automation workflow)

## Business Value
Enable AI agents to execute `blokctl create project`, `create node`, and `create workflow` commands programmatically without interactive prompts, dramatically improving AI programming efficiency and automation capabilities while maintaining full backward compatibility for human developers.

## Acceptance Criteria
- [ ] **Backward Compatibility**: All existing interactive behavior remains unchanged when --non-interactive flag is not used
- [ ] **Non-Interactive Mode**: Commands execute without prompts when --non-interactive flag is provided
- [ ] **Parameter Validation**: Robust validation for required parameters in non-interactive mode
- [ ] **Default Values**: Intelligent defaults applied for optional parameters in non-interactive mode
- [ ] **Error Handling**: Clear error messages when required parameters missing in non-interactive mode
- [ ] **Documentation**: Updated help text and examples for new flags

## Business Queries to Validate
1. "Can an AI create a complete Blok project setup (project + nodes + workflows) programmatically in under 30 seconds?"
2. "Can developers script automated project scaffolding for team onboarding using blokctl non-interactive commands?"
3. "Does the non-interactive mode provide clear error messages when parameters are missing or invalid?"

## Technical Implementation Details

### Current Interactive Parameters Analysis
```bash
# create project current prompts:
projectName: string        # default: "nano-service"
trigger: "http"           # only HTTP available (gRPC commented out)
runtimes: ["node"]        # only NodeJS available (Python3 commented out)  
selectedManager: auto     # npm/yarn/pnpm (auto-detected)
examples: false          # default: NO

# create node current prompts:
nodeName: string          # required
selectedManager: auto     # npm/yarn/pnpm (auto-detected)
nodeRuntime: "typescript" # only TypeScript available (Python3 commented out)
nodeType: "module"|"class" # only for TypeScript
template: "class"|"ui"     # only for TypeScript

# create workflow current prompts:
workflowName: string      # required only
```

### Proposed CLI Extensions (Zero Breaking Changes)

#### Enhanced create project command:
```bash
blokctl create project \
  --name "my-api" \
  --trigger "http" \
  --runtimes "node" \
  --manager "pnpm" \
  --examples \
  --non-interactive

# With intelligent defaults:
blokctl create project --name "my-api" --non-interactive
# Auto-applies: trigger=http, runtimes=node, manager=auto-detect, examples=false
```

#### Enhanced create node command:
```bash
blokctl create node \
  --name "user-validator" \
  --runtime "typescript" \
  --type "module" \
  --template "class" \
  --manager "pnpm" \
  --non-interactive

# With defaults:
blokctl create node --name "user-validator" --non-interactive
# Auto-applies: runtime=typescript, type=module, template=class, manager=auto-detect
```

#### Enhanced create workflow command:
```bash
blokctl create workflow --name "user-registration" --non-interactive
```

## Implementation Approach

### Phase 1: Add CLI Options (SAFE - No Existing Logic Changes)
**Files to modify**:
- `packages/cli/src/index.ts`: Add new option flags to command definitions
- No changes to existing logic flow

**New options to add**:
```typescript
// create project options
.option("--trigger <value>", "Trigger type (http)")
.option("--runtimes <value>", "Runtimes (node)")  
.option("--manager <value>", "Package manager (npm|yarn|pnpm)")
.option("--examples", "Include examples")
.option("--non-interactive", "Run without prompts")

// create node options
.option("--runtime <value>", "Runtime (typescript)")
.option("--type <value>", "Node type (module|class)")
.option("--template <value>", "Template (class|ui)")
.option("--manager <value>", "Package manager")
.option("--non-interactive", "Run without prompts")

// create workflow options  
.option("--non-interactive", "Run without prompts")
```

### Phase 2: Extend Command Logic (SAFE - Additive Only)
**Files to modify**:
- `packages/cli/src/commands/create/project.ts`
- `packages/cli/src/commands/create/node.ts`
- `packages/cli/src/commands/create/workflow.ts`

**Implementation pattern** (maintains SACRED_PRODUCTION status):
```typescript
export async function createProject(opts: OptionValues, version: string, currentPath = false) {
  const isDefault = opts.name !== undefined;
  const isNonInteractive = opts.nonInteractive === true;
  
  // NEW: Non-interactive mode
  if (isNonInteractive) {
    validateNonInteractiveParams('project', opts);
    projectName = opts.name;
    trigger = opts.trigger || "http";
    runtimes = opts.runtimes ? opts.runtimes.split(',') : ["node"];
    selectedManager = opts.manager || await pm.getManager();
    examples = opts.examples || false;
  }
  // EXISTING: Interactive mode (unchanged)
  else if (!isDefault) {
    // All existing interactive logic remains identical
  }
  
  // EXISTING: All subsequent logic remains unchanged
}
```

### Phase 3: Add Validation Function (NEW - Safe Addition)
**New utility function**:
```typescript
function validateNonInteractiveParams(command: string, opts: OptionValues): void {
  if (!opts.nonInteractive) return;
  
  const errors: string[] = [];
  
  switch (command) {
    case 'project':
      if (!opts.name) errors.push("--name is required in non-interactive mode");
      if (opts.trigger && !['http'].includes(opts.trigger)) {
        errors.push("--trigger must be 'http' (only available option)");
      }
      if (opts.runtimes && !opts.runtimes.split(',').every(r => ['node'].includes(r))) {
        errors.push("--runtimes must be 'node' (only available option)");
      }
      break;
      
    case 'node':
      if (!opts.name) errors.push("--name is required in non-interactive mode");
      if (opts.runtime && !['typescript'].includes(opts.runtime)) {
        errors.push("--runtime must be 'typescript' (only available option)");
      }
      if (opts.type && !['module', 'class'].includes(opts.type)) {
        errors.push("--type must be 'module' or 'class'");
      }
      if (opts.template && !['class', 'ui'].includes(opts.template)) {
        errors.push("--template must be 'class' or 'ui'");
      }
      break;
      
    case 'workflow':
      if (!opts.name) errors.push("--name is required in non-interactive mode");
      break;
  }
  
  if (errors.length > 0) {
    throw new Error(`Non-interactive validation failed:\n${errors.join('\n')}`);
  }
}
```

## Security & Safety Considerations
- **SACRED_PRODUCTION Compliance**: Zero modifications to existing core logic
- **Backward Compatibility**: All existing behavior preserved perfectly
- **Input Validation**: Robust validation prevents invalid parameter combinations
- **Error Handling**: Clear error messages guide users to correct usage
- **Default Safety**: Conservative defaults prevent accidental unwanted behavior

## Testing Strategy

### Unit Tests (Required)
```typescript
describe('Non-Interactive CLI Mode', () => {
  test('create project with all parameters succeeds', () => {
    // Test successful non-interactive project creation
  });
  
  test('create project with missing name fails with clear error', () => {
    // Test validation error handling
  });
  
  test('create node with invalid runtime fails with specific error', () => {
    // Test parameter validation
  });
  
  test('interactive mode unchanged when --non-interactive not provided', () => {
    // Test backward compatibility
  });
});
```

### Integration Tests (Required)
```bash
# Test actual command execution
blokctl create project --name "test-project" --non-interactive
# Verify: project created successfully without prompts

blokctl create node --name "test-node" --non-interactive  
# Verify: node created with default parameters

blokctl create workflow --name "test-workflow" --non-interactive
# Verify: workflow JSON file created correctly
```

## AI Programming Integration

### Updated blok.md Documentation Section
```markdown
## Non-Interactive CLI Usage for AI Programming

AI agents can execute blokctl commands programmatically:

```bash
# Create complete project setup programmatically:
blokctl create project --name "user-management-api" --non-interactive
blokctl create node --name "user-validator" --type "module" --non-interactive  
blokctl create node --name "auth-handler" --type "module" --non-interactive
blokctl create workflow --name "user-registration" --non-interactive
```

### AI Usage Examples:
- **Project Scaffolding**: Create entire project structure in seconds
- **Batch Node Creation**: Generate multiple nodes with consistent patterns
- **Template Automation**: Script common project setups for team standardization
```

## Definition of Done
- [ ] All acceptance criteria met with test evidence
- [ ] Business queries validated with actual command executions
- [ ] Backward compatibility verified - existing interactive behavior unchanged
- [ ] Non-interactive mode works for all three commands (project, node, workflow)
- [ ] Parameter validation provides clear error messages
- [ ] Help text updated with new flag documentation
- [ ] Integration tests pass for both interactive and non-interactive modes
- [ ] Code review completed focusing on SACRED_PRODUCTION compliance
- [ ] Documentation updated in blok.md with AI programming examples
- [ ] Changeset updated with feature implementation details

## Success Metrics
- **AI Automation**: AI can create project + 2 nodes + 1 workflow in <30 seconds
- **Error Clarity**: Missing parameter errors clearly guide to correct usage
- **Backward Compatibility**: 100% existing functionality preserved
- **Developer Adoption**: Feature enables scripted project setup workflows

## Implementation Notes
- **Code Location**: All changes in `packages/cli/src/` directory
- **Testing**: Both unit tests for logic and integration tests for actual CLI execution
- **Documentation**: Update CLI help text and blok.md AI programming section
- **Validation**: Comprehensive parameter validation with user-friendly error messages

---

**This task enables the core AI programming workflow capability while maintaining the highest safety standards for the SACRED_PRODUCTION CLI codebase.** 