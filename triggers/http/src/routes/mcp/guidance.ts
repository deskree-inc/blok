import { Hono } from "hono";
import type { Context as HonoContext } from "hono";

/**
 * AI Agent Guidance System - Provides step-by-step onboarding for AI agents
 * Enables AI agents to learn Blok framework from zero knowledge
 */
export const guidanceRoutes = new Hono();

// GET /mcp/guidance/start - Framework overview and learning path
guidanceRoutes.get("/guidance/start", (c: HonoContext) => {
	return c.json({
		framework: {
			name: "Blok",
			description: "Workflow-based backend development platform",
			version: "1.0.0",
			concepts: [
				"Workflows - JSON-based business logic orchestration",
				"Nodes - Reusable processing units in TypeScript/Python",
				"Context - Data flow between workflow steps",
				"Triggers - HTTP/gRPC/MCP entry points",
			],
		},
		learningPath: [
			"1. Understanding Workflows - JSON structure and step orchestration",
			"2. Node Discovery - Finding existing nodes vs creating new ones",
			"3. Context Patterns - Data interpolation and variable access",
			"4. Workflow Creation - Building complete business processes",
			"5. Node Development - Creating custom processing logic",
		],
		nextSteps: [
			"Call /mcp/docs/search to learn about workflow structure",
			"Call /mcp/guidance/workflows to discover workflow patterns",
			"Call /mcp/guidance/nodes to understand node usage",
		],
	});
});
