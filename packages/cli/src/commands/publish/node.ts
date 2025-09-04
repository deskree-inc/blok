import child_process from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import util from "node:util";
import * as p from "@clack/prompts";

import { Command, type OptionValues, trackCommandExecution } from "../../services/commander.js";
import { tokenManager } from "../../services/local-token-manager.js";
import { VersionUpdateType, manager as pm } from "../../services/package-manager.js";
import { registryManager } from "../../services/registry-manager.js";
import { cleanupNpmrcFile } from "../../services/utils.js";

const exec = util.promisify(child_process.exec);

const packagePublisherRuntimes = [
	{
		label: "node",
		value: "npm",
	},
	// {
	//     label: "python",
	//     value: "pip"
	// }
];

const packagePublishVerion = [VersionUpdateType.PATCH, VersionUpdateType.MINOR, VersionUpdateType.MAJOR];

function findSimilarDirectories(directory: string, searchTerm: string): string[] {
	if (!fs.existsSync(directory)) return [];

	const dirs = fs.readdirSync(directory).filter((file) => fs.statSync(path.join(directory, file)).isDirectory());

	return dirs.filter((dir) => {
		const dirName = dir.toLowerCase();
		const search = searchTerm.toLowerCase();

		// Exact match gets highest priority
		if (dirName === search) return true;

		// Check if search term is a substring at the start
		if (dirName.startsWith(search)) return true;

		// Check if words in the dirname start with the search term
		const words = dirName.split(/[-_]/);
		if (words.some((word) => word.startsWith(search))) return true;

		// If search term is 3 or more chars, allow for partial matches
		if (search.length >= 3) {
			// Calculate similarity (more than 50% of chars match in sequence)
			let matches = 0;
			let searchIndex = 0;

			for (let i = 0; i < dirName.length && searchIndex < search.length; i++) {
				if (dirName[i] === search[searchIndex]) {
					matches++;
					searchIndex++;
				}
			}

			return matches >= search.length * 0.5;
		}

		return false;
	});
}

async function loadNodeDirectories(baseDir: string): Promise<{ label: string; value: string }[]> {
	const nodesDir = path.join(baseDir, "src/nodes");
	if (!fs.existsSync(nodesDir)) {
		throw new Error("src/nodes directory not found");
	}

	const dirs = fs.readdirSync(nodesDir).filter((file) => fs.statSync(path.join(nodesDir, file)).isDirectory());

	return dirs.map((dir) => ({
		label: dir,
		value: dir,
	}));
}

