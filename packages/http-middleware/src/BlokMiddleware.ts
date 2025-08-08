import { type Context, type GlobalOptions, TriggerBase } from "@blok-ts/runner";
import { DefaultLogger, NodeMap } from "@blok-ts/runner";
import { type Span, metrics, trace } from "@opentelemetry/api";
import { v4 as uuid } from "uuid";
import type { BlokRequest, BlokResponse, ExpressMiddleware, HonoMiddleware, MiddlewareOptions } from "./types";
import MessageDecode from "./utils/MessageDecode";
import { extractWorkflowName, handleDynamicRoute } from "./utils/RouteUtils";

// Define Hono context interface to avoid any
interface HonoContext {
	req: {
		url: string;
		method: string;
		param(): Record<string, string>;
		header(name?: string): string | Record<string, string>;
		json(): Promise<unknown>;
		text(): Promise<string>;
		formData(): Promise<FormData>;
	};
	status(code: number): void;
	header(name: string, value: string): void;
	json(data: unknown): unknown;
	text(data: string): unknown;
	env?: { ip?: string };
}

// Copy exact same structure as HttpTrigger but as middleware
export class BlokMiddleware extends TriggerBase {
	private nodeMap: GlobalOptions;
	private logger = new DefaultLogger();
	private options: MiddlewareOptions;
	protected tracer = trace.getTracer(
		process.env.PROJECT_NAME || "blok-middleware",
		process.env.PROJECT_VERSION || "0.1.0",
	);

	// Implement abstract method from TriggerBase
	async listen(): Promise<number> {
		// This is not used in middleware mode, but required by interface
		throw new Error(
			"BlokMiddleware.listen() should not be called. Use createExpressMiddleware() or createHonoMiddleware() instead.",
		);
	}

	constructor(options: MiddlewareOptions = {}) {
		super();
		this.options = {
			enableMetrics: true,
			timeout: 30000,
			prefix: "",
			debug: false,
			...options,
		};

		// Apply environment overrides
		if (this.options.env) {
			for (const [key, value] of Object.entries(this.options.env)) {
				process.env[key] = value;
			}
		}

		// Initialize node map (exact same as HttpTrigger)
		this.nodeMap = {
			nodes: new NodeMap(),
			workflows: {},
		};

		// Load nodes and workflows (same as HttpTrigger)
		this.loadNodes();
		this.loadWorkflows();
	}

	// Load nodes using Express.js pattern: registry-first, fallback to auto-discovery
	private loadNodes(): void {
		this.nodeMap.nodes = new NodeMap();

		// Primary approach: Use provided nodes registry (Express.js pattern)
		if (this.options.nodes) {
			const nodeKeys = Object.keys(this.options.nodes);
			for (const key of nodeKeys) {
				this.nodeMap.nodes.addNode(key, this.options.nodes[key]);
			}
			if (this.options.debug) {
				console.log(`Blok: Loaded ${nodeKeys.length} nodes from registry`);
			}
			return;
		}

		// Fallback: Auto-discovery from path
		if (this.options.nodesPath) {
			try {
				// Dynamic import for both CJS and ESM
				const nodesModule = require(this.options.nodesPath);
				const nodes = nodesModule.default || nodesModule;

				if (nodes && typeof nodes === "object") {
					const nodeKeys = Object.keys(nodes);
					for (const key of nodeKeys) {
						this.nodeMap.nodes.addNode(key, nodes[key]);
					}
					if (this.options.debug) {
						console.log(`Blok: Loaded ${nodeKeys.length} nodes from path: ${this.options.nodesPath}`);
					}
					return;
				}
			} catch (error) {
				if (this.options.debug) {
					console.warn(`Blok: Failed to load nodes from ${this.options.nodesPath}:`, error);
				}
			}
		}

		// No nodes provided - warn user
		if (this.options.debug) {
			console.warn(`Blok: No nodes loaded. Provide either 'nodes' registry or 'nodesPath' option.`);
		}
	}

