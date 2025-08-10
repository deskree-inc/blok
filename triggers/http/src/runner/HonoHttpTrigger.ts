import { type StepHelper, Workflow } from "@blok-ts/runner";
import type { TriggerOpts } from "@blok-ts/runner";
import type { GlobalOptions, ParamsDictionary, TriggerResponse } from "@blok-ts/runner";
import { TriggerBase } from "@blok-ts/runner";
import { NodeMap } from "@blok-ts/runner";
import { DefaultLogger } from "@blok-ts/runner";
import { type Context, GlobalError, type RequestContext } from "@blok-ts/runner";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { type Span, SpanStatusCode, metrics, trace } from "@opentelemetry/api";
import type { Express } from "express";
import { Hono } from "hono";
import type { Context as HonoContext } from "hono";
import { cors } from "hono/cors";
import { v4 as uuid } from "uuid";
import nodes from "../Nodes";
import workflows from "../Workflows";
import MessageDecode from "./MessageDecode";
import { handleDynamicRoute, validateRoute } from "./Util";
import { metricsHandler } from "./metrics/opentelemetry_metrics";
import NodeTypes from "./types/NodeTypes";
import type RuntimeWorkflow from "./types/RuntimeWorkflow";

// Express-like Request interface for backward compatibility
interface ExpressLikeRequest {
	params: Record<string, string>;
	query: Record<string, string | string[]>;
	method: string;
	path: string;
	headers: Record<string, string | undefined>;
	body: unknown;
	url: string;
	ip?: string;
}

export default class HonoHttpTrigger extends TriggerBase {
	private app: Hono = new Hono();
	private port: string | number = process.env.PORT || 4000;
	private initializer = 0;
	private nodeMap: GlobalOptions = <GlobalOptions>{};
	protected tracer = trace.getTracer(
		process.env.PROJECT_NAME || "trigger-http-workflow",
		process.env.PROJECT_VERSION || "0.0.1",
	);
	private logger = new DefaultLogger();

	constructor() {
		super();

		this.initializer = this.startCounter();
		this.loadNodes();
		this.loadWorkflows();
		this.setupRoutes();
	}

	loadNodes() {
		this.nodeMap.nodes = new NodeMap();
		const nodeKeys = Object.keys(nodes);
		for (const key of nodeKeys) {
			this.nodeMap.nodes.addNode(key, nodes[key]);
		}
	}

	loadWorkflows() {
		this.nodeMap.workflows = workflows;
	}

	// Backward compatibility method - returns a mock Express app
	getApp(): Express {
		// Return a minimal Express-like interface for backward compatibility
		// This is primarily used for testing and external integrations
		return {
			use: () => {},
			listen: (port: number | string, callback?: () => void) => {
				if (callback) callback();
				return {} as unknown;
			},
			get: () => {},
			post: () => {},
			put: () => {},
			delete: () => {},
		} as unknown as Express;
	}

	// Get Hono app instance (new method for edge deployments)
	getHonoApp(): Hono {
		return this.app;
	}

	// Get handler for edge runtime deployment
	get handler() {
		return this.app.fetch;
	}

