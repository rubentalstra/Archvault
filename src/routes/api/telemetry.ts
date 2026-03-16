import { createFileRoute } from "@tanstack/react-router";
import { getCachedOtelSettings } from "#/lib/settings.cache";

async function handleTelemetryProxy(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const config = await getCachedOtelSettings();

    if (!config.enabled || !config.endpoint) {
      return new Response("Telemetry not configured", { status: 503 });
    }

    const body = await request.arrayBuffer();

    // Build auth headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

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

    // Forward to collector's traces endpoint
    const targetUrl = `${config.endpoint.replace(/\/$/, "")}/v1/traces`;

    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers,
      body,
    });

    return new Response(null, { status: upstream.ok ? 200 : 502 });
  } catch {
    return new Response("Internal error", { status: 500 });
  }
}

export const Route = createFileRoute("/api/telemetry")({
  server: {
    handlers: {
      POST: ({ request }) => handleTelemetryProxy(request),
    },
  },
});
