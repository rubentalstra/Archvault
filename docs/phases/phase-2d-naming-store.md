# Phase 2d — Naming Migration & Store Type

## Status: Complete

## Goal

Align Archvault terminology with IcePanel conventions and add the Store model object type. This phase
renames the core C4 concepts throughout the codebase:

| Old Term       | New Term       | Scope                                |
|----------------|----------------|--------------------------------------|
| `person`       | `actor`        | Element type enum, UI, node types    |
| `container`    | `app`          | Element type enum, UI, node types    |
| `relationship` | `connection`   | Table name, server functions, UI     |
| *(new)*        | `store`        | New element type for data stores     |

## Prerequisites

- Phase 2a (Model Objects) — complete
- Phase 2b (Connections) — complete
- Phase 2c (Tags) — complete

## Why This Phase Exists

IcePanel uses Actor/System/App/Store/Component as its object hierarchy. Our current codebase uses the
original C4 terms (Person/System/Container/Component). Since we're building an IcePanel-inspired platform,
aligning terminology avoids confusion and keeps the codebase consistent with the product vision.

Store is separated from App because data stores (databases, caches, file systems) have fundamentally
different properties from runnable application units — they don't execute code, they persist data.

## Data Model Changes

### Element type enum migration

```sql
-- Rename enum values (Drizzle migration)
ALTER TYPE element_type RENAME VALUE 'person' TO 'actor';
ALTER TYPE element_type RENAME VALUE 'container' TO 'app';
ALTER TYPE element_type ADD VALUE 'store';
```

### Relationships → Connections rename

```sql
ALTER TABLE relationships RENAME TO connections;
ALTER TABLE relationship_tags RENAME TO connection_tags;
ALTER TABLE relationship_tags RENAME COLUMN relationship_id TO connection_id;
ALTER TABLE diagram_relationships RENAME TO diagram_connections;
ALTER TABLE diagram_relationships RENAME COLUMN relationship_id TO connection_id;
```

### Hierarchy rules (updated)

| Object Type | Valid Parent                     | C4 Level |
|-------------|---------------------------------|----------|
| Actor       | none                            | 1        |
| System      | none (or another System)        | 1        |
| App         | must be a System                | 2        |
| Store       | must be a System                | 2        |
| Component   | must be an App                  | 3        |

### Diagram scope rules (updated)

| Diagram Type   | Allowed Objects                     | Scope              |
|----------------|-------------------------------------|---------------------|
| Context (L1)   | Actors, Systems                     | null or System      |
| App (L2)       | Actors, Systems, Apps, Stores       | must be a System    |
| Component (L3) | Actors, Systems, Apps, Components   | must be an App      |

### Store node data

Store nodes reuse the same `elements` table with `element_type = 'store'`. No new table needed.
Stores share the same properties as Apps: name, display description, status, technologies, tags, etc.

## Tasks

### Database Migration

- [x] Generate Drizzle migration to rename enum values (`person` → `actor`, `container` → `app`)
- [x] Add `store` value to `element_type` enum
- [x] Rename `relationships` table → `connections`
- [x] Rename `relationship_tags` → `connection_tags` with column rename
- [x] Rename `diagram_relationships` → `diagram_connections` with column rename
- [x] Rename `relationship_direction` enum → `connection_direction`
- [x] Update all foreign key constraint names
- [x] Run migration and verify

### Schema Files

- [x] Rename `src/lib/schema/relationships.ts` → `src/lib/schema/connections.ts`
- [x] Update all Drizzle schema definitions with new table/column names
- [x] Update `element_type` enum to include `actor`, `app`, `store` (remove `person`, `container`)
- [x] Update `src/lib/schema/index.ts` barrel exports
- [x] Rename `diagram_type` enum: `context` → `system_context`, `app` → `container` (Component stays)

### Server Functions

- [x] Rename `src/lib/server/relationships.ts` → `src/lib/server/connections.ts`
- [x] Update all function names: `createRelationship` → `createConnection`, etc.
- [x] Update hierarchy validation for new type names + Store rules
- [x] Update diagram scope validation for Store type
- [x] Update all Zod validators with new enum values

