import fs from "node:fs";
import path from "node:path";
import { type INanoServiceResponse, NanoService, NanoServiceResponse } from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";
import ejs from "ejs";
import { inputSchema } from "./inputSchema";

type InputType = {
	react_app: string;
	title?: string;
	scripts?: string;
	metas?: string;
	index_html?: string;
	styles?: string;
	root_element?: string;
};

const rootDir = path.resolve(__dirname, ".");

export default class React extends NanoService<InputType> {
	constructor() {
		super();

		// Set the input "JSON Schema Format" here for automated validation
		// Learn JSON Schema: https://json-schema.org/learn/getting-started-step-by-step
		this.inputSchema = inputSchema;

		// Set the output "JSON Schema Format" here for automated validation
		// Learn JSON Schema: https://json-schema.org/learn/getting-started-step-by-step
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
		let file_path = inputs.react_app;
		if (file_path === undefined || file_path === "") file_path = "./app/index.merged.min.js";
		const react_script_template = '<script type="text/babel">\nREACT_SCRIPT\n</script>';

		const title = inputs.title || "React App";
		const scripts = inputs.scripts || "";
		const metas = inputs.metas || "";
		const index_html = inputs.index_html || "index.html";
		const styles = inputs.styles || "";
		const root_element = inputs.root_element || "root";

		try {
			// Load React script from the current module location
			const min_file = this.root(file_path);
			let react_app = fs.readFileSync(min_file, "utf8");
			react_app = react_script_template.replace("REACT_SCRIPT", react_app);

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

			// Your code here
			response.setSuccess(html); // Set the success
		} catch (error: unknown) {
			const nodeError: GlobalError = new GlobalError((error as Error).message);
			nodeError.setCode(500);
			nodeError.setStack((error as Error).stack);
			nodeError.setName(this.name);
			response.setError(nodeError); // Set the error
		}

		return response;
	}
}
