/**
 * Blok SDK Types for Node.js/Bun/Deno
 */

export interface BlokSDKConfig {
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
