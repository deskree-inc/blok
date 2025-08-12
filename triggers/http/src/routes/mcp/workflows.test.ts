import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { mcpAdminMiddleware } from "../../middleware/mcp-admin";
import { workflowRoutes } from "./workflows";

describe("MCP Workflow Routes", () => {
	it("should validate and create a workflow with proper JSON structure", async () => {
		// RED: This test will fail because workflow routes don't exist yet
		const app = new Hono();

		// Enable MCP admin features
		process.env.ENABLE_MCP_ADMIN = "true";

		app.use("/mcp/*", mcpAdminMiddleware);
		app.route("/mcp", workflowRoutes);

		const workflowData = {
			name: "test-workflow",
			version: "1.0.0",
			description: "Test workflow for AI agent",
			trigger: {
				http: {
					method: "GET",
					path: "/",
				},
			},
			steps: [
				{
					name: "test-step",
					node: "api-call",
					type: "module",
					inputs: {
						url: "https://api.example.com/data",
					},
				},
			],
		};

		const req = new Request("http://localhost/mcp/workflows/validate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(workflowData),
		});

		const res = await app.fetch(req);

		expect(res.status).toBe(200);
		const json = await res.json();

		// Should return validation result
		expect(json).toHaveProperty("valid");
		expect(json).toHaveProperty("workflow");
		expect(json.valid).toBe(true);
		expect(json.workflow.name).toBe("test-workflow");

		// Cleanup
		process.env.ENABLE_MCP_ADMIN = undefined;
	});
});
