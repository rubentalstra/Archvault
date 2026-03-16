# Phase 7d — Trash UI & Permanent Delete

## Status: Not Started

## Goal

Build a trash management interface for soft-deleted entities. Users can view, restore, or
permanently delete items. Includes configurable auto-cleanup for old deleted items.

## Prerequisites

- Phase 2e (Groups) — complete

## Tasks

### Trash Page

- [ ] Route: `workspace/$workspaceSlug/trash`
- [ ] Table of soft-deleted items: elements, connections, diagrams, flows, groups, tags
- [ ] Columns: name, type, deleted by, deleted at, actions (restore, permanent delete)
- [ ] Filter by entity type
- [ ] Search within trash
- [ ] Bulk actions: restore selected, permanently delete selected

### Server Functions

- [ ] List deleted items (query WHERE deleted_at IS NOT NULL)
- [ ] Restore item (set deleted_at = null)
- [ ] Permanent delete (hard delete with cascade)
- [ ] Auto-cleanup: scheduled job to permanently delete items older than N days (configurable)

### Restore Logic

- [ ] Restore element: verify parent still exists (if not, restore as orphan or prompt)
- [ ] Restore connection: verify source and target elements still exist
- [ ] Restore diagram: restore all diagram_elements and diagram_connections
- [ ] Cascade restore option: restore element + all its children

### i18n

- [ ] Add `trash_*` keys to messages files

## Key Files

- `src/routes/_protected/_onboarded/workspace/$workspaceSlug/trash.tsx`
- `src/components/trash/trash-table.tsx`
- `src/lib/trash.functions.ts`

## Verification

- [ ] Deleted items appear in trash
- [ ] Restore returns items to their original location
- [ ] Permanent delete removes items completely
- [ ] Bulk actions work
- [ ] Auto-cleanup removes old items
- [ ] `pnpm dev` and `pnpm build` succeed
