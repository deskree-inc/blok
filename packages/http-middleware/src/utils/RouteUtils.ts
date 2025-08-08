// Copy exact implementation from triggers/http/src/utils/Util.ts handleDynamicRoute function
import type { BlokRequest } from "../types";

export function handleDynamicRoute(configPath: string, req: BlokRequest): Record<string, string> {
	const params: Record<string, string> = {};

	if (!configPath || !req.path) {
		return params;
	}

	const configSegments = configPath.split("/").filter(Boolean);
	const requestSegments = req.path.split("/").filter(Boolean);

	// Extract dynamic parameters from route pattern like /:workflow
	for (let i = 0; i < configSegments.length; i++) {
		const configSegment = configSegments[i];
		const requestSegment = requestSegments[i];

		if (configSegment?.startsWith(":") && requestSegment) {
			const paramName = configSegment.slice(1); // Remove ':'
			params[paramName] = requestSegment;
		}
	}

	return params;
}

export function validateRoute(configPath: string, requestPath: string): boolean {
	if (!configPath || !requestPath) {
		return false;
	}

	const configSegments = configPath.split("/").filter(Boolean);
	const requestSegments = requestPath.split("/").filter(Boolean);

	if (configSegments.length !== requestSegments.length) {
		return false;
	}

	for (let i = 0; i < configSegments.length; i++) {
		const configSegment = configSegments[i];
		const requestSegment = requestSegments[i];

		// Dynamic parameter (starts with :)
		if (configSegment?.startsWith(":")) {
			continue; // Any value is valid for dynamic parameters
		}

		// Static segment must match exactly
		if (configSegment !== requestSegment) {
			return false;
		}
	}

	return true;
}

export function extractWorkflowName(path: string): string | null {
	const segments = path.split("/").filter(Boolean);
	return segments[segments.length - 1] || null;
}
