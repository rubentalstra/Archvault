# Phase 2b — Relationships

## Status: Not Started

## Goal

Implement relationships between C4 elements with CRUD, direction support, and table view.

## Prerequisites

- Phase 2a (Elements) — complete

## Data Model

The `relationships` table stores the semantic connection between two elements. The `source_element_id` /
`target_element_id` pair defines endpoint assignment (who is the "sender" and who is the "receiver"). The `direction`
column controls how the arrow renders and how the relationship is interpreted:

| `direction` value    | Arrow rendering | Meaning                             |
|----------------------|-----------------|-------------------------------------|
| `outgoing` (default) | source → target | Source sends to / depends on target |
| `incoming`           | source ← target | Target sends to / depends on source |
| `bidirectional`      | source ↔ target | Mutual / two-way communication      |
| `none`               | source — target | Undirected association (no arrows)  |

## Tasks

- [ ] Drizzle schema for `relationships` table:
    - `id` (uuid, PK)
    - `workspace_id` (FK → workspaces)
    - `source_element_id` (FK → elements) — the "sender" endpoint
    - `target_element_id` (FK → elements) — the "receiver" endpoint
    - `direction` (enum: `outgoing` | `incoming` | `bidirectional` | `none`, default `outgoing`)
    - `description` (text, nullable) — label shown on the relationship
    - `technology` (text, nullable) — e.g. "REST/HTTPS", "gRPC", "JDBC"
    - `source_block_installation_id` (FK, nullable) — if created from a block
    - `created_by`, `updated_by` (FK → users)
    - `deleted_at`, `created_at`, `updated_at` (timestamps)
- [ ] Create Drizzle enum for `relationship_direction` (`outgoing`, `incoming`, `bidirectional`, `none`)
- [ ] Run migration
- [ ] Server functions: relationship CRUD with Zod validation
- [ ] Validate source and target elements exist and belong to same workspace
- [ ] Validate source ≠ target (no self-referencing relationships)
- [ ] Relationship CRUD forms with TanStack Form:
    - Source picker (element selector)
    - Target picker (element selector)
    - Direction selector (`outgoing` / `incoming` / `bidirectional` / `none`)
    - Description (text input)
    - Technology (text input)
- [ ] Relationships table with TanStack Table (source, target, direction, description, technology, actions)
- [ ] Permission checks (org role-based)

## CLI Commands

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Key Files

- `src/lib/schema/relationships.ts` — Drizzle schema + direction enum
- `src/lib/server/relationships.ts` — server functions
- `src/routes/_protected/workspace/$workspaceSlug/relationships.tsx` — relationships page (or tab on elements page)
- `src/components/relationships/relationship-form.tsx` — create/edit form
- `src/components/tables/relationship-columns.tsx` — table column definitions

## Design Notes

- **Direction vs. reversing source/target:** Direction is a display/semantic property, not a data swap. Changing
  direction from `outgoing` to `incoming` does NOT swap source/target IDs — it changes which way the arrow points. This
  keeps the data model stable and avoids cascading updates.
- **Canvas rendering properties** (line shape, line style, label position, anchor points, control points) are stored
  per-diagram in phase 3d, not on the relationship itself. A single relationship can appear on multiple diagrams with
  different visual styles.

## Verification

- [ ] Create relationship between two elements with each direction type
- [ ] Source/target validation works (same workspace, elements exist, no self-reference)
- [ ] Direction displays correctly in table view (arrow icon or label)
- [ ] Table view shows all relationships with sorting/filtering
- [ ] `pnpm dev` and `pnpm build` succeed
