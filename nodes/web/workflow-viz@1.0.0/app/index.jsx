// Workflow Visualization Component
const { useState, useEffect } = React;
const { ReactFlow, Background, Controls, MiniMap } = ReactFlowRenderer;

function WorkflowVisualization() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const ctx = JSON.parse(atob(ctx_base64));

  useEffect(() => {
    if (ctx.workflow && Object.keys(ctx.workflow).length > 0) {
      setWorkflow(ctx.workflow);
      const { nodes: workflowNodes, edges: workflowEdges } = processWorkflow(ctx.workflow);
      setNodes(workflowNodes);
      setEdges(workflowEdges);
    }
  }, []);

  // Process workflow JSON into nodes and edges for ReactFlow
  const processWorkflow = (workflow) => {
    const nodes = [];
    const edges = [];
    const nodePositions = {};
    
    // Calculate positions for nodes in a grid layout
    const calculatePositions = () => {
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
    };
    
    calculatePositions();
    
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
          position,
          style: {
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '10px',
            width: 180,
          }
        });
      });
    }
    
    // Create edges
    if (workflow.edges) {
      workflow.edges.forEach((edge, index) => {
        edges.push({
          id: `e${index}`,
          source: edge.from,
          target: edge.to,
          animated: true,
          style: { stroke: '#3b82f6' },
          label: edge.label || ''
        });
      });
    }
    
    return { nodes, edges };
  };

  const nodeTypes = {};

  return (
    <div className="w-full h-full">
      {workflow ? (
        <div className="flex flex-col h-full">
          <div className="bg-blue-600 text-white p-4">
            <h1 className="text-2xl font-bold">{workflow.name || 'Workflow Visualization'}</h1>
            <p className="text-sm opacity-80">{workflow.description || 'A visual representation of the workflow'}</p>
          </div>
          
          <div className="flex-grow">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
            >
              <Background color="#aaa" gap={16} />
              <Controls />
              <MiniMap
                nodeStrokeColor={(n) => {
                  return '#fff';
                }}
                nodeColor={(n) => {
                  return '#3b82f6';
                }}
              />
            </ReactFlow>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Workflow Data</h2>
            <p className="text-gray-600">
              Please provide a valid workflow JSON file path to visualize.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<WorkflowVisualization />, document.getElementById(root_element));