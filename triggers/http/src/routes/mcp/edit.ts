import fs from "node:fs/promises";
import path from "node:path";
import { Hono } from "hono";
import { z } from "zod";
import { mcpAdminMiddleware } from "../../middleware/mcp-admin";

// Validation schemas
const WorkflowCreateSchema = z.object({
	name: z.string().min(1),
	version: z.string().min(1),
	description: z.string(),
	trigger: z.object({
		http: z.object({
			method: z.string(),
			path: z.string(),
		}),
	}),
	steps: z.array(
		z.object({
			name: z.string(),
			node: z.string(),
			type: z.string(),
			inputs: z.record(z.any()).optional(),
		}),
	),
});

const NodeCreateSchema = z.object({
	name: z.string().min(1),
	category: z.string().min(1),
	description: z.string(),
	runtime: z.string(),
	code: z.string().min(1),
	inputs: z
		.record(
			z.object({
				type: z.string(),
				required: z.boolean().optional(),
			}),
		)
		.optional(),
	outputs: z
		.record(
			z.object({
				type: z.string(),
			}),
		)
		.optional(),
});

const TestSchema = z.object({
	workflowName: z.string().optional(),
	nodeName: z.string().optional(),
	inputs: z.record(z.any()).optional(),
});

export const mcpEditRoutes = new Hono();

// Apply MCP admin middleware to all edit routes
mcpEditRoutes.use("*", mcpAdminMiddleware);

/**
 * CREATE WORKFLOW - Allow AI agents to create new workflows
 */
mcpEditRoutes.post("/workflows/create", async (c) => {
	try {
		const body = await c.req.json();
		const validation = WorkflowCreateSchema.safeParse(body);

		if (!validation.success) {
			return c.json(
				{
					success: false,
					error: "Invalid workflow data",
					details: validation.error.issues,
				},
				400,
			);
		}

		const workflowData = validation.data;
		const workflowsDir = path.join(process.cwd(), "workflows", "json");
		const workflowPath = path.join(workflowsDir, `${workflowData.name}.json`);

		// Ensure workflows directory exists
		await fs.mkdir(workflowsDir, { recursive: true });

		// Check if workflow already exists
		try {
			await fs.access(workflowPath);
			return c.json(
				{
					success: false,
					error: `Workflow '${workflowData.name}' already exists. Use PUT /workflows/update to modify it.`,
				},
				409,
			);
		} catch {
			// File doesn't exist - good to create
		}

		// Create the workflow JSON
		const workflowJson = {
			name: workflowData.name,
			description: workflowData.description,
			version: workflowData.version,
			trigger: workflowData.trigger,
			steps: workflowData.steps,
			nodes: {},
			metadata: {
				created: new Date().toISOString(),
				createdBy: "AI Agent via MCP",
				lastModified: new Date().toISOString(),
			},
		};

		// Write workflow to file
		await fs.writeFile(workflowPath, JSON.stringify(workflowJson, null, 2));

		return c.json(
			{
				success: true,
				message: `Workflow '${workflowData.name}' created successfully`,
				data: {
					name: workflowData.name,
					path: workflowPath,
					size: JSON.stringify(workflowJson).length,
				},
			},
			201,
		);
	} catch (error) {
		return c.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error creating workflow",
			},
			500,
		);
	}
});

/**
 * UPDATE WORKFLOW - Allow AI agents to update existing workflows
 */
mcpEditRoutes.put("/workflows/update", async (c) => {
	try {
		const body = await c.req.json();
		const validation = WorkflowCreateSchema.safeParse(body);

		if (!validation.success) {
			return c.json(
				{
					success: false,
					error: "Invalid workflow data",
					details: validation.error.issues,
				},
				400,
			);
		}

		const workflowData = validation.data;
		const workflowsDir = path.join(process.cwd(), "workflows", "json");
		const workflowPath = path.join(workflowsDir, `${workflowData.name}.json`);

		// Check if workflow exists
		let existingWorkflow: Record<string, unknown>;
		try {
			const existingContent = await fs.readFile(workflowPath, "utf-8");
			existingWorkflow = JSON.parse(existingContent);
		} catch {
			return c.json(
				{
					success: false,
					error: `Workflow '${workflowData.name}' not found. Use POST /workflows/create to create it.`,
				},
				404,
			);
		}

		// Update the workflow JSON
		const updatedWorkflow = {
			...existingWorkflow,
			name: workflowData.name,
			description: workflowData.description,
			version: workflowData.version,
			trigger: workflowData.trigger,
			steps: workflowData.steps,
			metadata: {
				...(existingWorkflow.metadata as Record<string, unknown>),
				lastModified: new Date().toISOString(),
				modifiedBy: "AI Agent via MCP",
				version: workflowData.version,
			},
		};

		// Write updated workflow to file
		await fs.writeFile(workflowPath, JSON.stringify(updatedWorkflow, null, 2));

		return c.json({
			success: true,
			message: `Workflow '${workflowData.name}' updated successfully`,
			data: {
				name: workflowData.name,
				path: workflowPath,
				version: workflowData.version,
				size: JSON.stringify(updatedWorkflow).length,
			},
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error updating workflow",
			},
			500,
		);
	}
});

