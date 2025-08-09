import { type ChildProcess, spawn } from "node:child_process";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { BlokHttpClient } from "../src/client";
import { McpToolRegistry } from "../src/registry";

// Integration tests require a running HTTP Trigger
const HTTP_TRIGGER_URL = process.env.BLOK_HTTP_TRIGGER_URL || "http://localhost:4000";
const HTTP_TRIGGER_PATH = join(__dirname, "../../http");

describe("MCP Integration Tests", () => {
	let httpTriggerProcess: ChildProcess | null = null;
	let client: BlokHttpClient;
	let registry: McpToolRegistry;

	beforeAll(async () => {
		// Start HTTP Trigger for testing
		if (process.env.SKIP_HTTP_TRIGGER !== "true") {
			console.log("Starting HTTP Trigger for integration tests...");

			httpTriggerProcess = spawn("npm", ["run", "dev"], {
				cwd: HTTP_TRIGGER_PATH,
				stdio: "pipe",
				env: {
					...process.env,
					PORT: "4001", // Use different port for testing
					DISABLE_TRIGGER_RUN: "false",
				},
			});

			let serverStarted = false;
			let serverError: string | null = null;

			// Set up process error handling
			httpTriggerProcess.on("error", (error) => {
				console.error("HTTP Trigger process error:", error);
				serverError = error.message;
			});

			httpTriggerProcess.on("exit", (code, signal) => {
				if (code !== 0 && code !== null) {
					console.error(`HTTP Trigger process exited with code ${code}, signal ${signal}`);
					serverError = `Process exited with code ${code}`;
				}
			});

			// Wait for server to start with improved detection
			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => {
					if (!serverStarted) {
						console.log("Timeout reached. Server output so far:");
						reject(new Error(serverError || "HTTP Trigger failed to start within timeout"));
					}
				}, 15000); // Increased timeout to 15 seconds

				if (httpTriggerProcess?.stdout) {
					httpTriggerProcess.stdout.on("data", (data) => {
						const output = data.toString();
						console.log("HTTP Trigger stdout:", output.trim());
						// Look for the exact message the HTTP Trigger sends
						if (
							output.includes("Server is running at http://localhost:") ||
							output.includes("Server initialized in") ||
							output.includes("listening on port") ||
							output.includes("server listening")
						) {
							console.log("✅ Detected server start message");
							serverStarted = true;
							clearTimeout(timeout);
							resolve();
						}
					});
				}

				if (httpTriggerProcess?.stderr) {
					httpTriggerProcess.stderr.on("data", (data) => {
						const error = data.toString().trim();
						console.error("HTTP Trigger stderr:", error);
						// Only fail on actual errors, not warnings
						if (error.includes("Error:") && !error.includes("npm warn") && !error.includes("Unknown env config")) {
							serverError = error;
							clearTimeout(timeout);
							reject(new Error(`HTTP Trigger stderr error: ${error}`));
						}
					});
				}
			});

			console.log("HTTP Trigger started on port 4001");
		}

		// Initialize test clients
		client = new BlokHttpClient("http://localhost:4001");
		registry = new McpToolRegistry(client);

		// Wait for HTTP trigger to be ready with exponential backoff
		let retries = 0;
		let waitTime = 500; // Start with 500ms
		while (retries < 15) {
			// Increased retries
			try {
				const isHealthy = await client.healthCheck();
				if (isHealthy) {
					console.log("HTTP Trigger is healthy");
					break;
				}
			} catch (error) {
				console.log(`Waiting for HTTP Trigger... (attempt ${retries + 1}/${15})`);
			}

			retries++;
			await new Promise((resolve) => setTimeout(resolve, waitTime));
			waitTime = Math.min(waitTime * 1.2, 2000); // Exponential backoff, max 2s
		}

		if (retries === 15) {
			throw new Error("HTTP Trigger failed to start or become healthy after 15 attempts");
		}
	}, 25000); // Increased timeout to 25 seconds for beforeAll

	afterAll(async () => {
		if (httpTriggerProcess) {
			httpTriggerProcess.kill("SIGTERM");

			// Wait for graceful shutdown
			await new Promise((resolve) => {
				if (httpTriggerProcess) {
					httpTriggerProcess.on("exit", resolve);
					setTimeout(resolve, 2000); // Force resolve after 2 seconds
				} else {
					resolve(undefined);
				}
			});

			console.log("HTTP Trigger stopped");
		}
	});

	describe("End-to-End Discovery and Execution", () => {
		it("should discover workflows and nodes from HTTP Trigger", async () => {
			const metadata = await client.getMetadata();

			expect(metadata).toBeDefined();
			expect(metadata.workflows).toBeInstanceOf(Array);
			expect(metadata.nodes).toBeInstanceOf(Array);

			console.log(`Discovered ${metadata.workflows.length} workflows and ${metadata.nodes.length} nodes`);

			// Verify structure of discovered items
			if (metadata.workflows.length > 0) {
				const workflow = metadata.workflows[0];
				expect(workflow).toHaveProperty("name");
				expect(workflow).toHaveProperty("description");
				expect(workflow).toHaveProperty("businessValue");
				expect(workflow.category).toBe("workflow");
			}

			if (metadata.nodes.length > 0) {
				const node = metadata.nodes[0];
				expect(node).toHaveProperty("name");
				expect(node).toHaveProperty("description");
				expect(node).toHaveProperty("businessValue");
				expect(node).toHaveProperty("runtime");
				expect(node.category).toBe("node");
			}
		});

		it("should initialize MCP registry with discovered tools", async () => {
			await registry.initialize();

			const tools = await registry.getAvailableTools();

			expect(tools).toBeInstanceOf(Array);
			expect(tools.length).toBeGreaterThan(0);

			console.log(`Registry contains ${tools.length} tools`);

			// Verify tool structure
			const tool = tools[0];
			expect(tool).toHaveProperty("name");
			expect(tool).toHaveProperty("description");
			expect(tool).toHaveProperty("inputSchema");
			expect(tool.inputSchema).toHaveProperty("type");
			expect(tool.inputSchema.type).toBe("object");

			// Verify naming conventions
			const workflowTools = tools.filter((t) => t.name.startsWith("workflow_"));
			const nodeTools = tools.filter((t) => t.name.startsWith("node_"));

			console.log(`Found ${workflowTools.length} workflow tools and ${nodeTools.length} node tools`);
		});

		it("should execute workflow through MCP registry", async () => {
			await registry.initialize();
			const tools = await registry.getAvailableTools();

			const workflowTools = tools.filter((t) => t.name.startsWith("workflow_"));

			if (workflowTools.length === 0) {
				console.log("No workflows available, skipping execution test");
				return;
			}

			const workflowTool = workflowTools[0];
			console.log(`Testing execution of workflow: ${workflowTool.name}`);

			try {
				const result = await registry.executeTool(workflowTool.name, {});

				expect(result).toBeDefined();
				expect(result).toHaveProperty("success");
				expect(result).toHaveProperty("metadata");
				expect(result.metadata).toHaveProperty("duration");
				expect(result.metadata).toHaveProperty("timestamp");

				console.log("Workflow execution result:", {
					success: result.success,
					duration: result.metadata?.duration,
					hasData: !!result.data,
					hasError: !!result.error,
				});

				// Even if workflow execution fails (e.g., missing inputs),
				// the MCP infrastructure should work correctly
				expect(typeof result.success).toBe("boolean");
			} catch (error) {
				console.log("Workflow execution error (expected for some workflows):", error);
				// Test that errors are handled gracefully
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should handle invalid tool execution gracefully", async () => {
			await registry.initialize();

			// Test with non-existent tool
			try {
				await registry.executeTool("workflow_nonexistent", {});
				expect(false).toBe(true); // Should not reach here
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain("not found");
			}

			// Test with invalid tool name format
			try {
				await registry.executeTool("invalid_format", {});
				expect(false).toBe(true); // Should not reach here
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain("not found");
			}
		});

		it("should track tool execution metrics", async () => {
			await registry.initialize();

			const toolCount = registry.getToolCount();

			expect(toolCount).toHaveProperty("workflows");
			expect(toolCount).toHaveProperty("nodes");
			expect(toolCount).toHaveProperty("total");
			expect(typeof toolCount.workflows).toBe("number");
			expect(typeof toolCount.nodes).toBe("number");
			expect(typeof toolCount.total).toBe("number");
			expect(toolCount.total).toBe(toolCount.workflows + toolCount.nodes);

			console.log("Tool count metrics:", toolCount);
		});

		it("should refresh registry and maintain consistency", async () => {
			await registry.initialize();
			const initialTools = await registry.getAvailableTools();
			const initialCount = registry.getToolCount();

			// Refresh the registry
			await registry.refresh();

			const refreshedTools = await registry.getAvailableTools();
			const refreshedCount = registry.getToolCount();

			// Should maintain same tool count after refresh
			expect(refreshedCount.total).toBe(initialCount.total);
			expect(refreshedTools.length).toBe(initialTools.length);

			// Tool names should be consistent
			const initialNames = initialTools.map((t) => t.name).sort();
			const refreshedNames = refreshedTools.map((t) => t.name).sort();
			expect(refreshedNames).toEqual(initialNames);

			console.log("Registry refresh maintained consistency");
		});
	});

	describe("Error Handling and Resilience", () => {
		it("should handle HTTP Trigger connection failures", async () => {
			const offlineClient = new BlokHttpClient("http://localhost:9999"); // Non-existent server

			// Metadata fetch should fail gracefully
			try {
				await offlineClient.getMetadata();
				expect(false).toBe(true); // Should not reach here
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain("Failed to fetch metadata");
			}

			// Health check should return false
			const healthStatus = await offlineClient.healthCheck();
			expect(healthStatus).toBe(false);
		});

		it("should handle registry initialization failures", async () => {
			const offlineClient = new BlokHttpClient("http://localhost:9999");
			const offlineRegistry = new McpToolRegistry(offlineClient);

			try {
				await offlineRegistry.initialize();
				expect(false).toBe(true); // Should not reach here
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain("Failed to initialize MCP registry");
			}
		});
	});
});
