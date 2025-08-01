import type { OptionValues } from "commander";

/**
 * Validates non-interactive mode parameters for blokctl create commands
 * Provides clear error messages when required parameters are missing or invalid
 */
export function validateNonInteractiveParams(command: string, opts: OptionValues): void {
	if (!opts.nonInteractive) return;

	const errors: string[] = [];

	switch (command) {
		case "project":
			if (!opts.name) errors.push("--name is required in non-interactive mode");
			if (opts.trigger && !["http"].includes(opts.trigger)) {
				errors.push("--trigger must be 'http' (only available option)");
			}
			if (opts.runtimes && !opts.runtimes.split(",").every((r: string) => ["node"].includes(r))) {
				errors.push("--runtimes must be 'node' (only available option)");
			}
			if (opts.manager && !["npm", "yarn", "pnpm"].includes(opts.manager)) {
				errors.push("--manager must be one of: npm, yarn, pnpm");
			}
			break;

		case "node":
			if (!opts.name) errors.push("--name is required in non-interactive mode");
			if (opts.runtime && !["typescript"].includes(opts.runtime)) {
				errors.push("--runtime must be 'typescript' (only available option)");
			}
			if (opts.type && !["module", "class"].includes(opts.type)) {
				errors.push("--type must be 'module' or 'class'");
			}
			if (opts.template && !["class", "ui"].includes(opts.template)) {
				errors.push("--template must be 'class' or 'ui'");
			}
			if (opts.manager && !["npm", "yarn", "pnpm"].includes(opts.manager)) {
				errors.push("--manager must be one of: npm, yarn, pnpm");
			}
			break;

		case "workflow":
			if (!opts.name) errors.push("--name is required in non-interactive mode");
			break;

		default:
			errors.push(`Unknown command: ${command}`);
	}

	if (errors.length > 0) {
		throw new Error(`Non-interactive validation failed:\n${errors.join("\n")}\n\nUse --help for usage information.`);
	}
}