/**
 * TEST WORKFLOW - Allow AI agents to test workflow execution
 */
mcpEditRoutes.post("/workflows/test", async (c) => {
	try {
		const body = await c.req.json();
		const validation = TestSchema.safeParse(body);

		if (!validation.success) {
			return c.json(
				{
					success: false,
					error: "Invalid test data",
					details: validation.error.issues,
				},
				400,
			);
		}

		const testData = validation.data;

		if (!testData.workflowName) {
			return c.json(
				{
					success: false,
					error: "workflowName is required for workflow testing",
				},
				400,
			);
		}

		const startTime = Date.now();

		// Make HTTP request to test the workflow
		const baseUrl = process.env.BLOK_HTTP_TRIGGER_URL || "http://localhost:4000";
		const testUrl = `${baseUrl}/${testData.workflowName}`;
		const method = "POST"; // Default to POST for testing
		const requestBody = testData.inputs ? JSON.stringify(testData.inputs) : undefined;

		const testResponse = await fetch(testUrl, {
			method,
			headers: {
				"Content-Type": "application/json",
			},
			body: requestBody,
		});

		const executionTime = Date.now() - startTime;
		const responseData = await testResponse.text();

		let parsedResponse: unknown;
		try {
			parsedResponse = JSON.parse(responseData);
		} catch {
			parsedResponse = responseData;
		}

		return c.json({
			success: testResponse.ok,
			executionTime: `${executionTime}ms`,
			status: testResponse.status,
			statusText: testResponse.statusText,
			data: parsedResponse,
			metadata: {
				testUrl,
				method,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error testing workflow",
				executionTime: "0ms",
			},
			500,
		);
	}
});

/**
 * CREATE NODE - Allow AI agents to create custom nodes
 */
mcpEditRoutes.post("/nodes/create", async (c) => {
	try {
		const body = await c.req.json();
		const validation = NodeCreateSchema.safeParse(body);

		if (!validation.success) {
			return c.json(
				{
					success: false,
					error: "Invalid node data",
					details: validation.error.issues,
				},
				400,
			);
		}

		const nodeData = validation.data;
		const nodesDir = path.join(process.cwd(), "nodes", nodeData.category);
		const nodeDir = path.join(nodesDir, `${nodeData.name}@1.0.0`);

		// Create node directory structure
		await fs.mkdir(nodeDir, { recursive: true });

		// Check if node already exists
		const configPath = path.join(nodeDir, "config.json");
		try {
			await fs.access(configPath);
			return c.json(
				{
					success: false,
					error: `Node '${nodeData.name}' already exists. Use PUT /nodes/update to modify it.`,
				},
				409,
			);
		} catch {
			// File doesn't exist - good to create
		}

		// Create config.json
		const config = {
			name: nodeData.name,
			category: nodeData.category,
			description: nodeData.description,
			version: "1.0.0",
			runtime: nodeData.runtime,
			inputs: nodeData.inputs || {},
			outputs: nodeData.outputs || {},
			metadata: {
				created: new Date().toISOString(),
				createdBy: "AI Agent via MCP",
			},
		};

		await fs.writeFile(configPath, JSON.stringify(config, null, 2));

		// Create index.ts with the code
		const indexPath = path.join(nodeDir, "index.ts");
		await fs.writeFile(indexPath, nodeData.code);

		// Create package.json
		const packageJson = {
			name: `@blok-nodes/${nodeData.name}`,
			version: "1.0.0",
			description: nodeData.description,
			main: "index.ts",
			scripts: {
				test: "vitest",
			},
			devDependencies: {
				vitest: "^1.0.0",
			},
		};

		const packagePath = path.join(nodeDir, "package.json");
		await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));

		return c.json(
			{
				success: true,
				message: `Node '${nodeData.name}' created successfully`,
				data: {
					name: nodeData.name,
					category: nodeData.category,
					path: nodeDir,
					files: ["config.json", "index.ts", "package.json"],
				},
			},
			201,
		);
	} catch (error) {
		return c.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error creating node",
			},
			500,
		);
	}
});

