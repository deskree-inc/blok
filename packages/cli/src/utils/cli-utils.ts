import { dirname } from "node:path";
import type { OptionValues } from "commander";

// Simple request body creation from CLI options
export function createRequestBody(options: OptionValues): object {
	// Complete JSON context provided
	if (options.json) {
		return JSON.parse(options.json);
	}

	// Build from individual options
	return {
		body: options.body ? JSON.parse(options.body) : {},
		query: options.query ? JSON.parse(options.query) : {},
		headers: options.headers ? JSON.parse(options.headers) : {},
		params: options.params ? JSON.parse(options.params) : {},
	};
}

// Output formatting (reusable)
export async function formatOutput(data: unknown, format: string): Promise<void> {
	if (format === "json") {
		console.log(JSON.stringify(data, null, 0));
	} else if (format === "pretty") {
		console.log(JSON.stringify(data, null, 2));
	} else if (format.startsWith("file:")) {
		const { mkdir, writeFile } = await import("node:fs/promises");
		const filePath = format.replace("file:", "");
		const dir = dirname(filePath);

		await mkdir(dir, { recursive: true });
		await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
		console.log(`📄 Output written to: ${filePath}`);
	} else {
		// Default to pretty format for unknown formats
		console.log(JSON.stringify(data, null, 2));
	}
}
