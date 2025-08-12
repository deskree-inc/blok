import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { mcpAdminMiddleware } from "./mcp-admin";

describe("MCP Admin Middleware", () => {
	it("should block access when ENABLE_MCP_ADMIN is not set", async () => {
		const app = new Hono();

		// Clear environment variable
		process.env.ENABLE_MCP_ADMIN = undefined;

		app.use("/mcp/*", mcpAdminMiddleware);
		app.get("/mcp/test", (c) => c.json({ message: "success" }));

		const req = new Request("http://localhost/mcp/test");
		const res = await app.fetch(req);

		expect(res.status).toBe(404);
	});

	it("should allow access when ENABLE_MCP_ADMIN is true", async () => {
		// RED: This test will initially fail if middleware doesn't handle true case correctly
		const app = new Hono();

		// Set environment variable
		process.env.ENABLE_MCP_ADMIN = "true";

		app.use("/mcp/*", mcpAdminMiddleware);
		app.get("/mcp/test", (c) => c.json({ message: "success" }));

		const req = new Request("http://localhost/mcp/test");
		const res = await app.fetch(req);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual({ message: "success" });

		// Cleanup
		process.env.ENABLE_MCP_ADMIN = undefined;
	});
});
