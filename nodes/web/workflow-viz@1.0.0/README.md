# Workflow Visualization Node

This node provides a visual representation of Blok workflows using React and React Flow.

## Features

- Visualizes workflow nodes and connections
- Interactive graph with pan and zoom capabilities
- Minimap for navigation
- Automatic layout of workflow nodes

## Usage

To use this node in your workflow:

```json
{
  "nodes": {
    "visualizer": {
      "type": "@nanoservice-ts/workflow-viz",
      "name": "Workflow Visualizer",
      "inputs": {
        "workflow_path": "./workflows/json/your-workflow.json",
        "title": "My Workflow Visualization"
      }
    }
  }
}
```

## Input Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| workflow_path | string | Path to the workflow JSON file to visualize | No |
| title | string | Title of the visualization page | No |
| scripts | string | Additional scripts to include in the HTML | No |
| metas | string | Additional meta tags to include in the HTML | No |
| index_html | string | Path to the HTML template file | No |
| styles | string | Additional styles to include in the HTML | No |
| root_element | string | ID of the root element to render the React app into | No |

## Example

Create a workflow that visualizes itself:

```json
{
  "name": "Self-Visualizing Workflow",
  "description": "A workflow that visualizes itself",
  "nodes": {
    "visualizer": {
      "type": "@nanoservice-ts/workflow-viz",
      "name": "Workflow Visualizer",
      "inputs": {
        "workflow_path": "./workflows/json/self-visualizing.json",
        "title": "Self-Visualizing Workflow"
      }
    }
  },
  "edges": [],
  "triggers": [
    {
      "type": "http",
      "path": "/visualize",
      "method": "GET",
      "node": "visualizer"
    }
  ]
}
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build
```