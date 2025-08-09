import type { OptionValues } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeNode } from "../src/commands/execute/node.js";

// Mock the temporal server
const mockTemporalServer = {
	start: vi.fn(),
	shutdown: vi.fn(),
};

vi.mock("../src/utils/temporal-server.js", () => ({
	TemporalBlokServer: vi.fn(() => mockTemporalServer),
}));

// Mock CLI utilities
vi.mock("../src/utils/cli-utils.js", () => ({
	createRequestBody: vi.fn(),
	formatOutput: vi.fn().mockResolvedValue(undefined),
}));

import { createRequestBody } from "../src/utils/cli-utils.js";
const mockCreateRequestBody = vi.mocked(createRequestBody);

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch;

// Mock console methods
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});

// Mock process.exit
const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
	throw new Error("process.exit called");
});

describe("executeNode", () => {
	const defaultOptions: OptionValues = {
		workflowPath: "./test-workflows",
		nodePath: "./test-nodes",
		output: "pretty",
		timeout: "30000",
		runtime: "module",
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockConsoleLog.mockClear();
		mockConsoleError.mockClear();
		mockExit.mockClear();

		// Default mock setup
		mockTemporalServer.start.mockResolvedValue(8000);
		mockTemporalServer.shutdown.mockResolvedValue(undefined);

		// Mock createRequestBody to return expected format
		mockCreateRequestBody.mockReturnValue({
			body: { input: "test" },
			query: {},
			headers: {},
			params: {},
		});

		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({
				message: "Node executed successfully",
				result: { output: "processed" },
			}),
		} as unknown as Response);
	});

	it("should execute node successfully", async () => {
		const options = {
			...defaultOptions,
			body: '{"input": "test"}',
		};

		try {
			await executeNode("sentiment-analysis", options);
		} catch (error) {
			// Expected due to process.exit mock
			expect(error.message).toBe("process.exit called");
		}

		expect(mockTemporalServer.start).toHaveBeenCalledWith({
			workflowsPath: expect.stringMatching(/.*test-workflows$/),
			nodesPath: expect.stringMatching(/.*test-nodes$/),
			timeout: 30000,
			enableMetrics: false,
			debug: false,
			env: expect.objectContaining({
				WORKFLOWS_PATH: expect.stringMatching(/.*test-workflows$/),
				NODES_PATH: expect.stringMatching(/.*test-nodes$/),
			}),
		});

		expect(global.fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/sentiment-analysis", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-blok-execute-node": "true",
			},
			body: JSON.stringify({
				body: { input: "test" },
				query: {},
				headers: {},
				params: {},
			}),
		});

		expect(mockConsoleLog).toHaveBeenCalledWith("🔧 Executing node: sentiment-analysis (module)");
		expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringMatching(/✅ Node completed in \d+ms/));
		expect(mockExit).toHaveBeenCalledWith(0);
		expect(mockTemporalServer.shutdown).toHaveBeenCalled();
	});

	it("should handle node execution failure", async () => {
		vi.mocked(global.fetch).mockResolvedValue({
			ok: false,
			status: 404,
			json: vi.fn().mockResolvedValue({
				error: "Node not found",
			}),
		} as unknown as Response);

		const options = {
			...defaultOptions,
			body: '{"input": "test"}',
		};

		try {
			await executeNode("non-existent-node", options);
		} catch (error) {
			expect(error.message).toBe("process.exit called");
		}

		expect(mockExit).toHaveBeenCalledWith(1);
		expect(mockTemporalServer.shutdown).toHaveBeenCalled();
	});

	it("should handle server startup failure", async () => {
		mockTemporalServer.start.mockRejectedValue(new Error("No available ports"));

		const options = {
			...defaultOptions,
			body: '{"input": "test"}',
		};

		try {
			await executeNode("test-node", options);
		} catch (error) {
			expect(error.message).toBe("process.exit called");
		}

		expect(mockConsoleError).toHaveBeenCalledWith("❌ Node failed: No available ports");
		expect(mockExit).toHaveBeenCalledWith(1);
		expect(mockTemporalServer.shutdown).toHaveBeenCalled();
	});

	it("should handle fetch failure", async () => {
		vi.mocked(global.fetch).mockRejectedValue(new Error("Connection refused"));

		const options = {
			...defaultOptions,
			body: '{"input": "test"}',
		};

		try {
			await executeNode("test-node", options);
		} catch (error) {
			expect(error.message).toBe("process.exit called");
		}

		expect(mockConsoleError).toHaveBeenCalledWith("❌ Node failed: Connection refused");
		expect(mockExit).toHaveBeenCalledWith(1);
		expect(mockTemporalServer.shutdown).toHaveBeenCalled();
	});

	it("should pass through runtime and CLI options", async () => {
		const options = {
			...defaultOptions,
			body: '{"text": "sentiment test"}',
			query: '{"model": "v2"}',
			headers: '{"Authorization": "Bearer token"}',
			params: '{"version": "latest"}',
			runtime: "runtime.python3",
			debug: true,
			timeout: "45000",
		};

		// Configure mock for this specific test
		mockCreateRequestBody.mockReturnValue({
			body: { text: "sentiment test" },
			query: { model: "v2" },
			headers: { Authorization: "Bearer token" },
			params: { version: "latest" },
		});

		try {
			await executeNode("ml-model", options);
		} catch (error) {
			expect(error.message).toBe("process.exit called");
		}

		expect(mockTemporalServer.start).toHaveBeenCalledWith({
			workflowsPath: expect.stringMatching(/.*test-workflows$/),
			nodesPath: expect.stringMatching(/.*test-nodes$/),
			timeout: 45000,
			enableMetrics: false,
			debug: true,
			env: expect.objectContaining({
				WORKFLOWS_PATH: expect.stringMatching(/.*test-workflows$/),
				NODES_PATH: expect.stringMatching(/.*test-nodes$/),
			}),
		});

		expect(mockConsoleLog).toHaveBeenCalledWith("🔧 Executing node: ml-model (runtime.python3)");

		expect(global.fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/ml-model", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-blok-execute-node": "true",
			},
			body: JSON.stringify({
				body: { text: "sentiment test" },
				query: { model: "v2" },
				headers: { Authorization: "Bearer token" },
				params: { version: "latest" },
			}),
		});
	});

	it("should always cleanup server even on error", async () => {
		mockTemporalServer.start.mockRejectedValue(new Error("Startup failed"));

		try {
			await executeNode("test-node", defaultOptions);
		} catch (error) {
			expect(error.message).toBe("process.exit called");
		}

		expect(mockTemporalServer.shutdown).toHaveBeenCalled();
	});

	it("should format output with node-specific data", async () => {
		const mockFormatOutput = vi.fn();
		(await import("../src/utils/cli-utils.js")).formatOutput = mockFormatOutput;

		const options = {
			...defaultOptions,
			body: '{"input": "test"}',
			output: "json",
		};

		try {
			await executeNode("data-processor", options);
		} catch (error) {
			expect(error.message).toBe("process.exit called");
		}

		expect(mockFormatOutput).toHaveBeenCalledWith(
			expect.objectContaining({
				node: "data-processor",
				runtime: "module",
				success: true,
				duration_ms: expect.any(Number),
				result: expect.any(Object),
				execution_method: "temporal_server_middleware",
			}),
			"json",
		);
	});
});
