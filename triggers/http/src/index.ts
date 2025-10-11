// Main entry point for HTTP trigger server

import { DefaultLogger } from "@nanoservice-ts/runner";
import { type Span, metrics, trace } from "@opentelemetry/api";
import HttpTrigger from "./runner/HttpTrigger";

export default class App {
    private httpTrigger: HttpTrigger;
    private readonly tracer = trace.getTracer(
        process.env.PROJECT_NAME || "trigger-http-server",
        process.env.PROJECT_VERSION || "0.0.1",
    );
    private readonly logger = new DefaultLogger();
    private readonly app_cold_start = metrics.getMeter("default").createGauge("initialization", {
        description: "Application cold start",
    });
    private initializer = 0;

    constructor() {
        this.initializer = performance.now();
        this.httpTrigger = new HttpTrigger();
    }

    // Start the HTTP trigger and record initialization metrics
    async run() {
        this.tracer.startActiveSpan("initialization", async (span: Span) => {
            await this.httpTrigger.listen();
            this.initializer = performance.now() - this.initializer;

            this.logger.log(`Server initialized in ${this.initializer.toFixed(2)}ms`);
            this.app_cold_start.record(this.initializer, {
                pid: process.pid,
                env: process.env.NODE_ENV,
                app: process.env.APP_NAME,
            });
            span.end();
        });
    }

    // Expose the Express app for hosting with serverless functions like AWS Lambda, GC Functions, etc.
    getHttpApp() {
        return this.httpTrigger.getApp();
    }
}

// Only run if not disabled by environment variable
if (process.env.DISABLE_TRIGGER_RUN !== "true") {
    new App().run();
}