### UI Components

- [x] Rename `src/components/relationships/` → `src/components/connections/`
- [x] Update element form: type selector shows Actor, System, App, Store, Component
- [x] Update element tree to use new type names and icons
- [x] Update element table columns with new type labels
- [x] Update connection (formerly relationship) table columns
- [x] Update properties panel labels and type badges

### Editor / Canvas

- [x] Rename `person-node.tsx` → `actor-node.tsx` (update component name, data type)
- [x] Rename `container-node.tsx` → `app-node.tsx`
- [x] Create `store-node.tsx` — cylinder/database shape with Store icon (Lucide `Database`)
- [x] Update `nodeTypes` registry in `src/components/editor/nodes/index.ts`
- [x] Update type definitions in `src/lib/types/diagram-nodes.ts`
- [x] Update `diagram-to-flow.ts` converter for new type names + Store
- [x] Update editor toolbar add-element dropdown (Actor, System, App, Store, Component)
- [x] Update context menu labels

### i18n

- [x] Update `messages/en.json`: rename all `person_*` keys → `actor_*`, `container_*` → `app_*`
- [x] Add new keys for Store type
- [x] Rename all `relationship_*` keys → `connection_*`
- [x] Update `messages/nl.json` with same changes

### Diagram Type Rename (added post-spec)

- [x] Rename `diagram_type` enum: `context` → `system_context`, `app` → `container`
- [x] Update diagram labels to show "Level 1 — System Context", "Level 2 — Container", "Level 3 — Component"
- [x] Add level descriptions to create dialog
- [x] Hide scope field for Level 1 (System Context diagrams don't have scope)
- [x] Contextual scope labels: "Scoped to System" (L2), "Scoped to Container" (L3)
- [x] Generate and fix DB migration with data conversion for existing rows

### Routes

- [x] Rename relationships route/page → connections
- [x] Update any route references in navigation

## Key Files

- `src/lib/schema/elements.ts` — element_type enum update
- `src/lib/schema/connections.ts` — renamed from relationships.ts
- `src/lib/schema/diagram-connections.ts` — renamed from diagram-relationships.ts
- `src/lib/element.validators.ts` — hierarchy validation update
- `src/lib/diagram.validators.ts` — scope validation update
- `src/components/editor/nodes/actor-node.tsx` — renamed from person-node.tsx
- `src/components/editor/nodes/app-node.tsx` — renamed from container-node.tsx
- `src/components/editor/nodes/store-node.tsx` — new Store node component

## Design Notes

- **Store node visual:** Rendered as a cylinder shape (like database icons in architecture diagrams) with
  the Lucide `Database` icon. Distinguished from App nodes by shape and default blue-gray color scheme.
- **Store hierarchy:** Stores sit at the same level as Apps — they're children of Systems. Components
  cannot be children of Stores (components only belong to Apps). This matches IcePanel's model.
- **Migration safety:** The rename migration should be run in a transaction. All enum renames and table
  renames happen in a single migration to avoid inconsistent state.
- **No `container` in diagram_type:** The `diagram_type` enum value `container` should be renamed to `app`
  to match the new terminology. Context and Component stay the same.

## Verification

- [x] Migration runs successfully (new enum values, renamed tables)
- [x] All existing data preserved after migration (no data loss)
- [x] Create model objects of all 5 types (Actor, System, App, Store, Component)
- [x] Hierarchy rules enforced: Store must have System parent, Component must have App parent
- [x] Store node renders correctly on canvas (cylinder shape, Database icon)
- [x] Connection CRUD works (create, edit, delete) with new naming
- [x] All UI labels show new terminology (Actor not Person, App not Container, Connection not Relationship)
- [x] Diagram scope validation works with Store type
- [x] Diagram types show C4 levels: Level 1 (System Context), Level 2 (Container), Level 3 (Component)
- [x] `pnpm dev` and `pnpm build` succeed
