import { resolve } from "node:path";
import type { OptionValues } from "commander";
import { createRequestBody, formatOutput } from "../../utils/cli-utils.js";
import { TemporalBlokServer, type TemporalServerConfig } from "../../utils/temporal-server.js";

export async function executeNode(nodeName: string, options: OptionValues): Promise<void> {
	const tempServer = new TemporalBlokServer();

	try {
		// 1. Resolve absolute paths for Runner
		const workflowsPath = resolve(options.workflowPath || "./workflows");
		const nodesPath = resolve(options.nodePath || "./nodes");

		console.log(`📁 Using workflows: ${workflowsPath}`);
		console.log(`📁 Using nodes: ${nodesPath}`);

		// 2. Create config with environment variables for Runner
		const serverConfig: TemporalServerConfig = {
			workflowsPath,
			nodesPath,
			timeout: Number.parseInt(options.timeout) || 30000,
			enableMetrics: false,
			debug: options.debug || false,
			env: {
				...process.env,
				WORKFLOWS_PATH: workflowsPath,
				NODES_PATH: nodesPath,
			},
		};

		// 2. Start temporal server (REUSES ALL LOGIC)
		const port = await tempServer.start(serverConfig);

		// 3. Execute node via HTTP with special header
		console.log(`🔧 Executing node: ${nodeName} (${options.runtime})`);
		const startTime = Date.now();

		const response = await fetch(`http://127.0.0.1:${port}/${nodeName}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-blok-execute-node": "true", // Node execution header
			},
			body: JSON.stringify(createRequestBody(options)),
		});

		const duration = Date.now() - startTime;
		const result = await response.json();

		// 4. Format node-specific output
		const output = {
			node: nodeName,
			runtime: options.runtime,
			success: response.ok,
			duration_ms: duration,
			result: result,
			execution_method: "temporal_server_middleware",
		};

		await formatOutput(output, options.output);
		console.log(`✅ Node completed in ${duration}ms`);
		process.exit(response.ok ? 0 : 1);
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorOutput = {
			node: nodeName,
			runtime: options.runtime,
			success: false,
			error: errorMessage,
			timestamp: new Date().toISOString(),
		};

		await formatOutput(errorOutput, options.output);
		console.error(`❌ Node failed: ${errorMessage}`);
		process.exit(1);
	} finally {
		// Always cleanup - no port conflicts
		await tempServer.shutdown();
	}
}
