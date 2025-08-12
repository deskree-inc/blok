import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { mcpAdminMiddleware } from "../../middleware/mcp-admin";
import { docsRoutes } from "./docs";

describe("MCP Documentation Routes", () => {
	it("should search blok.md documentation and return relevant sections", async () => {
		// RED: This test will fail because docs routes don't exist yet
		const app = new Hono();

		// Enable MCP admin features
		process.env.ENABLE_MCP_ADMIN = "true";

		app.use("/mcp/*", mcpAdminMiddleware);
		app.route("/mcp", docsRoutes);

		const searchData = {
			query: "workflow structure",
			maxResults: 5,
		};

		const req = new Request("http://localhost/mcp/docs/search", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(searchData),
		});

		const res = await app.fetch(req);

		expect(res.status).toBe(200);
		const json = await res.json();

		// Should return search results
		expect(json).toHaveProperty("results");
		expect(json).toHaveProperty("query");
		expect(json.query).toBe("workflow structure");
		expect(Array.isArray(json.results)).toBe(true);

		// Cleanup
		process.env.ENABLE_MCP_ADMIN = undefined;
	});

	it("should return blok.md overview for general framework understanding", async () => {
		// RED: This test will also fail initially
		const app = new Hono();

		// Enable MCP admin features
		process.env.ENABLE_MCP_ADMIN = "true";

		app.use("/mcp/*", mcpAdminMiddleware);
		app.route("/mcp", docsRoutes);

		const req = new Request("http://localhost/mcp/docs/blok");
		const res = await app.fetch(req);

		expect(res.status).toBe(200);
		const json = await res.json();

		// Should return framework overview
		expect(json).toHaveProperty("framework");
		expect(json).toHaveProperty("sections");
		expect(json.framework.name).toBe("Blok");

		// Cleanup
		process.env.ENABLE_MCP_ADMIN = undefined;
	});
});