	// Load workflows using Express.js pattern: registry-first, fallback to auto-discovery
	private loadWorkflows(): void {
		// Primary approach: Use provided workflows registry (Express.js pattern)
		if (this.options.workflows) {
			this.nodeMap.workflows = this.options.workflows;
			const workflowKeys = Object.keys(this.options.workflows);
			if (this.options.debug) {
				console.log(`Blok: Loaded ${workflowKeys.length} workflows from registry`);
			}
			return;
		}

		// Fallback: Auto-discovery from path
		if (this.options.workflowsPath) {
			try {
				// Dynamic import for both CJS and ESM
				const workflowsModule = require(this.options.workflowsPath);
				const workflows = workflowsModule.default || workflowsModule;

				if (workflows && typeof workflows === "object") {
					this.nodeMap.workflows = workflows;
					const workflowKeys = Object.keys(workflows);
					if (this.options.debug) {
						console.log(`Blok: Loaded ${workflowKeys.length} workflows from path: ${this.options.workflowsPath}`);
					}
					return;
				}
			} catch (error) {
				if (this.options.debug) {
					console.warn(`Blok: Failed to load workflows from ${this.options.workflowsPath}:`, error);
				}
			}
		}

		// Fallback to empty registry
		this.nodeMap.workflows = {};
		if (this.options.debug) {
			console.warn(`Blok: No workflows loaded. Provide either 'workflows' registry or 'workflowsPath' option.`);
		}
	}

	// Check if request should be handled by this middleware
	private shouldHandleRequest(req: BlokRequest): boolean {
		if (!req.path) return false;

		// Check if path starts with configured prefix
		if (this.options.prefix) {
			return req.path.startsWith(this.options.prefix);
		}

		// Default: handle all requests (same as HttpTrigger)
		return true;
	}

