# Phase 3e — Groups on Canvas

## Status: Dropped

## Reason

This phase was dropped because it duplicates functionality already provided by the `group` element type
(React Flow sub-flows). The `group` element type renders as a visual container on the canvas with
`NodeResizer`, parent-child nesting, and drag-to-move — which covers the core use case of visual
grouping on diagrams.

Phase 2e Groups (workspace-level organizational groups with CRUD, colors, memberships) remain as a
workspace management feature for categorizing elements, but they don't need to be rendered as canvas
overlays. The `diagram_group` table and related server functions have been removed.

### What provides canvas grouping instead

- **`group` element type** — a React Flow sub-flow node (`group-node.tsx`) with:
  - Dashed-border container with `NodeResizer`
  - Parent-child nesting via `parentId` / `extent: 'parent'`
  - Can contain any element type (actors, systems, etc.)
  - Works on all diagram levels
