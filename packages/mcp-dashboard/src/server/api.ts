import { Router } from "express";
import type { MetricsCollector } from "./metrics";

export class DashboardAPI {
	private router: Router;

	constructor(private metricsCollector: MetricsCollector) {
		this.router = Router();
		this.setupRoutes();
	}

	private setupRoutes(): void {
		// Get current metrics
		this.router.get("/metrics", async (req, res) => {
			try {
				const metrics = await this.metricsCollector.getMetrics();
				res.json(metrics);
			} catch (error) {
				console.error("Error fetching metrics:", error);
				res.status(500).json({ error: "Failed to fetch metrics" });
			}
		});

		// Get tool history
		this.router.get("/tools/:toolName/history", (req, res) => {
			try {
				const { toolName } = req.params;
				const limit = Number.parseInt(req.query.limit as string) || 100;
				const history = this.metricsCollector.getToolHistory(toolName, limit);
				res.json(history);
			} catch (error) {
				console.error("Error fetching tool history:", error);
				res.status(500).json({ error: "Failed to fetch tool history" });
			}
		});

		// Get error summary
		this.router.get("/errors", (req, res) => {
			try {
				const errorSummary = this.metricsCollector.getErrorSummary();
				res.json(errorSummary);
			} catch (error) {
				console.error("Error fetching error summary:", error);
				res.status(500).json({ error: "Failed to fetch error summary" });
			}
		});

		// Record a new execution (for testing or external integrations)
		this.router.post("/executions", (req, res) => {
			try {
				const execution = req.body;

				// Validate required fields
				if (!execution.toolName || !execution.timestamp || execution.success === undefined) {
					res.status(400).json({
						error: "Missing required fields: toolName, timestamp, success",
					});
					return;
				}

				this.metricsCollector.recordExecution(execution);
				res.status(201).json({ message: "Execution recorded successfully" });
			} catch (error) {
				console.error("Error recording execution:", error);
				res.status(500).json({ error: "Failed to record execution" });
			}
		});

		// Health check endpoint
		this.router.get("/health", (req, res) => {
			res.json({
				status: "healthy",
				timestamp: new Date().toISOString(),
				service: "mcp-dashboard",
			});
		});

		// Clear old metrics (maintenance endpoint)
		this.router.post("/maintenance/clear-old-metrics", (req, res) => {
			try {
				const hours = Number.parseInt(req.query.hours as string) || 24;
				this.metricsCollector.clearOldMetrics(hours);
				res.json({
					message: `Cleared metrics older than ${hours} hours`,
					timestamp: new Date().toISOString(),
				});
			} catch (error) {
				console.error("Error clearing old metrics:", error);
				res.status(500).json({ error: "Failed to clear old metrics" });
			}
		});
	}

	getRouter(): Router {
		return this.router;
	}
}
