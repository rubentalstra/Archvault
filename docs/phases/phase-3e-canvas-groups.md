# Phase 3e — Groups on Canvas

## Status: Not Started

## Goal

Render groups as visual overlays on the diagram canvas. Groups auto-resize around their assigned
objects, support nesting, and can be styled with colors. Users can assign/unassign objects to groups
directly from the canvas.

## Prerequisites

- Phase 3d (Canvas Edges & Connections) — complete
- Phase 2e (Groups) — complete

## Tasks

### Group Node Rendering

- [ ] Create `GroupOverlayNode` — a special React Flow node type for groups:
  - Thin colored border (group's color) with subtle background fill (color at ~10% opacity)
  - Group name label at top-left corner
  - Renders behind all other nodes (`z_index: -1` by default)
  - Supports `<NodeResizer>` for manual resize (only when no assigned objects)
- [ ] Register `group_overlay` in `nodeTypes` (separate from the scope `group` node)
- [ ] Convert `diagram_groups` rows to React Flow nodes in `diagram-to-flow.ts`

### Auto-Resize Behavior

- [ ] When objects are assigned to a group:
  - Calculate bounding box of all assigned objects on the diagram
  - Add padding (20px default) around the bounding box
  - Set group node position and dimensions to contain all assigned objects
  - Disable manual resize (NodeResizer hidden)
- [ ] When no objects are assigned:
  - Group acts as a free-form visual overlay
  - Manual resize enabled
  - Can be positioned anywhere on the canvas
- [ ] Re-calculate bounds when:
  - An object is moved (onNodeDragStop)
  - An object is added/removed from the group
  - An object is resized

### Nested Groups

- [ ] Child groups render inside parent groups
- [ ] Use React Flow `parentId` for nested group nodes
- [ ] Auto-resize cascades up: when a child group resizes, parent group re-calculates bounds
- [ ] Nested groups adjust around sibling groups (no overlap)

### Group Assignment from Canvas

- [ ] Right-click context menu on nodes includes "Groups" submenu:
  - List of workspace groups with checkboxes
  - `+ Create group` option
  - Assign/unassign toggles update `element_groups` table
- [ ] Drag-and-drop: drag a node into a group overlay to assign
- [ ] Multi-select elements → right-click → "Add to group" for batch assignment

### Group Properties Panel

- [ ] When a group overlay node is selected, properties panel shows:
  - Name (editable)
  - Color picker
  - Parent group selector
  - Description (editable)
  - List of assigned elements
  - "Remove from diagram" action
  - "Delete group" action (with confirmation)

### Adding Groups to Diagrams

- [ ] Toolbar `+ Add` button includes Group option:
  - Click to search/select existing workspace group
  - Or create new group
  - Place on canvas at click position
- [ ] Groups in element properties panel show "Add to diagram" for unplaced groups
- [ ] Auto-place: when assigning elements to a group, if the group isn't on the diagram yet,
  automatically add it

### i18n

- [ ] Add group canvas keys to messages files

## Key Files

- `src/components/editor/nodes/group-overlay-node.tsx` — group visual overlay node
- `src/components/editor/nodes/index.ts` — updated nodeTypes with group_overlay
- `src/lib/converters/diagram-to-flow.ts` — group node conversion
- `src/components/editor/panels/group-properties.tsx` — group properties panel
- `src/stores/editor-store.ts` — group state management

## Design Notes

- **Two group node types:** The existing `group` node type (from 3b) is the scope element that acts
  as a parent container for sub-flow nesting (e.g., a System containing its Apps). The new
  `group_overlay` is the Groups feature — a visual overlay. They serve different purposes:
  - `group` = scope element (structural, from element hierarchy)
  - `group_overlay` = visual group (organizational, from groups table)
- **Z-index ordering:** Group overlays render behind all model object nodes. Nested groups use
  incrementally lower z-indices so parents render behind children.
- **Performance:** For diagrams with many groups, use `memo()` and avoid re-calculating bounds on
  every frame. Debounce the auto-resize calculation during drag operations.

## Verification

- [ ] Groups render as colored overlays on the canvas
- [ ] Auto-resize works when objects are assigned
- [ ] Manual resize works for empty groups
- [ ] Nested groups render correctly (child inside parent)
- [ ] Assign/unassign objects via context menu works
- [ ] Drag-and-drop assignment works
- [ ] Group properties panel shows when group selected
- [ ] Adding groups to diagrams works (toolbar + auto-place)
- [ ] Groups persist position/size after page reload
- [ ] Dark mode renders correctly
- [ ] `pnpm dev` and `pnpm build` succeed
