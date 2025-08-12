import { afterAll, beforeAll, describe, expect, it } from "vitest";
import HonoHttpTrigger from "./HonoHttpTrigger";

describe("HonoHttpTrigger MCP Integration", () => {
	let trigger: HonoHttpTrigger;

	beforeAll(() => {
		// Enable MCP admin features for testing
		process.env.ENABLE_MCP_ADMIN = "true";
		trigger = new HonoHttpTrigger();
	});

	afterAll(() => {
		process.env.ENABLE_MCP_ADMIN = undefined;
	});

	it("should provide MCP guidance endpoint", async () => {
		// RED: This test will fail because MCP routes aren't integrated yet
		const app = trigger.getHonoApp();

		const req = new Request("http://localhost/mcp/guidance/start");
		const res = await app.fetch(req);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.framework.name).toBe("Blok");
	});

	it("should provide MCP workflow validation endpoint", async () => {
		// RED: This test will also fail initially
		const app = trigger.getHonoApp();

		const workflowData = {
			name: "test-workflow",
			version: "1.0.0",
			description: "Test workflow",
			trigger: { http: { method: "GET", path: "/" } },
			steps: [{ name: "test", node: "api-call", type: "module" }],
		};

		const req = new Request("http://localhost/mcp/workflows/validate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(workflowData),
		});

		const res = await app.fetch(req);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.valid).toBe(true);
	});

	it("should provide MCP documentation search endpoint", async () => {
		// RED: This test will also fail initially
		const app = trigger.getHonoApp();

		const searchData = { query: "workflow", maxResults: 5 };

		const req = new Request("http://localhost/mcp/docs/search", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(searchData),
		});

		const res = await app.fetch(req);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.query).toBe("workflow");
		expect(Array.isArray(json.results)).toBe(true);
	});

	it("should provide MCP node discovery endpoint", async () => {
		// RED: This test will also fail initially
		const app = trigger.getHonoApp();

		const req = new Request("http://localhost/mcp/nodes");
		const res = await app.fetch(req);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(Array.isArray(json.nodes)).toBe(true);
		expect(typeof json.totalNodes).toBe("number");
	});

	it("should block MCP endpoints when ENABLE_MCP_ADMIN is not set", async () => {
		// Test security middleware
		process.env.ENABLE_MCP_ADMIN = undefined;
		const testTrigger = new HonoHttpTrigger();
		const app = testTrigger.getHonoApp();

		const req = new Request("http://localhost/mcp/guidance/start");
		const res = await app.fetch(req);

		expect(res.status).toBe(404);

		// Restore for other tests
		process.env.ENABLE_MCP_ADMIN = "true";
	});
});
