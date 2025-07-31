import child_process from "node:child_process";
import os from "node:os";
import path from "node:path";
import util from "node:util";
import * as p from "@clack/prompts";
import type { OptionValues } from "commander";
import figlet from "figlet";
import fsExtra from "fs-extra";
import color from "picocolors";
import { manager as pm } from "../../services/package-manager.js";
import { python3_file } from "./utils/Examples.js";

const exec = util.promisify(child_process.exec);

const HOME_DIR = `${os.homedir()}/.blokctl`;
const GITHUB_REPO_LOCAL = `${HOME_DIR}/blok`;

export async function createNode(opts: OptionValues, currentPath = false) {
	const availableManagers = await pm.getAvailableManagers();
	let manager = await pm.getManager();
	const isDefault = opts.name !== undefined;
	let nodeName: string = opts.name ? opts.name : "";
	let nodeType = "";
	let template = "";
	let node_runtime = "";
	let selectedManager = "npm";

	if (!isDefault) {
		console.log(
			figlet.textSync("Blok CLI".toUpperCase(), {
				font: "Digital",
				horizontalLayout: "default",
				verticalLayout: "default",
				width: 100,
				whitespaceBreak: true,
			}),
		);
		console.log("");

		const resolveNodeName = async (): Promise<string> => {
			if (nodeName !== "") {
				return nodeName;
			}

			return (await p.text({
				message: "Please provide a name for the node",
				placeholder: "node-name",
				defaultValue: "",
			})) as string;
		};

		const resolveSelectedManager = async (): Promise<string> => {
			if (availableManagers.length === 1) {
				return availableManagers[0];
			}
			return (await p.select({
				message: "Select the package manager",
				options: availableManagers.map((manager) => ({
					label: manager,
					value: manager,
				})),
			})) as string;
		};

		p.intro(color.inverse(" Creating a new Node "));
		const blokctlNode = await p.group(
			{
				nodeName: () => resolveNodeName(),
				selectedManager: () => resolveSelectedManager(),
				nodeRuntime: () =>
					p.select({
						message: "Select the blok runtime",
						options: [
							{ label: "Typescript", value: "typescript", hint: "recommended" },
							//{ label: "Python3", value: "python3", hint: "Alpha - Limited to MacOS and Linux" },
						],
					}),
			},
			{
				onCancel: () => {
					p.cancel("Operation canceled.");
					process.exit(0);
				},
			},
		);

		nodeName = blokctlNode.nodeName;
		node_runtime = blokctlNode.nodeRuntime;
		selectedManager = blokctlNode.selectedManager;

		if (node_runtime === "python3") {
			// Show a warning message
			console.log(
				color.yellow(
					"⚠️  Python3 runtime is currently in Alpha and is limited to MacOS and Linux. Please use Typescript for production.",
				),
			);
		}

		if (node_runtime !== "python3") {
			const blokctlNodeExtension = await p.group(
				{
					nodeType: () =>
						p.select({
							message: "Select the blok type",
							options: [
								{ label: "Module", value: "module", hint: "recommended" },
								{ label: "Class", value: "class" },
							],
						}),
					template: () =>
						p.select({
							message: "Select the template",
							options: [
								{ label: "Class", value: "class", hint: "recommended" },
								{ label: "UI - EJS + ReactJS + TailwindCSS", value: "ui" },
							],
						}),
				},
				{
					onCancel: () => {
						p.cancel("Operation canceled.");
						process.exit(0);
					},
				},
			);

			nodeType = blokctlNodeExtension.nodeType;
			template = blokctlNodeExtension.template;
		}
	}

	const s = p.spinner();
	if (!isDefault) s.start(`Creating the ${node_runtime} node...`);

	try {
		// Prepare the project
		const mainDirExists = fsExtra.existsSync(GITHUB_REPO_LOCAL);
		if (!mainDirExists)
			throw new Error(
				"The blok repository was not found. Please run 'npx blokctl@latest create project' to clone the repository.",
			);

		if (node_runtime === "typescript") {
			let dirPath = process.cwd();
			if (!currentPath) {
				// Validate the project
				const currentDir = `${process.cwd()}/src`;
				const nodeProjectDirExists = fsExtra.existsSync(currentDir);
				if (!nodeProjectDirExists) throw new Error("ops1");

				// Prepare the node
				const currentNodesDir = `${currentDir}/nodes`;
				if (!isDefault) {
					fsExtra.ensureDirSync(currentNodesDir);
				} else {
					const nodeDirExists = fsExtra.existsSync(currentNodesDir);
					if (!nodeDirExists) throw new Error("ops1");
				}

				dirPath = path.join(currentNodesDir, nodeName);
			}

			if (!isDefault) s.message("Copying project files...");

			/// Copy the node files
			if (!currentPath) {
				const nodeDirExists = fsExtra.existsSync(dirPath);
				if (nodeDirExists) throw new Error("ops2");
			}

			if (nodeType === "module") {
				if (template === "class") {
					fsExtra.copySync(`${GITHUB_REPO_LOCAL}/templates/node`, dirPath);
				}

				if (template === "ui") {
					fsExtra.copySync(`${GITHUB_REPO_LOCAL}/templates/node-ui`, dirPath);
				}

				// Change project name in package.json
				const packageJson = `${dirPath}/package.json`;
				const packageJsonContent = JSON.parse(fsExtra.readFileSync(packageJson, "utf8"));
				packageJsonContent.name = nodeName;
				packageJsonContent.version = "1.0.0";
				packageJsonContent.author = "";
				fsExtra.writeFileSync(packageJson, JSON.stringify(packageJsonContent, null, 2));

				// Get the package manager
				manager = await pm.getManager(selectedManager as string);

				// Install Packages
				s.message("Installing packages...");
				await exec(manager.INSTALL, { cwd: dirPath });

				// Build the project
				s.message("Building the project...");
				await exec(manager.BUILD, { cwd: dirPath });
			}

			if (nodeType === "class") {
				if (template === "class") {
					fsExtra.ensureDirSync(dirPath);
					fsExtra.copyFileSync(`${GITHUB_REPO_LOCAL}/templates/node/index.ts`, `${dirPath}/index.ts`);
				}

				if (template === "ui") {
					fsExtra.ensureDirSync(dirPath);
					fsExtra.ensureDirSync(`${dirPath}/app`);
					fsExtra.copySync(`${GITHUB_REPO_LOCAL}/templates/node-ui/app`, `${dirPath}/app`);
					fsExtra.copyFileSync(`${GITHUB_REPO_LOCAL}/templates/node-ui/index.ts`, `${dirPath}/index.ts`);
					fsExtra.copyFileSync(`${GITHUB_REPO_LOCAL}/templates/node-ui/inputSchema.ts`, `${dirPath}/inputSchema.ts`);
					fsExtra.copyFileSync(`${GITHUB_REPO_LOCAL}/templates/node-ui/index.html`, `${dirPath}/index.html`);
				}
			}
		}

		if (node_runtime === "python3") {
			let dirPath = process.cwd();
			if (!currentPath) {
				// Validate the project
				const currentDir = `${process.cwd()}/runtimes/python3`;
				const nodeProjectDirExists = fsExtra.existsSync(currentDir);
				if (!nodeProjectDirExists) throw new Error("ops3");

				// Prepare the node
				const currentNodesDir = `${currentDir}/nodes`;
				if (!isDefault) {
					fsExtra.ensureDirSync(currentNodesDir);
				} else {
					const nodeDirExists = fsExtra.existsSync(currentNodesDir);
					if (!nodeDirExists) throw new Error("ops3");
				}

				dirPath = path.join(currentNodesDir, nodeName);
			}

			if (!isDefault) s.message("Copying project files...");

			// Copy the node files
			if (!currentPath) {
				const nodeDirExists = fsExtra.existsSync(dirPath);
				if (nodeDirExists) throw new Error("ops2");
			}

			fsExtra.ensureDirSync(dirPath);
			fsExtra.writeFileSync(`${dirPath}/node.py`, python3_file);
			fsExtra.writeFileSync(`${dirPath}/__init__.py`, "");
		}

		if (!isDefault) s.stop(`Node "${nodeName}" created successfully.`);
		if (!currentPath && node_runtime === "typescript")
			console.log(`\nNavigate to the node directory by running: cd src/nodes/${nodeName}`);
		if (!currentPath && node_runtime === "python3")
			console.log(`\nNavigate to the node directory by running: cd runtimes/python3/nodes/${nodeName}`);
		console.log(
			`${currentPath ? "\n" : ""}Run the command "npm run build" or "npm run build:dev" to build the project.`,
		);
		console.log("For more documentation, visit https://blok.build/docs/d/core-concepts/nodes");
	} catch (error) {
		if (!isDefault) s.stop("An error occurred");

		const message = (error as Error).message;
		if (message === "ops1") {
			console.log(
				"Oops! It seems like you haven't created a project yet... or have you? 🤔\n" +
					"If you already did, you can navigate to it using: cd project-name\n" +
					"Otherwise, you can create a new project with: npx blokctl@latest create project",
			);
		}
		if (message === "ops2") {
			console.log(
				"The node you are trying to create already exists in the project.\n" +
					"Please use a different name, or delete the existing node to create a new one.",
			);
		}
		if (message === "ops3") {
			console.log(
				"Oops! It seems like you haven't created a project with python3 support yet... or have you? 🤔\n" +
					"If you already did, you can navigate to it using: cd project-name\n" +
					"Otherwise, you can create a new project with: npx blokctl@latest create project",
			);
		}
		if (message !== "ops1" && message !== "ops2") {
			console.log((error as Error).message);
		}
	}
}
