# TASK-000: NPM Publication Cleanup - Remove Nanoservice-TS References
**Master Plan Reference**: Section 🚀 CRITICAL - Pre-publication package metadata cleanup  
**Dependencies**: None (MUST be completed before ALL other tasks)
**Estimated Effort**: S (4 hours) - Systematic metadata cleanup and version reset
**Assigned To**: [To be assigned IMMEDIATELY]
**Priority**: P0-CRITICAL (BLOCKING ALL DEVELOPMENT - Must complete before any other task)

## Business Value
Clean all package metadata from legacy "nanoservice-ts" references to ensure professional, consistent "blok-ts" branding for the first NPM publication. This is essential for community adoption, professional credibility, and avoiding confusion in the ecosystem.

## Acceptance Criteria
- [ ] **All Package.json Files**: Remove every "nanoservice" reference from descriptions, keywords, and repositories
- [ ] **Version Reset**: Standardize all public package versions to 0.1.0 for clean first publication
- [ ] **Service Names**: Update infrastructure service names from "nanoservice-http" to "blok-http"
- [ ] **Repository URLs**: Update all repository links to current blok-ts repository
- [ ] **Keywords Cleanup**: Replace outdated keywords with relevant blok-ts terminology
- [ ] **Publication Test**: Verify all packages can be published successfully with `pnpm ci:publish --dry-run`
- [ ] **No Breaking Changes**: Ensure all changes are metadata-only, no code modifications

## Business Queries to Validate
1. "Are all @blok-ts packages ready for professional NPM publication with consistent, accurate metadata?"
2. "Can developers find blok-ts packages easily through correct keywords and descriptions on NPM?"
3. "Do all published packages reflect the current blok-ts branding without legacy nanoservice references?"

## Current State Analysis

### 🚨 Critical Issues Found
**Investigation shows ZERO @blok-ts packages are published on NPM** and contain multiple legacy references that will cause:
- **Professional Embarrassment**: Legacy "nanoservice" references in public NPM listings
- **Community Confusion**: Mixed branding between nanoservice-ts and blok-ts
- **Discovery Problems**: Wrong keywords preventing proper package discovery
- **Broken Links**: Repository URLs pointing to old/incorrect repositories

### Affected Files Requiring Cleanup
```bash
# PUBLIC PACKAGES (Will appear on NPM)
nodes/control-flow/if-else@1.0.0/package.json     # Description: "nanoservice if-else"
packages/cli/package.json                          # Keywords: ["nanoservice", "nanoservice-ts"]
core/runner/package.json                          # ✅ Already clean
nodes/web/api-call@1.0.0/package.json            # ✅ Already clean

# PRIVATE PACKAGES (Internal consistency)
triggers/grpc/package.json                        # Repository: nanoservice-ts.git
templates/ts-template/package.json                # Repository: nanoservice-ts-shared-lib.git
runtimes/python3/package.json                     # Keywords: ["nanoservice", "node"]

# INFRASTRUCTURE
infra/metrics/dashboard.json                       # Service names: "nanoservice-http"
```

### Publication-Ready Packages Status
| Package | Current Version | Public/Private | Status |
|---------|----------------|----------------|---------|
| `@blok-ts/runner` | 0.1.26 | Public | ✅ Metadata clean, ready |
| `@blok-ts/api-call` | 0.1.29 | Public | ✅ Metadata clean, ready |
| `@blok-ts/if-else` | 0.0.30 | Public | ❌ **Legacy description** |
| `blokctl` | 0.1.14 | Public | ❌ **Legacy keywords** |

## Implementation Approach

### Phase 1: Public Package Metadata Cleanup
**Target**: All packages with `"private": false`

**File 1**: `nodes/control-flow/if-else@1.0.0/package.json`
```json
{
  "name": "@blok-ts/if-else",
  "version": "0.1.0", // ← Reset for clean first publication
  "description": "Blok conditional flow control node for workflow orchestration",
  // ... rest unchanged
}
```

**File 2**: `packages/cli/package.json`
```json
{
  "name": "blokctl",
  "version": "0.1.0", // ← Reset for clean first publication  
  "description": "CLI for Blok - Workflow-based backend development platform",
  "keywords": ["blokctl", "cli", "blok", "blok-ts", "workflow", "backend", "orchestration"],
  // ... rest unchanged
}
```

### Phase 2: Private Package Consistency Cleanup
**Target**: Internal packages for consistency

**File 3**: `triggers/grpc/package.json`
```json
{
  "repository": "https://github.com/deskree-inc/blok-ts.git", // ← Update to current repo
  // ... rest unchanged
}
```

**File 4**: `templates/ts-template/package.json`
```json
{
  "repository": "https://github.com/deskree-inc/blok-ts.git", // ← Update to current repo
  // ... rest unchanged
}
```

**File 5**: `runtimes/python3/package.json`
```json
{
  "keywords": ["blok", "python", "runtime", "node", "workflow"],
  // ... rest unchanged
}
```

### Phase 3: Infrastructure Service Names
**Target**: `infra/metrics/dashboard.json`

```json
{
  // Find and replace all instances:
  // "nanoservice-http" → "blok-http"
  "expr": "{service_name=\"blok-http\"} | json | level=\"info\"",
  "expr": "{service_name=\"blok-http\"} | json | level=\"error\"",
}
```

### Phase 4: Version Standardization Strategy
**Recommendation**: Reset all public packages to `0.1.0` for clean ecosystem start

**Rationale**:
- **Clean Slate**: First publication should start with consistent versioning
- **Ecosystem Clarity**: All @blok-ts packages begin together at 0.1.0
- **Professional Appearance**: Shows coordinated, planned release strategy
- **Community Trust**: Clear that this is the "official" blok-ts ecosystem launch

