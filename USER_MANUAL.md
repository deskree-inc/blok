# Blok Framework - User Manual & QA Testing Procedures
## Comprehensive Testing, Validation, and Operational Guidelines

**Framework**: Blok - Workflow-based Backend Development Platform  
**Manual Version**: 1.0.0  
**Last Updated**: 2024-01-XX  
**Compliance**: MCP Business Standard

---

## 📋 **MANUAL OVERVIEW**

This user manual provides comprehensive testing procedures, quality assurance guidelines, and operational instructions for the Blok Framework. It serves as the definitive guide for validating framework functionality, ensuring production readiness, and maintaining system quality.

### **Document Purpose**
- **QA Testing**: Step-by-step validation procedures for all framework components
- **Production Verification**: Pre-deployment checklists and validation requirements
- **Troubleshooting**: Common issues and resolution procedures
- **Operational Guidelines**: Best practices for framework usage and maintenance

### **Target Audience**
- **QA Engineers**: Testing and validation procedures
- **DevOps Teams**: Deployment and operational guidelines
- **Developers**: Integration testing and debugging procedures
- **System Administrators**: Monitoring and maintenance procedures

---

## 🧪 **TESTING PROCEDURES**

### **1. UNIT TESTING PROCEDURES**

#### **1.1 Node Unit Testing**
**Objective**: Validate individual node functionality in isolation

**Prerequisites**:
- Node.js 18+ installed
- Project created with `npx blokctl@latest create project`
- Vitest testing framework available

**Test Execution**:
```bash
# Install dependencies
npm install

# Run all unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific node tests
npm run test -- --grep "node-name"

# Watch mode for development
npm run test:watch
```

**Validation Criteria**:
- ✅ All unit tests pass (100% pass rate required)
- ✅ Code coverage meets project standards
- ✅ No memory leaks detected during test execution
- ✅ Test execution time under 30 seconds for full suite

**Example Unit Test Validation**:
```typescript
// Test file: nodes/email-validator@1.0.0/test/index.test.ts
import { describe, it, expect } from 'vitest';
import EmailValidator from '../index';

describe('EmailValidator Node', () => {
  const validator = new EmailValidator();

  it('should validate correct email format', async () => {
    const result = await validator.execute({
      email: 'user@example.com'
    }, mockContext);
    
    expect(result.valid).toBe(true);
    expect(result.email).toBe('user@example.com');
  });

  it('should reject invalid email format', async () => {
    const result = await validator.execute({
      email: 'invalid-email'
    }, mockContext);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

#### **1.2 Context System Testing**
**Objective**: Validate context interpolation and JavaScript evaluation

**Test Cases**:
```bash
# String interpolation testing
curl -X POST http://localhost:4000/test-context \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "id": "123",
      "email": "test@example.com"
    }
  }'

# Expected workflow: ${ctx.request.body.user.email} → "test@example.com"
```

**JavaScript Evaluation Testing**:
```json
{
  "name": "js-evaluation-test",
  "steps": [
    {
      "name": "condition-check",
      "node": "@blok-ts/if-else",
      "type": "module"
    }
  ],
  "nodes": {
    "condition-check": {
      "inputs": {
        "condition": "js/ctx.request.body.user.id === '123'",
        "then": { "status": "authorized" },
        "else": { "status": "unauthorized" }
      }
    }
  }
}
```

**Validation Requirements**:
- ✅ String interpolation resolves correctly
- ✅ JavaScript evaluation executes safely
- ✅ Error handling works for invalid expressions
- ✅ Context variables accessible across steps

---

### **2. INTEGRATION TESTING PROCEDURES**

#### **2.1 Workflow Integration Testing**
**Objective**: Validate end-to-end workflow execution

**Test Setup**:
```bash
# Start development server
npm run dev

# Verify server is running
curl http://localhost:4000/health-check
# Expected: {"status": "ok", "timestamp": "..."}
```

**Multi-Step Workflow Test**:
```bash
# Test complete user registration workflow
curl -X POST http://localhost:4000/user-registration \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepassword",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }'

