# Phase 6a — Versions & Timeline

## Status: Not Started

## Goal

Implement workspace-level version snapshots that capture the full state of the architecture model
at a point in time. Users can view a timeline of how the architecture has evolved, compare versions,
and browse historical snapshots in read-only mode.

## Prerequisites

- Phase 3f (Autosave, Hotkeys & Undo/Redo) — complete

## Data Model

The `diagram_revisions` table already exists from Phase 3a (schema only). This phase activates it
and adds workspace-level versioning.

**`workspace_versions`** (workspace-level snapshots):

| Column                     | Type              | Notes                                |
|----------------------------|-------------------|--------------------------------------|
| `id`                       | uuid, PK          |                                      |
| `workspace_id`             | FK → workspaces   |                                      |
| `version_number`           | integer           | Auto-incremented per workspace       |
| `name`                     | text, nullable    | Optional version name, e.g. "v2.0"   |
| `note`                     | text, nullable    | Description of what changed          |
| `snapshot_json`            | jsonb             | Full workspace model state           |
| `created_by`               | FK → users        |                                      |
| `created_at`               | timestamp         |                                      |

### Snapshot Structure

The `snapshot_json` captures:
```json
{
  "elements": [...],        // all model objects with full properties
  "connections": [...],      // all connections
  "tags": [...],             // all tags and tag groups
  "groups": [...],           // all groups
  "diagrams": [              // all diagrams with their placements
    {
      "diagram": {...},
      "diagram_elements": [...],
      "diagram_connections": [...],
      "diagram_groups": [...]
    }
  ],
  "flows": [                 // all flows with their steps
    {
      "flow": {...},
      "flow_steps": [...]
    }
  ]
}
```

## Tasks

### Database & Schema

- [ ] Drizzle schema for `workspace_versions` table
- [ ] Run migration

### Server Functions

- [ ] Create version: snapshot all workspace data into `snapshot_json`
- [ ] List versions for workspace (ordered by version_number desc)
- [ ] Get version detail (metadata + snapshot)
- [ ] Delete version (admin only)
- [ ] Version comparison: diff two snapshots (added/removed/modified objects)

### Version Creation UI

- [ ] "Create version" button in workspace header or settings
- [ ] Version creation dialog:
  - Auto-generated version number
  - Optional name (e.g., "Q1 2026 Architecture")
  - Optional note (what changed since last version)
- [ ] Confirmation with snapshot size indicator

### Version Timeline

- [ ] Timeline view in workspace settings or dedicated page:
  - Chronological list of versions (newest first)
  - Each entry shows: version number, name, note, created by, date
  - Click to browse that version
- [ ] Version selector dropdown in diagram editor header:
  - "Current" (default, live data)
  - List of versions (click to enter read-only browse mode)

### Read-Only Browse Mode

- [ ] When viewing a historical version:
  - Banner at top: "Viewing version {N} — {name}" with "Return to current" button
  - All editing is disabled (no drag, no add, no delete, no property edits)
  - All data is loaded from the snapshot_json, not live tables
  - Diagrams, flows, and tags work in view-only mode
  - Canvas renders from snapshot data

### Version Comparison (Stretch)

- [ ] Select two versions to compare
- [ ] Diff view showing:
  - Added objects/connections (green)
  - Removed objects/connections (red)
  - Modified objects (yellow) with change details
  - Summary: "12 added, 3 removed, 8 modified"

### i18n

- [ ] Add `version_*` keys to messages files

## Key Files

- `src/lib/schema/workspace-versions.ts` — versions table
- `src/lib/version.functions.ts` — server functions (snapshot creation, loading)
- `src/components/versions/version-timeline.tsx` — timeline view
- `src/components/versions/version-create-dialog.tsx` — creation dialog
- `src/components/versions/version-banner.tsx` — read-only mode banner
- `src/hooks/use-version-mode.ts` — version browsing state

## Design Notes

- **Workspace-level, not diagram-level.** Versions capture the entire workspace model because C4
  architecture is interconnected. A diagram-level snapshot would miss the context of how objects
  relate across diagrams. This matches IcePanel's approach.
- **Snapshot size.** For large workspaces, the JSON snapshot could be several MB. Consider
  compressing the JSON (gzip) before storing, or storing as separate blobs. For MVP, raw JSON
  is fine — optimize later.
- **Version creation is manual.** Users explicitly create versions (not automatic). This gives
  them control over what constitutes a meaningful checkpoint.

## Verification

- [ ] Create a version captures all workspace data
- [ ] Version list shows all versions with metadata
- [ ] Clicking a version enters read-only browse mode
- [ ] Banner displays and "Return to current" works
- [ ] All editing is disabled in version browse mode
- [ ] Diagrams render correctly from snapshot data
- [ ] Flows work in view-only mode from snapshot
- [ ] Version comparison shows diffs (if implemented)
- [ ] `pnpm dev` and `pnpm build` succeed
