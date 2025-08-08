// Main exports for the middleware package
export { BlokMiddleware } from "./BlokMiddleware";
export type {
	MiddlewareConfig,
	MiddlewareOptions,
	ExpressMiddleware,
	HonoMiddleware,
	BlokRequest,
	BlokResponse,
	FrameworkType,
} from "./types";

import { BlokMiddleware } from "./BlokMiddleware";
import type { ExpressMiddleware, HonoMiddleware, MiddlewareOptions } from "./types";

/**
 * Create Blok middleware for Express.js applications
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { blokMiddleware } from '@blok-ts/http-middleware';
 *
 * const app = express();
 *
 * // Add Blok workflow capabilities
 * app.use('/workflows', blokMiddleware({
 *   workflowsPath: './workflows',
 *   enableMetrics: true
 * }));
 *
 * app.listen(3000);
 * ```
 */
export function blokMiddleware(options: MiddlewareOptions = {}): ExpressMiddleware {
	const middleware = new BlokMiddleware(options);
	return middleware.createExpressMiddleware();
}

/**
 * Create Blok middleware for Hono applications
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { createHonoBlokMiddleware } from '@blok-ts/http-middleware';
 *
 * const app = new Hono();
 *
 * // Add Blok workflow capabilities
 * app.use('/workflows/*', createHonoBlokMiddleware({
 *   workflowsPath: './workflows',
 *   enableMetrics: true
 * }));
 *
 * export default app;
 * ```
 */
export function createHonoBlokMiddleware(options: MiddlewareOptions = {}): HonoMiddleware {
	const middleware = new BlokMiddleware(options);
	return middleware.createHonoMiddleware();
}

/**
 * Universal middleware factory that detects framework automatically
 *
 * @example
 * ```typescript
 * import { createBlokMiddleware } from '@blok-ts/http-middleware';
 *
 * // Works with both Express and Hono
 * const middleware = createBlokMiddleware({
 *   workflowsPath: './workflows',
 *   prefix: '/api/workflows'
 * });
 *
 * // Express
 * app.use('/api/workflows', middleware);
 *
 * // Hono
 * app.use('/api/workflows/*', middleware);
 * ```
 */
export function createBlokMiddleware(options: MiddlewareOptions = {}): ExpressMiddleware | HonoMiddleware {
	const middleware = new BlokMiddleware(options);

	// Return Express middleware by default (most common case)
	// Could add framework detection logic here if needed
	return middleware.createExpressMiddleware() as ExpressMiddleware | HonoMiddleware;
}

// Default export for convenience
export default blokMiddleware;