# Expected Response Structure:
# {
#   "success": true,
#   "userId": "uuid-generated",
#   "email": "newuser@example.com",
#   "profile": { ... },
#   "timestamp": "2024-01-01T00:00:00Z"
# }
```

**Validation Checklist**:
- ✅ HTTP response status 200 for successful workflows
- ✅ Response body matches expected schema
- ✅ All workflow steps execute in correct sequence
- ✅ Context data flows correctly between steps
- ✅ Error responses include proper error details (4xx/5xx status codes)

#### **2.2 Node Type Integration Testing**

**Module Node Testing**:
```bash
# Test NPM package node (@blok-ts/api-call)
curl -X POST http://localhost:4000/test-api-call \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "https://httpbin.org/post",
    "data": {"test": "value"}
  }'
```

**Local Node Testing**:
```bash
# Test local node discovery and execution
curl -X POST http://localhost:4000/test-local-node \
  -H "Content-Type: application/json" \
  -d '{
    "input": "test-data"
  }'
```

**Python Runtime Testing**:
```bash
# Test Python node via gRPC
curl -X POST http://localhost:4000/test-python-node \
  -H "Content-Type: application/json" \
  -d '{
    "data": [1, 2, 3, 4, 5],
    "operation": "calculate_mean"
  }'
```

**Cross-Runtime Integration Test**:
```json
{
  "name": "cross-runtime-test",
  "steps": [
    {
      "name": "ts-preprocessing",
      "node": "data-preprocessor",
      "type": "local"
    },
    {
      "name": "python-analysis",
      "node": "statistical_analyzer",
      "type": "runtime.python3"
    },
    {
      "name": "ts-postprocessing",
      "node": "result-formatter",
      "type": "local"
    }
  ]
}
```

---

### **3. REMOTE NODE EXECUTION TESTING**

#### **3.1 HTTP Remote Node Protocol Testing**
**Objective**: Validate remote node execution functionality

**Base64 Payload Preparation**:
```javascript
// Prepare test payload
const payload = {
  request: {},
  workflow: {
    name: "Remote Node Test",
    description: "Test remote node execution",
    version: "1.0.0",
    trigger: {
      http: {
        method: "POST",
        path: "*",
        accept: "application/json"
      }
    },
    steps: [
      {
        name: "node",
        node: "email-validator",
        type: "local"
      }
    ],
    nodes: {
      node: {
        inputs: {
          email: "test@example.com"
        }
      }
    }
  }
};

const base64Payload = btoa(JSON.stringify(payload));
```

**Remote Execution Test**:
```bash
curl -X POST http://localhost:4000/email-validator \
  -H "x-nanoservice-execute-node: true" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "email-validator",
    "Message": "eyJyZXF1ZXN0Ijp7fSwid29ya2Zsb3ciOnsibmFtZSI6IlJlbW90ZSBOb2RlIFRlc3QiLCJkZXNjcmlwdGlvbiI6IlRlc3QgcmVtb3RlIG5vZGUgZXhlY3V0aW9uIiwidmVyc2lvbiI6IjEuMC4wIiwidHJpZ2dlciI6eyJodHRwIjp7Im1ldGhvZCI6IlBPU1QiLCJwYXRoIjoiKiIsImFjY2VwdCI6ImFwcGxpY2F0aW9uL2pzb24ifX0sInN0ZXBzIjpbeyJuYW1lIjoibm9kZSIsIm5vZGUiOiJlbWFpbC12YWxpZGF0b3IiLCJ0eXBlIjoibG9jYWwifV0sIm5vZGVzIjp7Im5vZGUiOnsiaW5wdXRzIjp7ImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9fX19fQ==",
    "Encoding": "BASE64",
    "Type": "JSON"
  }'
