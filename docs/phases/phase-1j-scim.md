# Phase 1j — SCIM Provisioning

## Status: Complete

## Goal
Add SCIM 2.0 support for automated user provisioning/deprovisioning from enterprise identity providers (Okta, Azure AD, etc.). Pairs with SSO (Phase 1i) since the same IdP typically handles both SSO and SCIM.

## Prerequisites
- Phase 1i (SSO) — complete

## Tasks
- [x] Install `@better-auth/scim` package
- [x] Add `scim()` plugin to server auth config with provider ownership and admin-only token generation
- [x] Add `scimClient()` plugin to client auth config
- [x] Ensure auth API route handler supports PUT, PATCH, DELETE methods
- [x] Add `scimProvider` table to Drizzle schema
- [x] Generate and apply database migration
- [x] Add SCIM nav link to admin sidebar
- [x] Create SCIM connections list page (`admin/scim`) with TanStack Table
- [x] Create SCIM token generation dialog with copy-to-clipboard
- [x] Show SCIM base URL in admin UI

## Key Files
- `src/lib/auth.ts` — server auth config with scim() plugin
- `src/lib/auth-client.ts` — client auth config with scimClient() plugin
- `src/routes/api/auth/$.ts` — API route with all HTTP methods
- `src/lib/schema/auth.ts` — scimProvider table definition
- `src/routes/_protected/admin.tsx` — admin layout with SCIM nav link
- `src/routes/_protected/admin/scim.tsx` — SCIM connections list page
- `src/components/admin/generate-scim-token-dialog.tsx` — token generation form

## Verification
- [x] `pnpm dev` starts without errors
- [x] `pnpm build` succeeds
- [x] Admin panel: SCIM page lists connections
- [x] Admin can generate a SCIM token for a provider
- [x] SCIM base URL `/api/auth/scim/v2/ServiceProviderConfig` returns valid config
- [x] Non-admin users cannot generate SCIM tokens (403)
- [ ] Token deletion invalidates the connection
- [x] All existing auth flows still work
