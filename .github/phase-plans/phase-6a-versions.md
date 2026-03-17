# Phase 6a — Versions & Timeline

## Status: Not Started

## Goal

Implement workspace-level version snapshots that capture the full state of the architecture model
at a point in time. Users can view a timeline of how the architecture has evolved, compare versions,
and browse historical snapshots in read-only mode.

## Prerequisites

- Phase 3f (Autosave, Hotkeys & Undo/Redo) — complete

## Current State

The `diagramRevision` table already exists in `apps/web/src/lib/schema/diagram-revisions.ts` with:

- `id`, `diagramId`, `revisionNumber`, `snapshotJson` (jsonb), `note`, `createdBy`, `createdAt`
- Index on `diagramId`

This captures per-diagram snapshots. This phase adds **workspace-level** versioning on top.

## Why JSONB Snapshots (Design Decision)

Five approaches were evaluated for workspace versioning:

| Approach                            | Effort    | Schema Impact                                                          | Fit                                       |
|-------------------------------------|-----------|------------------------------------------------------------------------|-------------------------------------------|
| **JSONB snapshot** (chosen)         | Low       | 1 new table                                                            | Best                                      |
| Copy-on-write (`version_id` column) | High      | All tables modified, all queries need version filter                   | Over-engineered                           |
| Temporal/history tables             | High      | 10+ history tables + raw SQL triggers (Drizzle has no trigger support) | Overkill for manual checkpoints           |
| Event sourcing                      | Very high | Complete architecture rewrite                                          | Incompatible with TanStack Query patterns |
| Git-like blobs                      | High      | All queries rewritten through blob indirection                         | Unproven (Specfy tried and shut down)     |

**Why JSONB snapshots are the correct choice for ArchVault:**

1. **Data volumes are small.** A typical workspace (200 elements, 500 connections, 20 diagrams with
   placements) serializes to ~100-500KB of JSON. Even with 100 versions, that's 50MB — trivial.
2. **Versions are manual checkpoints.** Users explicitly create named versions (like IcePanel). No
   need for continuous history, triggers, or event streams.
3. **Consistent with existing pattern.** `diagramRevision.snapshotJson` already does this at the
   diagram level. Workspace versions extend the same proven pattern.
4. **Zero impact on existing queries.** One new table, no modifications to the 10+ existing tables.
   No `version_id` filters, no history table JOINs, no event replay.
5. **Atomic consistency.** One row = one complete workspace state. No risk of partial snapshots
   from multi-table copy transactions.
6. **Diffing is straightforward.** Compare two JSONB objects by entity ID — added, removed, modified.
   This is a UI-layer concern, not a database query problem.
7. **Schema evolution is handled.** A `schemaVersion` integer inside the JSONB lets the app handle
   deserialization of older snapshot formats gracefully.

## Data Model

**`workspace_versions`** table:

| Column           | Type            | Notes                          |
|------------------|-----------------|--------------------------------|
| `id`             | text, PK        | nanoid                         |
| `workspace_id`   | FK → workspace  | cascade on delete              |
| `version_number` | integer         | Auto-incremented per workspace |
| `name`           | text, nullable  | Optional label, e.g. "v2.0"    |
| `note`           | text, nullable  | Description of what changed    |
| `snapshot_json`  | jsonb, NOT NULL | Full workspace model state     |
| `created_by`     | FK → user       | set null on delete             |
| `created_at`     | timestamp       | default now()                  |

Indices: `workspace_id`, unique `(workspace_id, version_number)`.

### Snapshot Structure

The `snapshot_json` captures all versioned workspace data with a schema version for forward compatibility:

```json
{
  "schemaVersion": 1,
  "elements": [
    {
      "id": "...",
      "parentElementId": "... | null",
      "elementType": "actor | system | app | store | component",
      "name": "...",
      "displayDescription": "...",
      "description": "...",
      "status": "planned | live | deprecated",
      "external": false,
      "metadataJson": {},
      "iconTechnologyId": "... | null"
    }
  ],
  "connections": [
    {
      "id": "...",
      "sourceElementId": "...",
      "targetElementId": "...",
      "direction": "outgoing | incoming | bidirectional | none",
      "description": "...",
      "iconTechnologyId": "... | null"
    }
  ],
  "tags": [
    {
      "id": "...",
      "name": "...",
      "color": "#...",
      "icon": "... | null"
    }
  ],
  "elementTags": [
    {
      "elementId": "...",
      "tagId": "..."
    }
  ],
  "connectionTags": [
    {
      "connectionId": "...",
      "tagId": "..."
    }
  ],
  "diagrams": [
    {
      "id": "...",
      "name": "...",
      "diagramType": "system_context | container | component",
      "gridSize": 20,
      "snapToGrid": true,
      "elements": [
        {
          "elementId": "...",
          "x": 0,
          "y": 0,
          "width": 200,
          "height": 120,
          "zIndex": 0,
          "displayMode": "normal",
          "styleJson": null
        }
      ],
      "connections": [
        {
          "connectionId": "...",
          "pathType": "curved",
          "lineStyle": "solid",
          "sourceAnchor": "auto",
          "targetAnchor": "auto",
          "labelPosition": 0.5,
          "controlPointsJson": null,
          "styleJson": null
        }
      ]
    }
  ],
  "elementLinks": [
    {
      "id": "...",
      "elementId": "...",
      "url": "...",
      "label": "... | null",
      "sortOrder": 0
    }
  ],
  "technologies": [
    {
      "id": "...",
      "name": "...",
      "iconSlug": "...",
      "website": "... | null"
    }
  ],
  "elementTechnologies": [
    {
      "elementId": "...",
      "technologyId": "...",
      "sortOrder": 0
    }
  ],
  "connectionTechnologies": [
    {
      "connectionId": "...",
      "technologyId": "...",
      "sortOrder": 0
    }
  ]
}
```