```

**Validation Requirements**:
- ✅ Special header `x-nanoservice-execute-node: true` processed correctly
- ✅ Base64 payload decoded and parsed successfully
- ✅ Node executed in isolation with provided inputs
- ✅ Response format matches standard workflow response
- ✅ Error handling for invalid payloads

#### **3.2 Blok SDK Integration Testing**
**Objective**: Validate JavaScript SDK functionality

**SDK Test Script**:
```javascript
// test-sdk.js
const BlokSDK = require('@blok-ts/sdk');

async function testSDK() {
  const client = new BlokSDK().createHttpClient('http://localhost:4000');
  
  try {
    // Test TypeScript node
    const tsResult = await client.nodejs('email-validator', {
      email: 'sdk-test@example.com'
    }, 'local');
    
    console.log('TypeScript Node Result:', tsResult);
    
    // Test Python node
    const pyResult = await client.python3('statistical_analyzer', {
      data: [1, 2, 3, 4, 5],
      operation: 'mean'
    });
    
    console.log('Python Node Result:', pyResult);
    
  } catch (error) {
    console.error('SDK Test Failed:', error);
  }
}

testSDK();
```

**Execution and Validation**:
```bash
node test-sdk.js

# Expected Output:
# TypeScript Node Result: { success: true, data: { valid: true, email: "sdk-test@example.com" } }
# Python Node Result: { success: true, data: { result: 3.0, operation: "mean" } }
```

---

### **4. PERFORMANCE TESTING PROCEDURES**

#### **4.1 Load Testing**
**Objective**: Validate framework performance under load

**Load Test Setup**:
```bash
# Install load testing tool
npm install -g autocannon

# Basic load test
autocannon -c 10 -d 30 http://localhost:4000/simple-workflow

# Heavy load test
autocannon -c 50 -d 60 http://localhost:4000/complex-workflow

# Multi-endpoint test
autocannon -c 20 -d 45 http://localhost:4000/user-registration
```

**Performance Benchmarks**:
- ✅ Simple workflows: >1000 req/sec with <100ms avg response time
- ✅ Complex workflows: >500 req/sec with <200ms avg response time
- ✅ Memory usage stable under load (no memory leaks)
- ✅ CPU usage remains under 80% during peak load

#### **4.2 Metrics Validation**
**Objective**: Verify observability metrics accuracy

**Metrics Collection Test**:
```bash
# Generate test traffic
for i in {1..100}; do
  curl -s http://localhost:4000/test-workflow > /dev/null
done

# Collect metrics
curl http://localhost:9091/metrics > metrics-output.txt

# Validate key metrics presence
grep "http_requests_total" metrics-output.txt
grep "workflow_execution_duration" metrics-output.txt
grep "node_execution_count" metrics-output.txt
grep "memory_usage_bytes" metrics-output.txt
```

**Metrics Validation Checklist**:
- ✅ HTTP request counters increment correctly
- ✅ Response time histograms show realistic values
- ✅ Error counters track failed requests accurately
- ✅ Memory and CPU metrics update in real-time
- ✅ Workflow-specific metrics captured per endpoint

---

### **5. ERROR HANDLING & RESILIENCE TESTING**

#### **5.1 Error Condition Testing**
**Objective**: Validate error handling and recovery mechanisms

**Invalid Workflow Tests**:
```bash
# Test malformed JSON workflow
curl -X POST http://localhost:4000/invalid-workflow \
  -H "Content-Type: application/json" \
  -d '{invalid json}'

# Expected: 400 Bad Request with error details

# Test non-existent node
curl -X POST http://localhost:4000/test-missing-node \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Expected: 500 Internal Server Error with node not found message
```

**Network Failure Simulation**:
```bash
# Test external API failure (using @blok-ts/api-call)
curl -X POST http://localhost:4000/test-external-failure \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "http://non-existent-server.com/api",
    "data": {"test": "value"}
  }'

