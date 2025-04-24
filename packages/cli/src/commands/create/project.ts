import child_process from "node:child_process";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import util from "node:util";
import * as p from "@clack/prompts";
import type { OptionValues } from "commander";
import figlet from "figlet";
import fsExtra from "fs-extra";
import color from "picocolors";
import simpleGit, { type SimpleGit, type SimpleGitOptions } from "simple-git";
import {
	examples_url,
	node_file,
	package_dependencies,
	package_dev_dependencies,
	supervisord_nodejs,
	supervisord_python,
} from "./utils/Examples.js";

const exec = util.promisify(child_process.exec);

const HOME_DIR = `${os.homedir()}/.nanoctl`;
const GITHUB_REPO_LOCAL = `${HOME_DIR}/nanoservice-ts`;
const GITHUB_REPO_REMOTE = "https://github.com/deskree-inc/nanoservice-ts.git";

fsExtra.ensureDirSync(HOME_DIR);
const options: Partial<SimpleGitOptions> = {
	baseDir: HOME_DIR,
	binary: "git",
	maxConcurrentProcesses: 6,
	trimmed: false,
};

const git: SimpleGit = simpleGit(options);

export async function createProject(opts: OptionValues, version: string, currentPath = false) {
	const isDefault = opts.name !== undefined;
	let projectName: string = opts.name ? opts.name : "";
	let trigger = "http";
	let examples = false;
	let runtimes = ["node"];

	if (!isDefault) {
		console.log(
			figlet.textSync("nanoservice-ts CLI".toUpperCase(), {
				font: "Digital",
				horizontalLayout: "default",
				verticalLayout: "default",
				width: 100,
				whitespaceBreak: true,
			}),
		);
		console.log("");
		p.intro(color.inverse(" Create a New Project "));

		// Get the project name and trigger

		const resolveProjectName = async (): Promise<string> => {
			if (projectName !== "") {
				return projectName;
			}

			return (await p.text({
				message: "Please provide a name for the project",
				placeholder: "nano-service",
				defaultValue: "nano-service",
			})) as string;
		};

		const nanoctlProject = await p.group(
			{
				projectName: () => resolveProjectName(),
				trigger: () =>
					p.select({
						message: "Select the trigger to install",
						options: [
							{ label: "HTTP", value: "http", hint: "recommended" },
							//{ label: "GRPC", value: "grpc" }
						],
					}),
				runtimes: () =>
					p.multiselect({
						message: "Select the runtimes to install",
						options: [
							{ label: "NodeJS", value: "node", hint: "recommended" },
							{ label: "Python3", value: "python3" },
						],
						initialValues: ["node"],
					}),
			},
			{
				onCancel: () => {
					p.cancel("Operation canceled.");
					process.exit(0);
				},
			},
		);

		projectName = nanoctlProject.projectName;
		trigger = nanoctlProject.trigger;
		runtimes = nanoctlProject.runtimes;

		// Python3 Alpha Warning
		if (runtimes.includes("python3")) {
			// Show a warning message
			console.log(color.yellow("⚠️  Python3 Runtime (Alpha Version) ⚠️."));
			console.log(color.yellow("-----------------------------------------------------"));

			console.log(color.yellow("- Requires **Python 3** to be installed."));
			console.log(color.yellow("- Currently supported only on **MacOS**."));
			console.log(color.yellow("- Experimental feature: Some functionality may be unstable or missing."));
			console.log(color.yellow("- Recommended for testing purposes only."));
			console.log(color.yellow("- For production, use **NodeJS (recommended)**."));

			console.log(color.yellow("-----------------------------------------------------"));
		}

		const nanoctlExamplesProject = await p.group(
			{
				examples: () =>
					p.select({
						message: "Install the examples?",
						options: [
							{ label: "NO", value: false, hint: "recommended" },
							{ label: "YES", value: true },
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

		examples = nanoctlExamplesProject.examples;
	}

	const s = p.spinner();
	if (!isDefault) s.start("Creating the project...");

	try {
		// Prepare the project
		const dirPath = !currentPath ? path.join(process.cwd(), projectName) : process.cwd();

		if (!isDefault) s.message("Gathering project files");

		const githubLocalExists = fsExtra.existsSync(GITHUB_REPO_LOCAL);
		if (githubLocalExists) {
			fsExtra.removeSync(GITHUB_REPO_LOCAL);
		}

		const REPO_LOCAL = process.env.LOCAL_REPO_CLONE || "/Users/ernestochan/Desktop/Repositories/nanoservice-ts";
		if (REPO_LOCAL) {
			fsExtra.copySync(REPO_LOCAL, GITHUB_REPO_LOCAL);
			console.log(`Using local repo clone: ${REPO_LOCAL} to ${GITHUB_REPO_LOCAL}`);
		} else {
			await git.clone(GITHUB_REPO_REMOTE, GITHUB_REPO_LOCAL);
			console.log(`Cloning the repository from ${GITHUB_REPO_REMOTE} to ${GITHUB_REPO_LOCAL}`);
		}

		if (!isDefault) s.message("Copying project files...");

		/// Copy the project files
		if (!currentPath) {
			const projectDirExists = fsExtra.existsSync(dirPath);
			if (projectDirExists) {
				throw new Error("A project already exists in the current directory. Please remove it and try again.");
			}
		}

		fsExtra.copySync(`${GITHUB_REPO_LOCAL}/triggers/${trigger}`, dirPath);

		if (!isDefault) {
			s.message("Installing example workflows and nodes");
		}
		const nodesDir = `${dirPath}/src/nodes`;
		const workflowsDir = `${dirPath}/workflows`;

		fsExtra.ensureDirSync(nodesDir);
		fsExtra.copySync(`${GITHUB_REPO_LOCAL}/workflows`, workflowsDir);

		// Add permissions to the directory
		try {
			fsExtra.chownSync(dirPath, os.userInfo().uid, os.userInfo().gid);
		} catch (error) {
			console.error(`Failed to change ownership of directory ${dirPath}:`, error);
		}

		// Examples

		if (!examples) {
			fsExtra.removeSync(`${nodesDir}/examples`);
			fsExtra.removeSync(`${workflowsDir}`);
			fsExtra.ensureDirSync(`${workflowsDir}`);
			fsExtra.ensureDirSync(`${workflowsDir}/json`);
			fsExtra.ensureDirSync(`${workflowsDir}/yaml`);
			fsExtra.ensureDirSync(`${workflowsDir}/toml`);
		} else {
			fsExtra.copySync(`${GITHUB_REPO_LOCAL}/infra/development`, `${nodesDir}/examples/infra`);
			fsExtra.writeFileSync(`${dirPath}/src/Nodes.ts`, node_file);
			fsExtra.copySync(`${GITHUB_REPO_LOCAL}/sdk`, `${dirPath}/public/sdk`);
		}

		// Create .env.local file

		const envExample = `${dirPath}/.env.example`;
		const envLocal = `${dirPath}/.env.local`;

		const envContent = fsExtra.readFileSync(envExample, "utf8");
		const result = envContent.replaceAll("PROJECT_PATH", dirPath);
		fsExtra.writeFileSync(envLocal, result);

		// Change package.json
		const packageJson = `${dirPath}/package.json`;
		const packageJsonContent = JSON.parse(fsExtra.readFileSync(packageJson, "utf8"));
		packageJsonContent.name = projectName;
		packageJsonContent.version = "1.0.0";
		packageJsonContent.author = "";

		// Runtimes

		if (runtimes.includes("python3")) {
			// Setup the environment
			const nanoctlDir = `${dirPath}/.nanoctl`;
			fsExtra.ensureDirSync(nanoctlDir);
			const runtimesDir = `${nanoctlDir}/runtimes`;
			fsExtra.ensureDirSync(runtimesDir);
			const pythonDir = `${runtimesDir}/python3`;
			fsExtra.ensureDirSync(pythonDir);
			fsExtra.copySync(`${GITHUB_REPO_LOCAL}/runtimes/python3`, pythonDir);

			// Setup the project
			const runtimesProjectDir = `${dirPath}/runtimes`;
			fsExtra.ensureDirSync(runtimesProjectDir);
			const pythonProjectDir = `${runtimesProjectDir}/python3`;
			fsExtra.ensureDirSync(pythonProjectDir);
			fsExtra.symlinkSync(`${pythonDir}/nodes`, `${pythonProjectDir}/nodes`, "junction");
			fsExtra.symlinkSync(`${pythonDir}/core`, `${pythonProjectDir}/core`, "junction");
			fsExtra.symlinkSync(`${pythonDir}/requirement.txt`, `${pythonProjectDir}/requirement.txt`, "file");

			// Install Python3 Packages
			s.message("Installing python3 packages...");
			await exec("npm install", { cwd: pythonDir });
			await createPythonVenv(pythonDir);
			await exec(
				`bash -c "source ${pythonDir}/python3_runtime/bin/activate && pip3 install -r ${pythonDir}/requirements.txt"`,
				{ cwd: pythonDir },
			);

			fsExtra.symlinkSync(`${pythonDir}/python3_runtime`, `${pythonProjectDir}/python3_runtime`, "junction");

			packageJsonContent.scripts = {
				...packageJsonContent.scripts,
				dev: "nanoctl dev",
			};

			packageJsonContent.devDependencies = {
				...packageJsonContent.devDependencies,
				nanoctl: `^${version}`,
			};
		}

		// Examples

		if (examples) {
			packageJsonContent.dependencies = {
				...packageJsonContent.dependencies,
				...package_dependencies,
			};
			packageJsonContent.devDependencies = {
				...packageJsonContent.devDependencies,
				...package_dev_dependencies,
			};
		}

		fsExtra.writeFileSync(packageJson, JSON.stringify(packageJsonContent, null, 2));

		// Create supervisord.conf
		const supervisordConfPath = `${dirPath}/supervisord.conf`;
		let supervisordConfContent = supervisord_nodejs;
		if (runtimes.includes("python3")) supervisordConfContent += supervisord_python;
		fsExtra.writeFileSync(supervisordConfPath, supervisordConfContent);

		// Install Packages
		s.message("Installing packages...");
		await exec("npm install", { cwd: dirPath });

		// Create a new project
		if (!isDefault) s.stop(`Project "${projectName}" created successfully.`);
		console.log(`\nTrigger: ${trigger.toUpperCase()}\n`);
		if (!currentPath) console.log(`Change to the project directory: cd ${projectName}`);
		console.log(`Run the command "npm run dev" to start the development server.`);
		console.log("You can test the project in your browser at http://localhost:4000/health-check");
		console.log("For more documentation, visit https://nanoservice.xyz/");

		if (examples) {
			console.log(examples_url);
		}
	} catch (error) {
		if (!isDefault) s.stop((error as Error).message);
		if (isDefault) console.log((error as Error).message);
	}
}

function createPythonVenv(pythonProjectDir: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const process = spawn("python3", ["-m", "venv", "python3_runtime"], {
			cwd: pythonProjectDir,
			stdio: "inherit",
			shell: true,
		});

		process.on("close", (code) => {
			if (code === 0) {
				console.log("\n✅ Python3 virtual environment created successfully!");
				resolve();
			} else {
				reject(new Error(`❌ Failed to create virtual environment. Exit code: ${code}`));
			}
		});

		process.on("error", (err) => {
			reject(new Error(`⚠️ Error creating virtual environment: ${err.message}`));
		});
	});
}
