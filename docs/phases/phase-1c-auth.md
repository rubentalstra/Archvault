# Phase 1c — Authentication

## Status: Complete

## Goal
Integrate Better Auth with all plugins, create auth pages, and protect routes.

## Prerequisites
- Phase 1b (Database & Docker) — complete

## Tasks
- [x] Install Better Auth: `pnpm add better-auth`
- [x] Create `src/lib/auth.ts` — server config with all plugins (admin, organization, twoFactor, emailOTP, haveibeenpwned, lastLoginMethod, tanstackStartCookies)
- [x] Create `src/lib/auth-client.ts` — client config with matching plugins
- [x] Create `src/lib/auth.functions.ts` — `getSession` and `ensureSession` server functions
- [x] Create `src/lib/permissions.ts` — platform AC + org AC with all roles (owner, admin, editor, viewer)
- [x] Create `src/routes/api/auth/$.ts` — Better Auth route handler
- [x] Generate Better Auth tables: `pnpm dlx @better-auth/cli generate` → Drizzle migration
- [x] Create `src/routes/_protected.tsx` — auth guard layout with `beforeLoad`
- [x] Build sign-up page (`src/routes/signup.tsx`) — email/password + social providers (GitHub, Microsoft, Google)
- [x] Build sign-in page (`src/routes/login.tsx`) — email/password + social + Email OTP
- [x] Build email verification page (`src/routes/verify-email.tsx`)
- [x] Build password reset page (`src/routes/reset-password.tsx`)
- [x] Build 2FA setup page (TOTP enrollment)
- [x] Build 2FA challenge page (TOTP verification)
- [x] All forms use TanStack Form + shadcn/ui

## CLI Commands
```bash
pnpm add better-auth
pnpm dlx @better-auth/cli generate
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Key Files
- `src/lib/auth.ts` — Better Auth server config
- `src/lib/auth-client.ts` — Better Auth client config
- `src/lib/auth.functions.ts` — session helpers (getSession, ensureSession)
- `src/lib/permissions.ts` — RBAC definitions (platform + org)
- `src/routes/api/auth/$.ts` — auth API route handler
- `src/routes/_protected.tsx` — auth guard layout
- `src/routes/signup.tsx` — sign-up page
- `src/routes/login.tsx` — sign-in page
- `src/routes/verify-email.tsx` — email verification
- `src/routes/reset-password.tsx` — password reset
- `src/routes/_protected/settings.tsx` — 2FA setup

## Verification
- [x] Sign up with email/password creates user in database
- [x] Sign in returns valid session
- [x] Protected routes redirect to login when unauthenticated
- [x] Social provider buttons render (full OAuth flow depends on provider config)
- [x] `pnpm dev` and `pnpm build` succeed

## Social Provider Configuration
- Social providers are enabled per provider, not globally.
- Set `AUTH_SOCIAL_<PROVIDER>_ENABLED=true` to force-enable a provider.
- If the toggle is omitted, provider auto-enables only when both credentials exist.
- Login and signup pages render only providers that are enabled at runtime.

