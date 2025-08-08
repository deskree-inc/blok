import { DefaultLogger } from "@blok-ts/runner";
import { type Span, metrics, trace } from "@opentelemetry/api";
import HttpTriggerAdapter from "./runner/HttpTriggerAdapter";

export default class App {
	private httpTrigger: HttpTriggerAdapter = <HttpTriggerAdapter>{};
	protected trigger_initializer = 0;
	protected initializer = 0;
	protected tracer = trace.getTracer(
		process.env.PROJECT_NAME || "trigger-http-server",
		process.env.PROJECT_VERSION || "0.0.1",
	);
	private logger = new DefaultLogger();
	protected app_cold_start = metrics.getMeter("default").createGauge("initialization", {
		description: "Application cold start",
	});

	constructor() {
		this.initializer = performance.now();
		this.httpTrigger = new HttpTriggerAdapter();

		// Log which implementation is being used
		const info = this.httpTrigger.getImplementationInfo();
		this.logger.log(`HTTP Trigger: ${info.framework} (${info.version}) - Edge Capable: ${info.edgeCapable}`);
	}

	async run() {
		this.tracer.startActiveSpan("initialization", async (span: Span) => {
			await this.httpTrigger.listen();
			this.initializer = performance.now() - this.initializer;

			const info = this.httpTrigger.getImplementationInfo();
			this.logger.log(`Server initialized in ${(this.initializer).toFixed(2)}ms using ${info.framework}`);
			this.app_cold_start.record(this.initializer, {
				pid: process.pid,
				env: process.env.NODE_ENV,
				app: process.env.APP_NAME,
				framework: info.framework,
			});
			span.end();
		});
	}

	// Expose the Express app for hosting with serverless functions like AWS Lambda, GC Functions, etc.
	// 100% backward compatible - existing integrations continue to work
	getHttpApp() {
		return this.httpTrigger.getApp();
	}

	// New: Get Hono app instance for edge deployments (when Hono is enabled)
	getHonoApp() {
		return this.httpTrigger.getHonoApp();
	}

	// New: Get edge runtime handler for Cloudflare Workers, Vercel Edge, etc.
	get edgeHandler() {
		return this.httpTrigger.handler;
	}

	// New: Check which implementation is being used
	isUsingHono(): boolean {
		return this.httpTrigger.isUsingHono();
	}

	// New: Get implementation details for debugging
	getFrameworkInfo() {
		return this.httpTrigger.getImplementationInfo();
	}
}

if (process.env.DISABLE_TRIGGER_RUN !== "true") {
	new App().run();
}
