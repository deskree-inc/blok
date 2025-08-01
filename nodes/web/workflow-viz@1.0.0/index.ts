import fs from "node:fs";
import path from "node:path";
import { type INanoServiceResponse, NanoService, NanoServiceResponse } from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import ejs from "ejs";
import { inputSchema } from "./inputSchema";

type InputType = {
	workflow_path?: string;
	title?: string;
	scripts?: string;
	metas?: string;
	index_html?: string;
	styles?: string;
	root_element?: string;
};

const rootDir = path.resolve(__dirname, ".");

export default class WorkflowViz extends NanoService<InputType> {
	constructor() {
		super();

		// Set the input "JSON Schema Format" here for automated validation
		this.inputSchema = inputSchema;

		// Set the output "JSON Schema Format" here for automated validation
		this.outputSchema = {};

		// Set html content type
		this.contentType = "text/html";
	}

	/**
	 * Relative path to root
	 */
	root(relPath: string): string {
		return path.resolve(rootDir, relPath);
	}

	async handle(ctx: Context, inputs: InputType): Promise<INanoServiceResponse> {
		// Create a new instance of the response
		const response = new NanoServiceResponse();
		let file_path = inputs.workflow_path;
		const react_script_template = '<script type="text/babel">REACT_SCRIPT</script>';

		const title = inputs.title || "Workflow Visualization";
		const scripts = inputs.scripts || "<script src=\"https://unpkg.com/react-flow-renderer@latest/dist/umd/index.js\"></script>";
		const metas = inputs.metas || "";
		const index_html = inputs.index_html || "index.html";
		const styles = inputs.styles || "<style>\n.react-flow {\n  width: 100%;\n  height: 100%;\n}\n</style>";
		const root_element = inputs.root_element || "root";

		try {
			// Load React app from the current module location
			const min_file = this.root("./app/index.jsx");
			let react_app = fs.readFileSync(min_file, "utf8");
			react_app = react_script_template.replace("REACT_SCRIPT", `\n${react_app}\n`);

			// If workflow path is provided, load the workflow JSON
			let workflowData = {};
			if (file_path) {
				const workflowFile = path.resolve(process.cwd(), file_path);
				if (fs.existsSync(workflowFile)) {
					const workflowContent = fs.readFileSync(workflowFile, "utf8");
					workflowData = JSON.parse(workflowContent);
				}
			}

			// Read index.html file from the current module location
			const content = fs.readFileSync(this.root(index_html), "utf8");
			const render = ejs.compile(content, { client: false });
			const ctxCloned = {
				config: ctx.config,
				inputs: inputs,
				response: ctx.response,
				request: {
					body: ctx.request.body,
					headers: ctx.request.headers,
					url: ctx.request.url,
					originalUrl: ctx.request.originalUrl,
					query: ctx.request.query,
					params: ctx.request.params,
					cookies: ctx.request.cookies,
				},
				workflow: workflowData
			};

			const html = render({
				title,
				metas,
				styles,
				scripts,
				root_element,
				react_app,
				ctx: btoa(JSON.stringify(ctxCloned)),
			});

			// Return the HTML
			response.setSuccess(html);
		} catch (error: unknown) {
			const nodeError: GlobalError = new GlobalError((error as Error).message);
			nodeError.setCode(500);
			nodeError.setStack((error as Error).stack);
			nodeError.setName(this.name);
			response.setError(nodeError);
		}

		return response;
	}
}