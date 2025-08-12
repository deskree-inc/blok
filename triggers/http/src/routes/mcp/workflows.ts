import { Hono } from "hono";
import type { Context as HonoContext } from "hono";
import { z } from "zod";

/**
 * Workflow Creation & Validation endpoints for AI agents
 * Enables AI agents to create valid Blok workflows with JSON validation
 */
export const workflowRoutes = new Hono();

// Workflow schema for validation
const WorkflowSchema = z.object({
	name: z.string(),
	version: z.string(),
	description: z.string(),
	trigger: z.object({
		http: z.object({
			method: z.string(),
			path: z.string(),
		}),
	}),
	steps: z.array(
		z.object({
			name: z.string(),
			node: z.string(),
			type: z.string(),
			inputs: z.record(z.any()).optional(),
		}),
	),
});

// POST /mcp/workflows/validate - Validate workflow JSON structure
workflowRoutes.post("/workflows/validate", async (c: HonoContext) => {
	try {
		const body = await c.req.json();

		// Validate against schema
		const validatedWorkflow = WorkflowSchema.parse(body);

		return c.json({
			valid: true,
			workflow: validatedWorkflow,
			message: "Workflow structure is valid",
		});
	} catch (error) {
		return c.json(
			{
				valid: false,
				error: error instanceof Error ? error.message : "Validation failed",
				suggestions: [
					"Ensure workflow has name, version, description fields",
					"Include trigger.http with method and path",
					"Add steps array with name, node, type for each step",
				],
			},
			400,
		);
	}
});
