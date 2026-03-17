# Phase 4a — Flow Schema & CRUD

## Status: Not Started

## Goal

Implement the data model and CRUD for Flows — step-by-step sequences that show how model objects
interact for a specific use case. Flows sit on top of diagrams and highlight connections one step
at a time, like an interactive walkthrough.

## Prerequisites

- Phase 3d (Canvas Edges & Connections) — complete

## Data Model

**`flows`** (one row per flow):

| Column                                   | Type            | Notes                              |
|------------------------------------------|-----------------|------------------------------------|
| `id`                                     | uuid, PK        |                                    |
| `workspace_id`                           | FK → workspaces |                                    |
| `diagram_id`                             | FK → diagrams   | Which diagram this flow belongs to |
| `name`                                   | text            | e.g. "User Login", "Place Order"   |
| `description`                            | text, nullable  | Optional overview text             |
| `pinned`                                 | boolean, false  | Pinned flows show at top of list   |
| `created_by`, `updated_by`               | FK → users      |                                    |
| `deleted_at`, `created_at`, `updated_at` | timestamps      |                                    |

**`flow_steps`** (ordered steps within a flow):

| Column                     | Type                   | Notes                                |
|----------------------------|------------------------|--------------------------------------|
| `id`                       | uuid, PK               |                                      |
| `flow_id`                  | FK → flows             |                                      |
| `step_type`                | enum (see below)       | Type of step                         |
| `sort_order`               | integer                | Step sequence (0-based)              |
| `title`                    | text, nullable         | Optional step title                  |
| `description`              | text, nullable         | Optional step detail text            |
| `source_element_id`        | FK → elements, nullable| For message steps: sender            |
| `target_element_id`        | FK → elements, nullable| For message steps: receiver          |
| `connection_id`            | FK → connections, nullable | For message steps: which connection |
| `element_id`               | FK → elements, nullable| For process steps: which object      |
| `linked_flow_id`           | FK → flows, nullable   | For "go to flow" steps               |
| `parent_step_id`           | FK → flow_steps, nullable | For path sub-steps (alt/parallel) |
| `path_index`               | integer, nullable      | Which path branch (0, 1, 2...)       |
| `direction_override`       | enum, nullable         | Override connection direction for step|
| `metadata_json`            | jsonb, nullable        | Extra data per step type             |
| `created_at`, `updated_at` | timestamps             |                                      |

### Flow Step Types

| Step Type      | Description                                     | Required Fields                    |
|----------------|-------------------------------------------------|------------------------------------|
| `introduction` | Opening context — shows all objects before steps | title, description                 |
| `message`      | Communication between two objects via connection | source_element_id, target_element_id, connection_id |
| `process`      | Single object performing an action               | element_id, title                  |
| `alternate`    | Branching "OR" paths (e.g., auth methods)        | child steps with path_index        |
| `parallel`     | Simultaneous "AND" paths (e.g., async fan-out)   | child steps with path_index        |
| `goto_flow`    | Link to another flow                             | linked_flow_id                     |
| `information`  | Contextual note unattached to objects            | title, description                 |
| `conclusion`   | Closing step with summary                        | title, description                 |

Drizzle enum: `flow_step_type` with these 8 values.

## Tasks

### Database & Schema

- [ ] Drizzle schema for `flows` table
- [ ] Drizzle schema for `flow_steps` table
- [ ] Drizzle enum for `flow_step_type` (8 values)
- [ ] Run migration

### Server Functions

- [ ] Flow CRUD (create, update, delete, list by workspace/diagram)
- [ ] List flows for a specific diagram
- [ ] Duplicate flow (deep copy including all steps)
- [ ] Pin/unpin flow
- [ ] Flow step CRUD:
  - Add step (with sort_order management)
  - Update step (title, description, type-specific fields)
  - Delete step (reorder remaining steps)
  - Reorder steps (drag to rearrange)
