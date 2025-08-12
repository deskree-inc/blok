import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { BlokExecutionResult, BlokHttpClient, BlokMetadata } from "./client";

/**
 * Registry that converts Blok workflows/nodes into MCP tools
 */
export class McpToolRegistry {
	private tools: Map<string, Tool> = new Map();
	private workflowMethods: Map<string, string> = new Map(); // Store HTTP methods for workflows
	private metadata?: BlokMetadata;

	constructor(private httpClient: BlokHttpClient) {}

	/**
	 * Initialize the registry by fetching metadata from the HTTP Trigger
	 */
	async initialize(): Promise<void> {
		try {
			this.metadata = await this.httpClient.getMetadata();
			this.buildToolRegistry();
		} catch (error) {
			throw new Error(`Failed to initialize MCP registry: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	}

	/**
	 * Get all available tools in MCP format
	 */
	async getAvailableTools(): Promise<Tool[]> {
		if (!this.metadata) {
			await this.initialize();
		}

		return Array.from(this.tools.values());
	}

	/**
	 * Execute a specific tool by name
	 */
	async executeTool(name: string, args: Record<string, unknown>): Promise<BlokExecutionResult> {
		if (!this.tools.has(name)) {
			throw new Error(`Tool "${name}" not found`);
		}

		// Handle AI Agent Training tools
		switch (name) {
			case "ai_guidance_start":
				return await this.httpClient.getAiGuidance();
			case "workflow_validate":
				return await this.httpClient.validateWorkflow(args);
			case "docs_search":
				return await this.httpClient.searchDocs(args.query as string, args.maxResults as number);
			case "framework_info":
				return await this.httpClient.getFrameworkInfo();
			case "node_discovery":
				return await this.httpClient.discoverNodes();
			case "node_details":
				return await this.httpClient.getNodeDetails(args.nodeName as string);
			case "node_search":
				return await this.httpClient.searchNodes(args.query as string, args.category as string);

			// AI Agent EDIT tools - Critical for iterative development
			case "workflow_create":
				return await this.httpClient.createWorkflow(args);
			case "workflow_update":
				return await this.httpClient.updateWorkflow(args);
			case "workflow_test":
				return await this.httpClient.testWorkflow(args.workflowName as string, args.inputs as Record<string, unknown>);
			case "node_create":
				return await this.httpClient.createNode(args);
			case "node_update":
				return await this.httpClient.updateNode(args);
			case "node_test":
				return await this.httpClient.testNode(args.nodeName as string, args.inputs as Record<string, unknown>);
		}

		// Determine if this is a workflow or node based on name prefix
		if (name.startsWith("workflow_")) {
			const workflowName = name.replace("workflow_", "");
			const method = this.workflowMethods.get(workflowName) || "POST";
			return await this.httpClient.executeWorkflowWithMethod(workflowName, args, method);
		}
		if (name.startsWith("node_")) {
			const nodeName = name.replace("node_", "");
			return await this.httpClient.executeNode(nodeName, args);
		}
		throw new Error(`Invalid tool name format: ${name}`);
	}

	/**
	 * Build the internal tool registry from Blok metadata
	 */
	private buildToolRegistry(): void {
		if (!this.metadata) return;

		// Add AI Agent Training tools
		this.buildAiAgentTrainingTools();

		// Convert workflows to MCP tools
		for (const workflow of this.metadata.workflows) {
			const toolName = `workflow_${workflow.name}`;
			// Store the HTTP method for this workflow
			this.workflowMethods.set(workflow.name, workflow.method);

			const tool: Tool = {
				name: toolName,
				description: `${workflow.description}\n\nBusiness Value: ${workflow.businessValue}\n\nHTTP Method: ${workflow.method}`,
				inputSchema: {
					type: "object",
					properties: this.convertInputsToSchema(workflow.inputs),
					additionalProperties: false,
				},
			};
			this.tools.set(toolName, tool);
		}

		// Convert nodes to MCP tools
		for (const node of this.metadata.nodes) {
			const toolName = `node_${node.name}`;
			const tool: Tool = {
				name: toolName,
				description: `${node.description}\n\nRuntime: ${node.runtime}\nBusiness Value: ${node.businessValue}`,
				inputSchema: {
					type: "object",
					properties: this.convertInputsToSchema(node.inputs),
					additionalProperties: false,
				},
			};
			this.tools.set(toolName, tool);
		}
	}

	/**
	 * Build AI Agent Training tools
	 */
	private buildAiAgentTrainingTools(): void {
		// AI Guidance - Framework overview and learning path
		this.tools.set("ai_guidance_start", {
			name: "ai_guidance_start",
			description:
				"AI agent guidance - Get framework overview and step-by-step learning path for Blok framework. Perfect for AI agents starting to learn Blok from zero knowledge.",
			inputSchema: {
				type: "object",
				properties: {},
				additionalProperties: false,
			},
		});

		// Workflow Validation - Validate JSON workflow structure
		this.tools.set("workflow_validate", {
			name: "workflow_validate",
			description:
				"Validate workflow JSON structure against Blok schema. Ensures workflows are properly formatted before execution. Essential for workflow development.",
			inputSchema: {
				type: "object",
				properties: {
					name: { type: "string", description: "Workflow name" },
					version: { type: "string", description: "Workflow version" },
					description: { type: "string", description: "Workflow description" },
					trigger: { type: "object", description: "Trigger configuration" },
					steps: { type: "array", description: "Array of workflow steps" },
				},
				required: ["name", "version", "description", "trigger", "steps"],
				additionalProperties: false,
			},
		});

		// Documentation Search - Search blok.md and framework docs
		this.tools.set("docs_search", {
			name: "docs_search",
			description:
				"Search documentation for specific topics in blok.md and framework guides. Returns relevant sections with context for AI learning.",
			inputSchema: {
				type: "object",
				properties: {
					query: { type: "string", description: "Search query for documentation" },
					maxResults: { type: "number", description: "Maximum number of results (optional, default 10)" },
				},
				required: ["query"],
				additionalProperties: false,
			},
		});

		// Framework Info - Get Blok framework overview
		this.tools.set("framework_info", {
			name: "framework_info",
			description:
				"Get comprehensive Blok framework information including concepts, sections, and usage guidance from blok.md documentation.",
			inputSchema: {
				type: "object",
				properties: {},
				additionalProperties: false,
			},
		});

		// Node Discovery - List all available nodes
		this.tools.set("node_discovery", {
			name: "node_discovery",
			description:
				"Discover all available nodes in the system with categories and metadata. Essential for understanding available processing capabilities.",
			inputSchema: {
				type: "object",
				properties: {},
				additionalProperties: false,
			},
		});

		// Node Details - Get detailed node information
		this.tools.set("node_details", {
			name: "node_details",
			description:
				"Get detailed information about a specific node including inputs, outputs, examples, and usage instructions.",
			inputSchema: {
				type: "object",
				properties: {
					nodeName: { type: "string", description: "Name of the node to get details for" },
				},
				required: ["nodeName"],
				additionalProperties: false,
			},
		});

		// Node Search - Search nodes by functionality
		this.tools.set("node_search", {
			name: "node_search",
			description:
				"Search for nodes based on functionality or category. Helps AI agents find the right nodes for specific tasks.",
			inputSchema: {
				type: "object",
				properties: {
					query: { type: "string", description: "Search query for node functionality" },
					category: { type: "string", description: "Optional category filter (web, control-flow, etc.)" },
				},
				required: ["query"],
				additionalProperties: false,
			},
		});

		// ========== CRITICAL AI AGENT EDIT TOOLS ==========
		// These tools enable AI agents to create, edit, and test workflows/nodes iteratively

		// Workflow Creation - Allow AI agents to create new workflows
		this.tools.set("workflow_create", {
			name: "workflow_create",
			description:
				"🛠️ CREATE WORKFLOW - AI agents can create new workflows from scratch. Essential for iterative development when existing workflows don't meet requirements.",
			inputSchema: {
				type: "object",
				properties: {
					name: { type: "string", description: "Unique workflow name (no spaces, use hyphens)" },
					version: { type: "string", description: "Version (e.g., '1.0.0')" },
					description: { type: "string", description: "Clear description of workflow purpose" },
					trigger: {
						type: "object",
						description: "Trigger configuration",
						properties: {
							http: {
								type: "object",
								properties: {
									method: { type: "string", description: "HTTP method (GET, POST, PUT, DELETE)" },
									path: { type: "string", description: "URL path pattern" },
								},
							},
						},
					},
					steps: {
						type: "array",
						description: "Array of workflow steps",
						items: {
							type: "object",
							properties: {
								name: { type: "string", description: "Step name" },
								node: { type: "string", description: "Node to execute" },
								type: { type: "string", description: "Execution type (usually 'module')" },
							},
						},
					},
				},
				required: ["name", "version", "description", "trigger", "steps"],
				additionalProperties: false,
			},
		});

		// Workflow Update - Allow AI agents to edit existing workflows
		this.tools.set("workflow_update", {
			name: "workflow_update",
			description:
				"✏️ UPDATE WORKFLOW - AI agents can modify existing workflows when they need fixes or improvements. Critical for debugging and iteration.",
			inputSchema: {
				type: "object",
				properties: {
					name: { type: "string", description: "Name of existing workflow to update" },
					version: { type: "string", description: "New version number" },
					description: { type: "string", description: "Updated description" },
					trigger: {
						type: "object",
						description: "Updated trigger configuration",
					},
					steps: {
						type: "array",
						description: "Updated workflow steps",
					},
				},
				required: ["name", "version", "description", "trigger", "steps"],
				additionalProperties: false,
			},
		});

		// Workflow Test - Allow AI agents to test workflow execution
		this.tools.set("workflow_test", {
			name: "workflow_test",
			description:
				"🧪 TEST WORKFLOW - AI agents can execute workflows with test data to verify functionality. Essential for validation before deployment.",
			inputSchema: {
				type: "object",
				properties: {
					workflowName: { type: "string", description: "Name of workflow to test" },
					inputs: {
						type: "object",
						description: "Test input data (optional)",
						additionalProperties: true,
					},
				},
				required: ["workflowName"],
				additionalProperties: false,
			},
		});

		// Node Creation - Allow AI agents to create custom nodes
		this.tools.set("node_create", {
			name: "node_create",
			description:
				"🔧 CREATE NODE - AI agents can create custom processing nodes when existing ones don't meet requirements. Enables unlimited extensibility.",
			inputSchema: {
				type: "object",
				properties: {
					name: { type: "string", description: "Unique node name (no spaces, use hyphens)" },
					category: { type: "string", description: "Node category (e.g., 'custom', 'web', 'data')" },
					description: { type: "string", description: "Clear description of node functionality" },
					runtime: { type: "string", description: "Runtime type (usually 'module')" },
					code: { type: "string", description: "TypeScript code for the node function" },
					inputs: {
						type: "object",
						description: "Expected input parameters schema",
						additionalProperties: true,
					},
					outputs: {
						type: "object",
						description: "Expected output schema",
						additionalProperties: true,
					},
				},
				required: ["name", "category", "description", "runtime", "code"],
				additionalProperties: false,
			},
		});

		// Node Update - Allow AI agents to update existing nodes
		this.tools.set("node_update", {
			name: "node_update",
			description:
				"🔄 UPDATE NODE - AI agents can modify existing custom nodes to fix bugs or add features. Critical for iterative node development.",
			inputSchema: {
				type: "object",
				properties: {
					name: { type: "string", description: "Name of existing node to update" },
					category: { type: "string", description: "Node category" },
					description: { type: "string", description: "Updated description" },
					runtime: { type: "string", description: "Runtime type" },
					code: { type: "string", description: "Updated TypeScript code" },
					inputs: {
						type: "object",
						description: "Updated input parameters schema",
						additionalProperties: true,
					},
					outputs: {
						type: "object",
						description: "Updated output schema",
						additionalProperties: true,
					},
				},
				required: ["name", "category", "description", "runtime", "code"],
				additionalProperties: false,
			},
		});

		// Node Test - Allow AI agents to test node execution
		this.tools.set("node_test", {
			name: "node_test",
			description:
				"⚡ TEST NODE - AI agents can execute nodes with test data to verify functionality before using them in workflows. Essential for validation.",
			inputSchema: {
				type: "object",
				properties: {
					nodeName: { type: "string", description: "Name of node to test" },
					inputs: {
						type: "object",
						description: "Test input data for the node",
						additionalProperties: true,
					},
				},
				required: ["nodeName"],
				additionalProperties: false,
			},
		});
	}

	/**
	 * Convert Blok input schema to JSON Schema format
	 */
	private convertInputsToSchema(inputs: Record<string, unknown>): Record<string, unknown> {
		const properties: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(inputs)) {
			// Basic schema inference based on value type
			if (typeof value === "string") {
				properties[key] = {
					type: "string",
					description: `Input parameter: ${key}`,
				};
			} else if (typeof value === "number") {
				properties[key] = {
					type: "number",
					description: `Input parameter: ${key}`,
				};
			} else if (typeof value === "boolean") {
				properties[key] = {
					type: "boolean",
					description: `Input parameter: ${key}`,
				};
			} else if (Array.isArray(value)) {
				properties[key] = {
					type: "array",
					description: `Input parameter: ${key}`,
					items: { type: "string" },
				};
			} else if (typeof value === "object" && value !== null) {
				properties[key] = {
					type: "object",
					description: `Input parameter: ${key}`,
					additionalProperties: true,
				};
			} else {
				// Default to string for unknown types
				properties[key] = {
					type: "string",
					description: `Input parameter: ${key}`,
				};
			}
		}

		return properties;
	}

	/**
	 * Refresh the registry with latest metadata
	 */
	async refresh(): Promise<void> {
		await this.initialize();
	}

	/**
	 * Get tool count for monitoring
	 */
	getToolCount(): { workflows: number; nodes: number; total: number } {
		const workflows = Array.from(this.tools.keys()).filter((name) => name.startsWith("workflow_")).length;
		const nodes = Array.from(this.tools.keys()).filter((name) => name.startsWith("node_")).length;

		return {
			workflows,
			nodes,
			total: workflows + nodes,
		};
	}
}
