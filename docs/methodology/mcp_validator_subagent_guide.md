# Guía de Uso: MCP Validator Sub-Agent (Claude Code Oficial)
**Versión**: 2.0 - Sistema Oficial Claude Code  
**Fecha**: 2025-01-08  
**Sub-Agent**: `mcp-validator`

---

## **¿Qué es el MCP Validator Sub-Agent?**

Es un **sub-agent oficial de Claude Code** especializado en validación sistemática de implementaciones MCP methodology. Utiliza el sistema nativo de sub-agents de Claude Code con contexto separado y herramientas específicas.

### **Ubicación del Sub-Agent**
```
.claude/agents/mcp-validator.md
```

### **Características Técnicas**
- ✅ **Contexto Separado**: Opera en su propia ventana de contexto
- ✅ **Herramientas Específicas**: Read, Grep, Glob, TodoWrite únicamente
- ✅ **Sistema Prompts Personalizado**: Especializado en validación MCP
- ✅ **Configuración YAML**: Almacenado como Markdown con frontmatter

---

## **Cómo Usar el Sub-Agent: Métodos Oficiales**

### **Método 1: Delegación Automática (Recomendado)**
Claude Code detecta automáticamente cuando necesitas validación MCP:

```
Necesito validar la implementación MCP de mi proyecto. 
Tengo 4 tareas completadas en docs/tasks/DONE/ y quiero 
un reporte profesional de compliance.
```

**Claude automáticamente delegará al sub-agent mcp-validator.**

### **Método 2: Invocación Explícita**
```
Use the mcp-validator subagent to validate MCP methodology 
implementation for this project.
```

### **Método 3: Comando Slash (Si está disponible)**
```
/mcp-validator
```

---

## **Casos de Uso Específicos**

### **Caso 1: Validación Completa del Proyecto**
```
I need a comprehensive MCP methodology validation for my Blok Framework project. 
The mcp-validator subagent should analyze all DONE tasks and generate 
a professional compliance report.
```

**Resultado**: Reporte completo con análisis de todas las tareas DONE.

### **Caso 2: Validación de Task Específica**
```
Use the mcp-validator to specifically validate TASK-001 CLI Non-Interactive Mode 
for MCP compliance, focusing on SACRED_PRODUCTION adherence.
```

**Resultado**: Análisis detallado de una tarea individual.

### **Caso 3: Validación Arquitectural**
```
I need the mcp-validator to assess whether our SACRED_PRODUCTION classification 
system is properly implemented and the external extension pattern is being followed.
```

**Resultado**: Validación específica de arquitectura MCP.

### **Caso 4: Auditoria Trimestral**
```
Use the mcp-validator subagent to perform quarterly MCP compliance validation, 
comparing current state against the January 2025 baseline.
```

**Resultado**: Reporte de compliance continua.

---

## **Diferencias vs. Implementación Anterior**

### **✅ Sistema Oficial Claude Code**
| Aspecto | Anterior (Incorrecto) | Actual (Oficial) |
|---------|----------------------|------------------|
| **Almacenamiento** | docs/methodology/ | .claude/agents/ |
| **Formato** | Documentos MD simples | MD con YAML frontmatter |
| **Invocación** | Prompt manual largo | Delegación automática |
| **Contexto** | Misma ventana | Contexto separado |
| **Herramientas** | Todas disponibles | Restringidas específicamente |
| **Configuración** | Manual cada vez | Configuración persistente |

### **✅ Ventajas del Sistema Oficial**
- **Performance**: Contexto separado optimizado
- **Consistencia**: Mismo comportamiento siempre
- **Mantenimiento**: Versionado con el proyecto
- **Integración**: Parte del ecosistema Claude Code
- **Eficiencia**: Delegación automática inteligente

---

## **Estructura del Sub-Agent (Técnica)**

### **Configuración YAML (Frontmatter)**
```yaml
name: mcp-validator
description: "Expert MCP methodology validation specialist..."
tools: Read, Grep, Glob, TodoWrite
```

### **Capacidades Específicas**
1. **Análisis de Metodología MCP**: Lee documentos `docs/methodology/`
2. **Validación de Tareas**: Revisa `docs/tasks/DONE/` sistemáticamente
3. **Compliance Matrix**: Genera matriz de compliance detallada
4. **Reportes Profesionales**: Formato business-ready en español
5. **Recomendaciones Actionable**: Guidance específico para mejoras

### **Proceso de 5 Fases Automatizado**
El sub-agent ejecuta automáticamente:
1. **Context Understanding**: Lee documentos MCP
2. **Task Analysis**: Analiza tareas DONE
3. **Compliance Validation**: Valida contra estándares
4. **Architecture Review**: Verifica SACRED_PRODUCTION
5. **Report Generation**: Genera reporte profesional

