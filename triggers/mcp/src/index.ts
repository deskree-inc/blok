#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { BlokHttpClient } from "./client";
import { McpToolRegistry } from "./registry";

const server = new Server(
	{
		name: "blok-mcp-server",
		version: "0.0.1",
	},
	{
		capabilities: {
			tools: {},
		},
	},
);

// Initialize HTTP client and tool registry
const httpTriggerUrl = process.env.BLOK_HTTP_TRIGGER_URL || "http://localhost:4000";
const authToken = process.env.BLOK_AUTH_TOKEN; // Optional bearer token for enterprise security
const httpClient = new BlokHttpClient(httpTriggerUrl, authToken);
const toolRegistry = new McpToolRegistry(httpClient);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
	try {
		const tools = await toolRegistry.getAvailableTools();
		return { tools };
	} catch (error) {
		throw new McpError(
			ErrorCode.InternalError,
			`Failed to list tools: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
});

// Execute tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	try {
		const { name, arguments: args } = request.params;
		const result = await toolRegistry.executeTool(name, args || {});

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	} catch (error) {
		throw new McpError(
			ErrorCode.InternalError,
			`Failed to execute tool "${request.params.name}": ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
});

async function main() {
	// Initialize the tool registry
	await toolRegistry.initialize();

	const transport = new StdioServerTransport();
	await server.connect(transport);

	console.error("Blok MCP Server running on stdio");
}

if (require.main === module) {
	main().catch((error) => {
		console.error("Fatal error in main():", error);
		process.exit(1);
	});
}
