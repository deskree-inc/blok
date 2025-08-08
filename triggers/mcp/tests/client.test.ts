import { beforeEach, describe, expect, it, vi } from "vitest";
import { BlokHttpClient } from "../src/client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("BlokHttpClient", () => {
	let client: BlokHttpClient;
	let clientWithToken: BlokHttpClient;

	beforeEach(() => {
		client = new BlokHttpClient("http://localhost:4000");
		clientWithToken = new BlokHttpClient("http://localhost:4000", "test-bearer-token");
		mockFetch.mockReset();
	});

	describe("getMetadata", () => {
		it("should fetch metadata successfully", async () => {
			const mockMetadata = {
				workflows: [
					{
						name: "test-workflow",
						description: "Test workflow",
						inputs: {},
						businessValue: "Test value",
						category: "workflow" as const,
					},
				],
				nodes: [
					{
						name: "test-node",
						description: "Test node",
						inputs: {},
						runtime: "local",
						businessValue: "Test value",
						category: "node" as const,
					},
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockMetadata,
			});

			const result = await client.getMetadata();

			expect(mockFetch).toHaveBeenCalledWith("http://localhost:4000/mcp/metadata", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});
			expect(result).toEqual(mockMetadata);
		});

		it("should throw error when fetch fails", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
			});

			await expect(client.getMetadata()).rejects.toThrow("HTTP 500: Internal Server Error");
		});

		it("should include Authorization header when token is provided", async () => {
			const mockMetadata = {
				workflows: [],
				nodes: [],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockMetadata,
			});

			await clientWithToken.getMetadata();

			expect(mockFetch).toHaveBeenCalledWith("http://localhost:4000/mcp/metadata", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer test-bearer-token",
				},
			});
		});

		it("should not include Authorization header when no token is provided", async () => {
			const mockMetadata = {
				workflows: [],
				nodes: [],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockMetadata,
			});

			await client.getMetadata();

			expect(mockFetch).toHaveBeenCalledWith("http://localhost:4000/mcp/metadata", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});
		});
	});

	describe("executeWorkflow", () => {
		it("should execute workflow successfully", async () => {
			const mockResponse = { result: "success" };

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.executeWorkflow("test-workflow", { input: "test" });

			expect(mockFetch).toHaveBeenCalledWith("http://localhost:4000/test-workflow", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ input: "test" }),
			});

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockResponse);
			expect(result.metadata).toBeDefined();
			expect(result.metadata?.duration).toBeTypeOf("number");
			expect(result.metadata?.timestamp).toBeTypeOf("string");
		});

		it("should handle workflow execution error", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				text: async () => "Bad Request",
			});

			const result = await client.executeWorkflow("test-workflow", {});

			expect(result.success).toBe(false);
			expect(result.error).toBe("HTTP 400: Bad Request");
			expect(result.metadata).toBeDefined();
		});
	});

	describe("executeNode", () => {
		it("should execute node successfully", async () => {
			const mockResponse = { result: "node success" };

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.executeNode("test-node", { input: "test" });

			// Expect the SDK remote node execution protocol
			expect(mockFetch).toHaveBeenCalledWith("http://localhost:4000/test-node", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-blok-execute-node": "true",
				},
				body: expect.stringContaining('"Name":"test-node"'),
			});

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockResponse);
		});
	});

	describe("healthCheck", () => {
		it("should return true when health check passes", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
			});

			const result = await client.healthCheck();

			expect(mockFetch).toHaveBeenCalledWith("http://localhost:4000/health-check", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});
			expect(result).toBe(true);
		});

		it("should return false when health check fails", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
			});

			const result = await client.healthCheck();
			expect(result).toBe(false);
		});

		it("should return false when fetch throws", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			const result = await client.healthCheck();
			expect(result).toBe(false);
		});
	});
});
