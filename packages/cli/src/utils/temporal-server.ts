import { type Server, createServer as createHttpServer } from "node:http";
import { createServer } from "node:net";

// Simplified config interface for CLI
export interface TemporalServerConfig {
	workflowsPath?: string;
	nodesPath?: string;
	timeout?: number;
	enableMetrics?: boolean;
	debug?: boolean;
	env?: Record<string, string | undefined>;
}

export class TemporalBlokServer {
	private server: Server | null = null;
	private port = 0;

	async start(config: TemporalServerConfig): Promise<number> {
		// Find available port in safe range
		this.port = await this.findAvailablePort(8000, 9000);

		// Create simple HTTP server for MVP (will integrate middleware later)
		this.server = createHttpServer(async (req, res) => {
			// Health check endpoint
			if (req.url === "/health-check") {
				res.statusCode = 200;
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify({ status: "healthy" }));
				return;
			}

			// For now, return a basic response (MVP implementation)
			res.statusCode = 200;
			res.setHeader("Content-Type", "application/json");
			res.end(
				JSON.stringify({
					message: "Temporal server running",
					config: {
						workflowsPath: config.workflowsPath,
						nodesPath: config.nodesPath,
					},
				}),
			);
		});

		this.server.listen(this.port, "127.0.0.1");

		// Wait for server ready
		await this.waitForServerReady();

		return this.port;
	}

	async shutdown(): Promise<void> {
		if (this.server) {
			return new Promise((resolve) => {
				this.server?.close(() => {
					this.server = null;
					resolve();
				});
			});
		}
	}

	private async findAvailablePort(start: number, end: number): Promise<number> {
		for (let port = start; port <= end; port++) {
			if (await this.isPortFree(port)) {
				return port;
			}
		}

		throw new Error(`No available ports in range ${start}-${end}`);
	}

	private async isPortFree(port: number): Promise<boolean> {
		return new Promise((resolve) => {
			const server = createServer();
			server.listen(port, "127.0.0.1", () => {
				server.close(() => resolve(true));
			});
			server.on("error", () => resolve(false));
		});
	}

	private async waitForServerReady(): Promise<void> {
		// Simple health check with retry
		for (let i = 0; i < 10; i++) {
			try {
				const response = await fetch(`http://127.0.0.1:${this.port}/health-check`);
				if (response.ok) return;
			} catch {}
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		throw new Error("Temporal server failed to start");
	}
}
