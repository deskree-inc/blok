/**
 * Blok Browser SDK Types
 * Shared types for browser-based Blok SDK
 */

export interface BlokBrowserConfig {
	host: string;
	token?: string;
	debug?: boolean;
	timeout?: number;
}

export interface BlokResponse<T = unknown> {
	success: boolean;
	data: T | null;
	rawData?: string | Blob;
	errors?: BlokError[] | BlokError;
	contentType?: string;
	status?: number;
}

export interface BlokError {
	status?: number;
	message: string;
	code?: string;
}

export interface WorkflowDefinition {
	name: string;
	description: string;
	version: string;
	trigger: {
		http: {
			method: string;
			path: string;
			accept: string;
		};
	};
	steps: WorkflowStep[];
	nodes: Record<string, NodeConfiguration>;
}

export interface WorkflowStep {
	name: string;
	node: string;
	type: string;
}

export interface NodeConfiguration {
	inputs: Record<string, unknown>;
}

export interface BlokMessage {
	Name: string;
	Message: string;
	Encoding: string;
	Type: string;
}

export type RuntimeType = "runtime.python3" | "module" | "local";

export interface NodeExecutionOptions {
	timeout?: number;
	headers?: Record<string, string>;
}

// React-specific types
export interface UseBlokNodeOptions<T = unknown> extends NodeExecutionOptions {
	enabled?: boolean;
	onSuccess?: (data: T) => void;
	onError?: (error: BlokError[] | BlokError) => void;
}

export interface UseBlokNodeResult<T = unknown> {
	data: T | null;
	error: BlokError[] | BlokError | null;
	loading: boolean;
	execute: (inputs: Record<string, unknown>) => Promise<BlokResponse<T>>;
	reset: () => void;
}

export interface UseBlokWorkflowOptions<T = unknown> extends NodeExecutionOptions {
	enabled?: boolean;
	onSuccess?: (data: T) => void;
	onError?: (error: BlokError[] | BlokError) => void;
}

export interface UseBlokWorkflowResult<T = unknown> {
	data: T | null;
	error: BlokError[] | BlokError | null;
	loading: boolean;
	execute: (workflow: WorkflowDefinition, request?: Record<string, unknown>) => Promise<BlokResponse<T>>;
	reset: () => void;
}

// Vue-specific types
export interface BlokNodeComposableOptions<T = unknown> extends NodeExecutionOptions {
	immediate?: boolean;
	onSuccess?: (data: T) => void;
	onError?: (error: BlokError[] | BlokError) => void;
}

export interface BlokWorkflowComposableOptions<T = unknown> extends NodeExecutionOptions {
	immediate?: boolean;
	onSuccess?: (data: T) => void;
	onError?: (error: BlokError[] | BlokError) => void;
}
