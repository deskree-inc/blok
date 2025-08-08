import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { BlokExecutionResult, BlokHttpClient, BlokMetadata } from "./client";

/**
 * Registry that converts Blok workflows/nodes into MCP tools
 */
export class McpToolRegistry {
	private tools: Map<string, Tool> = new Map();
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

		// Determine if this is a workflow or node based on name prefix
		if (name.startsWith("workflow_")) {
			const workflowName = name.replace("workflow_", "");
			return await this.httpClient.executeWorkflow(workflowName, args);
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

		// Convert workflows to MCP tools
		for (const workflow of this.metadata.workflows) {
			const toolName = `workflow_${workflow.name}`;
			const tool: Tool = {
				name: toolName,
				description: `${workflow.description}\n\nBusiness Value: ${workflow.businessValue}`,
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
