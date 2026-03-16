import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./database";
import { appSettings } from "./schema/app-settings";
import {
  invalidateOtelSettingsCache,
  resolveOtelConfig,
} from "./settings.cache";
import {
  OTEL_SETTINGS_KEYS,
  otelSettingsSchema,
  type OtelSettings,
} from "./settings.validators";

async function ensureAdmin() {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "admin") throw new Error("Forbidden");
  return session;
}

export const getOtelSettings = createServerFn({ method: "GET" }).handler(
  async () => {
    await ensureAdmin();
    return resolveOtelConfig();
  },
);

export const updateOtelSettings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => otelSettingsSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await ensureAdmin();

    const entries: { key: string; value: unknown }[] = [];
    for (const [field, value] of Object.entries(data) as [
      keyof OtelSettings,
      unknown,
    ][]) {
      if (value === undefined) continue;
      const key = OTEL_SETTINGS_KEYS[field];
      if (key) {
        entries.push({ key, value });
      }
    }

    for (const { key, value } of entries) {
      const existing = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, key));

      if (existing.length > 0) {
        await db
          .update(appSettings)
          .set({ value, updatedBy: session.user.id })
          .where(eq(appSettings.key, key));
      } else {
        await db.insert(appSettings).values({
          key,
          value,
          updatedBy: session.user.id,
        });
      }
    }

    invalidateOtelSettingsCache();

    return resolveOtelConfig();
  });

export const getBrowserTelemetryConfig = createServerFn({
  method: "GET",
}).handler(async () => {
  const { config } = await resolveOtelConfig();
  if (!config.enabled) return null;
  return {
    serviceName: config.serviceName,
    endpoint: "/api/telemetry",
  };
});

export const testOtelConnection = createServerFn({ method: "POST" }).handler(
  async () => {
    await ensureAdmin();

    const { config } = await resolveOtelConfig();

    if (!config.endpoint) {
      return { success: false, error: "No endpoint configured" };
    }

    try {
      const { OTLPTraceExporter } = await import(
        "@opentelemetry/exporter-trace-otlp-proto"
      );
      const { BasicTracerProvider, SimpleSpanProcessor } = await import(
        "@opentelemetry/sdk-trace-node"
      );
      const { resourceFromAttributes } = await import(
        "@opentelemetry/resources"
      );
      const { ATTR_SERVICE_NAME } = await import(
        "@opentelemetry/semantic-conventions"
      );

      // Build auth headers from current config
      const headers: Record<string, string> = {};
      switch (config.authType) {
        case "custom_headers":
          Object.assign(headers, config.customHeaders);
          break;
        case "bearer":
          if (config.bearerToken) {
            headers["Authorization"] = `Bearer ${config.bearerToken}`;
          }
          break;
        case "basic":
          if (config.basicUser && config.basicPass) {
            const encoded = Buffer.from(
              `${config.basicUser}:${config.basicPass}`,
            ).toString("base64");
            headers["Authorization"] = `Basic ${encoded}`;
          }
          break;
        case "api_key":
          if (config.apiKeyValue) {
            headers[config.apiKeyHeader || "x-api-key"] = config.apiKeyValue;
          }
          break;
      }

      const exporter = new OTLPTraceExporter({
        url: config.endpoint,
        headers,
      });

      const provider = new BasicTracerProvider({
        resource: resourceFromAttributes({
          [ATTR_SERVICE_NAME]: config.serviceName,
        }),
        spanProcessors: [new SimpleSpanProcessor(exporter)],
      });

      const tracer = provider.getTracer("archvault-connection-test");
      const span = tracer.startSpan("otel.connection_test");
      span.setAttribute("test", true);
      span.end();

      await provider.forceFlush();
      await provider.shutdown();

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
);
