import { z } from "zod/v4";

export const otelAuthTypes = [
  "none",
  "custom_headers",
  "bearer",
  "basic",
  "api_key",
  "mtls",
] as const;
export type OtelAuthType = (typeof otelAuthTypes)[number];

export const otelSettingsSchema = z.object({
  // Core
  enabled: z.boolean().optional(),
  endpoint: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  serviceName: z.string().min(1).max(100).optional(),
  sampleRate: z.number().min(0).max(100).optional(),
  exportInterval: z.number().min(5).optional(),
  consoleExporter: z.boolean().optional(),
  // Auth
  authType: z.enum(otelAuthTypes).optional(),
  customHeaders: z.record(z.string(), z.string()).optional(),
  bearerToken: z.string().optional(),
  basicUser: z.string().optional(),
  basicPass: z.string().optional(),
  apiKeyHeader: z.string().optional(),
  apiKeyValue: z.string().optional(),
  // TLS
  tlsCaCertPath: z.string().optional(),
  tlsClientCertPath: z.string().optional(),
  tlsClientKeyPath: z.string().optional(),
  tlsInsecureSkipVerify: z.boolean().optional(),
  // Logs
  logsEnabled: z.boolean().optional(),
});

export type OtelSettings = z.infer<typeof otelSettingsSchema>;

/** Maps form field names to app_settings keys */
export const OTEL_SETTINGS_KEYS = {
  enabled: "otel.enabled",
  endpoint: "otel.endpoint",
  serviceName: "otel.serviceName",
  sampleRate: "otel.sampleRate",
  exportInterval: "otel.exportInterval",
  consoleExporter: "otel.consoleExporter",
  authType: "otel.authType",
  customHeaders: "otel.customHeaders",
  bearerToken: "otel.bearerToken",
  basicUser: "otel.basicUser",
  basicPass: "otel.basicPass",
  apiKeyHeader: "otel.apiKeyHeader",
  apiKeyValue: "otel.apiKeyValue",
  tlsCaCertPath: "otel.tlsCaCertPath",
  tlsClientCertPath: "otel.tlsClientCertPath",
  tlsClientKeyPath: "otel.tlsClientKeyPath",
  tlsInsecureSkipVerify: "otel.tlsInsecureSkipVerify",
  logsEnabled: "otel.logsEnabled",
} as const;
