/**
 * HTTP Client for communicating with Blok HTTP Trigger
 */
export interface BlokMetadata {
	workflows: Array<{
		name: string;
		description: string;
		inputs: Record<string, unknown>;
		businessValue: string;
		category: "workflow";
	}>;
	nodes: Array<{
		name: string;
		description: string;
		inputs: Record<string, unknown>;
		runtime: string;
		businessValue: string;
		category: "node";
	}>;
}

export interface BlokExecutionResult {
	success: boolean;
	data?: unknown;
	error?: string;
	metadata?: {
		duration: number;
		timestamp: string;
	};
}

export class BlokHttpClient {
	constructor(
		private baseUrl: string,
		private token?: string,
	) {}

	/**
	 * Create headers with optional bearer token authentication
	 */
	private createHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...additionalHeaders,
		};

		// Add Authorization header only if token is provided
		if (this.token) {
			headers.Authorization = `Bearer ${this.token}`;
		}

		return headers;
	}

	/**
	 * Fetch available workflows and nodes from the HTTP Trigger
	 */
	async getMetadata(): Promise<BlokMetadata> {
		try {
			const response = await fetch(`${this.baseUrl}/mcp/metadata`, {
				method: "GET",
				headers: this.createHeaders(),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			return (await response.json()) as BlokMetadata;
		} catch (error) {
			throw new Error(`Failed to fetch metadata: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	}

	/**
	 * Execute a workflow via HTTP Trigger
	 */
	async executeWorkflow(workflowName: string, inputs: Record<string, unknown>): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();

			const response = await fetch(`${this.baseUrl}/${workflowName}`, {
				method: "POST",
				headers: this.createHeaders(),
				body: JSON.stringify(inputs),
			});

			const duration = Date.now() - startTime;
			const timestamp = new Date().toISOString();

			if (!response.ok) {
				const errorData = await response.text();
				return {
					success: false,
					error: `HTTP ${response.status}: ${errorData}`,
					metadata: { duration, timestamp },
				};
			}

			const data = await response.json();

			return {
				success: true,
				data,
				metadata: { duration, timestamp },
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				metadata: { duration: 0, timestamp: new Date().toISOString() },
			};
		}
	}

	/**
	 * Execute a node via HTTP Trigger using remote node execution protocol
	 */
	async executeNode(nodeName: string, inputs: Record<string, unknown>): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();

			// Use Blok SDK remote node execution protocol (similar to JavaScript SDK)
			const workflow = {
				name: "Remote Node",
				description: "Execution of remote node via MCP",
				version: "1.0.0",
				trigger: {
					http: {
						method: "POST",
						path: "*",
						accept: "application/json",
					},
				},
				steps: [
					{
						name: "node",
						node: nodeName,
						type: "module", // Default to module, can be enhanced later
					},
				],
				nodes: {
					node: {
						inputs: inputs,
					},
				},
			};

			const base64Workflow = btoa(JSON.stringify({ request: {}, workflow: workflow }));

			const message = {
				Name: nodeName,
				Message: base64Workflow,
				Encoding: "BASE64",
				Type: "JSON",
			};

			const response = await fetch(`${this.baseUrl}/${nodeName}`, {
				method: "POST",
				headers: this.createHeaders({
					"x-blok-execute-node": "true",
				}),
				body: JSON.stringify(message),
			});

			const duration = Date.now() - startTime;
			const timestamp = new Date().toISOString();

			if (!response.ok) {
				const errorData = await response.text();
				return {
					success: false,
					error: `HTTP ${response.status}: ${errorData}`,
					metadata: { duration, timestamp },
				};
			}

			const data = await response.json();

			return {
				success: true,
				data,
				metadata: { duration, timestamp },
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				metadata: { duration: 0, timestamp: new Date().toISOString() },
			};
		}
	}

	/**
	 * Health check for the HTTP Trigger
	 */
	async healthCheck(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/health-check`, {
				method: "GET",
				headers: this.createHeaders(),
			});
			return response.ok;
		} catch {
			return false;
		}
	}
}
