import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { mcpAdminMiddleware } from "../../middleware/mcp-admin";
import { nodeRoutes } from "./nodes";

describe("MCP Node Routes", () => {
	it("should list all available nodes in the system", async () => {
		// RED: This test will fail because node routes don't exist yet
		const app = new Hono();

		// Enable MCP admin features
		process.env.ENABLE_MCP_ADMIN = "true";

		app.use("/mcp/*", mcpAdminMiddleware);
		app.route("/mcp", nodeRoutes);

		const req = new Request("http://localhost/mcp/nodes");
		const res = await app.fetch(req);

		expect(res.status).toBe(200);
		const json = await res.json();

		// Should return available nodes
		expect(json).toHaveProperty("nodes");
		expect(json).toHaveProperty("categories");
		expect(json).toHaveProperty("totalNodes");
		expect(Array.isArray(json.nodes)).toBe(true);

		// Cleanup
		process.env.ENABLE_MCP_ADMIN = undefined;
	});

	it("should provide detailed information about a specific node", async () => {
		// RED: This test will also fail initially
		const app = new Hono();

		// Enable MCP admin features
		process.env.ENABLE_MCP_ADMIN = "true";

		app.use("/mcp/*", mcpAdminMiddleware);
		app.route("/mcp", nodeRoutes);

		const req = new Request("http://localhost/mcp/nodes/api-call");
		const res = await app.fetch(req);

		expect(res.status).toBe(200);
		const json = await res.json();

		// Should return node details
		expect(json).toHaveProperty("node");
		expect(json).toHaveProperty("inputs");
		expect(json).toHaveProperty("outputs");
		expect(json).toHaveProperty("examples");
		expect(json.node.name).toBe("api-call");

		// Cleanup
		process.env.ENABLE_MCP_ADMIN = undefined;
	});

	it("should search for nodes based on functionality", async () => {
		// RED: This test will also fail initially
		const app = new Hono();

		// Enable MCP admin features
		process.env.ENABLE_MCP_ADMIN = "true";

		app.use("/mcp/*", mcpAdminMiddleware);
		app.route("/mcp", nodeRoutes);

		const searchData = {
			query: "http request",
			category: "web",
		};

		const req = new Request("http://localhost/mcp/nodes/search", {
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
		expect(json.query).toBe("http request");
		expect(Array.isArray(json.results)).toBe(true);

		// Cleanup
		process.env.ENABLE_MCP_ADMIN = undefined;
	});
});
