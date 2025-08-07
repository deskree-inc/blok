import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BlokBrowserClient } from "./client";
import type {
	BlokBrowserConfig,
	BlokError,
	BlokResponse,
	NodeExecutionOptions,
	UseBlokNodeOptions,
	UseBlokNodeResult,
	UseBlokWorkflowOptions,
	UseBlokWorkflowResult,
	WorkflowDefinition,
} from "./types";

// Global client instance for hooks
let globalClient: BlokBrowserClient | null = null;

/**
 * Configure global Blok client for React hooks
 */
export function configureBlokClient(config: BlokBrowserConfig): void {
	globalClient = new BlokBrowserClient(config);
}

/**
 * Get the global Blok client instance
 */
export function useBlokClient(): BlokBrowserClient {
	if (!globalClient) {
		throw new Error("Blok client not configured. Call configureBlokClient() before using hooks.");
	}
	return globalClient;
}

/**
 * React hook for executing Python nodes with AI processing
 * Perfect for React frontends calling Python AI nodes
 */
export function useBlokPython3<T = unknown>(
	nodeName: string,
	options: UseBlokNodeOptions<T> = {},
): UseBlokNodeResult<T> {
	const client = useBlokClient();
	const [data, setData] = useState<T | null>(null);
	const [error, setError] = useState<BlokError[] | BlokError | null>(null);
	const [loading, setLoading] = useState(false);
	const optionsRef = useRef(options);
	optionsRef.current = options;

	const execute = useCallback(
		async (inputs: Record<string, unknown>): Promise<BlokResponse<T>> => {
			setLoading(true);
			setError(null);

			try {
				const response = await client.python3<T>(nodeName, inputs, {
					timeout: optionsRef.current.timeout,
					headers: optionsRef.current.headers,
				});

				if (response.success && response.data) {
					setData(response.data);
					optionsRef.current.onSuccess?.(response.data);
				} else {
					const errorData = response.errors || [{ message: "Unknown error", status: 500 }];
					setError(errorData);
					optionsRef.current.onError?.(errorData);
				}

				return response;
			} catch (err) {
				const errorData: BlokError = {
					message: err instanceof Error ? err.message : "Unexpected error",
					status: 500,
				};
				setError(errorData);
				optionsRef.current.onError?.(errorData);

				return {
					success: false,
					data: null,
					errors: errorData,
				};
			} finally {
				setLoading(false);
			}
		},
		[client, nodeName],
	);

	const reset = useCallback(() => {
		setData(null);
		setError(null);
		setLoading(false);
	}, []);

	return { data, error, loading, execute, reset };
}

/**
 * React hook for executing Node.js modules
 * Great for API integrations and TypeScript processing
 */
export function useBlokNodeJS<T = unknown>(
	nodeName: string,
	nodeType: "module" | "local" = "module",
	options: UseBlokNodeOptions<T> = {},
): UseBlokNodeResult<T> {
	const client = useBlokClient();
	const [data, setData] = useState<T | null>(null);
	const [error, setError] = useState<BlokError[] | BlokError | null>(null);
	const [loading, setLoading] = useState(false);
	const optionsRef = useRef(options);
	optionsRef.current = options;

	const execute = useCallback(
		async (inputs: Record<string, unknown>): Promise<BlokResponse<T>> => {
			setLoading(true);
			setError(null);

			try {
				const response = await client.nodejs<T>(nodeName, inputs, nodeType, {
					timeout: optionsRef.current.timeout,
					headers: optionsRef.current.headers,
				});

				if (response.success && response.data) {
					setData(response.data);
					optionsRef.current.onSuccess?.(response.data);
				} else {
					const errorData = response.errors || [{ message: "Unknown error", status: 500 }];
					setError(errorData);
					optionsRef.current.onError?.(errorData);
				}

				return response;
			} catch (err) {
				const errorData: BlokError = {
					message: err instanceof Error ? err.message : "Unexpected error",
					status: 500,
				};
				setError(errorData);
				optionsRef.current.onError?.(errorData);

				return {
					success: false,
					data: null,
					errors: errorData,
				};
			} finally {
				setLoading(false);
			}
		},
		[client, nodeName, nodeType],
	);

	const reset = useCallback(() => {
		setData(null);
		setError(null);
		setLoading(false);
	}, []);

	return { data, error, loading, execute, reset };
}

/**
 * React hook for executing complete workflows
 * Perfect for complex data processing pipelines
 */
export function useBlokWorkflow<T = unknown>(options: UseBlokWorkflowOptions<T> = {}): UseBlokWorkflowResult<T> {
	const client = useBlokClient();
	const [data, setData] = useState<T | null>(null);
	const [error, setError] = useState<BlokError[] | BlokError | null>(null);
	const [loading, setLoading] = useState(false);
	const optionsRef = useRef(options);
	optionsRef.current = options;

	const execute = useCallback(
		async (workflow: WorkflowDefinition, request?: Record<string, unknown>): Promise<BlokResponse<T>> => {
			setLoading(true);
			setError(null);

			try {
				const response = await client.executeWorkflow<T>(workflow, request, {
					timeout: optionsRef.current.timeout,
					headers: optionsRef.current.headers,
				});

				if (response.success && response.data) {
					setData(response.data);
					optionsRef.current.onSuccess?.(response.data);
				} else {
					const errorData = response.errors || [{ message: "Unknown error", status: 500 }];
					setError(errorData);
					optionsRef.current.onError?.(errorData);
				}

				return response;
			} catch (err) {
				const errorData: BlokError = {
					message: err instanceof Error ? err.message : "Unexpected error",
					status: 500,
				};
				setError(errorData);
				optionsRef.current.onError?.(errorData);

				return {
					success: false,
					data: null,
					errors: errorData,
				};
			} finally {
				setLoading(false);
			}
		},
		[client],
	);

	const reset = useCallback(() => {
		setData(null);
		setError(null);
		setLoading(false);
	}, []);

	return { data, error, loading, execute, reset };
}

/**
 * Higher-order component for providing Blok client context
 */
export interface BlokProviderProps {
	config: BlokBrowserConfig;
	children: React.ReactNode;
}

export function BlokProvider({ config, children }: BlokProviderProps): JSX.Element {
	useEffect(() => {
		configureBlokClient(config);
	}, [config]);

	return <>{children}</>;
}

/**
 * Pre-configured hook for AI sentiment analysis
 * Example of specialized AI processing hook
 */
export function useBlokSentiment() {
	return useBlokPython3<{ sentiment: string; confidence: number; score: number }>("sentiment-analyzer");
}

/**
 * Pre-configured hook for image processing
 * Example of specialized AI vision processing
 */
export function useBlokImageAnalysis() {
	return useBlokPython3<{ objects: string[]; confidence: number[]; boundingBoxes: number[][] }>("image-analyzer");
}

/**
 * Pre-configured hook for text summarization
 * Example of specialized NLP processing
 */
export function useBlokTextSummarizer() {
	return useBlokPython3<{ summary: string; keyPoints: string[]; originalLength: number; summaryLength: number }>(
		"text-summarizer",
	);
}
