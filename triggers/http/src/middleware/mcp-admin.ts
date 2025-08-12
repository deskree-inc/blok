import type { Context as HonoContext, Next } from "hono";

/**
 * Security middleware to protect MCP admin endpoints
 * Returns 404 when ENABLE_MCP_ADMIN is not set to true
 */
export const mcpAdminMiddleware = async (c: HonoContext, next: Next) => {
	// Block access when ENABLE_MCP_ADMIN is not enabled
	if (process.env.ENABLE_MCP_ADMIN !== "true") {
		return c.notFound();
	}

	return await next();
};
