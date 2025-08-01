/**
 * Automated tests for workflow visualization components
 * 
 * This script can be run with a testing framework like Jest or Cypress
 * to automate testing of the workflow visualization components.
 */

// Sample workflow data for testing
const testWorkflows = {
  simple: {
    "name": "Simple Workflow",
    "description": "A simple workflow with two nodes",
    "nodes": {
      "start": {
        "type": "@nanoservice-ts/api-call",
        "name": "API Call",
        "inputs": {
          "url": "https://example.com/api",
          "method": "GET"
        }
      },
      "end": {
        "type": "@nanoservice-ts/react",
        "name": "Display Results",
        "inputs": {
          "title": "API Results",
          "react_app": "./app/index.jsx"
        }
      }
    },
    "edges": [
      {
        "from": "start",
        "to": "end"
      }
    ]
  },
  complex: {
    "name": "Complex Workflow Example",
    "description": "A more complex workflow with multiple nodes and connections for visualization testing",
    "nodes": {
      "start": {
        "type": "@nanoservice-ts/api-call",
        "name": "Fetch Countries",
        "inputs": {
          "url": "https://countriesnow.space/api/v0.1/countries/capital",
          "method": "GET"
        }
      },
      "filter": {
        "type": "@nanoservice-ts/if-else",
        "name": "Filter Countries",
        "inputs": {
          "condition": "{{start.response.data.length > 10}}"
        }
      },
      "process_many": {
        "type": "@nanoservice-ts/react",
        "name": "Process Many Countries",
        "inputs": {
          "title": "Many Countries Found",
          "react_app": "./app/index.jsx"
        }
      },
      "process_few": {
        "type": "@nanoservice-ts/react",
        "name": "Process Few Countries",
        "inputs": {
          "title": "Few Countries Found",
          "react_app": "./app/index.jsx"
        }
      },
      "visualizer": {
        "type": "@nanoservice-ts/workflow-viz",
        "name": "Workflow Visualizer",
        "inputs": {
          "workflow_path": "./workflows/json/complex-workflow.json",
          "title": "Complex Workflow Visualization"
        }
      }
    },
    "edges": [
      {
        "from": "start",
        "to": "filter"
      },
      {
        "from": "filter",
        "to": "process_many",
        "condition": "true"
      },
      {
        "from": "filter",
        "to": "process_few",
        "condition": "false"
      }
    ]
  },
  error: {
    "name": "Error Test Workflow",
    "description": "A workflow with intentional errors for testing error handling",
    "nodes": {
      "start": {
        "type": "@nanoservice-ts/api-call",
        "name": "Invalid API Call",
        "inputs": {
          "url": "https://invalid-url-for-testing",
          "method": "GET"
        }
      },
      "end": {
        "type": "@nanoservice-ts/react",
        "name": "Display Results",
        "inputs": {
          "title": "API Results",
          "react_app": "./app/index.jsx"
        }
      }
    },
    "edges": [
      {
        "from": "start",
        "to": "nonexistent-node" // Intentional error: node doesn't exist
      }
    ]
  }
};

/**
 * Test function for workflow visualization
 * @param {Object} workflow - The workflow to visualize
 * @returns {Object} - Test results
 */
function testWorkflowVisualization(workflow) {
  console.log(`Testing visualization for workflow: ${workflow.name}`);
  
  // Validate workflow structure
  const validationResults = validateWorkflow(workflow);
  
  // Process workflow into nodes and edges
  const { nodes, edges, errors } = processWorkflow(workflow);
  
  return {
    workflow: workflow.name,
    valid: validationResults.valid,
    validationErrors: validationResults.errors,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    processingErrors: errors,
    success: validationResults.valid && errors.length === 0
  };
}

/**
 * Validate workflow structure
 * @param {Object} workflow - The workflow to validate
 * @returns {Object} - Validation results
 */
function validateWorkflow(workflow) {
  const errors = [];
  
  // Check required properties
  if (!workflow.name) errors.push('Workflow name is required');
  if (!workflow.nodes || Object.keys(workflow.nodes).length === 0) {
    errors.push('Workflow must have at least one node');
  }
  
  // Check edges reference valid nodes
  if (workflow.edges && workflow.edges.length > 0) {
    workflow.edges.forEach((edge, index) => {
      if (!edge.from) errors.push(`Edge ${index}: 'from' property is required`);
      if (!edge.to) errors.push(`Edge ${index}: 'to' property is required`);
      
      if (edge.from && !workflow.nodes[edge.from]) {
        errors.push(`Edge ${index}: Source node '${edge.from}' does not exist`);
      }
      
      if (edge.to && !workflow.nodes[edge.to]) {
        errors.push(`Edge ${index}: Target node '${edge.to}' does not exist`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Process workflow into nodes and edges for visualization
 * @param {Object} workflow - The workflow to process
 * @returns {Object} - Processed nodes and edges
 */
function processWorkflow(workflow) {
  const nodes = [];
  const edges = [];
  const errors = [];
  const nodePositions = {};
  
  try {
    // Calculate positions for nodes
    const nodeIds = Object.keys(workflow.nodes || {});
    const gridSize = Math.ceil(Math.sqrt(nodeIds.length));
    const spacing = 250;
    
    nodeIds.forEach((nodeId, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      nodePositions[nodeId] = {
        x: col * spacing + 50,
        y: row * spacing + 50
      };
    });
    
    // Create nodes
    if (workflow.nodes) {
      Object.entries(workflow.nodes).forEach(([nodeId, nodeData]) => {
        const position = nodePositions[nodeId] || { x: 0, y: 0 };
        nodes.push({
          id: nodeId,
          type: 'default',
          data: { 
            label: nodeData.name || nodeId,
            nodeType: nodeData.type || 'Unknown',
            details: nodeData
          },
          position
        });
      });
    }
    
    // Create edges
    if (workflow.edges) {
      workflow.edges.forEach((edge, index) => {
        // Skip edges with invalid nodes (already reported in validation)
        if (edge.from && edge.to && workflow.nodes[edge.from] && workflow.nodes[edge.to]) {
          edges.push({
            id: `e${index}`,
            source: edge.from,
            target: edge.to,
            label: edge.condition || ''
          });
        }
      });
    }
  } catch (error) {
    errors.push(`Error processing workflow: ${error.message}`);
  }
  
  return { nodes, edges, errors };
}

/**
 * Run tests on all test workflows
 */
function runAllTests() {
  console.log('Running workflow visualization tests...');
  
  const results = {};
  
  // Test each workflow
  for (const [key, workflow] of Object.entries(testWorkflows)) {
    results[key] = testWorkflowVisualization(workflow);
  }
  
  // Log results
  console.log('\nTest Results:');
  for (const [key, result] of Object.entries(results)) {
    console.log(`\n${key}: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Nodes: ${result.nodeCount}, Edges: ${result.edgeCount}`);
    
    if (!result.valid) {
      console.log('  Validation Errors:');
      result.validationErrors.forEach(err => console.log(`  - ${err}`));
    }
    
    if (result.processingErrors.length > 0) {
      console.log('  Processing Errors:');
      result.processingErrors.forEach(err => console.log(`  - ${err}`));
    }
  }
  
  return results;
}

// Export functions for use in testing frameworks
module.exports = {
  testWorkflows,
  testWorkflowVisualization,
  validateWorkflow,
  processWorkflow,
  runAllTests
};

// Run tests if script is executed directly
if (require.main === module) {
  runAllTests();
}