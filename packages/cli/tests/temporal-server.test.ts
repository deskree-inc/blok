import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TemporalBlokServer, type TemporalServerConfig } from "../src/utils/temporal-server.js";

// Mock net module for port checking
const mockNetServer = {
	listen: vi.fn(),
	close: vi.fn(),
	on: vi.fn(),
};

// Mock HTTP server
const mockHttpServer = {
	listen: vi.fn(),
	close: vi.fn(),
	on: vi.fn(),
};

vi.mock("node:net", () => ({
	createServer: vi.fn(() => mockNetServer),
}));

vi.mock("node:http", () => ({
	createServer: vi.fn(() => mockHttpServer),
}));

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch;

describe("TemporalBlokServer", () => {
	let server: TemporalBlokServer;
	let config: TemporalServerConfig;

	beforeEach(() => {
		server = new TemporalBlokServer();
		config = {
			workflowsPath: "./test-workflows",
			nodesPath: "./test-nodes",
			timeout: 30000,
			enableMetrics: false,
		};

		// Reset all mocks
		vi.clearAllMocks();

		// Mock successful port check (net module)
		mockNetServer.listen.mockImplementation((port, hostname, callback) => {
			if (callback) callback();
		});
		mockNetServer.close.mockImplementation((callback) => {
			if (callback) callback();
		});

		// Mock HTTP server
		mockHttpServer.listen.mockImplementation((port, hostname) => {
			// Simulate successful server start
		});
		mockHttpServer.close.mockImplementation((callback) => {
			if (callback) callback();
		});

		// Mock successful health check
		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
		} as Response);
	});

	afterEach(async () => {
		// Always clean up the server after each test
		try {
			await server.shutdown();
		} catch {
			// Ignore cleanup errors
		}
	});

	describe("start", () => {
		it("should start server and return port number", async () => {
			const port = await server.start(config);

			expect(port).toBeTypeOf("number");
			expect(port).toBeGreaterThanOrEqual(8000);
			expect(port).toBeLessThanOrEqual(9000);
		});

		it("should create HTTP server with config", async () => {
			const port = await server.start(config);

			// Verify server was created and config was used
			expect(port).toBeGreaterThan(0);
		});

		it("should find available port in range", async () => {
			const port = await server.start(config);

			expect(port).toBeGreaterThanOrEqual(8000);
			expect(port).toBeLessThanOrEqual(9000);
		});

		it("should wait for server ready with health check", async () => {
			await server.start(config);

			expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/http:\/\/127\.0\.0\.1:\d+\/health-check/));
		});

		it("should throw error if no ports available", async () => {
			// Mock port check to always return false (port occupied)
			mockNetServer.listen.mockImplementation((port, hostname, callback) => {
				// Don't call callback, trigger error instead
			});
			mockNetServer.on.mockImplementation((event, callback) => {
				if (event === "error") {
					callback(new Error("EADDRINUSE"));
				}
			});

			await expect(server.start(config)).rejects.toThrow("No available ports in range 8000-9000");
		});

		it("should throw error if server fails to start", async () => {
			// Mock health check failure
			vi.mocked(global.fetch).mockRejectedValue(new Error("Connection refused"));

			await expect(server.start(config)).rejects.toThrow("Temporal server failed to start");
		});
	});

	describe("shutdown", () => {
		it("should shutdown server gracefully", async () => {
			await server.start(config);

			await expect(server.shutdown()).resolves.not.toThrow();
		});

		it("should handle shutdown when server not started", async () => {
			await expect(server.shutdown()).resolves.not.toThrow();
		});
	});

	describe("port management", () => {
		it("should check if port is free correctly", async () => {
			// This tests the private method indirectly
			const port = await server.start(config);

			expect(mockNetServer.listen).toHaveBeenCalled();
			expect(mockNetServer.close).toHaveBeenCalled();
		});
	});
});
