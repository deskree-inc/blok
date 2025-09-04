import os from "node:os";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import type { PackageJson } from "type-fest";

export async function getPackageVersion() {
	// @ts-ignore
	const __filename = fileURLToPath(import.meta.url);

	const __dirname = dirname(__filename);
	const pkgJsonPath = path.join(__dirname, "..", "..", "package.json");

	const content = (await fs.readJSON(pkgJsonPath)) as PackageJson;
	return content?.version as string;
}

export function getPreferredEditor(): string {
	// Try to load user config
	const configPath = `${os.homedir()}/.nanoctl/config.json`;
	try {
		if (fs.existsSync(configPath)) {
			const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
			if (config.defaultEditor) {
				return config.defaultEditor;
			}
		}
	} catch (error) {
		// Silently fail and fall back to auto-detection
	}

	// Fall back to auto-detection
	return process.env.TERM_PROGRAM === "vscode"
		? "Visual Studio Code"
		: process.env.TERM_PROGRAM === "cursor"
			? "Cursor"
			: "Visual Studio Code";
}

export function cleanupNpmrcFile(npmrcFile: string, fileExisted: boolean, appendedContent: string) {
	if (!fs.existsSync(npmrcFile) || !appendedContent) return;

	if (fileExisted) {
		// Remove only the appended content if present at the end
		const fileContent = fs.readFileSync(npmrcFile, "utf8");
		if (fileContent.endsWith(appendedContent)) {
			const newContent = fileContent.slice(0, -appendedContent.length);
			fs.writeFileSync(npmrcFile, newContent);
		}
		// else: appended content is not at the end, do not modify the file
	} else {
		// File didn't exist before, so just remove it
		fs.unlinkSync(npmrcFile);
	}
}
