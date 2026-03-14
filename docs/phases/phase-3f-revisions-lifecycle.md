# Phase 3f — Revisions

## Status: Not Started

## Goal

Add diagram revision history — users can create named snapshots of a diagram and restore previous versions.

## Prerequisites

- Phase 3e (Autosave, Hotkeys, Undo/Redo) — complete

## Tasks

### Revision CRUD

- [ ] Server function: create revision — captures immutable `snapshot_json` of current diagram state
    - Snapshot includes: all `diagram_elements` (positions, sizes, styles) + `diagram_relationships` (visual props)
    - Auto-increments `revision_number` per diagram
- [ ] Server function: list revisions for a diagram
- [ ] Server function: get revision detail (load snapshot)
- [ ] Server function: restore revision — replaces current diagram state with snapshot contents
- [ ] Update `current_revision_id` on diagram when a new revision is created

### Revision UI

- [ ] "Create revision" button in editor toolbar → dialog with optional note
- [ ] Revision history panel (collapsible, in side panel or drawer):
    - List with TanStack Table + Virtual (revision number, note, author, date)
    - Click to preview a revision (read-only overlay on canvas)
    - "Restore" button to apply a revision as the current state
- [ ] Visual indicator when viewing a historical revision (banner: "Viewing revision #N — Restore or go back")

## Key Files

- `src/lib/server/diagram-revisions.ts` — revision server functions
- `src/components/editor/revision-history.tsx` — revision list panel
- `src/components/editor/create-revision-dialog.tsx` — revision creation with optional note
- `src/components/editor/revision-preview-banner.tsx` — historical view indicator

## Design Notes

- **Revisions are manual, not automatic.** Autosave (3e) saves the working state continuously. Revisions are explicit
  "checkpoints" the user creates intentionally (like Git commits). This avoids flooding the revision list with
  auto-generated snapshots.
- **Snapshot format:** `snapshot_json` stores the full diagram state as a JSON object:
  `{ elements: DiagramElement[], relationships: DiagramRelationship[] }`. This is self-contained — restoring a
  revision doesn't depend on the current state of the core element/relationship tables.
- **Lifecycle states removed:** The original plan had `draft → in_review → approved → archived` workflow states.
  This is over-engineered for an architecture diagramming tool. If approval workflows are needed later, they can be
  added as a separate feature. For now, diagrams are simply "active" or soft-deleted.

## Verification

- [ ] Creating a revision captures full diagram snapshot
- [ ] Revision number auto-increments correctly
- [ ] Revision history lists all versions with correct metadata
- [ ] Previewing a revision shows historical state on canvas (read-only)
- [ ] Restoring a revision replaces current diagram state
- [ ] `pnpm dev` and `pnpm build` succeed
