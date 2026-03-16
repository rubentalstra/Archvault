import { eq } from "drizzle-orm";
import type { OtelSettings } from "./settings.validators";
import { OTEL_SETTINGS_KEYS } from "./settings.validators";
import type { OtelAuthType } from "./settings.validators";

interface CachedSettings {
  data: ResolvedOtelConfig;
  timestamp: number;
}

export interface ResolvedOtelConfig {
  enabled: boolean;
  endpoint: string;
  serviceName: string;
  sampleRate: number;
  exportInterval: number;
  consoleExporter: boolean;
  // Auth
  authType: OtelAuthType;
  customHeaders: Record<string, string>;
  bearerToken: string;
  basicUser: string;
  basicPass: string;
  apiKeyHeader: string;
  apiKeyValue: string;
  // TLS
  tlsCaCertPath: string;
  tlsClientCertPath: string;
  tlsClientKeyPath: string;
  tlsInsecureSkipVerify: boolean;
  // Logs
  logsEnabled: boolean;
}

export interface ResolvedOtelConfigWithSources {
  config: ResolvedOtelConfig;
  sources: Record<keyof ResolvedOtelConfig, "env" | "db">;
}

const CACHE_TTL_MS = 30_000; // 30 seconds
let cache: CachedSettings | null = null;

function getEnvDefaults(): ResolvedOtelConfig {
  return {
    enabled: process.env.OTEL_ENABLED === "true",
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "",
    serviceName: process.env.OTEL_SERVICE_NAME ?? "archvault",
    sampleRate:
      parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG ?? "1.0") * 100,
    exportInterval: parseInt(
      process.env.OTEL_METRICS_EXPORT_INTERVAL ?? "60000",
      10,
    ),
    consoleExporter: process.env.OTEL_CONSOLE_EXPORTER === "true",
    // Auth
    authType: (process.env.OTEL_AUTH_TYPE as OtelAuthType) ?? "none",
    customHeaders: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    bearerToken: process.env.OTEL_AUTH_BEARER_TOKEN ?? "",
    basicUser: process.env.OTEL_AUTH_BASIC_USER ?? "",
    basicPass: process.env.OTEL_AUTH_BASIC_PASS ?? "",
    apiKeyHeader: process.env.OTEL_AUTH_API_KEY_HEADER ?? "x-api-key",
    apiKeyValue: process.env.OTEL_AUTH_API_KEY_VALUE ?? "",
    // TLS
    tlsCaCertPath: process.env.OTEL_EXPORTER_OTLP_CERTIFICATE ?? "",
    tlsClientCertPath:
      process.env.OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE ?? "",
    tlsClientKeyPath: process.env.OTEL_EXPORTER_OTLP_CLIENT_KEY ?? "",
    tlsInsecureSkipVerify:
      process.env.OTEL_TLS_INSECURE_SKIP_VERIFY === "true",
    // Logs
    logsEnabled: process.env.OTEL_LOGS_ENABLED === "true",
  };
}

function parseHeaders(raw?: string): Record<string, string> {
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

async function fetchDbSettings(): Promise<Partial<OtelSettings>> {
  try {
    // Dynamic import to avoid issues when DB isn't ready
    const { db } = await import("./database");
    const { appSettings } = await import("./schema/app-settings");

    const allKeys = Object.values(OTEL_SETTINGS_KEYS);
    const rows = await Promise.all(
      allKeys.map((key) =>
        db
          .select()
          .from(appSettings)
          .where(eq(appSettings.key, key))
          .then((r) => (r.length > 0 ? { key, value: r[0].value } : null)),
      ),
    );

    const result: Partial<OtelSettings> = {};
    for (const row of rows) {
      if (!row) continue;
      const fieldName = Object.entries(OTEL_SETTINGS_KEYS).find(
        ([, v]) => v === row.key,
      )?.[0] as keyof OtelSettings | undefined;
      if (fieldName) {
        (result as Record<string, unknown>)[fieldName] = row.value;
      }
    }
    return result;
  } catch {
    // DB not ready — fall back to env-only
    return {};
  }
}

export async function resolveOtelConfig(): Promise<ResolvedOtelConfigWithSources> {
  const envDefaults = getEnvDefaults();
  const dbOverrides = await fetchDbSettings();

  const sources = Object.fromEntries(
    Object.keys(envDefaults).map((k) => [k, "env" as const]),
  ) as Record<keyof ResolvedOtelConfig, "env" | "db">;

  const config = { ...envDefaults };

  // Apply DB overrides for all fields
  const stringFields = [
    "endpoint",
    "serviceName",
    "bearerToken",
    "basicUser",
    "basicPass",
    "apiKeyHeader",
    "apiKeyValue",
    "tlsCaCertPath",
    "tlsClientCertPath",
    "tlsClientKeyPath",
  ] as const;

  const booleanFields = [
    "enabled",
    "consoleExporter",
    "tlsInsecureSkipVerify",
    "logsEnabled",
  ] as const;

  const numberFields = ["sampleRate", "exportInterval"] as const;

  for (const field of stringFields) {
    const val = dbOverrides[field];
    if (val !== undefined && val !== "") {
      (config as Record<string, unknown>)[field] = val;
      sources[field] = "db";
    }
  }

  for (const field of booleanFields) {
    if (dbOverrides[field] !== undefined) {
      (config as Record<string, unknown>)[field] = dbOverrides[field];
      sources[field] = "db";
    }
  }

  for (const field of numberFields) {
    if (dbOverrides[field] !== undefined) {
      (config as Record<string, unknown>)[field] = dbOverrides[field];
      sources[field] = "db";
    }
  }

  if (dbOverrides.authType !== undefined) {
    config.authType = dbOverrides.authType;
    sources.authType = "db";
  }

  if (
    dbOverrides.customHeaders !== undefined &&
    Object.keys(dbOverrides.customHeaders).length > 0
  ) {
    config.customHeaders = dbOverrides.customHeaders;
    sources.customHeaders = "db";
  }

  return { config, sources };
}

export async function getCachedOtelSettings(): Promise<ResolvedOtelConfig> {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.data;
  }

  const { config } = await resolveOtelConfig();
  cache = { data: config, timestamp: Date.now() };
  return config;
}

export function invalidateOtelSettingsCache(): void {
  cache = null;
}