# Expected: Graceful error handling with timeout/connection error
```

#### **5.2 Resource Exhaustion Testing**
**Objective**: Validate behavior under resource constraints

**Memory Stress Test**:
```bash
# Test large payload handling
curl -X POST http://localhost:4000/large-data-processor \
  -H "Content-Type: application/json" \
  -d '{
    "data": "'$(head -c 10000000 /dev/zero | base64)'"
  }'

# Monitor memory usage during test
ps aux | grep node
```

**Concurrent Request Test**:
```bash
# Test concurrent request handling
for i in {1..50}; do
  curl -X POST http://localhost:4000/concurrent-test \
    -H "Content-Type: application/json" \
    -d '{"id": "'$i'"}' &
done
wait
```

---

## 🔍 **VALIDATION CHECKLISTS**

### **Pre-Deployment Validation Checklist**

#### **Core Functionality**
- [ ] All unit tests pass (100% pass rate)
- [ ] Integration tests pass for all workflow types
- [ ] Remote node execution works correctly
- [ ] Cross-runtime communication (TypeScript ↔ Python) functional
- [ ] Context interpolation and JavaScript evaluation working
- [ ] Error handling graceful for all error conditions

#### **Performance Requirements**
- [ ] Load testing meets performance benchmarks
- [ ] Memory usage stable under sustained load
- [ ] Response times within acceptable ranges
- [ ] Metrics collection accurate and complete
- [ ] No memory leaks detected during extended testing

#### **Security Validation**
- [ ] Input validation prevents injection attacks
- [ ] JavaScript evaluation sandbox properly isolated
- [ ] Error messages don't expose sensitive information
- [ ] HTTP headers properly configured (security headers)
- [ ] CORS configuration appropriate for deployment environment

#### **Observability Validation**
- [ ] Health check endpoint responsive (`/health-check`)
- [ ] Metrics endpoint accessible (`/metrics`)
- [ ] OpenTelemetry tracing captures workflow execution
- [ ] Structured logging includes proper context
- [ ] Prometheus metrics scraped successfully

#### **Production Readiness**
- [ ] Environment variables properly configured
- [ ] Container images build successfully
- [ ] Database connections (if used) working
- [ ] External API integrations functional
- [ ] Backup and recovery procedures tested

---

## 🚨 **TROUBLESHOOTING PROCEDURES**

### **Common Issues and Resolution**

#### **Issue: Workflow Not Found (404 Error)**
**Symptoms**: HTTP 404 when calling workflow endpoint

**Diagnosis**:
```bash
# Check workflow file exists
ls workflows/
ls workflows/json/

# Verify workflow syntax
npx blokctl@latest validate workflow workflow-name.json

# Check server logs
npm run dev  # Look for workflow loading errors
```

**Resolution**:
1. Verify workflow file exists in correct directory
2. Check JSON/YAML syntax is valid
3. Ensure trigger configuration matches request path/method
4. Restart server to reload workflows

#### **Issue: Node Not Found Error**
**Symptoms**: "Node 'node-name' not found" error during workflow execution

**Diagnosis**:
```bash
# For module nodes - check Nodes.ts registration
cat triggers/http/src/Nodes.ts

# For local nodes - check NODES_PATH
echo $NODES_PATH
ls $NODES_PATH/

# For Python nodes - check runtime connectivity
curl http://localhost:50052/health  # If gRPC health check available
```

**Resolution**:
1. **Module nodes**: Add to `Nodes.ts` and reinstall dependencies
2. **Local nodes**: Verify node exists in `NODES_PATH` directory
3. **Python nodes**: Ensure Python runtime is running and accessible
4. Check node name spelling and version (e.g., `node@1.0.0`)

#### **Issue: Context Variable Not Resolved**
**Symptoms**: `${ctx.variable}` appears as literal string in output

**Diagnosis**:
```bash
# Test context with simple workflow
curl -X POST http://localhost:4000/debug-context \
  -H "Content-Type: application/json" \
  -d '{"testValue": "hello world"}'

