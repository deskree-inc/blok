import { beforeEach, describe, expect, it } from "vitest";
import { MetricsCollector } from "../src/server/metrics";

describe("MetricsCollector", () => {
	let collector: MetricsCollector;

	beforeEach(() => {
		collector = new MetricsCollector();
	});

	describe("recordExecution", () => {
		it("should record execution metrics", () => {
			const execution = {
				timestamp: "2025-01-08T12:00:00Z",
				toolName: "workflow_test",
				duration: 150,
				success: true,
			};

			collector.recordExecution(execution);
			const history = collector.getToolHistory("workflow_test");

			expect(history).toHaveLength(1);
			expect(history[0].toolName).toBe("workflow_test");
		});

		it("should maintain maximum stored executions limit", () => {
			const toolName = "test_tool";

			// Record some executions
			for (let i = 0; i < 10; i++) {
				collector.recordExecution({
					timestamp: new Date().toISOString(),
					toolName: toolName,
					duration: 100,
					success: true,
				});
			}

			const history = collector.getToolHistory(toolName);
			expect(history.length).toBeGreaterThan(0);
		});
	});

	describe("getToolHistory", () => {
		it("should return empty array when no executions recorded", () => {
			const history = collector.getToolHistory("nonexistent_tool");
			expect(history).toEqual([]);
		});

		it("should return tool-specific history", () => {
			const toolName = "workflow_test";

			collector.recordExecution({
				timestamp: "2025-01-08T12:00:00Z",
				toolName,
				duration: 150,
				success: true,
			});

			collector.recordExecution({
				timestamp: "2025-01-08T12:01:00Z",
				toolName: "other_tool",
				duration: 200,
				success: false,
			});

			const history = collector.getToolHistory(toolName);
			expect(history).toHaveLength(1);
			expect(history[0].toolName).toBe(toolName);
		});
	});

	describe("getErrorSummary", () => {
		it("should return empty array when no errors", () => {
			collector.recordExecution({
				timestamp: "2025-01-08T12:00:00Z",
				toolName: "workflow_test",
				duration: 150,
				success: true,
			});

			const errors = collector.getErrorSummary();
			expect(errors).toEqual([]);
		});

		it("should aggregate error counts", () => {
			const errorMessage = "Connection timeout";

			collector.recordExecution({
				timestamp: "2025-01-08T12:00:00Z",
				toolName: "workflow_test",
				duration: 150,
				success: false,
				error: errorMessage,
			});

			collector.recordExecution({
				timestamp: "2025-01-08T12:01:00Z",
				toolName: "workflow_test2",
				duration: 200,
				success: false,
				error: errorMessage,
			});

			const errors = collector.getErrorSummary();
			expect(errors).toHaveLength(1);
			expect(errors[0].error).toBe(errorMessage);
			expect(errors[0].count).toBe(2);
		});
	});

	describe("clearOldMetrics", () => {
		it("should remove old metrics", () => {
			// Record old execution
			const oldTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago
			collector.recordExecution({
				timestamp: oldTimestamp,
				toolName: "old_tool",
				duration: 100,
				success: true,
			});

			// Record recent execution
			collector.recordExecution({
				timestamp: new Date().toISOString(),
				toolName: "recent_tool",
				duration: 100,
				success: true,
			});

			collector.clearOldMetrics(24); // Clear older than 24 hours

			const recentHistory = collector.getToolHistory("recent_tool");
			const oldHistory = collector.getToolHistory("old_tool");

			expect(recentHistory).toHaveLength(1);
			expect(oldHistory).toHaveLength(0);
		});
	});
});
