import type { OptionValues } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeWorkflow } from "../src/commands/execute/workflow.js";

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

describe("executeWorkflow", () => {
	const defaultOptions: OptionValues = {
		workflowPath: "./test-workflows",
		nodePath: "./test-nodes",
		output: "pretty",
		timeout: "30000",
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
			body: { data: "test" },
			query: {},
			headers: {},
			params: {},
		});

		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({
				message: "Workflow executed successfully",
				result: { data: "test" },
			}),
		} as unknown as Response);
	});

	it("should execute workflow successfully", async () => {
		const options = {
			...defaultOptions,
			body: '{"data": "test"}',
		};

		try {
			await executeWorkflow("test-workflow", options);
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

		expect(global.fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/test-workflow", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				body: { data: "test" },
				query: {},
				headers: {},
				params: {},
			}),
		});

		expect(mockConsoleLog).toHaveBeenCalledWith("🚀 Executing workflow: test-workflow");
		expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringMatching(/✅ Workflow completed in \d+ms/));
		expect(mockExit).toHaveBeenCalledWith(0);
		expect(mockTemporalServer.shutdown).toHaveBeenCalled();
	});

	it("should handle workflow execution failure", async () => {
		vi.mocked(global.fetch).mockResolvedValue({
			ok: false,
			status: 500,
			json: vi.fn().mockResolvedValue({
				error: "Workflow not found",
			}),
		} as unknown as Response);

		const options = {
			...defaultOptions,
			body: '{"data": "test"}',
		};

		try {
			await executeWorkflow("non-existent-workflow", options);
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
			body: '{"data": "test"}',
		};

		try {
			await executeWorkflow("test-workflow", options);
		} catch (error) {
			expect(error.message).toBe("process.exit called");
		}

		expect(mockConsoleError).toHaveBeenCalledWith("❌ Workflow failed: No available ports");
		expect(mockExit).toHaveBeenCalledWith(1);
		expect(mockTemporalServer.shutdown).toHaveBeenCalled();
	});

	it("should handle fetch failure", async () => {
		vi.mocked(global.fetch).mockRejectedValue(new Error("Connection refused"));

		const options = {
			...defaultOptions,
			body: '{"data": "test"}',
		};

		try {
			await executeWorkflow("test-workflow", options);
		} catch (error) {
			expect(error.message).toBe("process.exit called");
		}

		expect(mockConsoleError).toHaveBeenCalledWith("❌ Workflow failed: Connection refused");
		expect(mockExit).toHaveBeenCalledWith(1);
		expect(mockTemporalServer.shutdown).toHaveBeenCalled();
	});

	it("should pass through all CLI options", async () => {
		const options = {
			...defaultOptions,
			body: '{"message": "test"}',
			query: '{"filter": "active"}',
			headers: '{"Authorization": "Bearer token"}',
			params: '{"userId": "123"}',
			debug: true,
			timeout: "60000",
		};

		// Configure mock for this specific test
		mockCreateRequestBody.mockReturnValue({
			body: { message: "test" },
			query: { filter: "active" },
			headers: { Authorization: "Bearer token" },
			params: { userId: "123" },
		});

		try {
			await executeWorkflow("complex-workflow", options);
		} catch (error) {
			expect(error.message).toBe("process.exit called");
		}

		expect(mockTemporalServer.start).toHaveBeenCalledWith({
			workflowsPath: expect.stringMatching(/.*test-workflows$/),
			nodesPath: expect.stringMatching(/.*test-nodes$/),
			timeout: 60000,
			enableMetrics: false,
			debug: true,
			env: expect.objectContaining({
				WORKFLOWS_PATH: expect.stringMatching(/.*test-workflows$/),
				NODES_PATH: expect.stringMatching(/.*test-nodes$/),
			}),
		});

		expect(global.fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/complex-workflow", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				body: { message: "test" },
				query: { filter: "active" },
				headers: { Authorization: "Bearer token" },
				params: { userId: "123" },
			}),
		});
	});

	it("should always cleanup server even on error", async () => {
		mockTemporalServer.start.mockRejectedValue(new Error("Startup failed"));

		try {
			await executeWorkflow("test-workflow", defaultOptions);
		} catch (error) {
			expect(error.message).toBe("process.exit called");
		}

		expect(mockTemporalServer.shutdown).toHaveBeenCalled();
	});
});