# Check workflow syntax for context usage
cat workflows/problematic-workflow.json
```

**Resolution**:
1. Verify context variable path is correct (e.g., `ctx.request.body.testValue`)
2. Ensure variable exists in request data
3. Use `js/` prefix for complex expressions
4. Check for typos in variable names

#### **Issue: High Memory Usage / Memory Leaks**
**Symptoms**: Memory usage continuously increases during operation

**Diagnosis**:
```bash
# Monitor memory usage
top -p $(pgrep -f "node.*blok")

# Generate heap snapshots (if debugging tools available)
kill -USR2 $(pgrep -f "node.*blok")

# Check for large payloads or circular references
```

**Resolution**:
1. Review workflows for large data processing
2. Implement data streaming for large payloads
3. Check for circular references in context data
4. Monitor and limit payload sizes
5. Restart service if memory leak confirmed

#### **Issue: Python Node Execution Fails**
**Symptoms**: gRPC errors or Python runtime connection failures

**Diagnosis**:
```bash
# Check Python runtime status
ps aux | grep python

# Test gRPC connectivity
telnet localhost 50052

# Check Python dependencies
cd runtimes/python3/
pip list

# View Python runtime logs
python -m grpc_tools.protoc --version
```

**Resolution**:
1. Ensure Python runtime is running on correct port
2. Verify gRPC dependencies installed (`grpcio`, `protobuf`)
3. Check Python node syntax and dependencies
4. Restart Python runtime if connection issues persist
5. Verify network connectivity between services

---

## 📊 **MONITORING & MAINTENANCE**

### **Health Monitoring Procedures**

#### **Automated Health Checks**
```bash
#!/bin/bash
# health-check.sh - Automated monitoring script

# HTTP health check
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health-check)
if [ $HTTP_STATUS -ne 200 ]; then
  echo "ERROR: HTTP health check failed with status $HTTP_STATUS"
  exit 1
fi

# Metrics endpoint check
METRICS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9091/metrics)
if [ $METRICS_STATUS -ne 200 ]; then
  echo "ERROR: Metrics endpoint failed with status $METRICS_STATUS"
  exit 1
fi

# Memory usage check (threshold: 1GB)
MEMORY_MB=$(ps -o rss= -p $(pgrep -f "node.*blok") | awk '{sum+=$1} END {print sum/1024}')
if [ ${MEMORY_MB%.*} -gt 1024 ]; then
  echo "WARNING: High memory usage: ${MEMORY_MB}MB"
fi

echo "Health check passed - System operational"
```

#### **Log Analysis Procedures**
```bash
# Monitor error patterns
tail -f logs/application.log | grep ERROR

# Analyze performance metrics
grep "workflow_execution_duration" logs/metrics.log | \
  awk '{print $3}' | \
  sort -n | \
  tail -10  # Top 10 slowest executions

# Monitor context errors
grep "Context interpolation error" logs/application.log
```

#### **Capacity Planning**
**Memory Usage Tracking**:
```bash
# Track memory trends over time
echo "$(date): $(ps -o rss= -p $(pgrep -f "node.*blok") | awk '{sum+=$1} END {print sum/1024"MB"}')" >> memory-usage.log
```

**Request Rate Monitoring**:
```bash
# Extract request rates from metrics
curl -s http://localhost:9091/metrics | \
  grep "http_requests_total" | \
  awk -F'"' '{print $4, $0}' | \
  sort
```

---

## 📋 **STANDARD OPERATING PROCEDURES**

## 🖥️ **BLOKCTL MONITOR - COMPREHENSIVE GUIDE**

### **Command Overview**
`blokctl monitor` provides real-time monitoring of Blok workflows with both terminal and web interfaces.

### **Basic Usage**
```bash
# Terminal dashboard (default)
blokctl monitor

# Web dashboard (opens browser)
blokctl monitor --web

# Remote Prometheus server
blokctl monitor --host http://prometheus-server:9090

