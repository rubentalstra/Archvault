/// <reference types="vite/client" />
import { type ReactNode, useEffect } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import {
  Outlet,
  HeadContent,
  Scripts,
  Link,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { buttonVariants } from '#/components/ui/button'
import { TooltipProvider } from '#/components/ui/tooltip'
import { Toaster } from '#/components/ui/sonner'
import { ImpersonationBanner } from '#/components/admin/impersonation-banner'
import { ArchVaultLogo } from '#/components/archvault-logo'
import { getBrowserTelemetryConfig } from '#/lib/settings.functions'
import { getLocale } from '#/paraglide/runtime'
import { m } from '#/paraglide/messages'

import appCss from '../styles.css?url'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ArchVault' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/logo/logo.svg' },
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'apple-touch-icon', href: '/logo192.png' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: RootNotFoundComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function BrowserTelemetryInit() {
  const getConfigFn = useServerFn(getBrowserTelemetryConfig)
  const { data: telemetryConfig } = useQuery({
    queryKey: ['browser-telemetry-config'],
    queryFn: () => getConfigFn(),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!telemetryConfig) return
    void import('#/lib/telemetry.browser').then(({ initBrowserTelemetry }) => {
      initBrowserTelemetry(telemetryConfig)
    })
  }, [telemetryConfig])

  return null
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <ImpersonationBanner />
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'TanStack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <BrowserTelemetryInit />
        <Scripts />
      </body>
    </html>
  )
}

function RootNotFoundComponent() {
  return (
    <RootDocument>
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
        <ArchVaultLogo className="size-12" />
        <h1 className="text-2xl font-semibold">{m.common_not_found_title()}</h1>
        <p className="text-muted-foreground">{m.common_not_found_description()}</p>
        <Link to="/" className={buttonVariants({ variant: 'outline' })}>
          {m.common_not_found_back_home()}
        </Link>
      </main>
    </RootDocument>
  )
}

