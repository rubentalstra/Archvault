# Phase 7c — Activity Log & Audit

## Status: Not Started

## Goal

Track and display a log of all model changes within a workspace: who changed what, when, and how.
This provides an audit trail and helps teams understand the evolution of their architecture.

## Prerequisites

- Phase 6a (Versions & Timeline) — complete

## Tasks

### Database

- [ ] `activity_log` table:
  - `id` (uuid, PK)
  - `workspace_id` (FK)
  - `user_id` (FK → users)
  - `action` (enum: created, updated, deleted, restored)
  - `entity_type` (enum: element, connection, diagram, flow, group, tag, version)
  - `entity_id` (uuid)
  - `entity_name` (text) — snapshot of name at time of action
  - `changes_json` (jsonb, nullable) — diff of what changed
  - `created_at` (timestamp)

### Server Functions

- [ ] Log activity on all model mutations (create, update, delete)
- [ ] Query activity log (paginated, filtered by entity type, user, date range)
- [ ] Get activity for a specific entity (element, diagram, etc.)

### UI

- [ ] Activity feed page (`workspace/$workspaceSlug/activity`)
- [ ] Activity timeline in element/diagram/flow properties panel
- [ ] Filter by entity type, user, date range
- [ ] Each entry shows: user avatar, action verb, entity name, timestamp

### i18n

- [ ] Add `activity_*` keys to messages files

## Key Files

- `apps/web/src/lib/schema/activity-log.ts`
- `apps/web/src/lib/activity.functions.ts`
- `apps/web/src/routes/_protected/_onboarded/workspace/$workspaceSlug/activity.tsx`
- `apps/web/src/components/activity/activity-feed.tsx`

## Verification

- [ ] Model changes are logged automatically
- [ ] Activity feed shows chronological entries
- [ ] Filters work correctly
- [ ] Entity-specific activity shows in properties panel
- [ ] `pnpm dev` and `pnpm build` succeed
