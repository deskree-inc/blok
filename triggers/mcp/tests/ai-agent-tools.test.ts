import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BlokHttpClient } from "../src/client";
import { McpToolRegistry } from "../src/registry";

describe("AI Agent Training Tools", () => {
	let httpClient: BlokHttpClient;
	let toolRegistry: McpToolRegistry;

	beforeAll(async () => {
		// Use test HTTP trigger with MCP admin enabled
		httpClient = new BlokHttpClient("http://localhost:4000");
		toolRegistry = new McpToolRegistry(httpClient);
		await toolRegistry.initialize();
	});

	it("should provide ai_guidance_start tool", async () => {
		// RED: This test will fail because tool doesn't exist yet
		const tools = await toolRegistry.getAvailableTools();
		const guidanceTool = tools.find((tool) => tool.name === "ai_guidance_start");

		expect(guidanceTool).toBeDefined();
		expect(guidanceTool?.description).toContain("AI agent guidance");
	});

	it("should execute ai_guidance_start tool", async () => {
		// RED: This test will also fail initially
		const result = await toolRegistry.executeTool("ai_guidance_start", {});

		expect(result.success).toBe(true);
		expect(result.data).toHaveProperty("framework");
		expect(result.data).toHaveProperty("learningPath");
	});

	it("should provide workflow_validate tool", async () => {
		// GREEN: Tool should exist and have correct description
		const tools = await toolRegistry.getAvailableTools();
		const validateTool = tools.find((tool) => tool.name === "workflow_validate");

		expect(validateTool).toBeDefined();
		expect(validateTool?.description).toContain("Validate workflow");
	});

	it("should execute workflow_validate tool", async () => {
		// RED: This test will also fail initially
		const workflowData = {
			name: "test-workflow",
			version: "1.0.0",
			description: "Test workflow",
			trigger: { http: { method: "GET", path: "/" } },
			steps: [{ name: "test", node: "api-call", type: "module" }],
		};

		const result = await toolRegistry.executeTool("workflow_validate", workflowData);

		expect(result.success).toBe(true);
		expect(result.data).toHaveProperty("valid");
		expect((result.data as { valid: boolean }).valid).toBe(true);
	});

	it("should provide docs_search tool", async () => {
		// GREEN: Tool should exist and have correct description
		const tools = await toolRegistry.getAvailableTools();
		const searchTool = tools.find((tool) => tool.name === "docs_search");

		expect(searchTool).toBeDefined();
		expect(searchTool?.description).toContain("Search documentation");
	});

	it("should provide node_discovery tool", async () => {
		// GREEN: Tool should exist and have correct description
		const tools = await toolRegistry.getAvailableTools();
		const discoveryTool = tools.find((tool) => tool.name === "node_discovery");

		expect(discoveryTool).toBeDefined();
		expect(discoveryTool?.description).toContain("Discover all available nodes");
	});
});