---

## **Cómo Verificar que Funciona Correctamente**

### **Paso 1: Verificar Instalación**
```bash
ls .claude/agents/
# Debería mostrar: mcp-validator.md
```

### **Paso 2: Test de Delegación**
```
I need MCP validation for my project implementation.
```

**Respuesta esperada**: Claude debe mencionar que está usando el mcp-validator subagent.

### **Paso 3: Verificar Output Quality**
El reporte debe incluir estas secciones:
- ✅ Resumen Ejecutivo
- ✅ Validación de MCP Standard Compliance  
- ✅ Análisis Detallado de Tareas DONE
- ✅ Métricas de Éxito Alcanzadas
- ✅ Conclusiones y Recomendaciones

---

## **Troubleshooting**

### **Problema: Sub-agent no se activa automáticamente**
**Solución**: Usar invocación explícita:
```
Use the mcp-validator subagent to validate this MCP implementation.
```

### **Problema: No encuentra archivos del proyecto**
**Solución**: Verificar estructura de directorios:
```bash
ls docs/methodology/complete_plan.md  # Debe existir
ls docs/tasks/DONE/                   # Debe tener archivos
```

### **Problema: Reporte muy genérico**
**Solución**: Proveer contexto más específico:
```
Use mcp-validator to focus specifically on SACRED_PRODUCTION compliance 
validation for tasks TASK-001 and TASK-002, with concrete evidence analysis.
```

### **Problema: Sub-agent usa herramientas incorrectas**
**Verificar configuración**: El sub-agent debe tener tools limitadas a: `Read, Grep, Glob, TodoWrite`

---

## **Best Practices para Usar el Sub-Agent**

### **✅ Preparación Óptima**
1. **Documentación Completa**: Asegurar que `docs/methodology/` esté completo
2. **Tareas Documentadas**: Todas las tareas DONE deben tener documentación completa
3. **Evidencia Clara**: Incluir evidencia concreta de implementación
4. **Context Fresh**: Usar en sesión limpia para mejor performance

### **✅ Invocación Efectiva**
1. **Ser Específico**: Definir claramente qué aspectos validar
2. **Contexto Completo**: Proveer información relevante
3. **Expectativas Claras**: Especificar formato de reporte deseado
4. **Follow-up**: Hacer preguntas de clarification si necesario

### **✅ Maximizar Valor**
1. **Usar Regularmente**: Validación continua de calidad
2. **Actuar en Recommendations**: Implementar mejoras sugeridas
3. **Documentar Cambios**: Mantener record de validaciones
4. **Compartir Resultados**: Usar reportes para stakeholder communication

---

## **Integración en Workflow de Desarrollo**

### **Workflow Recomendado con Sub-Agent**
```
1. Completar tarea MCP → 
2. Documentar en docs/tasks/DONE/ → 
3. "I need MCP validation for the completed task" → 
4. Sub-agent genera reporte automáticamente → 
5. Review y address gaps → 
6. Re-validar si necesario → 
7. Proceder a siguiente tarea
```

### **Cadencia de Validación**
- **Per Task**: Cada tarea individual
- **Per Milestone**: Cada 3-4 tareas completadas  
- **Quarterly**: Validación general del proyecto
- **Pre-Release**: Antes de releases importantes

---

## **Ventajas del Sub-Agent Oficial**

### **Para el Proyecto**
- ✅ **Consistency**: Mismo nivel de análisis siempre
- ✅ **Efficiency**: Proceso automatizado y optimizado
- ✅ **Quality**: Standards profesionales mantenidos
- ✅ **Integration**: Parte del ecosistema de desarrollo

### **Para el Equipo**
- ✅ **Learning**: Mejora continua en MCP methodology
- ✅ **Confidence**: Validation objective y sistemática
- ✅ **Communication**: Reportes listos para business
- ✅ **Standards**: Clear expectations documentadas

### **Para Stakeholders**
- ✅ **Transparency**: Reportes profesionales regulares
- ✅ **Assurance**: Compliance verificada sistemáticamente
- ✅ **Progress**: Métricas claras de advancement
- ✅ **Quality**: Standards enterprise mantenidos

---

## **Comparación: Antes vs. Ahora**

### **Antes (Implementación Incorrecta)**
- Manual prompt largo cada vez
- Documentos separados difíciles de mantener
- Inconsistencia entre validaciones
- Contexto compartido afectaba performance

### **Ahora (Sub-Agent Oficial)**
- Delegación automática inteligente
- Configuración persistente y versionada
- Consistencia garantizada en todas las validaciones
- Contexto optimizado específicamente para validación MCP

---

**Con este sub-agent oficial, tienes un validador MCP experto integrado nativamente en Claude Code, que proporciona validation sistemática y profesional con la máxima eficiencia y consistencia.**