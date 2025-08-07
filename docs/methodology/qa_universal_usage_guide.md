# Guía de Uso: MCP QA Sub-Agent
**Versión**: 2.0 - Sistema Universal de Validación QA  
**Fecha**: 2025-01-08  
**Sub-Agent**: `mcp-qa`

---

## **¿Qué es el MCP QA Sub-Agent?**

Es un **sub-agent especializado** que puede validar **CUALQUIER tarea DONE** usando estándares MCP methodology y conocimiento completo de Blok Framework. A diferencia de soluciones hardcodeadas, este sub-agent se adapta automáticamente al tipo de tarea y aplica validaciones apropiadas.

### **Características Clave**
- ✅ **Universal**: Funciona con cualquier tarea DONE (actual y futura)
- ✅ **Context-Aware**: Lee automáticamente MCP docs y blok.md para validaciones precisas
- ✅ **Systematic**: Aplica mismo framework de validación para todas las tareas
- ✅ **Evidence-Based**: Ejecuta tests reales, no solo revisa documentación
- ✅ **Blok-Native**: Entiende arquitectura Blok para tests precisos

---

## **Problema que Resuelve**

### **❌ Enfoque Anterior (Hardcodeado)**
```bash
# Tests específicos por tarea
TEST_TASK001() { ... }  # Solo funciona para TASK-001
TEST_TASK002() { ... }  # Solo funciona para TASK-002
# Cada nueva tarea requiere nuevo código QA
```

### **✅ Enfoque Universal (Sub-Agent)**
```bash
# Un sistema que funciona para cualquier tarea
"Validate TASK-XXX using universal QA standards"
"Validate all DONE tasks systematically"
"Apply MCP methodology validation to any new task"
```

---

## **Cómo Usar el Sub-Agent**

### **Activación Automática (Recomendado)**
Claude detecta automáticamente cuando necesitas validación QA:

```
Necesito validar todas las tareas DONE usando estándares MCP methodology.
```

**Claude automáticamente delegará al mcp-qa sub-agent.**

### **Invocación Explícita**
```
Use the mcp-qa subagent to validate all tasks in docs/tasks/DONE/ 
against MCP methodology standards and Blok architecture requirements.
```

### **Comando Slash (Si disponible)**
```
/mcp-qa
```

---

## **Casos de Uso Específicos**

### **Caso 1: Validación de Todas las Tareas DONE**
```
I need systematic QA validation of all DONE tasks to ensure MCP methodology 
compliance and Blok architecture correctness. Generate a comprehensive report.
```

**Resultado**: Validación completa de todas las tareas con ratings individuales y reporte general.

### **Caso 2: Validación de Tarea Específica**
```
Validate TASK-005 MCP Server Development that just moved to DONE using mcp-qa. 
Focus on business query validation and SACRED_PRODUCTION compliance.
```

**Resultado**: Análisis detallado de una tarea específica con tests ejecutables.

### **Caso 3: Validación de Nueva Tarea (Futuro)**
```
TASK-010 Database Integration just moved to DONE. Use mcp-qa 
to validate implementation against MCP methodology requirements.
```

**Resultado**: Validación automática sin necesidad de código QA custom.

### **Caso 4: Auditoría de Compliance**
```
Perform comprehensive MCP methodology compliance audit on all DONE tasks using mcp-qa. 
Include SACRED_PRODUCTION verification and business value assessment.
```

**Resultado**: Auditoría completa con métricas de compliance y recomendaciones.

---

## **Proceso de Validación Universal**

### **Fase 1: Context Understanding (Automático)**
El sub-agent lee automáticamente:
- ✅ `docs/methodology/complete_plan.md` - MCP methodology
- ✅ `blok.md` - Blok Framework architecture (33k+ lines)
- ✅ **`docs/diagrams/`** - **CRÍTICO**: Architecture diagrams
  - **`legacy_service_topology.mmd`** - Component classifications (SACRED/PROTECTED/SAFE)
  - **`legacy_data_flow.mmd`** - Complete request/response flow patterns
  - **`legacy_integration_map.mmd`** - External dependencies and ecosystem
- ✅ `docs/tasks/README.md` - Project context
- ✅ Archivo de tarea específico

### **Fase 2: Task Type Detection (Inteligente)**
Detecta automáticamente el tipo de tarea:
- 🔧 **CLI Enhancement**: blokctl, commands, flags
- 🐍 **Runtime Migration**: python, classes, gRPC  
- 📦 **Package Management**: npm, metadata, publication
- 🐛 **Bug Fix**: error resolution, linting
- ⭐ **Generic Feature**: nueva funcionalidad

### **Fase 3: Business Query Validation (Ejecutable)**
Para cada una de las 3 business queries:
- ⏱️ **Speed Claims**: Mide tiempos reales vs. claims
- 🎯 **Capability Claims**: Ejecuta scenarios de test
- 🔗 **Integration Claims**: Testa componentes múltiples