	// Main middleware handler - converts HttpTrigger logic to middleware
	private async handleBlokRequest(req: BlokRequest, res: BlokResponse): Promise<boolean> {
		// Generate request ID (same as HttpTrigger)
		const id: string = (req.query?.requestId as string) || uuid();

		// Extract workflow name from path
		const workflowPath = this.options.prefix ? req.path.replace(this.options.prefix, "") : req.path;

		const workflowNameInPath = extractWorkflowName(workflowPath) || req.params.workflow;

		// Remote node execution detection (exact copy from HttpTrigger)
		let remoteNodeExecution = false;

		if (req.headers["x-nanoservice-execute-node"] === "true" && req.method.toLowerCase() === "post") {
			remoteNodeExecution = true;
			try {
				const coder = new MessageDecode();
				const messageContext: Context = coder.requestDecode(req.body as string);
				// Handle remote node execution logic here
			} catch (error) {
				res.status(400).json({ error: "Invalid remote node execution request" });
				return true; // Request handled
			}
		}

		// Metrics setup (exact copy from HttpTrigger)
		const defaultMeter = metrics.getMeter("default");
		const workflow_runner_errors = defaultMeter.createCounter("workflow_errors", {
			description: "Workflow runner errors",
		});
		const workflow_execution = defaultMeter.createCounter("workflow", {
			description: "Workflow requests",
		});

		// Tracer span (exact copy from HttpTrigger)
		return await this.tracer.startActiveSpan(`${workflowNameInPath}`, async (span: Span) => {
			try {
				const start = performance.now();

				// Configuration and context setup - check workflowNameInPath exists
				if (!workflowNameInPath) {
					res.status(400).json({ error: "Missing workflow name in path" });
					return true;
				}

				await this.configuration.init(workflowNameInPath, this.nodeMap);
				const ctx: Context = this.createContext(undefined, workflowNameInPath || req.params.workflow, id);

				// Handle dynamic route parameters
				req.params = handleDynamicRoute(this.configuration.trigger.http?.path || "/:workflow", req);

				// Log execution start
				ctx.logger.log(`Version: ${this.configuration.version}, Method: ${req.method}`);

				// Context injection from request with proper types
				ctx.request = {
					query: req.query as Record<string, unknown>,
					params: req.params as Record<string, unknown>,
					method: req.method as string,
					body: req.body as unknown,
					headers: req.headers as Record<string, unknown>,
					path: req.path as string,
					url: req.url as string,
					ip: req.ip as string,
				};

				// Execute workflow
				const result = await this.run(ctx);

				const duration = performance.now() - start;
				ctx.logger.log(`Completed in ${duration.toFixed(2)}ms`);

				// Response formatting using actual TriggerResponse structure
				if (result.ctx.response.success) {
					workflow_execution.add(1, {
						env: process.env.NODE_ENV,
						workflow: workflowNameInPath,
						status: "success",
					});

					res.setHeader("x-blok-execution-id", id);
					res.setHeader("x-blok-execution-time", duration.toString());
					res.status(200).json({
						success: true,
						data: result.ctx.response.data,
						executionId: id,
					});
				} else {
					workflow_runner_errors.add(1, {
						env: process.env.NODE_ENV,
						workflow: workflowNameInPath,
						error: result.ctx.response.error || "Unknown error",
					});

					res.status(500).json({
						success: false,
						error: result.ctx.response.error || "Workflow execution failed",
						executionId: id,
					});
				}

				span.setStatus({ code: 1 }); // OK
				return true; // Request handled
			} catch (error) {
				// Error handling (exact copy from HttpTrigger)
				workflow_runner_errors.add(1, {
					env: process.env.NODE_ENV,
					workflow: workflowNameInPath || "unknown",
					error: error instanceof Error ? error.message : "Unknown error",
				});

				span.recordException(error instanceof Error ? error : new Error(String(error)));
				span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) }); // ERROR

				res.status(500).json({
					success: false,
					error: error instanceof Error ? error.message : "Internal server error",
					executionId: id,
				});

				return true; // Request handled
			} finally {
				span.end();
			}
		});
	}

	// Create Express.js middleware function
	createExpressMiddleware(): ExpressMiddleware {
		return async (req, res, next) => {
			try {
				// Convert Express request to BlokRequest
				const blokRequest: BlokRequest = {
					params: req.params || {},
					query: req.query || {},
					method: req.method,
					path: req.path,
					headers: req.headers as Record<string, string | undefined>,
					body: req.body,
					url: req.url,
					ip: req.ip,
				};

				// Convert Express response to BlokResponse
				const blokResponse: BlokResponse = {
					status: (code: number) => {
						res.status(code);
						return blokResponse;
					},
					json: (data: unknown) => {
						res.json(data);
					},
					send: (data: string) => {
						res.send(data);
					},
					setHeader: (name: string, value: string) => {
						res.setHeader(name, value);
					},
				};

				// Check if this request should be handled
				if (!this.shouldHandleRequest(blokRequest)) {
					return next();
				}

				// Handle the request
				const handled = await this.handleBlokRequest(blokRequest, blokResponse);

				if (!handled) {
					return next();
				}
			} catch (error) {
				if (this.options.debug) {
					console.error("Blok middleware error:", error);
				}
				next(error);
			}
		};
	}

	// Create Hono middleware function
	createHonoMiddleware(): HonoMiddleware {
		return async (c, next) => {
			try {
				// Convert Hono context to BlokRequest
				const url = new URL(c.req.url);
				const headerRecord = c.req.header();
				const blokRequest: BlokRequest = {
					params: c.req.param() || {},
					query: Object.fromEntries(url.searchParams.entries()),
					method: c.req.method,
					path: url.pathname,
					headers: typeof headerRecord === "string" ? {} : headerRecord,
					body: await this.parseHonoBody(c),
					url: c.req.url,
					ip: c.env?.ip as string,
				};

				// Convert Hono response to BlokResponse
				let statusCode = 200;
				const headers: Record<string, string> = {};

				const blokResponse: BlokResponse = {
					status: (code: number) => {
						statusCode = code;
						return blokResponse;
					},
					json: (data: unknown) => {
						headers["content-type"] = "application/json";
						c.status(statusCode);
						for (const [key, value] of Object.entries(headers)) {
							c.header(key, value);
						}
						return c.json(data);
					},
					send: (data: string) => {
						c.status(statusCode);
						for (const [key, value] of Object.entries(headers)) {
							c.header(key, value);
						}
						return c.text(data);
					},
					setHeader: (name: string, value: string) => {
						headers[name] = value;
					},
				};

				// Check if this request should be handled
				if (!this.shouldHandleRequest(blokRequest)) {
					return await next();
				}

				// Handle the request
				await this.handleBlokRequest(blokRequest, blokResponse);
			} catch (error) {
				if (this.options.debug) {
					console.error("Blok middleware error:", error);
				}
				throw error;
			}
		};
	}

	private async parseHonoBody(c: HonoContext): Promise<unknown> {
		const contentType = (c.req.header("content-type") as string) || "";

		try {
			if (contentType.includes("application/json")) {
				return await c.req.json();
			}
			if (contentType.includes("application/x-www-form-urlencoded")) {
				const formData = await c.req.formData();
				const result: Record<string, unknown> = {};
				for (const [key, value] of formData.entries()) {
					result[key] = value;
				}
				return result;
			}
			return await c.req.text();
		} catch {
			return undefined;
		}
	}
}
