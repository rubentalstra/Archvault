# Phase 1i — SSO (Single Sign-On)

## Status: Not Started

## Goal
Add enterprise SSO support via the Better Auth SSO plugin (`@better-auth/sso`) alongside existing social providers. Supports OIDC, OAuth2, and SAML 2.0 for enterprise customers with domain verification and organization provisioning.

## Prerequisites
- Phase 1c (Authentication) — complete

## Tasks
- [x] Install `@better-auth/sso` package
- [x] Add `sso()` plugin to server auth config with domain verification and org provisioning
- [x] Add `ssoClient()` plugin to client auth config
- [x] Add `ssoProvider` table to Drizzle schema
- [ ] Generate and apply database migration
- [x] Add SSO Providers nav link to admin sidebar
- [x] Create SSO providers list page (`admin/sso`) with TanStack Table
- [x] Create SSO provider registration dialog (OIDC/SAML)
- [x] Domain verification UI (DNS TXT record instructions + verify button)
- [ ] Login page SSO sign-in tab (deferred to follow-up phase)

## Key Files
- `src/lib/auth.ts` — server auth config with sso() plugin
- `src/lib/auth-client.ts` — client auth config with ssoClient() plugin
- `src/lib/schema/auth.ts` — ssoProvider table definition
- `src/routes/_protected/admin.tsx` — admin layout with SSO nav link
- `src/routes/_protected/admin/sso.tsx` — SSO providers list page
- `src/components/admin/register-sso-dialog.tsx` — SSO registration form

## Verification
- [ ] `pnpm dev` starts without errors
- [ ] `pnpm build` succeeds
- [ ] Login/signup pages unchanged, social buttons still work
- [ ] Admin panel: SSO Providers page lists providers
- [ ] Admin can register an OIDC provider via dialog
- [ ] Domain verification flow (TXT record instructions + verify button)
- [ ] SSO sign-in redirects to IdP and returns with valid session
- [ ] Org provisioning: SSO user auto-joins linked org
- [ ] Existing auth (email/password, emailOTP, 2FA) still works