# With authentication token
blokctl monitor --host http://remote-server:9090 --token your-prometheus-token
```

### **Terminal Dashboard Features**

#### **Real-time Metrics Display**
- **Workflow Requests**: Total requests per workflow (last minute)
- **Execution Time**: Average execution time in milliseconds
- **Memory Usage**: Memory consumption per workflow in MB
- **CPU Usage**: CPU percentage per workflow
- **Error Count**: Failed executions and error rates

#### **Interactive Controls**
```bash
# Keyboard shortcuts in terminal mode:
w - Sort by execution time (workflow time)
m - Sort by memory usage  
c - Sort by CPU usage
e - Sort by error count
r - Sort by request count
q - Quit monitoring
```

#### **Auto-refresh**
- Updates every 3 seconds automatically
- Shows timestamp of last update
- Real-time data from Prometheus metrics

### **Web Dashboard Features**

#### **Browser Interface**
```bash
blokctl monitor --web
# Opens http://localhost:3000 with web dashboard
```

#### **Advanced Filtering**
- Filter by specific workflows
- Time range selection
- Metric aggregation options
- Export capabilities

### **Prometheus Queries Used**
The monitor command uses these Prometheus queries:
```promql
# Workflow requests
sum(increase(workflow_total[1m])) by (workflow_path)

# Execution time  
sum(increase(workflow_time[1m])) by (workflow_path)

# Error rates
sum(increase(workflow_errors_total[1m])) by (workflow_path)

# CPU usage
sum(increase(workflow_cpu[1m])) by (workflow_path)

# Memory usage
sum(increase(workflow_memory[1m])) by (workflow_path)
```

### **Production Monitoring Setup**

#### **Remote Prometheus Configuration**
```bash
# Monitor production Prometheus server
blokctl monitor \
  --host http://prod-prometheus.company.com:9090 \
  --token $PROMETHEUS_API_TOKEN
```

#### **Environment Variables**
```bash
export PROMETHEUS_HOST=http://prometheus:9090
export PROMETHEUS_TOKEN=your-api-token
blokctl monitor --web
```

### **Troubleshooting Monitor Command**

#### **Common Issues**

**Issue: "No metrics found"**
```bash
# Verify Prometheus is running
curl http://localhost:9090/api/v1/query?query=up

# Check Blok metrics endpoint
curl http://localhost:9091/metrics | grep workflow_

# Ensure workflows have been executed
curl -X POST http://localhost:4000/test-workflow -d '{}'
```

**Issue: "Connection refused"**
```bash
# Check if Blok HTTP trigger is running
curl http://localhost:4000/health-check

# Verify metrics port is accessible
netstat -tuln | grep 9091

# Check Prometheus connectivity
curl http://localhost:9090/-/healthy
```

**Issue: "Web dashboard not loading"**
```bash
# Check if port 3000 is available
lsof -i :3000

# Try different port
blokctl monitor --web --port 3001

# Check browser console for errors
# Open Developer Tools in browser
```

### **Daily Operations Checklist**
- [ ] Run `blokctl monitor` to check system health
- [ ] Verify all workflows showing in dashboard
- [ ] Check error rates are within acceptable limits (<5%)
- [ ] Monitor memory usage trends (no continuous growth)
- [ ] Verify response times meet SLA requirements

### **Weekly Maintenance Tasks**
- [ ] Review and rotate log files
- [ ] Update NPM dependencies (test in development first)
- [ ] Check for new versions of global nodes (@blok-ts/*)
- [ ] Analyze performance trends and capacity requirements
- [ ] Test backup and recovery procedures

### **Monthly Review Tasks**
- [ ] Comprehensive security review and updates
- [ ] Performance baseline recalibration
- [ ] Documentation updates and review
- [ ] Community node updates and testing
- [ ] Disaster recovery procedure validation

---

**This user manual ensures comprehensive testing coverage and operational excellence for the Blok Framework. All procedures should be executed in the specified order for complete validation of system functionality and performance.** 