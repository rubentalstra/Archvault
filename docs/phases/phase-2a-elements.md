# Phase 2a — Elements

## Status: Not Started

## Goal

Implement C4 element CRUD with hierarchy validation, status tracking, tree view, and table view.

## Prerequisites

- Phase 1f (Workspaces) — complete

## Data Model

The `elements` table stores the C4 model objects (Person, System, Container, Component). Each element
has a lifecycle status and supports multiple technologies.

| Column                                   | Type                                                    | Notes                                            |
|------------------------------------------|---------------------------------------------------------|--------------------------------------------------|
| `id`                                     | uuid, PK                                                |                                                  |
| `workspace_id`                           | FK → workspaces                                         |                                                  |
| `parent_element_id`                      | FK → elements, nullable                                 | "Belongs to" — enforced by hierarchy rules       |
| `element_type`                           | enum: `person` / `system` / `container` / `component`   |                                                  |
| `name`                                   | text                                                    |                                                  |
| `display_description`                    | varchar(120), nullable                                  | Short text shown on diagram nodes                |
| `description`                            | text, nullable                                          | Rich detailed description (rendered with Tiptap) |
| `status`                                 | enum: `planned` / `live` / `deprecated`, default `live` | Lifecycle status                                 |
| `external`                               | boolean, default `false`                                | Scope: internal vs external                      |
| `metadata_json`                          | jsonb, nullable                                         | Extensible metadata                              |
| `source_block_installation_id`           | FK, nullable                                            | If created from a block                          |
| `created_by`, `updated_by`               | FK → users                                              |                                                  |
| `deleted_at`, `created_at`, `updated_at` | timestamps                                              |                                                  |

### Related tables

**`element_technologies`** (many-to-many join table — elements can have multiple technologies):

| Column       | Type           | Notes                          |
|--------------|----------------|--------------------------------|
| `id`         | uuid, PK       |                                |
| `element_id` | FK → elements  |                                |
| `name`       | text           | e.g. "TypeScript", "Cloud Run" |
| `icon_slug`  | text, nullable | Optional icon identifier       |
| `sort_order` | integer        | Display ordering               |

**`element_links`** (external URLs associated with an element):

| Column       | Type           | Notes                      |
|--------------|----------------|----------------------------|
| `id`         | uuid, PK       |                            |
| `element_id` | FK → elements  |                            |
| `url`        | text           |                            |
| `label`      | text, nullable | Display label for the link |
| `sort_order` | integer        | Display ordering           |

## Tasks

- [ ] Drizzle schema for `elements` table (see Data Model above)
- [ ] Drizzle enum for `element_type` (`person`, `system`, `container`, `component`)
- [ ] Drizzle enum for `element_status` (`planned`, `live`, `deprecated`)
- [ ] Drizzle schema for `element_technologies` join table
- [ ] Drizzle schema for `element_links` table
- [ ] Run migration
- [ ] Server functions: element CRUD with Zod validation
- [ ] `validateElementHierarchy()` — enforce C4 parent rules:
    - Person → no parent
    - System → no parent (or parent is another System)
    - Container → parent must be a System
    - Component → parent must be a Container
- [ ] Server functions: technology CRUD (add/remove/reorder on an element)
- [ ] Server functions: link CRUD (add/remove/reorder on an element)
- [ ] Element tree sidebar with TanStack Virtual (nested, collapsible)
- [ ] Element CRUD forms with TanStack Form + shadcn/ui:
    - Name, display description, element type
    - Parent picker (filtered by hierarchy rules)
    - Status selector (`planned` / `live` / `deprecated`)
    - Scope toggle (internal / external)
    - Technologies list (add/remove/reorder)
    - Links list (add/remove)
    - Detailed description (rich text editor)
- [ ] Elements table view with TanStack Table (name, type, status, technology, parent, actions)
- [ ] Permission checks (org role-based: viewer = read only)

## CLI Commands

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Key Files

- `src/lib/schema/elements.ts` — Drizzle schema + enums
- `src/lib/schema/element-technologies.ts` — Technologies join table
- `src/lib/schema/element-links.ts` — Links table
- `src/lib/server/elements.ts` — server functions with Zod validation
- `src/lib/validators/element-hierarchy.ts` — hierarchy validation
- `src/routes/_protected/workspace/$workspaceSlug/elements.tsx` — elements page
- `src/components/elements/element-tree.tsx` — virtual tree sidebar
- `src/components/elements/element-form.tsx` — create/edit form
- `src/components/tables/element-columns.tsx` — table column definitions

## Design Notes

- **Display description vs. description:** `display_description` is the short text (max 120 chars) shown directly on
  diagram nodes. `description` is the full rich-text detailed description shown in the side panel (supports headings,
  lists, etc. via Tiptap).
- **Technology as a list:** Unlike a single text field, technologies are stored as separate rows so they can have icons
  and be reordered. This matches how IcePanel shows stacked technology cards.
- **Status:** A simple lifecycle enum. The status badge renders with a colored dot (planned = blue, live = gray,
  deprecated = red). This is on the element itself, not per-diagram.
- **Contains / Diagrams / Flows counts** are derived at query time (not stored). "Contains" = count of child elements.
  "In N diagrams" comes from phase 3. "In N flows" comes from a future phase.

## Verification

- [ ] Create elements of all 4 types (person, system, container, component)
- [ ] Hierarchy rules enforced (e.g., container without system parent fails)
- [ ] Status badge renders correctly for each status value
- [ ] Multiple technologies can be added, reordered, and removed
- [ ] Links can be added and removed
- [ ] Display description enforces max 120 chars
- [ ] Element tree renders with nesting and collapse
- [ ] Table view shows all elements with sorting/filtering (including status column)
- [ ] `pnpm dev` and `pnpm build` succeed
