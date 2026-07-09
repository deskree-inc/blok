import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

const resource = Resource.default().merge(
	new Resource({
		[ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || process.env.PROJECT_NAME || "blok-service",
		[ATTR_SERVICE_VERSION]: "1.0.0",
	}),
);

// OTEL_EXPORTER_OTLP_ENDPOINT is picked up from env (set to http://adot-collector:4318 in k8s)
const exporter = new OTLPTraceExporter();
const processor = new BatchSpanProcessor(exporter);

const provider = new NodeTracerProvider({
	resource: resource,
	spanProcessors: [processor],
});

provider.register();