export async function publish(opts: OptionValues) {
	const token = tokenManager.getToken();
	const npmrcFile = `${opts.directory}/.npmrc`;
	const logger = p.spinner();
	let packageJsonOriginal: {
		name: string;
		[key: string]: string | boolean | Record<string, string> | string[];
	} | null = null;

	// --- .npmrc handling state ---
	let npmrcFileExisted = false;
	let appendedNpmrcContent = "";
	// ---

	try {
		if (!token) throw new Error("Authentication token not found. Please run 'nanoctl login' before publishing.");
		if (!opts.directory) throw new Error("Directory is required.");

		logger.start("Publishing node to the registry...");

		// Special case: if node is ".", use the current directory
		if (opts.node === ".") {
			// Keep the current directory, no need to search
			logger.message("Using current directory for publishing");
		} else {
			// Check if the specified node exists in src/nodes
			const nodesDir = path.join(opts.directory, "src/nodes");
			let targetNodeDir: string;

			if (opts.node) {
				const nodePath = path.join(nodesDir, opts.node);
				if (!fs.existsSync(nodePath)) {
					// Search for similar directories
					const similarDirs = findSimilarDirectories(nodesDir, opts.node);
					if (similarDirs.length > 0) {
						logger.message("Similar nodes found");
						const selection = await p.select({
							message: "Select a node to publish",
							options: similarDirs.map((dir) => ({
								label: dir,
								value: dir,
							})),
						});

						if (p.isCancel(selection)) {
							throw new Error("Operation cancelled");
						}

						targetNodeDir = selection;
						opts.directory = path.join(nodesDir, targetNodeDir);
					} else {
						throw new Error(`Node "${opts.node}" not found and no similar nodes found in src/nodes directory`);
					}
				} else {
					targetNodeDir = opts.node;
					opts.directory = nodePath;
				}
			} else {
				// List all nodes
				logger.message("Select a node to publish");
				const nodeOptions = await loadNodeDirectories(opts.directory);

				if (nodeOptions.length === 0) {
					throw new Error("No nodes found in src/nodes directory");
				}

				const selection = await p.select({
					message: "Select a node to publish",
					options: nodeOptions,
				});

				if (p.isCancel(selection)) {
					throw new Error("Operation cancelled");
				}

				targetNodeDir = selection;
				opts.directory = path.join(nodesDir, targetNodeDir);
			}
		}

		const runtimesToPublish = await p.select({
			message: "Select node runtime",
			options: packagePublisherRuntimes,
			initialValue: "npm",
		});

		const manager = await pm.getManager(runtimesToPublish as string);

		const versionType = await p.select({
			message: "Select the version bump type",
			options: packagePublishVerion.map((v) => ({ label: v, value: v })),
			initialValue: "patch",
		});

		if (opts.build) {
			logger.start("Running build before publishing...");
			const { stderr: buildError } = await exec(manager.BUILD, { cwd: opts.directory });
			if (buildError) {
				logger.stop(buildError);
				throw new Error(`Error running build: ${buildError}`);
			}
			logger.stop("Build completed successfully.");
		}

		// Update the version in package.json
		logger.message(`Updating package version to ${String(versionType)}...`);
		const { stderr: versionError } = await exec(manager.UPDATE_VERSION({ type: versionType as VersionUpdateType }), {
			cwd: opts.directory,
		});
		if (versionError) {
			throw new Error(`Error updating package version: ${versionError}`);
		}

		// Get the registry token
		const registry = await registryManager.getRegistryToken(token);
		if (registry.error) throw new Error("Failed to get registry token.");

		// Create .npmrc file temporarily (append, don't overwrite)
		const REGISTRY_URL = `https://${registry.url}`;
		const npmrcContent = `registry=${REGISTRY_URL}\n//${registry.url}:_authToken=${registry.token}`;
		npmrcFileExisted = fs.existsSync(npmrcFile);
		appendedNpmrcContent = npmrcContent;
		fs.appendFileSync(npmrcFile, npmrcContent);
		logger.message("Appended authentication to .npmrc file.");

		// Update package.json to add scoped registry
		const packageJsonPath = `${opts.directory}/package.json`;
		if (!fs.existsSync(packageJsonPath)) {
			logger.stop("package.json not found in the specified directory.");
			throw new Error("package.json not found in the specified directory.");
		}
		packageJsonOriginal = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
		const packageJson = { ...packageJsonOriginal };

		if (!packageJson.name) {
			logger.stop("package.json does not have a name field.");
			throw new Error("package.json does not have a name field.");
		}

		if (packageJson.name.startsWith("@") && !packageJson.name.startsWith(`@${registry.namespace}`)) {
			throw new Error("If you are publishing to the nanoservices registry, the package.json shouldn't be scoped.");
		}
		if (!packageJson.name.startsWith(`@${registry.namespace}`)) {
			packageJson.name = `@${registry.namespace}/${packageJson.name}`;
			packageJson.private = false;
			packageJson.files = ["dist"];
		}

		fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

		// publish the node
		const { stdout } = await exec(manager.PUBLISH({ registry: REGISTRY_URL, npmrcDir: npmrcFile }), {
			cwd: opts.directory,
		});

		const publishResult = JSON.parse(stdout);
		if (publishResult.error) {
			logger.stop(publishResult.error);
			throw new Error(`Error publishing node: ${publishResult.error}`);
		}

		logger.stop(
			`Node published successfully \n Node: ${publishResult.id} \n Version: ${publishResult.version} \n Packed Size: ${publishResult.size} bytes / Unpacked Size: ${publishResult.unpackedSize} bytes \n Amount of files: ${publishResult.entryCount}`,
		);
	} catch (error) {
		logger.stop((error as Error).message, 1);
	} finally {
		cleanupNpmrcFile(npmrcFile, npmrcFileExisted, appendedNpmrcContent);
		if (packageJsonOriginal) {
			const packageJsonPath = `${opts.directory}/package.json`;
			fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonOriginal, null, 2));
		}
	}
}

// Login command
export default new Command()
	.command("node")
	.description("Publish a node to the nanoservices registry")
	.option("-d, --directory <value>", "Directory to publish")
	.option("-b, --build", "Run build before publishing")
	.argument("<node>", "Node name")
	.action(async (node: string, options: OptionValues) => {
		await trackCommandExecution({
			command: "publish",
			args: options,
			execution: async () => {
				if (!options.directory) options.directory = process.cwd();
				options.node = node;
				await publish(options);
			},
		});
	});
