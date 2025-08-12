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
		method: string;
		path: string;
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
		return this.executeWorkflowWithMethod(workflowName, inputs, "POST");
	}

	/**
	 * Execute a workflow via HTTP Trigger with specific HTTP method
	 */
	async executeWorkflowWithMethod(
		workflowName: string,
		inputs: Record<string, unknown>,
		method: string,
	): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();

			// For GET requests, convert inputs to query parameters
			let url = `${this.baseUrl}/${workflowName}`;
			let body: string | undefined;

			if (method.toUpperCase() === "GET" && Object.keys(inputs).length > 0) {
				const queryParams = new URLSearchParams();
				for (const [key, value] of Object.entries(inputs)) {
					queryParams.append(key, String(value));
				}
				url += `?${queryParams.toString()}`;
			} else if (method.toUpperCase() !== "GET") {
				body = JSON.stringify(inputs);
			}

			const response = await fetch(url, {
				method: method.toUpperCase(),
				headers: this.createHeaders(),
				body: body,
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
	 * AI Agent Guidance - Get framework overview and learning path
	 */
	async getAiGuidance(): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();
			const response = await fetch(`${this.baseUrl}/mcp/guidance/start`, {
				method: "GET",
				headers: this.createHeaders(),
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
	 * Validate workflow structure
	 */
	async validateWorkflow(workflowData: Record<string, unknown>): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();
			const response = await fetch(`${this.baseUrl}/mcp/workflows/validate`, {
				method: "POST",
				headers: this.createHeaders(),
				body: JSON.stringify(workflowData),
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
	 * Search documentation
	 */
	async searchDocs(query: string, maxResults?: number): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();
			const response = await fetch(`${this.baseUrl}/mcp/docs/search`, {
				method: "POST",
				headers: this.createHeaders(),
				body: JSON.stringify({ query, maxResults }),
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
	 * Get framework overview
	 */
	async getFrameworkInfo(): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();
			const response = await fetch(`${this.baseUrl}/mcp/docs/blok`, {
				method: "GET",
				headers: this.createHeaders(),
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
	 * Discover available nodes
	 */
	async discoverNodes(): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();
			const response = await fetch(`${this.baseUrl}/mcp/nodes`, {
				method: "GET",
				headers: this.createHeaders(),
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
	 * Get detailed node information
	 */
	async getNodeDetails(nodeName: string): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();
			const response = await fetch(`${this.baseUrl}/mcp/nodes/${nodeName}`, {
				method: "GET",
				headers: this.createHeaders(),
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
	 * Search for nodes by functionality
	 */
	async searchNodes(query: string, category?: string): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();
			const response = await fetch(`${this.baseUrl}/mcp/nodes/search`, {
				method: "POST",
				headers: this.createHeaders(),
				body: JSON.stringify({ query, category }),
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
	 * CREATE WORKFLOW - Allow AI agents to create new workflows
	 */
	async createWorkflow(workflowData: Record<string, unknown>): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();
			const response = await fetch(`${this.baseUrl}/mcp/workflows/create`, {
				method: "POST",
				headers: this.createHeaders(),
				body: JSON.stringify(workflowData),
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
	 * UPDATE WORKFLOW - Allow AI agents to update existing workflows
	 */
	async updateWorkflow(workflowData: Record<string, unknown>): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();
			const response = await fetch(`${this.baseUrl}/mcp/workflows/update`, {
				method: "PUT",
				headers: this.createHeaders(),
				body: JSON.stringify(workflowData),
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
	 * TEST WORKFLOW - Allow AI agents to test workflow execution
	 */
	async testWorkflow(workflowName: string, inputs?: Record<string, unknown>): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();
			const response = await fetch(`${this.baseUrl}/mcp/workflows/test`, {
				method: "POST",
				headers: this.createHeaders(),
				body: JSON.stringify({ workflowName, inputs }),
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
	 * CREATE NODE - Allow AI agents to create custom nodes
	 */
	async createNode(nodeData: Record<string, unknown>): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();
			const response = await fetch(`${this.baseUrl}/mcp/nodes/create`, {
				method: "POST",
				headers: this.createHeaders(),
				body: JSON.stringify(nodeData),
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
	 * UPDATE NODE - Allow AI agents to update existing nodes
	 */
	async updateNode(nodeData: Record<string, unknown>): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();
			const response = await fetch(`${this.baseUrl}/mcp/nodes/update`, {
				method: "PUT",
				headers: this.createHeaders(),
				body: JSON.stringify(nodeData),
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
	 * TEST NODE - Allow AI agents to test node execution
	 */
	async testNode(nodeName: string, inputs?: Record<string, unknown>): Promise<BlokExecutionResult> {
		try {
			const startTime = Date.now();
			const response = await fetch(`${this.baseUrl}/mcp/nodes/test`, {
				method: "POST",
				headers: this.createHeaders(),
				body: JSON.stringify({ nodeName, inputs }),
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
