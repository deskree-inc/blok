export interface ExecutionMetrics {
	timestamp: string;
	toolName: string;
	duration: number;
	success: boolean;
	error?: string;
	clientId?: string;
}

export interface PerformanceStats {
	totalExecutions: number;
	successRate: number;
	averageDuration: number;
	popularTools: Array<{ name: string; count: number }>;
	errorRate: number;
	recentExecutions: ExecutionMetrics[];
}

export interface SystemHealth {
	httpTriggerStatus: "online" | "offline" | "degraded";
	mcpServerStatus: "online" | "offline" | "degraded";
	toolsAvailable: number;
	lastHealthCheck: string;
}

export interface DashboardMetrics {
	performance: PerformanceStats;
	health: SystemHealth;
	realTimeData: {
		activeConnections: number;
		requestsPerMinute: number;
		timestamp: string;
	};
}

export class MetricsCollector {
	private executions: ExecutionMetrics[] = [];
	private readonly maxStoredExecutions = 1000;
	private httpTriggerUrl: string;
	private mcpServerUrl: string;

	constructor() {
		this.httpTriggerUrl = process.env.BLOK_HTTP_TRIGGER_URL || "http://localhost:4000";
		this.mcpServerUrl = process.env.MCP_SERVER_URL || "http://localhost:4001";
	}

	/**
	 * Record a tool execution
	 */
	recordExecution(metrics: ExecutionMetrics): void {
		this.executions.push(metrics);

		// Keep only the most recent executions
		if (this.executions.length > this.maxStoredExecutions) {
			this.executions = this.executions.slice(-this.maxStoredExecutions);
		}
	}

	/**
	 * Get comprehensive metrics for dashboard
	 */
	async getMetrics(): Promise<DashboardMetrics> {
		const now = new Date().toISOString();
		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
		const recentExecutions = this.executions.filter((e) => e.timestamp >= oneHourAgo);

		// Performance stats
		const totalExecutions = this.executions.length;
		const successfulExecutions = this.executions.filter((e) => e.success).length;
		const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

		const durations = this.executions.filter((e) => e.success).map((e) => e.duration);
		const averageDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

		// Popular tools
		const toolCounts = this.executions.reduce(
			(acc, exec) => {
				acc[exec.toolName] = (acc[exec.toolName] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		const popularTools = Object.entries(toolCounts)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		const errorRate = totalExecutions > 0 ? ((totalExecutions - successfulExecutions) / totalExecutions) * 100 : 0;

		// System health
		const health = await this.getSystemHealth();

		// Real-time data
		const recentMinute = new Date(Date.now() - 60 * 1000).toISOString();
		const requestsPerMinute = this.executions.filter((e) => e.timestamp >= recentMinute).length;

		return {
			performance: {
				totalExecutions,
				successRate: Math.round(successRate * 100) / 100,
				averageDuration: Math.round(averageDuration * 100) / 100,
				popularTools,
				errorRate: Math.round(errorRate * 100) / 100,
				recentExecutions: recentExecutions.slice(-50), // Last 50 executions
			},
			health,
			realTimeData: {
				activeConnections: 1, // TODO: Track actual connections
				requestsPerMinute,
				timestamp: now,
			},
		};
	}

	/**
	 * Check system health
	 */
	private async getSystemHealth(): Promise<SystemHealth> {
		const now = new Date().toISOString();
		let httpTriggerStatus: SystemHealth["httpTriggerStatus"] = "offline";
		let toolsAvailable = 0;

		try {
			// Check HTTP Trigger
			const response = await fetch(`${this.httpTriggerUrl}/health-check`, {
				timeout: 5000,
			} as RequestInit);

			if (response.ok) {
				httpTriggerStatus = "online";

				// Try to get metadata to count tools
				try {
					const metadataResponse = await fetch(`${this.httpTriggerUrl}/mcp/metadata`, {
						timeout: 5000,
					} as RequestInit);

					if (metadataResponse.ok) {
						const metadata = await metadataResponse.json();
						toolsAvailable = (metadata.workflows?.length || 0) + (metadata.nodes?.length || 0);
					}
				} catch (error) {
					console.warn("Failed to fetch metadata for tool count:", error);
				}
			} else {
				httpTriggerStatus = "degraded";
			}
		} catch (error) {
			console.warn("HTTP Trigger health check failed:", error);
			httpTriggerStatus = "offline";
		}

		return {
			httpTriggerStatus,
			mcpServerStatus: "online", // TODO: Implement MCP server health check
			toolsAvailable,
			lastHealthCheck: now,
		};
	}

	/**
	 * Get execution history for a specific tool
	 */
	getToolHistory(toolName: string, limit = 100): ExecutionMetrics[] {
		return this.executions
			.filter((e) => e.toolName === toolName)
			.slice(-limit)
			.reverse();
	}

	/**
	 * Get error summary
	 */
	getErrorSummary(): Array<{ error: string; count: number; lastOccurrence: string }> {
		const errorCounts = this.executions
			.filter((e) => !e.success && e.error)
			.reduce(
				(acc, exec) => {
					const error = exec.error;
					if (error && !acc[error]) {
						acc[error] = { count: 0, lastOccurrence: exec.timestamp };
					}
					if (error) {
						acc[error].count++;
						if (exec.timestamp > acc[error].lastOccurrence) {
							acc[error].lastOccurrence = exec.timestamp;
						}
					}
					return acc;
				},
				{} as Record<string, { count: number; lastOccurrence: string }>,
			);

		return Object.entries(errorCounts)
			.map(([error, data]) => ({ error, ...data }))
			.sort((a, b) => b.count - a.count);
	}

	/**
	 * Clear old metrics (for maintenance)
	 */
	clearOldMetrics(olderThanHours = 24): void {
		const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();
		this.executions = this.executions.filter((e) => e.timestamp >= cutoff);
	}
}
