import os from "node:os";
import path from "node:path";
import * as p from "@clack/prompts";
import type { OptionValues } from "commander";
import figlet from "figlet";
import fsExtra from "fs-extra";
import color from "picocolors";
import { validateNonInteractiveParams } from "../../services/validation.js";
import { workflow_template } from "./utils/Examples.js";

const HOME_DIR = `${os.homedir()}/.blokctl`;
const GITHUB_REPO_LOCAL = `${HOME_DIR}/blok`;

export async function createWorkflow(opts: OptionValues, currentPath = false) {
	const isDefault = opts.name !== undefined;
	const isNonInteractive = opts.nonInteractive === true;
	let workflowName: string = opts.name ? opts.name : "";

	// Non-interactive mode (SAFE - Additive only)
	if (isNonInteractive) {
		validateNonInteractiveParams("workflow", opts);
		workflowName = opts.name;
	}
	// Interactive mode (EXISTING - Unchanged)
	else if (!isDefault) {
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

		const resolveWorkflowName = async (): Promise<string> => {
			if (workflowName !== "") {
				return workflowName;
			}

			return (await p.text({
				message: "Please provide a name for the workflow",
				placeholder: "workflow-name",
				defaultValue: "",
			})) as string;
		};

		p.intro(color.inverse(" Creating a new Workflow "));
		const blokctlNode = await p.group(
			{
				workflowName: () => resolveWorkflowName(),
			},
			{
				onCancel: () => {
					p.cancel("Operation canceled.");
					process.exit(0);
				},
			},
		);

		workflowName = blokctlNode.workflowName;
	}

	const s = p.spinner();
	if (!isDefault) s.start("Creating the workflow...");

	try {
		// Prepare the project
		const mainDirExists = fsExtra.existsSync(GITHUB_REPO_LOCAL);
		if (!mainDirExists)
			throw new Error(
				"The blok repository was not found. Please run 'npx blokctl@latest create project' to clone the repository.",
			);

		let dirPath = process.cwd();
		if (!currentPath) {
			// Validate the project
			const currentDir = `${process.cwd()}/src`;
			const nodeProjectDirExists = fsExtra.existsSync(currentDir);
			if (!nodeProjectDirExists) throw new Error("ops1");

			// Prepare the workflow
			const currentWorkflowsDir = `${dirPath}/workflows/json`;
			if (!isDefault) {
				fsExtra.ensureDirSync(currentWorkflowsDir);
			} else {
				const workflowDirExists = fsExtra.existsSync(currentWorkflowsDir);
				if (!workflowDirExists) throw new Error("ops1");
			}

			dirPath = path.join(currentWorkflowsDir, `${workflowName.replaceAll(" ", "-").toLowerCase()}.json`);
		} else {
			dirPath = path.join(dirPath, `${workflowName.replaceAll(" ", "-").toLowerCase()}.json`);
		}

		if (!isDefault) s.message("Creating workflow...");

		/// Copy the node files
		if (!currentPath) {
			const workflowDirExists = fsExtra.existsSync(dirPath);
			if (workflowDirExists) throw new Error("ops2");
		}

		const workflow_json = JSON.parse(workflow_template);
		workflow_json.name = workflowName;
		fsExtra.writeFileSync(dirPath, JSON.stringify(workflow_json, null, 2));

		if (!isDefault) s.stop(`Node "${workflowName}" created successfully.`);
		if (!currentPath) console.log("\nNavigate to the workflow directory by running: cd workflows/json");

		console.log("For more documentation, visit https://blok.build/docs/d/core-concepts/workflows");
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
				"The workflow you are trying to create already exists in the project.\n" +
					"Please use a different name, or delete the existing workflow to create a new one.",
			);
		}
		if (message !== "ops1" && message !== "ops2") {
			console.log((error as Error).message);
		}
	}
}
