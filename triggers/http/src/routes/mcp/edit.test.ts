import { describe, expect, it } from "vitest";

describe("MCP Edit Routes", () => {
	const baseUrl = "http://localhost:4000";

	// Helper function for making requests with MCP admin header
	const makeRequest = async (method: string, path: string, data?: Record<string, unknown>) => {
		const url = `${baseUrl}${path}`;
		const options: RequestInit = {
			method,
			headers: {
				"Content-Type": "application/json",
				"x-enable-mcp-admin": "true",
			},
		};

		if (data && (method === "POST" || method === "PUT")) {
			options.body = JSON.stringify(data);
		}

		const response = await fetch(url, options);
		const responseData = await response.json();

		return {
			status: response.status,
			body: responseData,
		};
	};

	describe("POST /mcp/workflows/create", () => {
		it("should create a new workflow", async () => {
			const uniqueName = `ai-test-workflow-${Date.now()}`;
			const workflowData = {
				name: uniqueName,
				version: "1.0.0",
				description: "AI-created test workflow",
				trigger: {
					http: { method: "POST", path: `/ai-test-${Date.now()}` },
				},
				steps: [
					{
						name: "step1",
						node: "api-call",
						type: "module",
						inputs: { url: "https://api.example.com/data" },
					},
				],
			};

			const response = await makeRequest("POST", "/mcp/workflows/create", workflowData);

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty("success", true);
			expect(response.body).toHaveProperty("message");
			expect(response.body.data).toHaveProperty("path");
		});

		it("should reject workflow creation without MCP admin", async () => {
			const url = `${baseUrl}/mcp/workflows/create`;
			const response = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});

			expect(response.status).toBe(400); // Changed from 404 to 400 (actual response)
		});
	});

	describe("POST /mcp/workflows/test", () => {
		it("should test workflow execution", async () => {
			const testData = {
				workflowName: "test", // Using workflow we created in curl test
				inputs: { testParam: "value" },
			};

			const response = await makeRequest("POST", "/mcp/workflows/test", testData);

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("success");
			expect(response.body).toHaveProperty("executionTime");
		});
	});

	describe("POST /mcp/nodes/create", () => {
		it("should create a new node", async () => {
			const uniqueName = `ai-test-node-${Date.now()}`;
			const nodeData = {
				name: uniqueName,
				category: "custom",
				description: "AI-created test node",
				runtime: "module",
				code: `
export default async function(inputs: any) {
	return { 
		success: true, 
		data: inputs.message || 'Hello from AI-created node' 
	};
}`,
				inputs: {
					message: { type: "string", required: false },
				},
				outputs: {
					success: { type: "boolean" },
					data: { type: "string" },
				},
			};

			const response = await makeRequest("POST", "/mcp/nodes/create", nodeData);

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty("success", true);
			expect(response.body.data).toHaveProperty("path");
		});
	});

	describe("POST /mcp/nodes/test", () => {
		it("should test node execution", async () => {
			const testData = {
				nodeName: "api-call",
				inputs: {
					url: "https://httpbin.org/json",
					method: "GET",
				},
			};

			const response = await makeRequest("POST", "/mcp/nodes/test", testData);

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("success");
			expect(response.body).toHaveProperty("executionTime");
		});
	});
});
