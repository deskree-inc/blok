#!/usr/bin/env node

/**
 * Test script for MCP server using JSON-RPC protocol via stdio
 */

const { spawn } = require("node:child_process");
const path = require("node:path");

// JSON-RPC messages for MCP protocol
const initializeMessage = {
	jsonrpc: "2.0",
	id: 1,
	method: "initialize",
	params: {
		protocolVersion: "2024-11-05",
		capabilities: {},
		clientInfo: {
			name: "test-client",
			version: "1.0.0",
		},
	},
};

const listToolsMessage = {
	jsonrpc: "2.0",
	id: 2,
	method: "tools/list",
	params: {},
};

const callAiGuidanceMessage = {
	jsonrpc: "2.0",
	id: 3,
	method: "tools/call",
	params: {
		name: "ai_guidance_start",
		arguments: {},
	},
};

async function testMcpServer() {
	console.log("🚀 Testing MCP Server with JSON-RPC protocol...\n");

	return new Promise((resolve, reject) => {
		const serverPath = path.join(__dirname, "dist", "index.js");
		const mcpServer = spawn("node", [serverPath], {
			stdio: ["pipe", "pipe", "pipe"],
			cwd: __dirname,
		});

		const responses = [];
		const testResults = {
			initialized: false,
			toolsListed: false,
			aiGuidanceWorks: false,
			aiAgentToolsFound: [],
		};

		// Handle server responses
		mcpServer.stdout.on("data", (data) => {
			const messages = data.toString().trim().split("\n");
			for (const message of messages) {
				if (message.trim()) {
					try {
						const response = JSON.parse(message);
						responses.push(response);
						console.log(`📥 Response ${response.id}:`, JSON.stringify(response, null, 2));

						// Process responses
						if (response.id === 1 && response.result) {
							testResults.initialized = true;
							console.log("✅ MCP Server initialized successfully");
						}

						if (response.id === 2 && response.result && response.result.tools) {
							testResults.toolsListed = true;
							const tools = response.result.tools;
							console.log(`✅ Found ${tools.length} tools`);

							// Check for AI Agent Training tools
							const aiAgentTools = ["ai_guidance_start", "workflow_validate", "docs_search", "node_discovery"];
							for (const toolName of aiAgentTools) {
								const found = tools.find((t) => t.name === toolName);
								if (found) {
									testResults.aiAgentToolsFound.push(toolName);
									console.log(`✅ Found AI Agent tool: ${toolName}`);
								}
							}
						}

						if (response.id === 3 && response.result) {
							testResults.aiGuidanceWorks = true;
							console.log("✅ ai_guidance_start tool executed successfully");
						}
					} catch (e) {
						console.log("📥 Raw response:", message);
					}
				}
			}
		});

		mcpServer.stderr.on("data", (data) => {
			console.error("❌ MCP Server Error:", data.toString());
		});

		// Send JSON-RPC messages
		function sendMessage(message) {
			const jsonMessage = `${JSON.stringify(message)}\n`;
			console.log(`📤 Sending message ${message.id}:`, JSON.stringify(message, null, 2));
			mcpServer.stdin.write(jsonMessage);
		}

		// Test sequence
		setTimeout(() => {
			sendMessage(initializeMessage);
		}, 500);

		setTimeout(() => {
			sendMessage(listToolsMessage);
		}, 1500);

		setTimeout(() => {
			sendMessage(callAiGuidanceMessage);
		}, 2500);

		// Finalize test after 4 seconds
		setTimeout(() => {
			mcpServer.kill();

			console.log("\n🏁 Test Results Summary:");
			console.log(`Initialized: ${testResults.initialized ? "✅" : "❌"}`);
			console.log(`Tools Listed: ${testResults.toolsListed ? "✅" : "❌"}`);
			console.log(`AI Guidance Works: ${testResults.aiGuidanceWorks ? "✅" : "❌"}`);
			console.log(`AI Agent Tools Found: ${testResults.aiAgentToolsFound.length}/4`);
			console.log(`Found tools: ${testResults.aiAgentToolsFound.join(", ")}`);

			const allPassed =
				testResults.initialized &&
				testResults.toolsListed &&
				testResults.aiGuidanceWorks &&
				testResults.aiAgentToolsFound.length >= 4;

			if (allPassed) {
				console.log("\n🎉 ALL TESTS PASSED! MCP AI Agent Training system is ready for Claude Desktop!");
				resolve(testResults);
			} else {
				console.log("\n❌ Some tests failed. Check the output above.");
				reject(new Error("MCP tests failed"));
			}
		}, 4000);
	});
}

if (require.main === module) {
	testMcpServer().catch(console.error);
}
