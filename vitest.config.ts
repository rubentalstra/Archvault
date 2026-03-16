import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    server: {
      deps: {
        external: [
          '@opentelemetry/api',
          '@opentelemetry/sdk-node',
          '@opentelemetry/sdk-trace-node',
          '@opentelemetry/sdk-metrics',
          '@opentelemetry/sdk-logs',
          '@opentelemetry/resources',
          '@opentelemetry/semantic-conventions',
          '@opentelemetry/exporter-trace-otlp-proto',
          '@opentelemetry/exporter-metrics-otlp-proto',
          '@opentelemetry/exporter-logs-otlp-proto',
          '@opentelemetry/instrumentation-http',
          '@opentelemetry/instrumentation-fetch',
          '@opentelemetry/instrumentation-pg',
          '@opentelemetry/instrumentation-dns',
        ],
      },
    },
  },
})
