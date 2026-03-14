# Phase 2c — Tags

## Status: Not Started

## Goal

Add a rich tag system for categorizing elements and relationships, with color and icon support.

## Prerequisites

- Phase 2b (Relationships) — complete

## Data Model

**`tags`** (workspace-scoped tag definitions):

| Column                     | Type            | Notes                                                 |
|----------------------------|-----------------|-------------------------------------------------------|
| `id`                       | uuid, PK        |                                                       |
| `workspace_id`             | FK → workspaces |                                                       |
| `name`                     | text            | Tag label, e.g. "us-west1", "Internal"                |
| `color`                    | varchar(7)      | Hex color, e.g. `#16D17D`, `#00ADDB`, `#FF8811`       |
| `icon`                     | text, nullable  | Lucide icon name, e.g. "globe", "database", "network" |
| `created_at`, `updated_at` | timestamps      |                                                       |

**`element_tags`** (many-to-many join):

| Column       | Type          | Notes |
|--------------|---------------|-------|
| `element_id` | FK → elements | PK    |
| `tag_id`     | FK → tags     | PK    |

**`relationship_tags`** (many-to-many join):

| Column            | Type               | Notes |
|-------------------|--------------------|-------|
| `relationship_id` | FK → relationships | PK    |
| `tag_id`          | FK → tags          | PK    |

## Tasks

- [ ] Drizzle schema for `tags` table (with color and icon columns)
- [ ] Drizzle schemas for `element_tags` and `relationship_tags` (composite PK join tables)
- [ ] Run migration
- [ ] Tag CRUD server functions (scoped to workspace):
    - Create tag (name, color, optional icon)
    - Update tag (rename, change color/icon)
    - Delete tag (cascades to join tables)
    - List tags for workspace
- [ ] Tag assignment server functions:
    - Add/remove tags on elements
    - Add/remove tags on relationships
- [ ] Tag management UI (create, rename, change color/icon, delete tags)
- [ ] Color picker for tag creation/editing (preset palette + custom hex)
- [ ] Icon picker for tag creation/editing (Lucide icon subset)
- [ ] Tag picker component (searchable, multi-select, used on element and relationship forms)
- [ ] Tag badges on element and relationship rows (colored pill with icon + label)
- [ ] Tag filtering in elements table (filter by one or more tags)
- [ ] Tag filtering in relationships table
- [ ] Permission checks (org role-based)

## CLI Commands

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Key Files

- `src/lib/schema/tags.ts` — Drizzle schemas (tags, element_tags, relationship_tags)
- `src/lib/server/tags.ts` — server functions
- `src/components/tags/tag-picker.tsx` — searchable multi-select tag assignment
- `src/components/tags/tag-manager.tsx` — tag CRUD UI (workspace settings)
- `src/components/tags/tag-badge.tsx` — colored pill with optional icon
- `src/components/tags/color-picker.tsx` — color selection for tags
- `src/components/tags/icon-picker.tsx` — Lucide icon selection for tags

## Design Notes

- **Tag rendering:** Each tag renders as a colored pill — border and icon in the tag's color, label text beside it,
  with a subtle tinted background (color at ~10% opacity). This matches the IcePanel style.
- **Icon set:** Tags use Lucide icons (same as shadcn/ui). A curated subset of ~30-50 commonly useful icons is offered
  in the icon picker (network, globe, database, server, cloud, lock, etc.), not the full 1500+ set.
- **Workspace-scoped:** Tags are defined per workspace. Each workspace has its own tag library.
- **No tag categories/groups:** Tags are flat (not grouped into categories). If grouping is needed later, it can be
  added as a separate feature.

## Verification

- [ ] Create tags with name, color, and icon
- [ ] Edit tag name, color, and icon
- [ ] Delete tag (removes from all assigned elements/relationships)
- [ ] Assign multiple tags to elements and relationships
- [ ] Tag badges render with correct color, icon, and tinted background
- [ ] Filter elements table by tags
- [ ] Filter relationships table by tags
- [ ] `pnpm dev` and `pnpm build` succeed
