# Phase 2e — Groups

## Status: Not Started

## Goal

Implement Groups as visual overlays that organize model objects within diagrams. Groups are NOT model
objects — they are diagram-level organizational containers. Objects can belong to multiple groups.

Like IcePanel, groups visualize deployment boundaries, microservice clusters, cloud regions, team
ownership, and other cross-cutting organizational concepts.

## Prerequisites

- Phase 2d (Naming Migration & Store Type) — complete

## Data Model

**`groups`** (workspace-scoped group definitions):

| Column                                   | Type                  | Notes                                 |
|------------------------------------------|-----------------------|---------------------------------------|
| `id`                                     | uuid, PK              |                                       |
| `workspace_id`                           | FK → workspaces       |                                       |
| `name`                                   | text                  | Group label, e.g. "Production", "AWS" |
| `color`                                  | varchar(7)            | Hex color for border/background       |
| `parent_group_id`                        | FK → groups, nullable | Nested groups support                 |
| `description`                            | text, nullable        | Optional description                  |
| `created_by`, `updated_by`               | FK → users            |                                       |
| `deleted_at`, `created_at`, `updated_at` | timestamps            |                                       |

**`element_groups`** (many-to-many: objects can belong to multiple groups):

| Column       | Type          | Notes        |
|--------------|---------------|--------------|
| `element_id` | FK → elements | Composite PK |
| `group_id`   | FK → groups   | Composite PK |

**`diagram_groups`** (per-diagram visual placement of groups):

| Column       | Type                  | Notes                            |
|--------------|-----------------------|----------------------------------|
| `id`         | uuid, PK              |                                  |
| `diagram_id` | FK → diagrams         |                                  |
| `group_id`   | FK → groups           |                                  |
| `x`          | float                 | Position on canvas               |
| `y`          | float                 | Position on canvas               |
| `width`      | float                 | Manual size (or auto-calculated) |
| `height`     | float                 | Manual size (or auto-calculated) |
| `z_index`    | integer, default `-1` | Behind objects by default        |
| `style_json` | jsonb, nullable       | Visual overrides                 |

Unique constraint: `(diagram_id, group_id)` — a group appears at most once per diagram.

## Tasks

### Database & Schema

- [ ] Drizzle schema for `groups` table
- [ ] Drizzle schema for `element_groups` join table (composite PK)
- [ ] Drizzle schema for `diagram_groups` table (per-diagram placement)
- [ ] Run migration

### Server Functions

- [ ] Group CRUD (create, update, delete, list by workspace)
- [ ] Assign/unassign elements to groups (add/remove element_groups rows)
- [ ] Batch assign: multi-select elements → assign to group
- [ ] Nested groups: validate no circular parent references
- [ ] Add/remove groups from diagrams (diagram_groups CRUD)
- [ ] Update group position/size on diagram

### UI Components

- [ ] Group management panel (workspace settings or sidebar):
    - Create group (name, color)
    - Edit group (rename, change color, set parent group)
    - Delete group (removes from all diagrams, unassigns elements)
- [ ] Group assignment in element properties panel:
    - "Groups" section with `+ Add to group` button
    - Searchable group picker (multi-select)
    - Remove from group
- [ ] Group assignment via multi-select:
    - Select multiple elements → right panel shows "Add to group" action
- [ ] Group color picker (preset palette matching tag colors)

### i18n

- [ ] Add `group_*` keys to `messages/en.json` and `messages/nl.json`

## Key Files

- `src/lib/schema/groups.ts` — groups, element_groups, diagram_groups tables
- `src/lib/schema/index.ts` — barrel export
- `src/lib/group.functions.ts` — server functions
- `src/lib/group.validators.ts` — validation (circular parent check)
- `src/components/groups/group-manager.tsx` — group CRUD UI
- `src/components/groups/group-picker.tsx` — assign elements to groups

## Design Notes

- **Groups are NOT model objects.** They don't appear in the element hierarchy, can't have connections,
  and don't have an element type. They're purely organizational overlays.
- **Per-diagram placement:** A group exists in the model but is placed independently on each diagram.
  The same group can appear on multiple diagrams at different positions.
- **Auto-resize (phase 3e):** When objects are assigned to a group, the group auto-resizes to contain
  them. Manual resize is only available for groups with no assigned objects. This is a canvas feature
  implemented in phase 3e.
- **Nested groups:** Groups can contain other groups (e.g., "AWS" → "us-east-1" → "VPC"). The
  `parent_group_id` column enables this. Validation prevents circular references.

## Verification

- [ ] Create groups with name and color
- [ ] Assign elements to groups (single and batch)
- [ ] Unassign elements from groups
- [ ] Elements can belong to multiple groups
- [ ] Nested groups work (set parent, validate no cycles)
- [ ] Delete group removes assignments
- [ ] Group data visible in element properties panel
- [ ] `pnpm dev` and `pnpm build` succeed
