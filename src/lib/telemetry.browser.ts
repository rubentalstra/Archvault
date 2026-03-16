import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-web";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ZoneContextManager } from "@opentelemetry/context-zone-peer-dep";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load";
import { UserInteractionInstrumentation } from "@opentelemetry/instrumentation-user-interaction";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

export interface BrowserTelemetryConfig {
  serviceName: string;
  endpoint: string;
}

let initialized = false;

export function initBrowserTelemetry(config: BrowserTelemetryConfig): void {
  if (initialized) return;
  initialized = true;

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: `${config.serviceName}-browser`,
  });

  const exporter = new OTLPTraceExporter({
    url: config.endpoint,
  });

  const provider = new WebTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register({
    contextManager: new ZoneContextManager(),
    propagator: new W3CTraceContextPropagator(),
  });

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new UserInteractionInstrumentation(),
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [/.*/],
      }),
    ],
  });
}
