# Phase 8e — Community Registry

## Status: Not Started

## Goal

Launch the community block registry — a public marketplace where users can publish, discover,
and install architecture blocks shared by the community. This is the social layer that makes
Archvault's block system a collaborative ecosystem.

## Prerequisites

- Phase 8c (Block Browser & Install) — complete

## Tasks

### Publishing Flow

- [ ] "Publish to Registry" action on private blocks
- [ ] Publishing checklist:
  - Valid manifest (passes schema validation)
  - Readme present and non-empty
  - At least one diagram in the block
  - Category and tags assigned
- [ ] Review/moderation queue (optional — can start with auto-publish)
- [ ] Published blocks are immutable per version (create new version to update)

### Registry API

- [ ] Public API endpoints (no auth required for reading):
  - `GET /api/registry/blocks` — search/browse blocks
  - `GET /api/registry/blocks/:slug` — block detail
  - `GET /api/registry/blocks/:slug/versions` — version history
  - `GET /api/registry/blocks/:slug/manifest` — download manifest
- [ ] Authenticated endpoints:
  - `POST /api/registry/blocks` — publish block
  - `PUT /api/registry/blocks/:slug` — update metadata
  - `DELETE /api/registry/blocks/:slug` — unpublish

### Community Features

- [ ] Download counter per block
- [ ] Block author profile (username, avatar, block count)
- [ ] "Featured" blocks section (curated by admins)
- [ ] Category browsing pages
- [ ] Related blocks suggestions (same category/tags)

### Discovery Integration

- [ ] Block browser (phase 8c) shows community blocks alongside official ones
- [ ] "Community" filter tab
- [ ] Sort by downloads, rating, newest
- [ ] Block detail shows author info and download count

### i18n

- [ ] Add registry keys to messages files

## Key Files

- `apps/web/src/routes/api/registry/$.ts` — registry API routes
- `apps/web/src/lib/registry.functions.ts` — registry server functions
- `apps/web/src/components/blocks/registry-browser.tsx` — community browsing UI
- `apps/web/src/components/blocks/publish-dialog.tsx` — publish flow

## Design Notes

- **Self-hosted registries.** For self-hosted Archvault instances, the registry can either
  connect to the central community registry (default) or run its own private registry. This
  is configurable via environment variables.
- **Versioning is immutable.** Once a version is published, its manifest cannot be changed.
  This ensures installed blocks don't unexpectedly change. Authors publish new versions instead.
- **No rating system initially.** Start with download count as the quality signal. Ratings/reviews
  can be added later once there's enough community activity.

## Verification

- [ ] Blocks can be published to the registry
- [ ] Published blocks appear in the block browser
- [ ] Registry API returns correct data
- [ ] Download count increments on install
- [ ] Block detail shows author and community info
- [ ] Featured blocks section works
- [ ] Self-hosted registry mode works
- [ ] `pnpm dev` and `pnpm build` succeed
