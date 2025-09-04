import child_process from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import util from "node:util";
import * as p from "@clack/prompts";

import { Command, type OptionValues, trackCommandExecution } from "../../services/commander.js";
import { tokenManager } from "../../services/local-token-manager.js";
import { manager as pm } from "../../services/package-manager.js";
import { registryManager } from "../../services/registry-manager.js";
import { cleanupNpmrcFile } from "../../services/utils.js";

interface NodeModule {
	importName: string; // e.g., 'awsGetAuthTokenCodeartifact'
	importPath: string; // e.g., '@local/aws-get-auth-token-codeartifact'
}

const discoveryNodeRuntime = async (): Promise<string> => {
	return "npm";
};

export async function install(opts: OptionValues) {
	const token = tokenManager.getToken();
	const npmrcFile = `${opts.directory}/.npmrc`;
	const logger = p.spinner();

	// --- .npmrc handling state ---
	let npmrcFileExisted = false;
	let appendedNpmrcContent = "";
	// ---

	try {
		if (!token) throw new Error("Token is invalid.");
		if (!opts.node) throw new Error("Node name is required.");
		// validate if node.ts file exists
		const nodeFilePath = path.resolve(opts.directory, "./src/Nodes.ts");
		if (!fs.existsSync(nodeFilePath)) {
			throw new Error("Node.ts file does not exist in the specified directory.");
		}
		// Validate if package.json file exists
		const packageJsonPath = path.resolve(opts.directory, "./package.json");
		if (!fs.existsSync(packageJsonPath)) {
			throw new Error("package.json file does not exist in the specified directory.");
		}

		const availableManagers = await pm.getAvailableManagers();
		let manager = await pm.getManager();

		logger.start("Installing node...");

		const runtime = await discoveryNodeRuntime();

		if (runtime === "npm" && availableManagers.length > 1) {
			logger.message("Multiple package managers detected. Please select one.");
			const selectedManager = await p.select({
				message: "Select the package manager",
				options: availableManagers.map((manager) => ({
					label: manager,
					value: manager,
				})),
			});
			manager = await pm.getManager(selectedManager as string);
		}

		// Get the registry token
		const registry = await registryManager.getRegistryToken(token);
		if (registry.error) throw new Error("Failed to get registry token.");

		// Create .npmrc file temporarily (append, don't overwrite)
		const REGISTRY_URL = `https://${registry.url}`;
		const npmrcContent = `@${registry.namespace}:registry=${REGISTRY_URL}\n//${registry.url}:_authToken=${registry.token}`;
		npmrcFileExisted = fs.existsSync(npmrcFile);
		appendedNpmrcContent = npmrcContent;
		fs.appendFileSync(npmrcFile, npmrcContent);
		logger.message("Appended .npmrc file for authentication.");

		// install the node
		const nodeName = `@${registry.namespace}/${opts.node}`;

		logger.message(`Installing node: ${opts.node}...`);
		const exec = util.promisify(child_process.exec);
		const { stdout, stderr } = await exec(
			manager.INSTALL_NODE({ node: nodeName, registry: REGISTRY_URL, npmrcDir: npmrcFile }),
			{ cwd: opts.directory },
		);

		if (stdout) p.log.info(stdout);
		else if (stderr) throw new Error(stderr);

		// Update Node.ts file
		updateNodeFile(nodeFilePath, {
			importName: toPascalCase(opts.node),
			importPath: nodeName,
		});

		logger.stop("Node installed successfully.");
	} catch (error) {
		logger.stop((error as Error).message, 1);
	} finally {
		cleanupNpmrcFile(npmrcFile, npmrcFileExisted, appendedNpmrcContent);
	}
}

function toPascalCase(input: string): string {
	return input.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase()).replace(/^./, (s) => s.toLowerCase());
}

function updateNodeFile(filePath: string, newModule: NodeModule) {
	let fileContent = fs.readFileSync(filePath, "utf-8");

	const { importName, importPath } = newModule;
	const importStatement = `import ${importName} from "${importPath}";`;

	// 1. Add import if not already there
	if (!fileContent.includes(importStatement)) {
		const importLines = fileContent.match(/^import .*;$/gm) || [];
		const lastImport = importLines[importLines.length - 1];
		fileContent = fileContent.replace(lastImport, `${lastImport}\n${importStatement}`);
	}

	// 2. Add to nodes object (append to the end)
	const nodesRegex = /const\s+nodes\s*:\s*\{[^}]+\}\s*=\s*\{([\s\S]*?)\n\};/;
	const match = fileContent.match(nodesRegex);

	if (!match) throw new Error("Could not find the `nodes` object.");

	const objectBody = match[1].trimEnd();
	const entryKey = importPath.replace(/^@[^/]+\//, ""); // e.g. 'aws-get-auth-token-codeartifact'
	const newEntry = `\t"${entryKey}": new ${importName}()`;

	if (objectBody.includes(`"${entryKey}"`)) {
		p.log.warn(`Node "${entryKey}" is already installed. Skipping...`);
		return;
	}

	// Append new entry after removing any trailing comma
	const lines = objectBody
		.split("\n")
		.filter(Boolean)
		.map((line) => line.trimEnd());

	if (lines.length > 0 && !lines[lines.length - 1].endsWith(",")) {
		lines[lines.length - 1] += ",";
	}

	lines.push(newEntry);

	const newObject = `const nodes: {\n\t[key: string]: NodeBase;\n} = {\n${lines.join("\n")}\n};`;

	fileContent = fileContent.replace(nodesRegex, newObject);

	// 3. Write back cleanly
	fs.writeFileSync(filePath, `${fileContent.trimEnd()}\n`, "utf-8");
}
// Login command
export default new Command()
	.command("node")
	.description("Install a node from the nanoservices registry")
	.option("-d, --directory <value>", "Directory to publish")
	.argument("<node>", "Node name")
	.action(async (node: string, options: OptionValues) => {
		await trackCommandExecution({
			command: "install",
			args: options,
			execution: async () => {
				options.node = node;
				if (!options.directory) options.directory = process.cwd();
				await install(options);
			},
		});
	});