**What is NOT included in snapshots:**

- Auth/org/team data (not workspace-scoped)
- `createdBy`, `updatedBy`, `createdAt`, `updatedAt` fields (audit metadata, not model state)
- `deletedAt` (snapshots only capture live entities — soft-deleted items are excluded)
- `sourceBlockInstallationId` (block provenance, not model state)
- `diagramRevision` (per-diagram versioning is separate from workspace versioning)

### Schema Evolution Strategy

The `schemaVersion` integer inside each snapshot handles future changes:

- **Adding a field:** New snapshots include it, old snapshots omit it → deserializer uses a default
- **Removing a field:** New snapshots omit it, old snapshots include it → deserializer ignores it
- **Renaming/restructuring:** Bump `schemaVersion`, add a migration function per version step

```typescript
// Example: deserialize with forward compatibility
function deserializeSnapshot(json: unknown): WorkspaceSnapshot {
    const raw = json as { schemaVersion: number; [key: string]: unknown };
    let data = raw;
    if (raw.schemaVersion < 2) data = migrateV1toV2(data);
    if (raw.schemaVersion < 3) data = migrateV2toV3(data);
    return parseWorkspaceSnapshot(data); // Zod validation
}
```

## Tasks

### Database & Schema

- [ ] Create Drizzle schema for `workspace_versions` table in `apps/web/src/lib/schema/workspace-versions.ts`
- [ ] Define Zod schema for snapshot structure (type-safe serialization/deserialization)
- [ ] Run migration via `pnpm drizzle-kit generate` + `pnpm drizzle-kit migrate`

### Snapshot Creation (Server Functions)

- [ ] `createWorkspaceVersion` server function:
    - Query all workspace entities (elements, connections, tags, groups, diagrams + placements, technologies, links) in
      a single transaction
    - Filter out soft-deleted entities (`WHERE deleted_at IS NULL`)
    - Strip audit fields (`createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `deletedAt`)
    - Serialize into typed snapshot structure with `schemaVersion: 1`
    - Auto-increment `version_number` (MAX + 1 for workspace)
    - Single INSERT into `workspace_versions`
- [ ] `listWorkspaceVersions` — metadata only (no snapshot_json), ordered by version_number desc
- [ ] `getWorkspaceVersion` — full snapshot for read-only browsing
- [ ] `deleteWorkspaceVersion` — admin/owner only
- [ ] `diffWorkspaceVersions` — compare two snapshots by entity ID:
    - Added: entities in v2 not in v1
    - Removed: entities in v1 not in v2
    - Modified: entities in both but with different field values (deep compare excluding IDs)

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

- `apps/web/src/lib/schema/workspace-versions.ts` — versions table (new)
- `apps/web/src/lib/schema/diagram-revisions.ts` — existing per-diagram revisions (separate concern)
- `apps/web/src/lib/schemas/workspace-snapshot.ts` — Zod schema for snapshot structure (new)
- `apps/web/src/lib/version.functions.ts` — server functions (snapshot creation, loading, diffing)
- `apps/web/src/components/versions/version-timeline.tsx` — timeline view
- `apps/web/src/components/versions/version-create-dialog.tsx` — creation dialog
- `apps/web/src/components/versions/version-banner.tsx` — read-only mode banner

## Design Notes

- **Workspace-level, not diagram-level.** Versions capture the entire workspace model because C4
  architecture is interconnected. A diagram-level snapshot would miss how objects relate across
  diagrams. The existing `diagramRevision` table is a separate concern for per-diagram history.
- **Version creation is manual.** Users explicitly create versions (not automatic). This matches
  IcePanel's model and gives users control over what constitutes a meaningful checkpoint.
- **Snapshot excludes audit metadata.** Only model state is captured — not who created what or
  when. This keeps snapshots focused and smaller.
- **Schema evolution over migration.** The `schemaVersion` field inside each snapshot means old
  versions remain readable even as the schema evolves. Migrations run at deserialization time,
  not at the database level.

## Verification

- [ ] Create a version captures all workspace data (all entity types present in snapshot)
- [ ] Snapshot excludes soft-deleted entities and audit metadata
- [ ] Version list shows all versions with metadata (without loading full snapshots)
- [ ] Clicking a version enters read-only browse mode
- [ ] Banner displays and "Return to current" works
- [ ] All editing is disabled in version browse mode
- [ ] Diagrams render correctly from snapshot data
- [ ] Version comparison shows diffs (if implemented)
- [ ] Zod schema validates snapshot structure on creation and deserialization
- [ ] `pnpm dev` and `pnpm build` succeed
