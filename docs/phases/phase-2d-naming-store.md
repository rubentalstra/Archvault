# Phase 2d — Naming Migration & Store Type

## Status: Not Started

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

- [ ] Generate Drizzle migration to rename enum values (`person` → `actor`, `container` → `app`)
- [ ] Add `store` value to `element_type` enum
- [ ] Rename `relationships` table → `connections`
- [ ] Rename `relationship_tags` → `connection_tags` with column rename
- [ ] Rename `diagram_relationships` → `diagram_connections` with column rename
- [ ] Rename `relationship_direction` enum → `connection_direction`
- [ ] Update all foreign key constraint names
- [ ] Run migration and verify

### Schema Files

- [ ] Rename `src/lib/schema/relationships.ts` → `src/lib/schema/connections.ts`
- [ ] Update all Drizzle schema definitions with new table/column names
- [ ] Update `element_type` enum to include `actor`, `app`, `store` (remove `person`, `container`)
- [ ] Update `src/lib/schema/index.ts` barrel exports
- [ ] Rename `diagram_type` enum: `container` → `app` (Context stays, Component stays)

### Server Functions

- [ ] Rename `src/lib/server/relationships.ts` → `src/lib/server/connections.ts`
- [ ] Update all function names: `createRelationship` → `createConnection`, etc.
- [ ] Update hierarchy validation for new type names + Store rules
- [ ] Update diagram scope validation for Store type
- [ ] Update all Zod validators with new enum values

### UI Components

- [ ] Rename `src/components/relationships/` → `src/components/connections/`
- [ ] Update element form: type selector shows Actor, System, App, Store, Component
- [ ] Update element tree to use new type names and icons
- [ ] Update element table columns with new type labels
- [ ] Update connection (formerly relationship) table columns
- [ ] Update properties panel labels and type badges

### Editor / Canvas

- [ ] Rename `person-node.tsx` → `actor-node.tsx` (update component name, data type)
- [ ] Rename `container-node.tsx` → `app-node.tsx`
- [ ] Create `store-node.tsx` — cylinder/database shape with Store icon (Lucide `Database`)
- [ ] Update `nodeTypes` registry in `src/components/editor/nodes/index.ts`
- [ ] Update type definitions in `src/lib/types/diagram-nodes.ts`
- [ ] Update `diagram-to-flow.ts` converter for new type names + Store
- [ ] Update editor toolbar add-element dropdown (Actor, System, App, Store, Component)
- [ ] Update context menu labels

### i18n

- [ ] Update `messages/en.json`: rename all `person_*` keys → `actor_*`, `container_*` → `app_*`
- [ ] Add new keys for Store type
- [ ] Rename all `relationship_*` keys → `connection_*`
- [ ] Update `messages/nl.json` with same changes

### Routes

- [ ] Rename relationships route/page → connections
- [ ] Update any route references in navigation

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

- [ ] Migration runs successfully (new enum values, renamed tables)
- [ ] All existing data preserved after migration (no data loss)
- [ ] Create model objects of all 5 types (Actor, System, App, Store, Component)
- [ ] Hierarchy rules enforced: Store must have System parent, Component must have App parent
- [ ] Store node renders correctly on canvas (cylinder shape, Database icon)
- [ ] Connection CRUD works (create, edit, delete) with new naming
- [ ] All UI labels show new terminology (Actor not Person, App not Container, Connection not Relationship)
- [ ] Diagram scope validation works with Store type
- [ ] `pnpm dev` and `pnpm build` succeed