	private setupRoutes(): void {
		// Enable CORS
		this.app.use("*", cors());

		// Serve static files
		this.app.use("/public/*", serveStatic({ root: "./" }));

		// Health check endpoint
		this.app.get("/health-check", (c: HonoContext) => {
			return c.text("Online and ready for action 💪");
		});

		// MCP metadata endpoint for discovery
		this.app.get("/mcp/metadata", (c: HonoContext) => {
			try {
				// Get available workflows
				const workflows = Object.keys(this.nodeMap.workflows).map((key) => ({
					name: key,
					description: `Workflow: ${key}`,
					inputs: {},
					businessValue: `Execute ${key} workflow with structured data processing`,
					category: "workflow" as const,
					method: "GET", // Default method, will be determined correctly by MCP client
					path: "/", // Default path
				}));

				// Get available nodes
				const nodeKeys = this.nodeMap.nodes?.getNodes() || [];
				const nodes = Object.keys(nodeKeys).map((nodeName: string) => ({
					name: nodeName,
					description: `Node: ${nodeName}`,
					inputs: {},
					runtime: "module",
					businessValue: `Execute ${nodeName} node for data processing`,
					category: "node" as const,
				}));

				return c.json({
					workflows,
					nodes,
				});
			} catch (error) {
				return c.json(
					{
						error: "Failed to fetch metadata",
						message: error instanceof Error ? error.message : "Unknown error",
					},
					500,
				);
			}
		});

		// Metrics endpoint
		this.app.get("/metrics", async (c: HonoContext) => {
			try {
				// Create Express-like req/res for metrics handler
				const mockReq = {
					method: "GET",
					url: "/metrics",
					headers: Object.fromEntries(c.req.raw.headers.entries()),
				};

				let responseData = "";
				let responseStatus = 200;
				const mockRes = {
					status: (code: number) => {
						responseStatus = code;
						return mockRes;
					},
					send: (data: string) => {
						responseData = data;
					},
					setHeader: () => {},
					set: () => {},
				};

				await metricsHandler(mockReq as never, mockRes as never);

				return new Response(responseData, {
					status: responseStatus,
					headers: { "Content-Type": "text/plain" },
				});
			} catch (error) {
				return new Response("Error serving metrics", {
					status: 500,
					headers: { "Content-Type": "text/plain" },
				});
			}
		});

		// Mount Express apps (for backward compatibility with custom routes)
		// Convert Express routes to Hono routes
		this.mountExpressApps();

		// Main workflow handler - matches Express pattern exactly
		// Check if it's a workflow request (not root path for welcome page)
		this.app.all("/:workflow{.+}", async (c: HonoContext) => {
			return await this.handleWorkflow(c);
		});
	}

