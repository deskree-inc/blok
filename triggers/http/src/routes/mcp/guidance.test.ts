import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { mcpAdminMiddleware } from "../../middleware/mcp-admin";
import { guidanceRoutes } from "./guidance";

describe("MCP Guidance Routes", () => {
	it("should return guidance start information for AI agents", async () => {
		// RED: This test will fail because guidance routes don't exist yet
		const app = new Hono();

		// Enable MCP admin features
		process.env.ENABLE_MCP_ADMIN = "true";

		app.use("/mcp/*", mcpAdminMiddleware);
		app.route("/mcp", guidanceRoutes);

		const req = new Request("http://localhost/mcp/guidance/start");
		const res = await app.fetch(req);

		expect(res.status).toBe(200);
		const json = await res.json();

		// Should provide framework overview and learning path
		expect(json).toHaveProperty("framework");
		expect(json).toHaveProperty("learningPath");
		expect(json).toHaveProperty("nextSteps");
		expect(json.framework.name).toBe("Blok");

		// Cleanup
		process.env.ENABLE_MCP_ADMIN = undefined;
	});
});