### **Fase 4: SACRED_PRODUCTION Compliance (Crítico)**
- 🛡️ Verifica zero modificaciones a core systems
- 🔄 Confirma backward compatibility mantenida
- 👥 Valida zero impacto negativo en comunidad

### **Fase 5: Implementation Evidence (Concreto)**
- ⚡ Ejecuta commands/workflows reales
- 📊 Mide performance cuando se clama
- 🧪 Testa error handling y edge cases

---

## **Tipos de Validación por Task Type**

### **CLI Enhancement Tasks**
```bash
# Auto-detected patterns: "blokctl", "CLI", "--flag"
Validations Applied:
✅ Test actual CLI commands work as documented
✅ Verify backward compatibility maintained  
✅ Test error handling and parameter validation
✅ Time performance claims if mentioned
✅ Test non-interactive modes if applicable
```

### **Runtime Migration Tasks**
```bash
# Auto-detected patterns: "runtime", "python", "migration"
Validations Applied:
✅ Test multi-runtime functionality using Blok architecture
✅ Verify class migrations completed (no legacy references)
✅ Test gRPC communication between runtimes
✅ Validate workflow execution with multiple runtimes
✅ Test remote node execution protocols
```

### **Package/Publication Tasks**  
```bash
# Auto-detected patterns: "npm", "package.json", "metadata"
Validations Applied:
✅ Check package.json files for claimed changes
✅ Verify no legacy references in metadata
✅ Test package publication readiness (dry-run)
✅ Validate repository links and keywords
✅ Test installation and dependency resolution
```

### **Bug Fix Tasks**
```bash
# Auto-detected patterns: "BUG-", "error", "linting", "fix"
Validations Applied:
✅ Verify root cause analysis is complete
✅ Test that the bug is actually fixed
✅ Confirm prevention measures implemented
✅ Validate code quality improvements (measurable)
✅ Test that fix doesn't introduce regressions
```

---

## **Business Query Validation Patterns**

### **Speed/Performance Claims**
```
Query Example: "Can AI create setup in <30 seconds?"

Validation Process:
1. Extract time target: 30 seconds
2. Execute complete workflow with timing
3. Measure actual duration: 23 seconds
4. Result: ✅ PASS - 23s < 30s target
```

### **Capability Claims**
```
Query Example: "Can developers script automated scaffolding?"

Validation Process:
1. Create automation script based on task
2. Execute script without interaction
3. Verify all expected outputs created
4. Result: ✅ PASS - Full automation achieved
```

### **Integration Claims**
```
Query Example: "Does Python runtime integrate seamlessly with HTTP trigger?"

Validation Process:
1. Start both Node.js and Python servers
2. Create multi-runtime workflow
3. Test HTTP trigger → Python node execution
4. Verify context passing and response format
5. Result: ✅ PASS - Integration working correctly
```

---

## **Blok Framework Specific Validations**

### **Workflow Testing (Diagram-Guided)**
```bash
# Uses architecture diagrams for precise validation
- HTTP trigger paths: trigger.http.path (per legacy_data_flow.mmd)
- Context system: ${ctx.vars}, js/expressions (per Context Processing flow)
- Node types: module/local/runtime.python3 (per Node Resolution patterns)
- Remote execution: BASE64 protocol (per Entry Points flow)
- Sequential execution: Step Execution patterns from data flow
```

### **Multi-Runtime Testing (Topology-Based)**
```bash
# Based on legacy_service_topology.mmd and integration map
- Starts Node.js server: npm run dev (per Runtime Environments)
- Starts Python gRPC server: python runtimes/python3/server.py (per Python Runtime Ecosystem)
- Tests communication: HTTP → Node.js → gRPC → Python (per service connections)
- Validates context passing: Context Data Flow patterns
- Verifies dependencies: Python Dependencies → PyPI (per integration map)
```

### **CLI Testing (Service Topology)**
```bash
# Follows Built-in CLI Tools section in service topology
- CLI commands: blokctl monitor, dev, build (per topology diagram)
- CLI integrations: monitor → /metrics, dev → HTTP server
- CLI publishing: blokctl → NPM Registry (per ecosystem connections)
- CLI tool relationships: CLI → CORE, CLI → HTTP (per SACRED connections)
```

### **Package/Publication Testing (Integration Map)**
```bash
# Based on NPM Ecosystem and Container Ecosystem sections
- NPM publishing: Package → NPM Registry (per integration connections)
- Dependencies: Third-Party Dependencies mapping validation
- Container publishing: Docker Hub ecosystem patterns
- External services: REST APIs, databases per External APIs & Services
```

---

## **Reportes Generados**

### **Executive Summary**
```
# QA Validation Report - Universal
**Date**: 2025-01-08
**Tasks Validated**: 4 DONE tasks
**Overall Rating**: EXCELLENT (100%)
**MCP Compliance**: Perfect adherence
**Critical Issues**: None detected
```

