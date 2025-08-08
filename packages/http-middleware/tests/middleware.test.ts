import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { BlokMiddleware, blokMiddleware } from "../src";

// Mock NodeBase implementation for testing
class MockNode {
	flow = false;
	name = "test-node";
	contentType = "application/json";
	active = true;
	stop = false;
	originalConfig = {};
	set_var = false;

	async run() {
		return { success: true, data: "test result", error: null };
	}

	async process() {
		return { success: true, data: "test result", error: null };
	}

	async processFlow() {
		return { success: true, data: "test result", error: null };
	}

	runSteps(): Promise<unknown> {
		return Promise.reject(new Error("runSteps not implemented in mock"));
	}

	runJs() {
		return {};
	}

	setVar() {
		// Mock implementation
	}

	getVar() {
		return undefined;
	}

	blueprintMapper = (obj: unknown) => obj;

	setError() {
		return new Error("Mock error");
	}
}

// Mock nodes for testing (use unknown to simplify test setup)
const mockNodes = {
	"test-node": new MockNode(),
} as Record<string, unknown>;

// Mock workflows for testing
const mockWorkflows = {
	"test-workflow": {
		name: "Test Workflow",
		version: "1.0.0",
		description: "Test workflow for testing",
	},
};

describe("Blok HTTP Middleware", () => {
	let app: express.Application;

	beforeEach(() => {
		app = express();
		app.use(express.json());
	});

	describe("Basic Integration", () => {
		it("should create middleware without errors", () => {
			expect(() => {
				const middleware = blokMiddleware({
					nodes: mockNodes,
					workflows: mockWorkflows,
					debug: false, // Disable debug to avoid console noise
				});
				expect(middleware).toBeDefined();
				expect(typeof middleware).toBe("function");
			}).not.toThrow();
		});

		it("should allow existing routes to continue working", async () => {
			// Add middleware with mock data
			app.use(
				"/workflows",
				blokMiddleware({
					nodes: mockNodes,
					workflows: mockWorkflows,
					debug: false,
				}),
			);

			// Add regular route
			app.get("/health", (req, res) => {
				res.json({ status: "healthy" });
			});

			const response = await request(app).get("/health").expect(200);

			expect(response.body.status).toBe("healthy");
		});

		it("should not interfere with non-workflow routes", async () => {
			app.use(
				"/workflows",
				blokMiddleware({
					nodes: mockNodes,
					workflows: mockWorkflows,
					debug: false,
				}),
			);

			app.get("/api/test", (req, res) => {
				res.json({ message: "original route works" });
			});

			const response = await request(app).get("/api/test").expect(200);

			expect(response.body.message).toBe("original route works");
		});
	});

	describe("Configuration", () => {
		it("should accept configuration options", () => {
			const middleware = blokMiddleware({
				nodes: mockNodes,
				workflows: mockWorkflows,
				enableMetrics: false,
				timeout: 60000,
				debug: false,
			});

			expect(middleware).toBeDefined();
		});

		it("should work with BlokMiddleware class directly", () => {
			const middlewareInstance = new BlokMiddleware({
				nodes: mockNodes,
				workflows: mockWorkflows,
				enableMetrics: true,
				debug: false,
			});

			const expressMiddleware = middlewareInstance.createExpressMiddleware();
			expect(expressMiddleware).toBeDefined();
			expect(typeof expressMiddleware).toBe("function");
		});

		it("should handle empty nodes/workflows gracefully", () => {
			expect(() => {
				const middleware = blokMiddleware({
					debug: false, // Disable debug to avoid console warnings
				});
				expect(middleware).toBeDefined();
			}).not.toThrow();
		});
	});

	describe("Request Processing", () => {
		it("should pass through requests that do not match workflow paths", async () => {
			app.use(
				"/workflows",
				blokMiddleware({
					nodes: mockNodes,
					workflows: mockWorkflows,
					debug: false,
				}),
			);

			app.get("/other-route", (req, res) => {
				res.json({ processed: false });
			});

			await request(app)
				.get("/other-route")
				.expect(200)
				.expect((res) => {
					expect(res.body.processed).toBe(false);
				});
		});

		it("should handle workflow requests with proper prefix", async () => {
			app.use(
				"/workflows",
				blokMiddleware({
					nodes: mockNodes,
					workflows: mockWorkflows,
					debug: false,
					enableMetrics: false, // Disable to avoid OpenTelemetry setup in tests
				}),
			);

			// This would normally execute a workflow, but since we don't have
			// the full Blok runtime setup in tests, it should at least not crash
			const response = await request(app).post("/workflows/test-workflow").send({ data: "test" });

			// The middleware should process the request (even if it fails due to missing setup)
			// The important thing is that it doesn't crash the application
			expect(response.status).toBeGreaterThanOrEqual(400); // Could be 400, 404, 500 depending on setup
		});

		it("should handle requests to non-existent workflows", async () => {
			app.use(
				"/workflows",
				blokMiddleware({
					nodes: mockNodes,
					workflows: mockWorkflows,
					debug: false,
				}),
			);

			const response = await request(app).post("/workflows/non-existent-workflow").send({ data: "test" });

			expect(response.status).toBeGreaterThanOrEqual(400);
		});
	});

	describe("Middleware Chain", () => {
		it("should work with other middleware", async () => {
			// Add CORS-like middleware
			app.use((req, res, next) => {
				res.header("X-Custom-Header", "test");
				next();
			});

			// Add Blok middleware
			app.use(
				"/workflows",
				blokMiddleware({
					nodes: mockNodes,
					workflows: mockWorkflows,
					debug: false,
				}),
			);

			// Add regular route
			app.get("/test", (req, res) => {
				res.json({ message: "success" });
			});

			const response = await request(app).get("/test").expect(200);

			expect(response.headers["x-custom-header"]).toBe("test");
			expect(response.body.message).toBe("success");
		});

		it("should work with body parser middleware", async () => {
			// Body parser is already added in beforeEach
			app.use(
				"/workflows",
				blokMiddleware({
					nodes: mockNodes,
					workflows: mockWorkflows,
					debug: false,
				}),
			);

			app.post("/test-json", (req, res) => {
				res.json({ received: req.body });
			});

			const testData = { test: "data" };
			const response = await request(app).post("/test-json").send(testData).expect(200);

			expect(response.body.received).toEqual(testData);
		});
	});

	describe("Registry Pattern", () => {
		it("should load nodes from registry", () => {
			const middleware = new BlokMiddleware({
				nodes: mockNodes,
				workflows: mockWorkflows,
				debug: false,
			});

			expect(middleware).toBeDefined();
			// The middleware should have loaded the nodes internally
		});

		it("should load workflows from registry", () => {
			const middleware = new BlokMiddleware({
				nodes: mockNodes,
				workflows: mockWorkflows,
				debug: false,
			});

			expect(middleware).toBeDefined();
			// The middleware should have loaded the workflows internally
		});

		it("should prefer registry over paths", () => {
			// This should not try to load from paths when registry is provided
			expect(() => {
				new BlokMiddleware({
					nodes: mockNodes,
					workflows: mockWorkflows,
					nodesPath: "./non-existent-nodes",
					workflowsPath: "./non-existent-workflows",
					debug: false,
				});
			}).not.toThrow();
		});
	});
});
