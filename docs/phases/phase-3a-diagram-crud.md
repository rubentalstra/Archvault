# Phase 3a — Diagram CRUD & Schema

## Status: Not Started

## Goal

Create diagram database schemas (including per-diagram visual properties for elements and relationships),
CRUD operations, and scope validation.

## Prerequisites

- Phase 2a (Elements) — complete
- Phase 2b (Relationships) — complete (needed for `diagram_relationships`)

## Data Model

**`diagrams`** (one row per diagram):

| Column                                   | Type                                        | Notes                                 |
|------------------------------------------|---------------------------------------------|---------------------------------------|
| `id`                                     | uuid, PK                                    |                                       |
| `workspace_id`                           | FK → workspaces                             |                                       |
| `name`                                   | text                                        |                                       |
| `description`                            | text, nullable                              |                                       |
| `diagram_type`                           | enum: `context` / `container` / `component` | C4 level                              |
| `scope_element_id`                       | FK → elements, nullable                     | Which element this diagram zooms into |
| `grid_size`                              | integer, default `20`                       | Grid spacing in px                    |
| `snap_to_grid`                           | boolean, default `true`                     |                                       |
| `current_revision_id`                    | FK → diagram_revisions, nullable            | Latest published revision             |
| `source_block_installation_id`           | FK, nullable                                | If created from a block               |
| `created_by`, `updated_by`               | FK → users                                  |                                       |
| `deleted_at`, `created_at`, `updated_at` | timestamps                                  |                                       |

**`diagram_elements`** (per-diagram visual properties for each element placed on a diagram):

| Column       | Type                 | Notes                                           |
|--------------|----------------------|-------------------------------------------------|
| `id`         | uuid, PK             |                                                 |
| `diagram_id` | FK → diagrams        |                                                 |
| `element_id` | FK → elements        |                                                 |
| `x`          | float                | Position on canvas                              |
| `y`          | float                | Position on canvas                              |
| `width`      | float, default `200` |                                                 |
| `height`     | float, default `120` |                                                 |
| `z_index`    | integer, default `0` | Layering order                                  |
| `style_json` | jsonb, nullable      | Visual overrides (color, border, opacity, etc.) |

Unique constraint: `(diagram_id, element_id)` — an element appears at most once per diagram.

**`diagram_relationships`** (per-diagram visual properties for each relationship shown on a diagram):

| Column                | Type                                                               | Notes                                          |
|-----------------------|--------------------------------------------------------------------|------------------------------------------------|
| `id`                  | uuid, PK                                                           |                                                |
| `diagram_id`          | FK → diagrams                                                      |                                                |
| `relationship_id`     | FK → relationships                                                 |                                                |
| `path_type`           | enum: `straight` / `curved` / `orthogonal`, default `curved`       | Line shape                                     |
| `line_style`          | enum: `solid` / `dashed` / `dotted`, default `solid`               | Line rendering                                 |
| `source_anchor`       | enum: `auto` / `top` / `bottom` / `left` / `right`, default `auto` | Where line attaches to source                  |
| `target_anchor`       | enum: `auto` / `top` / `bottom` / `left` / `right`, default `auto` | Where line attaches to target                  |
| `label_position`      | float, default `0.5`                                               | 0.0 = at source, 0.5 = center, 1.0 = at target |
| `control_points_json` | jsonb, nullable                                                    | Custom path waypoints `[{x, y}, ...]`          |
| `style_json`          | jsonb, nullable                                                    | Visual overrides (color, stroke width, etc.)   |

Unique constraint: `(diagram_id, relationship_id)` — a relationship appears at most once per diagram.

**`diagram_revisions`** (immutable snapshots — used in phase 3f):

| Column            | Type           | Notes                                  |
|-------------------|----------------|----------------------------------------|
| `id`              | uuid, PK       |                                        |
| `diagram_id`      | FK → diagrams  |                                        |
| `revision_number` | integer        | Auto-incremented per diagram           |
| `snapshot_json`   | jsonb          | Full diagram state at time of revision |
| `note`            | text, nullable | Optional revision note                 |
| `created_by`      | FK → users     |                                        |
| `created_at`      | timestamp      |                                        |

## Tasks

- [ ] Drizzle schema for `diagrams` table
- [ ] Drizzle enum for `diagram_type` (`context`, `container`, `component`)
- [ ] Drizzle schema for `diagram_elements` table (position, size, z-index, style)
- [ ] Drizzle schema for `diagram_relationships` table (path type, line style, anchors, label position)
- [ ] Drizzle enums: `path_type`, `line_style`, `anchor_point`
- [ ] Drizzle schema for `diagram_revisions` table (snapshot structure only — functionality in 3f)
- [ ] Run migrations
- [ ] Diagram CRUD server functions with scope validation:
    - Context diagram: can contain Persons, Systems; scope = null or System
    - Container diagram: can contain Persons, Systems, Containers; scope must be a System
    - Component diagram: can contain Persons, Systems, Containers, Components; scope must be a Container
- [ ] Server functions: add/remove elements to/from a diagram (creates `diagram_elements` row with position)
- [ ] Server functions: add/remove relationships to/from a diagram (creates `diagram_relationships` row)
- [ ] Server functions: update element position/size on a diagram
- [ ] Server functions: update relationship visual properties on a diagram
- [ ] Diagram list page with TanStack Table (name, type, scope element, element count, actions)
- [ ] Create diagram form (TanStack Form — type, name, description, scope element picker)
- [ ] Edit diagram settings form (name, description, grid size, snap toggle)
- [ ] Permission checks (org role-based)

## CLI Commands

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Key Files

- `src/lib/schema/diagrams.ts` — diagrams table + diagram_type enum
- `src/lib/schema/diagram-elements.ts` — per-diagram element positions/sizes
- `src/lib/schema/diagram-relationships.ts` — per-diagram relationship rendering + enums
- `src/lib/schema/diagram-revisions.ts` — revisions table (populated in 3f)
- `src/lib/server/diagrams.ts` — diagram CRUD server functions
- `src/lib/server/diagram-elements.ts` — element placement server functions
- `src/lib/server/diagram-relationships.ts` — relationship placement server functions
- `src/lib/validators/diagram-scope.ts` — scope validation
- `src/routes/_protected/workspace/$workspaceSlug/diagrams.tsx` — diagram list
- `src/components/diagrams/create-diagram-dialog.tsx` — creation form

## Design Notes

- **Per-diagram visual properties:** An element or relationship can appear on multiple diagrams, each with different
  positions, sizes, and styles. The `diagram_elements` and `diagram_relationships` tables store these per-diagram
  overrides. The element/relationship's core data (name, type, direction, etc.) stays in the phase 2 tables.
- **`style_json`:** A flexible jsonb column for visual overrides like custom colors, border styles, opacity, etc.
  Keeps the schema stable while allowing future style extensions without migrations.
- **Scope validation:** Determines which elements are _allowed_ on a diagram based on its C4 level. Adding an element
  outside the allowed types should fail with a clear validation error.

## Verification

- [ ] Create diagrams at all 3 levels (context, container, component)
- [ ] Scope validation enforced (e.g., container diagram requires system scope)
- [ ] Add/remove elements and relationships to/from diagrams
- [ ] Element positions and sizes persist correctly
- [ ] Relationship visual properties persist correctly
- [ ] Diagram list shows all diagrams with correct metadata
- [ ] `pnpm dev` and `pnpm build` succeed
