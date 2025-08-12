import { Hono } from "hono";
import type { Context as HonoContext } from "hono";

/**
 * Documentation Search & Learning system for AI agents
 * Provides intelligent search through blok.md and framework documentation
 */
export const docsRoutes = new Hono();

// POST /mcp/docs/search - Search blok.md documentation with full-text search
docsRoutes.post("/docs/search", async (c: HonoContext) => {
	try {
		const body = await c.req.json();
		const query = body.query || "";
		const maxResults = body.maxResults || 10;

		// Mock search results for now - will implement actual search later
		const mockResults = [
			{
				section: "Workflow Structure",
				content: "Workflows are JSON-based business logic orchestration patterns",
				relevance: 0.95,
				context: "Framework fundamentals",
			},
			{
				section: "Node Types",
				content: "Nodes are reusable processing units in TypeScript or Python",
				relevance: 0.85,
				context: "Component architecture",
			},
		];

		return c.json({
			query,
			results: mockResults.slice(0, maxResults),
			totalResults: mockResults.length,
			searchTime: "2ms",
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

// GET /mcp/docs/blok - Get blok.md framework overview
docsRoutes.get("/docs/blok", (c: HonoContext) => {
	return c.json({
		framework: {
			name: "Blok",
			version: "1.0.0",
			description: "Workflow-based backend development platform",
			documentation: "blok.md contains comprehensive AI programming guide",
		},
		sections: [
			"Getting Started - Project setup and basic concepts",
			"Workflow Development - JSON structure and orchestration",
			"Node Development - TypeScript and Python node creation",
			"Context Management - Data flow between workflow steps",
			"Deployment - Production deployment patterns",
		],
		usage: "Use /mcp/docs/search with specific queries to find detailed information",
		lastUpdated: new Date().toISOString(),
	});
});
