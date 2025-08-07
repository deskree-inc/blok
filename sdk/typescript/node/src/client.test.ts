import { beforeEach, describe, expect, it, vi } from "vitest";
import { BlokClient } from "./client";
import type { BlokSDKConfig } from "./types";

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("BlokClient", () => {
	let client: BlokClient;
	const config: BlokSDKConfig = {
		host: "http://localhost:4000",
		token: "test-token",
		debug: false,
	};

	beforeEach(() => {
		client = new BlokClient(config);
		mockFetch.mockClear();
	});

	describe("constructor", () => {
		it("should create client with valid config", () => {
			expect(client).toBeDefined();
			expect(client.host).toBe("http://localhost:4000");
		});

		it("should throw error for invalid host", () => {
			expect(() => {
				new BlokClient({ host: "invalid-host" });
			}).toThrow("Invalid host format");
		});

		it("should use default host when not provided", () => {
			const defaultClient = new BlokClient({});
			expect(defaultClient.host).toBe("http://localhost:4000");
		});
	});

	describe("python3", () => {
		it("should execute python3 node successfully", async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				headers: {
					get: vi.fn().mockReturnValue("application/json"),
				},
				json: vi.fn().mockResolvedValue({ result: "success" }),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const result = await client.python3("test-node", { prompt: "test" });

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ result: "success" });
			expect(mockFetch).toHaveBeenCalledWith(
				"http://localhost:4000/test-node",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						Authorization: "Bearer test-token",
						"x-blok-execute-node": "true",
						"Content-Type": "application/json",
					}),
				}),
			);
		});

		it("should handle python3 node execution error", async () => {
			const mockResponse = {
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				headers: {
					get: vi.fn().mockReturnValue("application/json"),
				},
				json: vi.fn().mockResolvedValue({ message: "Node execution failed" }),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const result = await client.python3("test-node", { prompt: "test" });

			expect(result.success).toBe(false);
			expect(result.errors).toBeDefined();
		});
	});

	describe("nodejs", () => {
		it("should execute nodejs module successfully", async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				headers: {
					get: vi.fn().mockReturnValue("application/json"),
				},
				json: vi.fn().mockResolvedValue({ data: "module result" }),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const result = await client.nodejs("@blok-ts/api-call", {
				url: "https://api.example.com/test",
				method: "GET",
			});

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ data: "module result" });
		});

		it("should execute local nodejs node successfully", async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				headers: {
					get: vi.fn().mockReturnValue("application/json"),
				},
				json: vi.fn().mockResolvedValue({ result: "local node result" }),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const result = await client.nodejs("my-local-node", { input: "test" }, "local");

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ result: "local node result" });
		});
	});

	describe("executeWorkflow", () => {
		it("should execute complete workflow successfully", async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				headers: {
					get: vi.fn().mockReturnValue("application/json"),
				},
				json: vi.fn().mockResolvedValue({ workflow: "completed" }),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const workflow = {
				name: "test-workflow",
				description: "Test workflow",
				version: "1.0.0",
				trigger: {
					http: {
						method: "POST",
						path: "/test",
						accept: "application/json",
					},
				},
				steps: [
					{
						name: "step1",
						node: "@blok-ts/api-call",
						type: "module",
					},
				],
				nodes: {
					step1: {
						inputs: { url: "https://api.example.com" },
					},
				},
			};

			const result = await client.executeWorkflow(workflow, { request: "data" });

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ workflow: "completed" });
		});
	});

	describe("setHeaders", () => {
		it("should allow setting custom headers", async () => {
			client.setHeaders({ "x-correlation-id": "test-123" });

			const mockResponse = {
				ok: true,
				status: 200,
				headers: {
					get: vi.fn().mockReturnValue("application/json"),
				},
				json: vi.fn().mockResolvedValue({ result: "success" }),
			};
			mockFetch.mockResolvedValue(mockResponse);

			await client.python3("test-node", { prompt: "test" });

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						"x-correlation-id": "test-123",
					}),
				}),
			);
		});
	});

	describe("error handling", () => {
		it("should handle network errors gracefully", async () => {
			mockFetch.mockRejectedValue(new Error("Network error"));

			const result = await client.python3("test-node", { prompt: "test" });

			expect(result.success).toBe(false);
			expect(result.errors).toEqual([
				{
					status: 500,
					message: "Network error",
				},
			]);
		});

		it("should handle non-JSON responses", async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				headers: {
					get: vi.fn().mockReturnValue("text/plain"),
				},
				text: vi.fn().mockResolvedValue("Plain text response"),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const result = await client.python3("test-node", { prompt: "test" });

			expect(result.success).toBe(true);
			expect(result.rawData).toBe("Plain text response");
		});
	});
});
