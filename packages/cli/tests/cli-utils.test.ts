import type { OptionValues } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequestBody, formatOutput } from "../src/utils/cli-utils.js";

// Mock fs/promises for file output testing
vi.mock("fs/promises", () => ({
	mkdir: vi.fn().mockResolvedValue(undefined),
	writeFile: vi.fn().mockResolvedValue(undefined),
}));

// Mock console.log for output testing
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

describe("CLI Utilities", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockConsoleLog.mockClear();
	});

	describe("createRequestBody", () => {
		it("should create request body from individual options", () => {
			const options: OptionValues = {
				body: '{"message": "test"}',
				query: '{"filter": "active"}',
				headers: '{"Authorization": "Bearer token"}',
				params: '{"userId": "123"}',
			};

			const result = createRequestBody(options);

			expect(result).toEqual({
				body: { message: "test" },
				query: { filter: "active" },
				headers: { Authorization: "Bearer token" },
				params: { userId: "123" },
			});
		});

		it("should handle empty options", () => {
			const options: OptionValues = {};

			const result = createRequestBody(options);

			expect(result).toEqual({
				body: {},
				query: {},
				headers: {},
				params: {},
			});
		});

		it("should use complete JSON context when provided", () => {
			const options: OptionValues = {
				json: '{"request": {"body": {"data": "test"}}, "vars": {"env": "prod"}}',
				// These should be ignored when json is provided
				body: '{"ignored": true}',
				query: '{"ignored": true}',
			};

			const result = createRequestBody(options);

			expect(result).toEqual({
				request: {
					body: { data: "test" },
				},
				vars: {
					env: "prod",
				},
			});
		});

		it("should handle invalid JSON gracefully", () => {
			const options: OptionValues = {
				body: "invalid json",
			};

			expect(() => createRequestBody(options)).toThrow();
		});
	});

	describe("formatOutput", () => {
		const testData = {
			workflow: "test-workflow",
			success: true,
			result: { message: "Hello World" },
		};

		it("should format output as JSON", async () => {
			await formatOutput(testData, "json");

			expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(testData, null, 0));
		});

		it("should format output as pretty JSON", async () => {
			await formatOutput(testData, "pretty");

			expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(testData, null, 2));
		});

		it("should write output to file", async () => {
			const fs = await import("node:fs/promises");

			await formatOutput(testData, "file:./test-results/output.json");

			expect(fs.mkdir).toHaveBeenCalledWith("./test-results", { recursive: true });
			expect(fs.writeFile).toHaveBeenCalledWith(
				"./test-results/output.json",
				JSON.stringify(testData, null, 2),
				"utf8",
			);
			expect(mockConsoleLog).toHaveBeenCalledWith("📄 Output written to: ./test-results/output.json");
		});

		it("should handle nested file paths", async () => {
			const fs = await import("node:fs/promises");

			await formatOutput(testData, "file:./deep/nested/path/output.json");

			expect(fs.mkdir).toHaveBeenCalledWith("./deep/nested/path", { recursive: true });
			expect(fs.writeFile).toHaveBeenCalledWith(
				"./deep/nested/path/output.json",
				JSON.stringify(testData, null, 2),
				"utf8",
			);
		});

		it("should default to pretty format for unknown formats", async () => {
			await formatOutput(testData, "unknown-format");

			expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(testData, null, 2));
		});
	});
});
