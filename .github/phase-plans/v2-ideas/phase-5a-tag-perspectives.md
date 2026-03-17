# Phase 5a — Tag Groups & Perspectives

## Status: Not Started

## Goal

Extend the tag system with Tag Groups (categories) and add diagram-level perspective controls:
Highlight, Pin, Focus, and Hide. This lets different audiences view the same diagram through
different lenses without duplicating diagrams.

## Prerequisites

- Phase 3d (Canvas Edges & Connections) — complete
- Phase 2c (Tags) — complete

## Data Model Changes

**`tag_groups`** (category containers for related tags):

| Column                     | Type            | Notes                                  |
|----------------------------|-----------------|----------------------------------------|
| `id`                       | uuid, PK        |                                        |
| `workspace_id`             | FK → workspaces |                                        |
| `name`                     | text            | e.g. "Deployment", "Risk", "Security"  |
| `sort_order`               | integer         | Display ordering                       |
| `created_at`, `updated_at` | timestamps      |                                        |

**Update `tags` table:**

- [ ] Add `tag_group_id` column (FK → tag_groups, nullable) — tags can optionally belong to a group

## Tasks

### Database & Schema

- [ ] Drizzle schema for `tag_groups` table
- [ ] Add `tag_group_id` FK to `tags` table
- [ ] Run migration

### Server Functions

- [ ] Tag group CRUD (create, update, delete, list, reorder)
- [ ] Assign/unassign tags to groups
- [ ] Tags without a group remain "ungrouped" (backward compatible)

### Tag Bar (Diagram-Level Perspective Controls)

- [ ] Tag bar component rendered at bottom of diagram canvas:
  - Shows all tags used by objects on the current diagram
  - Grouped by tag group (group headers as sections)
  - Each tag is a clickable pill
- [ ] **Highlight** (hover):
  - Hovering over a tag in the bar highlights all objects with that tag
  - Other objects dim to ~30% opacity
  - Connections between highlighted objects stay visible
  - Effect clears when mouse leaves the tag
- [ ] **Pin** (click):
  - Clicking a tag "pins" it — persistent highlight
  - Pinned objects show a colored dotted border in the tag's color
  - Tag name label appears at bottom-left of pinned objects
  - Multiple tags can be pinned simultaneously
  - Click again to unpin
- [ ] **Focus** (double-click or dedicated button):
  - Only objects with the focused tag are visible
  - All other objects and their connections are hidden
  - Connected objects (even without the tag) remain visible but dimmed
  - Only one tag can be focused at a time
  - Click "Clear focus" to restore
- [ ] **Hide** (right-click or context menu):
  - Objects with the hidden tag are removed from view
  - Their connections are also hidden
  - Multiple tags can be hidden
  - Useful for hiding deprecated or future objects
  - "Show all" button to clear hidden tags

### Tag Bar State

- [ ] Add to Zustand editor store:
  ```ts
  {
    pinnedTags: string[],      // tag IDs currently pinned
    focusedTag: string | null, // tag ID currently focused
    hiddenTags: string[],      // tag IDs currently hidden
  }
  ```
- [ ] State is per-session (not persisted to DB) — each viewer has their own perspective

### Tag Group Management UI

- [ ] Tag groups section in workspace settings (alongside existing tag management):
  - Create tag group (name)
  - Reorder tag groups (drag)
  - Assign existing tags to groups
  - Delete tag group (tags become ungrouped, not deleted)
- [ ] Group headers in tag picker (when assigning tags to objects)
- [ ] Filter by tag group in model objects table

### Integration with Flows

- [ ] When a flow is active AND tags are pinned/focused:
  - Both filters apply simultaneously
  - Flow step highlighting + tag perspective work together
  - Useful for "show me the risky parts of this user journey"

### i18n

- [ ] Add `tag_group_*` and perspective control keys to messages files

## Key Files

- `apps/web/src/lib/schema/tag-groups.ts` — tag_groups table
- `apps/web/src/lib/tag-group.functions.ts` — server functions
- `apps/web/src/components/editor/tag-bar.tsx` — diagram tag bar component
- `apps/web/src/components/tags/tag-group-manager.tsx` — tag group CRUD UI
- `apps/web/src/stores/editor-store.ts` — perspective state

## Design Notes

- **Tag bar position:** Rendered as a fixed bar at the bottom of the canvas viewport (below the
  diagram, above the status bar). Uses React Flow's `<Panel position="bottom-center">`.
- **Performance:** Perspective changes (highlight, pin, focus, hide) only affect node/edge opacity
  and border styling — no server calls, no re-fetching. This is purely a client-side visual filter
  applied via CSS classes or inline styles on the React Flow nodes/edges.
- **Tag groups are optional.** Ungrouped tags still work exactly as before. Tag groups just add
  organizational structure to the tag bar.
- **Combining perspectives:** Pin + Focus can work together. Hidden tags take priority — if an
  object's tag is both pinned and hidden, it's hidden.

## Verification

- [ ] Tag groups can be created, renamed, reordered, deleted
- [ ] Tags can be assigned to groups
- [ ] Tag bar shows tags grouped by tag group
- [ ] Hover highlight works (objects dim, tagged objects bright)
- [ ] Pin works (persistent highlight with colored border)
- [ ] Focus works (non-tagged objects hidden, connected objects dimmed)
- [ ] Hide works (tagged objects and connections disappear)
- [ ] Multiple pins work simultaneously
- [ ] Clear focus / show all restore the diagram
- [ ] Perspectives work alongside flow playback
- [ ] `pnpm dev` and `pnpm build` succeed
