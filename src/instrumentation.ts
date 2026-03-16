import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-node";
import {
  BatchLogRecordProcessor,
  type LogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import type {
  Attributes,
  Context,
  Link,
  SpanKind,
} from "@opentelemetry/api";
import type { Sampler, SamplingResult } from "@opentelemetry/sdk-trace-node";
import { SamplingDecision } from "@opentelemetry/sdk-trace-node";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { DnsInstrumentation } from "@opentelemetry/instrumentation-dns";
import * as fs from "node:fs";

import type { OtelAuthType } from "./lib/settings.validators";

// ─── Env config ────────────────────────────────────────────────────────────
const enabled = process.env.OTEL_ENABLED === "true";
const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const serviceName = process.env.OTEL_SERVICE_NAME ?? "archvault";
const consoleExporterEnabled = process.env.OTEL_CONSOLE_EXPORTER === "true";
const exportInterval = parseInt(
  process.env.OTEL_METRICS_EXPORT_INTERVAL ?? "60000",
  10,
);
const initialSampleRate = parseFloat(
  process.env.OTEL_TRACES_SAMPLER_ARG ?? "1.0",
);
const logsEnabled = process.env.OTEL_LOGS_ENABLED === "true";

// ─── Auth header builder ───────────────────────────────────────────────────
function buildExporterHeaders(): Record<string, string> {
  const authType = (process.env.OTEL_AUTH_TYPE ?? "none") as OtelAuthType;

  switch (authType) {
    case "none":
      return {};

    case "custom_headers":
      return parseEnvHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);

    case "bearer": {
      const token = process.env.OTEL_AUTH_BEARER_TOKEN;
      if (!token) return {};
      return { Authorization: `Bearer ${token}` };
    }

    case "basic": {
      const user = process.env.OTEL_AUTH_BASIC_USER;
      const pass = process.env.OTEL_AUTH_BASIC_PASS;
      if (!user || !pass) return {};
      const encoded = Buffer.from(`${user}:${pass}`).toString("base64");
      return { Authorization: `Basic ${encoded}` };
    }

    case "api_key": {
      const header = process.env.OTEL_AUTH_API_KEY_HEADER ?? "x-api-key";
      const value = process.env.OTEL_AUTH_API_KEY_VALUE;
      if (!value) return {};
      return { [header]: value };
    }

    case "mtls":
      // mTLS uses TLS config, not headers
      return {};

    default:
      return {};
  }
}

function parseEnvHeaders(raw?: string): Record<string, string> {
  if (!raw) return {};
  const headers: Record<string, string> = {};
  for (const pair of raw.split(",")) {
    const [key, ...rest] = pair.split("=");
    if (key && rest.length > 0) {
      headers[key.trim()] = rest.join("=").trim();
    }
  }
  return headers;
}

// ─── TLS configuration ────────────────────────────────────────────────────
function buildTlsOptions(): {
  ca?: Buffer;
  cert?: Buffer;
  key?: Buffer;
  rejectUnauthorized?: boolean;
} {
  const opts: {
    ca?: Buffer;
    cert?: Buffer;
    key?: Buffer;
    rejectUnauthorized?: boolean;
  } = {};

  const caPath = process.env.OTEL_EXPORTER_OTLP_CERTIFICATE;
  const certPath = process.env.OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE;
  const keyPath = process.env.OTEL_EXPORTER_OTLP_CLIENT_KEY;
  const skipVerify = process.env.OTEL_TLS_INSECURE_SKIP_VERIFY === "true";

  if (caPath && fs.existsSync(caPath)) {
    opts.ca = fs.readFileSync(caPath);
  }
  if (certPath && fs.existsSync(certPath)) {
    opts.cert = fs.readFileSync(certPath);
  }
  if (keyPath && fs.existsSync(keyPath)) {
    opts.key = fs.readFileSync(keyPath);
  }
  if (skipVerify) {
    opts.rejectUnauthorized = false;
  }

  return opts;
}

// ─── Dynamic sampler ───────────────────────────────────────────────────────
class DynamicSampler implements Sampler {
  private _rate: number;

  constructor(rate: number) {
    this._rate = Math.max(0, Math.min(1, rate));
  }

  shouldSample(
    _context: Context,
    _traceId: string,
    _spanName: string,
    _spanKind: SpanKind,
    _attributes: Attributes,
    _links: Link[],
  ): SamplingResult {
    if (Math.random() < this._rate) {
      return { decision: SamplingDecision.RECORD_AND_SAMPLED };
    }
    return { decision: SamplingDecision.NOT_RECORD };
  }

  toString(): string {
    return `DynamicSampler{rate=${this._rate}}`;
  }

  updateRate(rate: number): void {
    this._rate = Math.max(0, Math.min(1, rate));
  }
}

export const dynamicSampler = new DynamicSampler(initialSampleRate);

// ─── SDK setup ─────────────────────────────────────────────────────────────
let sdk: NodeSDK | undefined;

if (enabled) {
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: "0.1.0",
    "deployment.environment.name": process.env.NODE_ENV ?? "development",
  });

  const headers = buildExporterHeaders();
  const tls = buildTlsOptions();

  const exporterConfig = {
    ...(endpoint ? { url: endpoint } : {}),
    headers,
    ...(Object.keys(tls).length > 0 ? { tls } : {}),
  };

  const traceExporter = new OTLPTraceExporter(exporterConfig);

  const metricExporter = new OTLPMetricExporter(exporterConfig);

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: exportInterval,
  });

  const spanProcessors = [new BatchSpanProcessor(traceExporter)];
  if (consoleExporterEnabled) {
    spanProcessors.push(new BatchSpanProcessor(new ConsoleSpanExporter()));
  }

  const logRecordProcessors: LogRecordProcessor[] = [];
  if (logsEnabled) {
    const logExporter = new OTLPLogExporter(exporterConfig);
    logRecordProcessors.push(new BatchLogRecordProcessor(logExporter));
  }

  sdk = new NodeSDK({
    resource,
    sampler: dynamicSampler,
    spanProcessors,
    metricReaders: [metricReader],
    logRecordProcessors,
    instrumentations: [
      new HttpInstrumentation(),
      new PgInstrumentation(),
      new DnsInstrumentation(),
    ],
  });

  sdk.start();

  // Graceful shutdown
  const shutdown = () => {
    sdk
      ?.shutdown()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

// Periodically sync sample rate from DB settings cache
if (enabled) {
  const syncSampleRate = async () => {
    try {
      const { getCachedOtelSettings } = await import("./lib/settings.cache");
      const settings = await getCachedOtelSettings();
      dynamicSampler.updateRate(settings.sampleRate / 100);
    } catch {
      // Settings cache not available yet — keep current rate
    }
  };

  // Start syncing after a delay to let DB initialize
  setTimeout(() => {
    void syncSampleRate();
    setInterval(() => void syncSampleRate(), 30_000);
  }, 5_000);
}