/**
 * UPDATE NODE - Allow AI agents to update existing nodes
 */
mcpEditRoutes.put("/nodes/update", async (c) => {
	try {
		const body = await c.req.json();
		const validation = NodeCreateSchema.safeParse(body);

		if (!validation.success) {
			return c.json(
				{
					success: false,
					error: "Invalid node data",
					details: validation.error.issues,
				},
				400,
			);
		}

		const nodeData = validation.data;
		const nodesDir = path.join(process.cwd(), "nodes", nodeData.category);
		const nodeDir = path.join(nodesDir, `${nodeData.name}@1.0.0`);

		// Check if node exists
		const configPath = path.join(nodeDir, "config.json");
		let existingConfig: Record<string, unknown>;
		try {
			const existingContent = await fs.readFile(configPath, "utf-8");
			existingConfig = JSON.parse(existingContent);
		} catch {
			return c.json(
				{
					success: false,
					error: `Node '${nodeData.name}' not found. Use POST /nodes/create to create it.`,
				},
				404,
			);
		}

		// Update config.json
		const updatedConfig = {
			...existingConfig,
			description: nodeData.description,
			inputs: nodeData.inputs || {},
			outputs: nodeData.outputs || {},
			metadata: {
				...(existingConfig.metadata as Record<string, unknown>),
				lastModified: new Date().toISOString(),
				modifiedBy: "AI Agent via MCP",
			},
		} as Record<string, unknown> & { version?: string };

		await fs.writeFile(configPath, JSON.stringify(updatedConfig, null, 2));

		// Update index.ts with the new code
		const indexPath = path.join(nodeDir, "index.ts");
		await fs.writeFile(indexPath, nodeData.code);

		return c.json({
			success: true,
			message: `Node '${nodeData.name}' updated successfully`,
			data: {
				name: nodeData.name,
				category: nodeData.category,
				path: nodeDir,
				version: (updatedConfig.version as string) || "1.0.0",
			},
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error updating node",
			},
			500,
		);
	}
});

/**
 * TEST NODE - Allow AI agents to test node execution
 */
mcpEditRoutes.post("/nodes/test", async (c) => {
	try {
		const body = await c.req.json();
		const validation = TestSchema.safeParse(body);

		if (!validation.success) {
			return c.json(
				{
					success: false,
					error: "Invalid test data",
					details: validation.error.issues,
				},
				400,
			);
		}

		const testData = validation.data;

		if (!testData.nodeName) {
			return c.json(
				{
					success: false,
					error: "nodeName is required for node testing",
				},
				400,
			);
		}

		const startTime = Date.now();

		// Create a test workflow that executes this single node
		const testWorkflow = {
			name: "node-test",
			description: `Test execution of node: ${testData.nodeName}`,
			version: "1.0.0",
			trigger: {
				http: {
					method: "POST",
					path: "/test",
					accept: "application/json",
				},
			},
			steps: [
				{
					name: "test-node",
					node: testData.nodeName,
					type: "module",
				},
			],
			nodes: {
				"test-node": {
					inputs: testData.inputs || {},
				},
			},
		};

		// Execute via HTTP trigger using remote node execution protocol
		const baseUrl = process.env.BLOK_HTTP_TRIGGER_URL || "http://localhost:4000";
		const base64Workflow = Buffer.from(
			JSON.stringify({
				request: {},
				workflow: testWorkflow,
			}),
		).toString("base64");

		const message = {
			Name: testData.nodeName,
			Message: base64Workflow,
			Encoding: "BASE64",
			Type: "JSON",
		};

		const testResponse = await fetch(`${baseUrl}/${testData.nodeName}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-blok-execute-node": "true",
			},
			body: JSON.stringify(message),
		});

		const executionTime = Date.now() - startTime;
		const responseData = await testResponse.text();

		let parsedResponse: unknown;
		try {
			parsedResponse = JSON.parse(responseData);
		} catch {
			parsedResponse = responseData;
		}

		return c.json({
			success: testResponse.ok,
			executionTime: `${executionTime}ms`,
			status: testResponse.status,
			statusText: testResponse.statusText,
			data: parsedResponse,
			metadata: {
				nodeName: testData.nodeName,
				inputs: testData.inputs || {},
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error testing node",
				executionTime: "0ms",
			},
			500,
		);
	}
});
