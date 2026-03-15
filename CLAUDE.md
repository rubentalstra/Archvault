# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Archvault is a **greenfield** visual C4 architecture platform (Levels 1-3; Level 4 is out of scope). Users model software systems, create diagrams, build reusable architecture blocks, and share them via a community registry. Everything is UI-driven — users never write code.

Phase tracking and specs live in `docs/phases/`. The phase README (`docs/phases/README.md`) has the full dependency graph and current status of each sub-phase.

## Commands

```bash
pnpm dev            # Start dev server on http://localhost:3000
pnpm build          # Production build
pnpm preview        # Preview production build
pnpm test           # Run all tests (vitest)
pnpm vitest <file>  # Run a single test file

# Database (available after Phase 1b)
pnpm db:generate            # Generate migration from schema changes
pnpm db:migrate             # Apply migrations
pnpm db:studio              # Open Drizzle Studio
pnpm docker:compose:up      # Start PostgreSQL container

# Linting
pnpm lint            # Run ESLint on entire project
pnpm lint:fix        # Run ESLint with auto-fix
```

## Tech Stack

- **Framework:** TanStack Start (React 19 + Nitro server + file-based routing)
- **Router:** TanStack Router (type-safe, `src/routes/` directory)
- **Data:** TanStack Query, TanStack Form, TanStack Table, TanStack Virtual
- **State:** Zustand (client-side editor state)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` plugin, no `tailwind.config` — config lives in `src/styles.css`)
- **Components:** shadcn/ui (base-nova style, Lucide icons) — components in `src/components/ui/`
- **Validation:** Zod v4
- **Auth:** Better Auth (with admin, organization, twoFactor, emailOTP plugins)
- **Database:** PostgreSQL 18 + Drizzle ORM (after Phase 1b)
- **Build:** Vite 8, TypeScript strict mode

## Environment Variables

- Use `BETTER_AUTH_SECRET` for Better Auth secret configuration (see `.env.example`).

## Architecture

### Path Aliases
Two aliases resolve to `./src/*`:
- `#/*` — used in runtime code and shadcn config (Node.js subpath import)
- `@/*` — available but `#/*` is the convention

### Routing
TanStack Router with file-based route generation (`src/routeTree.gen.ts` is auto-generated — never edit). Routes live in `src/routes/`. Layout routes use underscore prefix (e.g., `_protected.tsx` will be the auth guard).

### Root Layout (`src/routes/__root.tsx`)
Wraps the app with `TooltipProvider`, `Toaster` (sonner), and TanStack Devtools (Router).

### Server Functions
TanStack Start uses server functions (via Nitro) for API logic — no separate API layer. The exception is `src/routes/api/auth/$.ts` which is a raw API route for Better Auth's handler.

### Data Fetching (TanStack Query)
TanStack Query is wired up via `@tanstack/react-router-ssr-query` in `src/router.tsx`. The `QueryClient` is created per router instance and available via router context.

**Pattern for client-side data fetching in components:**
```tsx
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

// Wrap server function with useServerFn, then pass to useQuery
const getDataFn = useServerFn(getData);
const { data, isLoading } = useQuery({
  queryKey: ["my-data"],
  queryFn: () => getDataFn(),
});

// Invalidate after mutations
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ["my-data"] });
```

**When to use what:**
- **Route `beforeLoad`** — auth guards, redirects, data needed before render. Call server functions directly (no Query).
- **`useQuery`** — client-side data fetching in components. Use `useServerFn()` to wrap server functions.
- **`authClient.use*` hooks** — Better Auth reactive state (`useSession`, `useActiveOrganization`, `useActiveMember`). These are not replaced by Query.
- **Direct calls** — mutations (form submissions, delete actions). These are fire-and-forget, not queries.

### Internationalization (i18n)
Paraglide JS v2 provides compile-time type-safe translations. Source files: `messages/*.json` (one flat file per locale with domain-prefixed keys). Auto-generated output: `src/paraglide/` (gitignored).

**Usage:** `import { m } from '#/paraglide/messages'` then `m.domain_key()` or `m.domain_key({ param: value })`. Example: `m.auth_sign_in()`, `m.org_create_success()`.

**Locale runtime:** `import { getLocale, setLocale, locales } from '#/paraglide/runtime'`

**URL strategy:** All locales use a URL prefix: English `/en/login`, Dutch `/nl/login`. Unprefixed URLs redirect to the detected locale. Cookie `ARCHVAULT_LOCALE` persists locale.

**Adding a locale:** Add to `project.inlang/settings.json` `locales` + add URL pattern to `vite.config.ts` `urlPatterns` + create `messages/{locale}.json`.

**Key convention:** `{domain}_{context}_{descriptor}` — e.g., `auth_login_title`, `org_create_success`. Domain = JSON filename.

### shadcn/ui
Config in `components.json`. Style: `base-nova`. RSC: `false`. Components install to `src/components/ui/`. Add new components with `pnpm dlx shadcn@latest add <component>`.

## Constraints

- **Greenfield only.** No legacy code, no backwards compatibility, no wrappers, no premature abstractions.
- **No RSC.** TanStack Start does not use React Server Components.
- **Tailwind v4.** No `tailwind.config.ts` — all theme config is CSS-based in `src/styles.css` using `@theme inline`.
- **pnpm only.** No npm or yarn.
- **Strict TypeScript.** `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` are all enabled.
- Forms use TanStack Form + Zod. Tables use TanStack Table. Toasts use Sonner.
- Client-side data fetching uses TanStack Query (`useQuery` + `useServerFn`). Never use `useState`/`useEffect` for data fetching.
- All user-facing strings use Paraglide message functions (`import { m } from '#/paraglide/messages'`). Never hardcode user-facing text.
