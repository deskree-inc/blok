import type { NodeBase } from "@blok-ts/runner";
import type { NextFunction, Request, Response } from "express";
import type { Context as HonoContext } from "hono";

// Configuration for the middleware
export interface MiddlewareConfig {
	/** Registry of nodes (following Express.js pattern) */
	nodes?: Record<string, NodeBase | unknown>;
	/** Registry of workflows (following Express.js pattern) */
	workflows?: Record<string, unknown>;
	/** Path to workflows directory (fallback for auto-discovery) */
	workflowsPath?: string;
	/** Path to nodes directory (fallback for auto-discovery) */
	nodesPath?: string;
	/** Enable OpenTelemetry metrics collection */
	enableMetrics?: boolean;
	/** Request timeout in milliseconds */
	timeout?: number;
	/** Environment overrides */
	env?: Record<string, string>;
	/** Enable debug logging */
	debug?: boolean;
}

// Express middleware function type
export type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Hono middleware function type
export type HonoMiddleware = (c: HonoContext, next: () => Promise<void>) => Promise<void>;

// Universal request interface (mirrors HttpTrigger patterns)
export interface BlokRequest {
	params: Record<string, string>;
	query: Record<string, unknown>;
	method: string;
	path: string;
	headers: Record<string, string | undefined>;
	body: unknown;
	url: string;
	ip?: string;
}

// Universal response interface
export interface BlokResponse {
	status: (code: number) => BlokResponse;
	json: (data: unknown) => void;
	send: (data: string) => void;
	setHeader: (name: string, value: string) => void;
}

// Framework detection
export enum FrameworkType {
	EXPRESS = "express",
	HONO = "hono",
	UNKNOWN = "unknown",
}

// Middleware options for different frameworks
export interface MiddlewareOptions extends MiddlewareConfig {
	/** URL path prefix for workflow routes */
	prefix?: string;
	/** Framework-specific options */
	framework?: {
		type: FrameworkType;
		version?: string;
	};
}