- [ ] Validate step references (element_id exists, connection_id valid, linked_flow_id exists)
- [ ] Alternate/Parallel path management:
  - Add path to a step (creates child steps with incremented path_index)
  - Remove path
  - Reorder paths

### Flow List UI

- [ ] Flow dropdown in diagram editor (top-left, like IcePanel):
  - List of flows for current diagram
  - Pinned flows at top
  - "New flow" button
  - Click flow to activate/view it
  - Edit flow name (pencil icon)
- [ ] Flows section page (workspace-level):
  - Table of all flows with columns: name, diagram, last modified, view count
  - Search and sort
  - Actions: duplicate, pin, delete
  - Click to navigate to diagram with flow active

### Flow Editor UI

- [ ] Flow step sidebar (left panel when flow is active):
  - Ordered list of steps with type icons
  - Drag handle for reordering
  - Click step to highlight its objects/connections on canvas
  - `+ Step` button at bottom
  - Step type selector when adding
- [ ] Step detail editor (inline or panel):
  - Title and description fields
  - Type-specific fields:
    - Message: source/target picker, connection picker, direction override
    - Process: element picker, action description
    - Alternate/Parallel: path tabs with sub-steps
    - Go to flow: flow picker
    - Information/Conclusion: just title + description
- [ ] Duplicate step, delete step via context menu

### Canvas Integration

- [ ] When a flow is active, dim all objects/connections not involved in the current step
- [ ] Highlight the active step's objects and connections (brighter colors, thicker edges)
- [ ] For message steps: animate the edge direction with a pulse
- [ ] Show step title as an overlay on the canvas
- [ ] "Edit mode" toggle (`Cmd/Ctrl + E`) to switch between viewing and editing flow steps

### i18n

- [ ] Add `flow_*` keys to `messages/en.json` and `messages/nl.json`

## Key Files

- `apps/web/src/lib/schema/flows.ts` — flows and flow_steps tables + step_type enum
- `apps/web/src/lib/schema/index.ts` — barrel export
- `apps/web/src/lib/flow.functions.ts` — server functions
- `apps/web/src/lib/flow.validators.ts` — step validation
- `apps/web/src/components/flows/flow-dropdown.tsx` — flow selector in editor
- `apps/web/src/components/flows/flow-step-list.tsx` — step sidebar
- `apps/web/src/components/flows/flow-step-editor.tsx` — step detail editor
- `apps/web/src/components/flows/flow-step-type-picker.tsx` — step type selector
- `apps/web/src/routes/_protected/_onboarded/workspace/$workspaceSlug/flows.tsx` — flows section page

## Design Notes

- **Flows belong to diagrams.** Each flow is associated with one diagram. The flow highlights objects
  and connections that exist on that diagram. A flow can reference objects from any C4 level that
  appear on the diagram.
- **Alternate/Parallel paths use parent_step_id.** An `alternate` or `parallel` step acts as a
  container. Its child steps have `parent_step_id` pointing to it and `path_index` indicating which
  branch they belong to. This recursive structure supports nested paths.
- **Direction override.** A message step can flip the connection direction just for that step. This
  lets you show a response flowing back over the same connection without creating a separate connection.
- **Canvas dimming.** When playing a flow, all non-active elements are dimmed (opacity ~30%). The
  active step's objects and connections render at full opacity with highlight effects. This focuses
  attention on the current step.

## Verification

- [ ] Create flows with name and description
- [ ] Add steps of all 8 types
- [ ] Reorder steps via drag
- [ ] Duplicate and delete steps
- [ ] Alternate paths: add/remove/reorder branches
- [ ] Parallel paths work similarly
- [ ] Go to flow step links to another flow
- [ ] Flow list shows in editor dropdown
- [ ] Flows section page lists all workspace flows
- [ ] Canvas highlights active step correctly
- [ ] Non-active elements are dimmed
- [ ] `pnpm dev` and `pnpm build` succeed
