import type { Express } from "express";
import HonoHttpTrigger from "./HonoHttpTrigger";
import HttpTrigger from "./HttpTrigger";

/**
 * HTTP Trigger Adapter - Provides seamless migration from Express to Hono
 *
 * Features:
 * - 100% backward compatibility with existing Express implementation
 * - Edge deployment capabilities via Hono
 * - Performance improvements while maintaining all existing functionality
 * - Gradual migration support
 */
export default class HttpTriggerAdapter {
	private useHono: boolean;
	private expressTrigger?: HttpTrigger;
	private honoTrigger?: HonoHttpTrigger;

	constructor(useHono = false) {
		this.useHono = useHono || process.env.USE_HONO === "true";

		if (this.useHono) {
			this.honoTrigger = new HonoHttpTrigger();
		} else {
			this.expressTrigger = new HttpTrigger();
		}
	}

	/**
	 * Get Express app instance for backward compatibility
	 */
	getApp(): Express {
		if (this.useHono && this.honoTrigger) {
			return this.honoTrigger.getApp();
		}

		if (this.expressTrigger) {
			return this.expressTrigger.getApp();
		}

		throw new Error("No HTTP trigger instance available");
	}

	/**
	 * Get Hono app instance for edge deployments
	 */
	getHonoApp() {
		if (this.useHono && this.honoTrigger) {
			return this.honoTrigger.getHonoApp();
		}
		throw new Error("Hono trigger not enabled. Set USE_HONO=true or pass useHono=true to constructor");
	}

	/**
	 * Get handler for edge runtime deployment (Cloudflare Workers, Vercel Edge, etc.)
	 */
	get handler() {
		if (this.useHono && this.honoTrigger) {
			return this.honoTrigger.handler;
		}
		throw new Error("Hono trigger not enabled. Edge deployment requires Hono.");
	}

	/**
	 * Start the HTTP server
	 */
	async listen(): Promise<number> {
		if (this.useHono && this.honoTrigger) {
			return await this.honoTrigger.listen();
		}

		if (this.expressTrigger) {
			return await this.expressTrigger.listen();
		}

		throw new Error("No HTTP trigger instance available");
	}

	/**
	 * Check which implementation is being used
	 */
	isUsingHono(): boolean {
		return this.useHono;
	}

	/**
	 * Get implementation details for logging/debugging
	 */
	getImplementationInfo() {
		return {
			framework: this.useHono ? "Hono" : "Express",
			edgeCapable: this.useHono,
			backwardCompatible: true,
			version: this.useHono ? "v4.8+" : "v4.21+",
		};
	}
}

// Export the actual trigger classes for direct usage if needed
export { HttpTrigger, HonoHttpTrigger };
