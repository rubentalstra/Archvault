# Phase 1f — Workspaces

## Status: Complete

## Goal
Add workspace CRUD scoped to the active organization.

## Prerequisites
- Phase 1e (Organizations & Teams) — complete

## Tasks
- [x] Drizzle schema for `workspaces` table (id, organization_id, name, slug, description, status, icon_emoji, settings_json, created_by, deleted_at, created_at, updated_at)
- [x] Run migration
- [x] Server functions: create, read, update, delete workspace (scoped to active org)
- [x] Workspace list on dashboard (filtered by active org, using TanStack Query)
- [x] Create workspace form (TanStack Form — name, slug, description, icon)
- [x] Workspace settings page (TanStack Form)
- [x] Workspace dashboard/index page
- [x] Permission checks on all workspace routes (org role-based)
- [x] Workspace slug validation (unique within org)

## CLI Commands
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Key Files
- `src/lib/schema/workspaces.ts` — Drizzle schema
- `src/lib/workspace.validators.ts` — Zod validation schemas
- `src/lib/workspace.functions.ts` — server functions
- `src/routes/_protected/_onboarded/workspace/$workspaceSlug.tsx` — workspace layout
- `src/routes/_protected/_onboarded/workspace/$workspaceSlug/index.tsx` — workspace dashboard
- `src/routes/_protected/_onboarded/workspace/$workspaceSlug/settings.tsx` — workspace settings
- `src/components/workspace/create-workspace-dialog.tsx` — creation form
- `src/components/workspace/workspace-list.tsx` — workspace list on dashboard

## Verification
- [x] Create workspace with name + slug
- [x] Workspace appears in list on dashboard
- [x] Workspace settings save correctly
- [x] Viewers can read but not modify workspace
- [x] Workspace slug is unique within org
- [x] `pnpm dev` and `pnpm build` succeed
