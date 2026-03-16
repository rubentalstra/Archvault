import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { paraglideVitePlugin } from '@inlang/paraglide-js'

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  ssr: {
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
  plugins: [
    nitro({ rollupConfig: { external: [/^@sentry\//, /^@opentelemetry\//] } }),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      outputStructure: 'message-modules',
      cookieName: 'ARCHVAULT_LOCALE',
      strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
      urlPatterns: [
        {
          pattern: '/:path(.*)?',
          localized: [
            ['en', '/en/:path(.*)?'],
            ['nl', '/nl/:path(.*)?'],
          ],
        },
      ],
    }),
    tailwindcss(),
    tanstackStart({
      serverFns: {
        generateFunctionId: ({ functionName }) => functionName,
      },
    }),
    viteReact(),
  ],
})

export default config