### **Individual Task Ratings**
```
| Task ID | Type | Business Queries | SACRED Compliance | Evidence | Rating |
|---------|------|------------------|-------------------|----------|---------|
| TASK-000 | Package | 3/3 ✅ | ✅ Perfect | ✅ Concrete | EXCELLENT |
| TASK-001 | CLI | 3/3 ✅ | ✅ Perfect | ✅ Concrete | EXCELLENT |
| TASK-002 | Runtime | 3/3 ✅ | ✅ Perfect | ✅ Concrete | EXCELLENT |
| BUG-001 | Bug Fix | 3/3 ✅ | ✅ Perfect | ✅ Concrete | EXCELLENT |
```

### **Detailed Validation Results**
```
## TASK-001: CLI Non-Interactive Mode

### Business Query Validations
BQ1: "Can AI create complete setup in <30 seconds?"
- ✅ PASS: Actual time 23s (target <30s)
- Evidence: Complete project + nodes + workflow created
- Test method: Timed execution with verification

BQ2: "Can developers script automated scaffolding?"  
- ✅ PASS: Full automation script successful
- Evidence: Non-interactive mode works for all commands
- Test method: Script execution without prompts

BQ3: "Does non-interactive mode provide clear error messages?"
- ✅ PASS: Clear, specific error messages
- Evidence: Missing parameter errors guide to correct usage
- Test method: Intentional error scenario testing

### Implementation Evidence
- ✅ CLI commands work as documented
- ✅ Backward compatibility maintained
- ✅ Error handling robust and helpful
```

---

## **Ventajas del Sistema Universal**

### **Para el Proyecto**
- ✅ **Escalabilidad**: Funciona con cualquier tarea futura
- ✅ **Consistencia**: Mismo estándar para todas las validaciones
- ✅ **Eficiencia**: No requiere desarrollo de QA custom
- ✅ **Precisión**: Validaciones basadas en arquitectura real

### **Para el Equipo**
- ✅ **Confianza**: Validaciones sistemáticas y confiables
- ✅ **Velocidad**: Validación automática vs. manual
- ✅ **Estándares**: Compliance MCP garantizado
- ✅ **Learning**: Feedback educativo sobre best practices

### **Para Stakeholders**
- ✅ **Visibility**: Reportes profesionales regulares
- ✅ **Assurance**: Compliance verificado automáticamente
- ✅ **Quality**: Standards enterprise mantenidos
- ✅ **Predictability**: Mismo proceso para todas las tareas

---

## **Comparación: Hardcoded vs. Universal**

### **Sistema Anterior (Hardcoded)**
```bash
# Limitaciones críticas:
❌ Solo funciona para 4 tareas específicas actuales
❌ Cada nueva tarea requiere desarrollo QA custom  
❌ Tests inconsistentes entre diferentes tareas
❌ No escala con crecimiento del proyecto
❌ Mantenimiento manual y propenso a errores
```

### **Sistema Universal (Sub-Agent)**
```bash
# Capacidades avanzadas:
✅ Funciona para cualquier tarea (actual y futura)
✅ Auto-detecta tipo de tarea y aplica validaciones apropiadas
✅ Estándares consistentes MCP para todas las validaciones
✅ Escala automáticamente con el crecimiento del proyecto  
✅ Zero mantenimiento - se actualiza automáticamente
```

---

## **Troubleshooting**

### **Problema: Sub-agent no encuentra documentos de referencia**
**Solución**: Verificar estructura de archivos:
```bash
ls docs/methodology/complete_plan.md  # MCP methodology
ls blok.md                           # Blok architecture  
ls docs/tasks/README.md              # Project context
ls docs/tasks/DONE/                  # Tasks to validate
```

### **Problema: Validaciones muy genéricas**
**Solución**: Proveer contexto específico:
```
Use qa-validator-universal to focus specifically on SACRED_PRODUCTION 
compliance and business query execution for runtime-related tasks.
```

### **Problema: Tests de Blok incorrectos**
**Verificación**: El sub-agent debe mencionar que leyó `blok.md` antes de ejecutar tests.

---

## **Casos de Éxito Esperados**

### **Validación Inmediata (Tareas Actuales)**
- ✅ 4 tareas DONE validadas con ratings EXCELLENT
- ✅ Todos los business queries ejecutados correctamente
- ✅ SACRED_PRODUCTION compliance verificado
- ✅ Implementation evidence confirmado

### **Escalabilidad Futura (Nuevas Tareas)**
- ✅ TASK-010 Database Integration → Auto-detecta como "database_feature"  
- ✅ TASK-015 Security Enhancement → Auto-detecta como "security_feature"
- ✅ BUG-005 Performance Issue → Auto-detecta como "bug_fix"
- ✅ Todas validadas con mismo estándar de calidad

### **Continuous Integration**
- ✅ CI/CD pipeline ejecuta validación en cada PR
- ✅ Automatic gating si QA validation falla
- ✅ Stakeholder reports generados automáticamente
- ✅ Compliance trends tracked over time

---

**Con este sub-agent universal, tienes un sistema de QA que crece con tu proyecto, mantiene estándares consistentes, y proporciona validaciones precisas basadas en conocimiento completo de MCP methodology y Blok Framework.**