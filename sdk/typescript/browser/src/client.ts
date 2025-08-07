import type {
	BlokBrowserConfig,
	BlokError,
	BlokMessage,
	BlokResponse,
	NodeExecutionOptions,
	RuntimeType,
	WorkflowDefinition,
} from "./types";

export class BlokBrowserClient {
	public readonly host: string;
	private readonly token?: string;
	private readonly debug: boolean;
	private readonly timeout: number;
	private customHeaders: Record<string, string> = {};

	constructor(config: BlokBrowserConfig) {
		this.host = this.validateAndNormalizeHost(config.host || "http://localhost:4000");
		this.token = config.token;
		this.debug = config.debug || false;
		this.timeout = config.timeout || 30000;
	}

	private validateAndNormalizeHost(host: string): string {
		if (!host.includes("http://") && !host.includes("https://")) {
			throw new Error("Invalid host format. Please provide a valid host with http:// or https://");
		}
		return host;
	}

	public setHeaders(headers: Record<string, string>): void {
		this.customHeaders = { ...headers };
	}

	public async python3<T = unknown>(
		nodeName: string,
		inputs: Record<string, unknown>,
		options?: NodeExecutionOptions,
	): Promise<BlokResponse<T>> {
		return this.call<T>("runtime.python3", nodeName, inputs, options);
	}

	public async nodejs<T = unknown>(
		nodeName: string,
		inputs: Record<string, unknown>,
		type?: RuntimeType,
		options?: NodeExecutionOptions,
	): Promise<BlokResponse<T>> {
		return this.call<T>(type || "module", nodeName, inputs, options);
	}

	public async executeWorkflow<T = unknown>(
		workflow: WorkflowDefinition,
		request?: Record<string, unknown>,
		options?: NodeExecutionOptions,
	): Promise<BlokResponse<T>> {
		const workflowName = workflow.name.replace(/\s+/g, "-").toLowerCase();
		return this.callWorkflow<T>(workflow, request || {}, workflowName, options);
	}

	private async call<T = unknown>(
		runtime: RuntimeType | string,
		nodeName: string,
		inputs: Record<string, unknown>,
		options?: NodeExecutionOptions,
	): Promise<BlokResponse<T>> {
		const workflow: WorkflowDefinition = {
			name: "Remote Node",
			description: "Execution of remote node",
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
					type: runtime,
				},
			],
			nodes: {
				node: {
					inputs: inputs,
				},
			},
		};

		return this.callWorkflow<T>(workflow, {}, nodeName, options);
	}

	private async callWorkflow<T = unknown>(
		workflow: WorkflowDefinition,
		request: Record<string, unknown>,
		endpointName: string,
		options?: NodeExecutionOptions,
	): Promise<BlokResponse<T>> {
		const requestHeaders = this.buildHeaders(options?.headers);

		if (this.debug) {
			console.log("Request Headers", JSON.stringify(requestHeaders));
			console.log("Request Workflow", JSON.stringify(workflow));
		}

		const base64Workflow = btoa(JSON.stringify({ request, workflow }));

		const message: BlokMessage = {
			Name: endpointName,
			Message: base64Workflow,
			Encoding: "BASE64",
			Type: "JSON",
		};

		if (this.debug) {
			console.log("Request Message", JSON.stringify(message));
		}

		try {
			const fetchUrl = `${this.host}/${message.Name}`;
			if (this.debug) {
				console.log("Fetch URL", fetchUrl);
			}

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), options?.timeout || this.timeout);

			const response = await fetch(fetchUrl, {
				method: "POST",
				headers: requestHeaders,
				body: JSON.stringify(message),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			return await this.processResponse<T>(response);
		} catch (error) {
			return this.handleError(error);
		}
	}

	private buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			"x-blok-execute-node": "true",
			...this.customHeaders,
			...additionalHeaders,
		};

		if (this.token) {
			headers.Authorization = `Bearer ${this.token}`;
		}

		return headers;
	}

	private async processResponse<T>(response: Response): Promise<BlokResponse<T>> {
		const contentType = response.headers.get("content-type") || undefined;

		const sdkResponse: BlokResponse<T> = {
			success: response.ok,
			data: null,
			contentType,
			status: response.status,
		};

		if (!response.ok) {
			sdkResponse.success = false;

			if (contentType?.includes("application/json")) {
				try {
					const responseJson = await response.json();
					sdkResponse.errors = Array.isArray(responseJson)
						? responseJson.map((error: unknown) => ({
								status: response.status,
								...(error as Record<string, unknown>),
							}))
						: [
								{
									status: response.status,
									...responseJson,
								},
							];
				} catch {
					sdkResponse.errors = [
						{
							status: response.status,
							message: response.statusText,
						},
					];
				}
			} else {
				sdkResponse.errors = [
					{
						status: response.status,
						message: response.statusText,
					},
				];
			}

			return sdkResponse;
		}

		// Handle successful responses
		if (contentType?.includes("application/json")) {
			try {
				const responseJson = await response.json();
				sdkResponse.data = responseJson;
			} catch {
				const responseText = await response.text();
				sdkResponse.rawData = responseText;
			}
		} else if (contentType?.includes("text/")) {
			const responseText = await response.text();
			sdkResponse.rawData = responseText;
		} else if (
			contentType?.includes("application/pdf") ||
			contentType?.includes("application/octet-stream") ||
			contentType?.includes("image/") ||
			contentType?.includes("application/zip")
		) {
			const responseBlob = await response.blob();
			sdkResponse.rawData = responseBlob;
		} else {
			const responseRaw = await response.text();
			sdkResponse.rawData = responseRaw;
		}

		return sdkResponse;
	}

	private handleError<T>(error: unknown): BlokResponse<T> {
		const blokError: BlokError = {
			status: 500,
			message: error instanceof Error ? error.message : "Unexpected error",
		};

		if (error instanceof Error && error.name === "AbortError") {
			blokError.message = "Request timeout";
			blokError.code = "TIMEOUT";
		}

		return {
			success: false,
			data: null,
			errors: [blokError],
			contentType: undefined,
			status: 500,
		};
	}
}

// Factory function for easier usage
export function createBlokBrowserClient(config: BlokBrowserConfig): BlokBrowserClient {
	return new BlokBrowserClient(config);
}