**Affected Versions**:
```bash
@blok-ts/runner: 0.1.26 → 0.1.0
@blok-ts/api-call: 0.1.29 → 0.1.0  
@blok-ts/if-else: 0.0.30 → 0.1.0
blokctl: 0.1.14 → 0.1.0
```

## Testing Strategy

### Pre-Publication Validation
```bash
# Test package publication without actually publishing
pnpm ci:publish --dry-run

# Verify package contents
npm pack @blok-ts/runner
npm pack @blok-ts/api-call  
npm pack @blok-ts/if-else
npm pack blokctl

# Check generated package.json files
tar -tf blok-ts-runner-0.1.0.tgz | grep package.json
tar -xf blok-ts-runner-0.1.0.tgz package/package.json
cat package/package.json | jq '.description, .keywords, .repository'
```

### Metadata Verification Checklist
- [ ] **No "nanoservice" strings** in any public package.json
- [ ] **Repository URLs** point to correct blok-ts repository
- [ ] **Keywords** are relevant and discoverable ("blok", "workflow", "backend")
- [ ] **Descriptions** clearly explain blok-ts purpose
- [ ] **Versions** are consistent across ecosystem (0.1.0)
- [ ] **Service names** updated in monitoring dashboards

### Publication Readiness Test
```bash
# Final verification before actual publication
npm whoami                    # Verify NPM auth
npm access list packages      # Check access permissions
pnpm ci:publish --dry-run     # Final dry run
pnpm ci:publish              # 🚀 ACTUAL PUBLICATION
```

## Risk Assessment & Mitigation

### Technical Risks
- **Breaking Changes**: Version resets might confuse development
  - *Mitigation*: This is pre-publication, no external dependencies exist
- **Package Conflicts**: Name conflicts on NPM
  - *Mitigation*: @blok-ts scope ensures namespace isolation
- **Build Failures**: Updated metadata breaks builds
  - *Mitigation*: Only metadata changes, no code modifications

### Business Risks
- **Delayed Publication**: Other tasks blocked until completion
  - *Mitigation*: Small scope, 4-hour task, can be completed immediately
- **Community Perception**: Looks unprofessional if legacy references remain
  - *Mitigation*: This task directly addresses professional appearance

## Success Metrics & Validation

### Publication Success Indicators
- **NPM Visibility**: All @blok-ts packages appear correctly on npmjs.com
- **Search Discovery**: Packages found via keywords "blok", "workflow", "backend"
- **Professional Metadata**: No legacy "nanoservice" references in public listings
- **Consistent Versioning**: All packages start at 0.1.0 ecosystem launch

### Business Validation Examples
```bash
# Community Discovery Test
1. Search npmjs.com for "blok workflow backend"
2. Verify @blok-ts packages appear in results
3. Confirm descriptions are accurate and professional
4. Check that keywords enable proper discovery

# Professional Appearance Test  
1. Visit @blok-ts/runner on npmjs.com
2. Verify description: "Blok workflow execution engine"
3. Confirm repository links to correct GitHub
4. Check that no "nanoservice" references exist

# Ecosystem Consistency Test
1. Verify all @blok-ts packages show version 0.1.0
2. Confirm consistent branding across all packages
3. Check that CLI (blokctl) aligns with ecosystem branding
```

## Documentation Integration

### Update blok.md Installation Section
```markdown
## Installation

### Global CLI Installation
```bash
npm install -g blokctl@latest
```

### Core Packages
```bash
npm install @blok-ts/runner@latest
npm install @blok-ts/api-call@latest
npm install @blok-ts/if-else@latest
```

All packages are now available on NPM with consistent 0.1.0 versioning.
```

### Update README.md Quick Start
```markdown
## Quick Start

```bash
# Install Blok CLI
npm install -g blokctl

# Create new project
blokctl create project my-app

# Install core dependencies  
npm install @blok-ts/runner @blok-ts/api-call
```

Professional, published packages ready for production use.
```

## Implementation Checklist

### Phase 1: Public Package Cleanup (CRITICAL)
- [ ] Update `@blok-ts/if-else` description and version
- [ ] Update `blokctl` keywords and version  
- [ ] Verify `@blok-ts/runner` and `@blok-ts/api-call` are clean

### Phase 2: Private Package Consistency
- [ ] Update gRPC trigger repository URL
- [ ] Update TypeScript template repository URL
- [ ] Update Python runtime keywords

### Phase 3: Infrastructure Updates
- [ ] Update service names in metrics dashboard
- [ ] Verify monitoring configurations use "blok-http"

### Phase 4: Publication Verification
- [ ] Run `pnpm ci:publish --dry-run`
- [ ] Verify all packages pass validation
- [ ] Test package metadata correctness
- [ ] Execute actual publication

## AI Programming Impact
This cleanup enables:
- **Professional NPM Ecosystem**: Clean, discoverable @blok-ts packages
- **Community Adoption**: Proper branding and metadata for developers
- **Ecosystem Growth**: Foundation for future package additions
- **Development Velocity**: Unblocks all other tasks waiting for publication
- **Brand Consistency**: Unified blok-ts identity across all touchpoints

## Implementation Timeline
- **Hour 1**: Public package metadata cleanup and version reset
- **Hour 2**: Private package consistency updates
- **Hour 3**: Infrastructure service name updates and testing
- **Hour 4**: Publication validation and execution

---

**🚨 CRITICAL BLOCKER: This task MUST be completed before any other development work. Without clean package publication, the entire blok-ts ecosystem cannot launch professionally.** 