/**
 * Cross-platform base64 encoding utility
 * Works in Node.js, Bun, Deno, and browser environments
 */
export function encodeBase64(input: string): string {
	// Node.js and Bun
	if (typeof Buffer !== "undefined") {
		return Buffer.from(input, "utf8").toString("base64");
	}

	// Deno and modern browsers
	if (typeof btoa !== "undefined") {
		return btoa(input);
	}

	// Fallback for older environments
	throw new Error("No base64 encoding method available in this environment");
}

/**
 * Cross-platform base64 decoding utility
 */
export function decodeBase64(input: string): string {
	// Node.js and Bun
	if (typeof Buffer !== "undefined") {
		return Buffer.from(input, "base64").toString("utf8");
	}

	// Deno and modern browsers
	if (typeof atob !== "undefined") {
		return atob(input);
	}

	// Fallback for older environments
	throw new Error("No base64 decoding method available in this environment");
}
