# Phase 1a — Project Scaffold

## Status: Complete

## Goal
Bootstrap the Archvault project with TanStack Start, Tailwind CSS v4, and shadcn/ui.

## Prerequisites
None — this is the first phase.

## Tasks
- [x] Scaffold project: `pnpm create @tanstack/start archvault` (with Better Auth + Nitro addons)
- [x] Install TanStack libraries: Form, Table, Virtual, Pacer, Hotkeys
- [x] Install additional deps: Zod, Zustand, Lucide React
- [x] Configure Tailwind CSS v4 (via `@tailwindcss/vite`)
- [x] Initialize shadcn/ui: `pnpm dlx shadcn@latest init`
- [x] Add base shadcn components: Button, Input, Label, Card, Dialog, DropdownMenu, Select, Tabs, Sonner (toast), Separator, Badge, Avatar, Sheet, Tooltip, Table, Textarea, Checkbox, Switch, AlertDialog, ScrollArea, Popover, Command
- [x] Set up `src/routes/__root.tsx` with TanStack Devtools (Router), TooltipProvider, Toaster
- [x] Clean up demo files (removed scaffold boilerplate routes/components)
- [x] Create landing page (`src/routes/index.tsx`)
- [x] Upgrade all deps to latest (Vite 8, vitest 4, etc.)
- [x] Remove `vite-tsconfig-paths` — use native `resolve.tsconfigPaths: true`
- [x] Fix `@noble/ciphers` version conflict via pnpm override
- [x] Verify dev server: `pnpm dev` starts without errors
- [x] Verify production build: `pnpm build` succeeds

## Key Files
- `package.json` — all dependencies
- `vite.config.ts` — Vite 8 + TanStack Start + Tailwind + Nitro
- `tsconfig.json` — TypeScript config with `@/*` and `#/*` path aliases
- `components.json` — shadcn/ui config
- `src/routes/__root.tsx` — root layout with providers and devtools
- `src/routes/index.tsx` — landing page
- `src/styles.css` — Tailwind v4 + shadcn/ui CSS variables
- `src/lib/utils.ts` — shadcn/ui utility (cn)
- `src/lib/auth.ts` — Better Auth server config (scaffold baseline)
- `src/lib/auth-client.ts` — Better Auth client config (scaffold baseline)
- `src/routes/api/auth/$.ts` — Better Auth route handler
- `.cta.json` — TanStack Start project metadata

## Verification
- [x] `pnpm dev` → app loads at http://localhost:3000
- [x] `pnpm build` → no errors
- [x] All shadcn components importable from `#/components/ui/*`
- [x] TanStack Router Devtools visible in dev mode