	private async handleWorkflow(c: HonoContext): Promise<Response> {
		const id: string = c.req.query("requestId") || uuid();
		let workflowNameInPath: string = c.req.param("workflow") || "";
		console.log(`Handling workflow: ${workflowNameInPath} with request ID: ${id}`);

		let remoteNodeExecution = false;
		let runtimeWorkflow: RuntimeWorkflow | undefined;

		// Check for remote node execution
		if (c.req.header("x-nanoservice-execute-node") === "true" && c.req.method.toLowerCase() === "post") {
			remoteNodeExecution = true;
			const requestBody = await c.req.text();
			const coder = new MessageDecode();
			const messageContext: Context = coder.requestDecode(requestBody as never);
			runtimeWorkflow = messageContext as unknown as RuntimeWorkflow;
		}

		const defaultMeter = metrics.getMeter("default");
		const workflow_runner_errors = defaultMeter.createCounter("workflow_errors", {
			description: "Workflow runner errors",
		});
		const workflow_execution = defaultMeter.createCounter("workflow", {
			description: "Workflow requests",
		});

		return await this.tracer.startActiveSpan(`${workflowNameInPath}`, async (span: Span) => {
			try {
				const start = performance.now();

				if (remoteNodeExecution && runtimeWorkflow !== undefined) {
					const workflowModel = runtimeWorkflow.workflow;
					const node_type = (workflowModel.steps[0] as unknown as ParamsDictionary).type;
					let set_node_type: NodeTypes = NodeTypes.MODULE;

					switch (node_type) {
						case "runtime.python3":
							set_node_type = NodeTypes.PYTHON3;
							break;
						case "local":
							set_node_type = NodeTypes.LOCAL;
							break;
						default:
							set_node_type = NodeTypes.MODULE;
							break;
					}

					const trigger = Object.keys(workflowModel.trigger)[0];
					const trigger_config =
						((workflowModel.trigger as unknown as ParamsDictionary)[trigger] as unknown as TriggerOpts) || {};

					let remoteNodeName = workflowNameInPath + c.req.path;
					if (remoteNodeName.substring(remoteNodeName.length - 1) === "/") {
						remoteNodeName = remoteNodeName.substring(0, remoteNodeName.length - 1);
					}

					const step: StepHelper = Workflow({
						name: `Remote Node: ${remoteNodeName}`,
						version: "1.0.0",
						description: "Remote Node",
					})
						.addTrigger((trigger as unknown as "http") || "grpc", trigger_config)
						.addStep({
							name: "node",
							node: remoteNodeName,
							type: set_node_type,
							inputs: ((workflowModel.nodes as unknown as ParamsDictionary).node as unknown as ParamsDictionary).inputs,
						});

					this.nodeMap.workflows[id] = step;
					workflowNameInPath = id;
					remoteNodeExecution = true;
				}

				await this.configuration.init(workflowNameInPath, this.nodeMap);
				let ctx: Context = this.createContext(undefined, workflowNameInPath || c.req.param("workflow") || "", id);

				// Create Express-like request object for backward compatibility
				// BUGFIX: Extract clean path without parameters like Express does
				// Hono route: /:workflow{.+} with request /countries should give path: /
				const workflow = c.req.param("workflow");
				const cleanPath = workflow ? "/" : c.req.path; // Remove parameter from path like Express

				const mockReq: ExpressLikeRequest = {
					method: c.req.method,
					path: cleanPath,
					headers: Object.fromEntries(c.req.raw.headers.entries()),
					body: remoteNodeExecution ? runtimeWorkflow : await this.parseBody(c),
					params: {},
					query: {},
					url: c.req.url,
				};

				// Parse query parameters
				const url = new URL(c.req.url);
				for (const [key, value] of url.searchParams.entries()) {
					if (key !== "requestId") {
						mockReq.query[key] = value;
					}
				}

				// Handle dynamic route parameters
				mockReq.params = handleDynamicRoute(this.configuration.trigger.http.path, mockReq as never);

				ctx.logger.log(`Version: ${this.configuration.version}, Method: ${c.req.method}`);

				const { method, path } = this.configuration.trigger.http;
				if (method && method !== "*" && c.req.method.toLowerCase() !== method.toLowerCase())
					throw new Error("Invalid HTTP method");

				console.log(
					`🔍 HONO DEBUG - Workflow: ${workflowNameInPath}, Config method: ${method}, Config path: ${path}, Request method: ${c.req.method}, Request path: ${c.req.path}`,
				);
				console.log(`🔍 HONO DEBUG - Clean path for validation: ${mockReq.path}`);
				if (!validateRoute(path, mockReq.path)) {
					console.log(`❌ HONO DEBUG - Path validation failed: config=${path}, request=${mockReq.path}`);
					throw new Error("Invalid HTTP path");
				}
				console.log(`✅ HONO DEBUG - Path validation SUCCESS: config=${path}, request=${mockReq.path}`);

				ctx.request = mockReq as unknown as RequestContext;
				const response: TriggerResponse = await this.run(ctx);
				ctx = response.ctx;
				const average = response.metrics;

				const end = performance.now();
				ctx.logger.log(`Completed in ${(end - start).toFixed(2)}ms`);

				if (ctx.response.contentType === undefined || ctx.response.contentType === "")
					ctx.response.contentType = "application/json";

				// Set span attributes for OpenTelemetry
				span.setAttribute("success", true);
				span.setAttribute("Content-Type", ctx.response.contentType);
				span.setAttribute("workflow_request_id", `${ctx.id}`);
				span.setAttribute("workflow_elapsed_time", `${end - start}`);
				span.setAttribute("workflow_version", `${this.configuration.version}`);
				span.setAttribute("workflow_name", `${this.configuration.name}`);
				span.setAttribute("workflow_memory_avg_mb", `${average.memory.total}`);
				span.setAttribute("workflow_memory_min_mb", `${average.memory.min}`);
				span.setAttribute("workflow_memory_max_mb", `${average.memory.max}`);
				span.setAttribute("workflow_cpu_percentage", `${average.cpu.average}`);
				span.setAttribute("workflow_cpu_total", `${average.cpu.total}`);
				span.setAttribute("workflow_cpu_usage", `${average.cpu.usage}`);
				span.setAttribute("workflow_cpu_model", `${average.cpu.model}`);
				span.setStatus({ code: SpanStatusCode.OK });

				// Return response with proper content type
				const responseBody =
					typeof ctx.response.data === "string" ? ctx.response.data : JSON.stringify(ctx.response.data);

				return new Response(responseBody, {
					status: 200,
					headers: {
						"Content-Type": ctx.response.contentType,
					},
				});
			} catch (e: unknown) {
				span.setAttribute("success", false);
				span.setAttribute("workflow_request_id", `${id}`);
				span.recordException(e as Error);

				workflow_execution.add(0, {
					env: process.env.NODE_ENV,
					workflow_version: `${this.configuration?.version || "unknown"}`,
					workflow_name: `${this.configuration?.name || "unknown"}`,
					workflow_path: `${workflowNameInPath}`,
				});

				if (e instanceof GlobalError) {
					const error_context = e as GlobalError;

					if (error_context.context.message === "{}" && error_context.context.json instanceof DOMException) {
						workflow_runner_errors.add(1, {
							env: process.env.NODE_ENV,
							workflow_version: `${this.configuration?.version || "unknown"}`,
							workflow_name: `${this.configuration?.name || "unknown"}`,
							workflow_path: `${workflowNameInPath}`,
						});
						span.setStatus({
							code: SpanStatusCode.ERROR,
							message: (error_context.context.json as Error).toString(),
						});

						this.logger.error(`${(error_context.context.json as Error).toString()}`);

						return new Response(
							JSON.stringify({
								origin: error_context.context.name,
								error: (error_context.context.json as Error).toString(),
							}),
							{
								status: 500,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					if (error_context.context.code === undefined) error_context.setCode(500);
					const code = error_context.context.code as number;

					if (error_context.hasJson()) {
						workflow_runner_errors.add(1, {
							env: process.env.NODE_ENV,
							workflow_version: `${this.configuration?.version || "unknown"}`,
							workflow_name: `${this.configuration?.name || "unknown"}`,
							workflow_path: `${workflowNameInPath}`,
						});
						span.setStatus({ code: SpanStatusCode.ERROR, message: JSON.stringify(error_context.context.json) });
						this.logger.error(`${JSON.stringify(error_context.context.json)}`);
						return new Response(JSON.stringify(error_context.context.json), {
							status: code,
							headers: { "Content-Type": "application/json" },
						});
					}

					workflow_runner_errors.add(1, {
						env: process.env.NODE_ENV,
						workflow_version: `${this.configuration?.version || "unknown"}`,
						workflow_name: `${this.configuration?.name || "unknown"}`,
						workflow_path: `${workflowNameInPath}`,
					});
					span.setStatus({ code: SpanStatusCode.ERROR, message: error_context.message });
					this.logger.error(`${error_context.message}`, error_context.stack?.replace(/\n/g, " "));
					return new Response(JSON.stringify({ error: error_context.message }), {
						status: code,
						headers: { "Content-Type": "application/json" },
					});
				}

				workflow_runner_errors.add(1, {
					env: process.env.NODE_ENV,
					workflow_version: `${this.configuration?.version || "unknown"}`,
					workflow_name: `${this.configuration?.name || "unknown"}`,
					workflow_path: `${workflowNameInPath}`,
				});
				span.setStatus({ code: SpanStatusCode.ERROR, message: (e as Error).message });
				this.logger.error(
					`${workflowNameInPath}: ${(e as Error).message}`,
					`${(e as Error).stack?.replace(/\n/g, " ")}`,
				);
				return new Response(JSON.stringify({ error: (e as Error).message }), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				});
			} finally {
				if (remoteNodeExecution) {
					delete this.nodeMap.workflows[id];
				}
				span.end();
			}
		});
	}

	// Mount Express apps/routes for backward compatibility
	private mountExpressApps(): void {
		// Convert Express router routes to Hono routes
		// This handles the main "/" route from AppRoutes which shows the welcome page
		this.app.get("/", (c: HonoContext) => {
			const html = `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Welcome to nanoservice-ts</title>
				<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
				<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
				<style>
					body { font-family: 'Inter', sans-serif; }
				</style>
			</head>
			<body class="bg-gray-50 text-gray-800 min-h-screen flex flex-col">
				<main class="flex-grow flex items-center justify-center px-4">
					<div class="max-w-3xl bg-white shadow-xl rounded-2xl p-10 border border-gray-200">
						<h1 class="text-3xl font-semibold mb-6 text-center text-blue-700">🚀 Welcome to <span class="text-black">nanoservice-ts</span></h1>
						<p class="text-lg mb-4">You're ready to start building fast and modular applications. Here's how to get started:</p>
						<ol class="list-decimal list-inside mb-6 space-y-2 text-base text-gray-700">
							<li><strong>Create</strong> a new <strong>node</strong> using <code class="bg-gray-100 px-2 py-1 rounded">npx blokctl@latest create node</code>.</li>
							<li><strong>Create</strong> a new <strong>workflow</strong> using <code class="bg-gray-100 px-2 py-1 rounded">npx blokctl@latest create workflow</code>.</li>
							<li><strong>Extend</strong> the routing system in <code class="bg-gray-100 px-2 py-1 rounded">src/AppRoutes.ts</code> to expose new logic.</li>
							<li><strong>Initialize</strong> the metrics stack with Prometheus using <code class="bg-gray-100 px-2 py-1 rounded">docker compose -f infra/metrics/docker-compose.yml up</code>.</li>
							<li><strong>Start</strong> the Docker development environment by running <code class="bg-gray-100 px-2 py-1 rounded">npm run infra:dev</code>.</li>
							<li><strong>Start</strong> the TypeScript watcher to regenerate the dist folder by running <code class="bg-gray-100 px-2 py-1 rounded">npm run infra:build</code>.</li>
							<li><strong>Monitor</strong> built-in performance metrics with <code class="bg-gray-100 px-2 py-1 rounded">npx blokctl@latest monitor</code>.</li>
						</ol>

						<div class="mt-8 text-center">
							<a href="https://blok.build/" target="_blank" class="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">Explore Docs</a>
						</div>
					</div>
				</main>

				<footer class="text-center text-sm text-gray-500 py-4">
					<p>Made with ❤️ by the <a href="https://deskree.com/" target="_blank" class="text-blue-600 hover:underline">Deskree</a> team.</p>
				</footer>
			</body>
			</html>
			`;

			return c.html(html);
		});
	}

	private async parseBody(c: HonoContext): Promise<unknown> {
		const contentType = c.req.header("content-type") || "";

		if (contentType.includes("application/json")) {
			try {
				return await c.req.json();
			} catch {
				return {};
			}
		}

		if (contentType.includes("text/")) {
			return await c.req.text();
		}

		if (contentType.includes("application/x-www-form-urlencoded")) {
			const formData = await c.req.formData();
			const result: Record<string, unknown> = {};
			for (const [key, value] of formData.entries()) {
				result[key] = value;
			}
			return result;
		}

		// Default to text for unknown content types
		try {
			return await c.req.text();
		} catch {
			return {};
		}
	}

	listen(): Promise<number> {
		return new Promise((resolve) => {
			// Node.js runtime (backward compatibility)
			if (typeof process !== "undefined") {
				serve(
					{
						fetch: this.app.fetch,
						port: this.port as number,
					},
					() => {
						this.logger.log(`Server is running at http://localhost:${this.port}`);
						resolve(this.endCounter(this.initializer));
					},
				);
			} else {
				// Edge runtime - just resolve with port
				this.logger.log(`Edge runtime initialized on port ${this.port}`);
				resolve(this.port as number);
			}
		});
	}
}
