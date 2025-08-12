import { Hono } from "hono";
import type { Context as HonoContext } from "hono";

/**
 * Node Discovery & Management system for AI agents
 * Enables AI agents to discover existing nodes and understand their usage
 */
export const nodeRoutes = new Hono();

// Mock node data - will be replaced with actual node discovery later
const mockNodes = [
	{
		name: "api-call",
		category: "web",
		description: "Make HTTP requests to external APIs",
		runtime: "module",
		inputs: ["url", "method", "headers", "body"],
		outputs: ["response", "statusCode", "headers"],
		examples: [
			{
				name: "GET request",
				inputs: { url: "https://api.example.com/data", method: "GET" },
				description: "Fetch data from external API",
			},
		],
	},
	{
		name: "if-else",
		category: "control-flow",
		description: "Conditional branching logic",
		runtime: "module",
		inputs: ["condition", "trueValue", "falseValue"],
		outputs: ["result"],
		examples: [
			{
				name: "Simple condition",
				inputs: { condition: "{{context.age}} > 18", trueValue: "adult", falseValue: "minor" },
				description: "Age-based conditional logic",
			},
		],
	},
];

// GET /mcp/nodes - List all available nodes
nodeRoutes.get("/nodes", (c: HonoContext) => {
	const categories = [...new Set(mockNodes.map((node) => node.category))];

	return c.json({
		nodes: mockNodes,
		categories,
		totalNodes: mockNodes.length,
		lastUpdated: new Date().toISOString(),
	});
});

// GET /mcp/nodes/:name - Get detailed information about a specific node
nodeRoutes.get("/nodes/:name", (c: HonoContext) => {
	const nodeName = c.req.param("name");
	const node = mockNodes.find((n) => n.name === nodeName);

	if (!node) {
		return c.json(
			{
				error: "Node not found",
				availableNodes: mockNodes.map((n) => n.name),
			},
			404,
		);
	}

	return c.json({
		node,
		inputs: node.inputs.map((input) => ({
			name: input,
			required: true,
			type: "string",
			description: `${input} parameter for ${node.name} node`,
		})),
		outputs: node.outputs.map((output) => ({
			name: output,
			type: "any",
			description: `${output} result from ${node.name} node`,
		})),
		examples: node.examples,
		usage: `Use this node by setting "node": "${node.name}" in workflow step`,
	});
});

// POST /mcp/nodes/search - Search for nodes based on functionality
nodeRoutes.post("/nodes/search", async (c: HonoContext) => {
	try {
		const body = await c.req.json();
		const query = body.query || "";
		const category = body.category;

		let filteredNodes = mockNodes;

		// Filter by category if specified
		if (category) {
			filteredNodes = filteredNodes.filter((node) => node.category === category);
		}

		// Simple text search in name and description
		if (query) {
			filteredNodes = filteredNodes.filter(
				(node) =>
					node.name.toLowerCase().includes(query.toLowerCase()) ||
					node.description.toLowerCase().includes(query.toLowerCase()),
			);
		}

		return c.json({
			query,
			results: filteredNodes,
			totalResults: filteredNodes.length,
			searchTime: "1ms",
		});
	} catch (error) {
		return c.json(
			{
				error: "Search failed",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			400,
		);
	}
});
