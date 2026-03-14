# Phase 3b — Canvas Rendering

## Status: Not Started

## Goal

Build the diagram canvas using React Flow (xyflow) with pan, zoom, grid, snap, and C4 element node rendering.

## Prerequisites

- Phase 3a (Diagram CRUD & Schema) — complete

## Canvas Library: React Flow

Building a canvas from raw SVG would be a massive undertaking (pan, zoom, selection, drag, edges, hit testing,
viewport management, etc.). **React Flow (xyflow)** provides all of this out of the box:

- Pan and zoom (scroll wheel, trackpad, controls)
- Node rendering as React components (full control over shapes)
- Edge rendering with labels and custom paths
- Selection (click, shift-click, selection box)
- Drag to move nodes
- Minimap, background grid
- Snap-to-grid
- Excellent TypeScript support

React Flow nodes are HTML-based (not SVG), but this is actually an advantage — C4 nodes contain text, icons, and
badges which are easier to render with HTML/CSS than SVG. Edges are SVG.

## Tasks

- [ ] Install `@xyflow/react` package
- [ ] Create editor page route (`diagram.$diagramId.tsx`)
- [ ] Create React Flow canvas wrapper component with:
    - `<ReactFlow>` with `<Background>` (dot grid, configurable size from diagram settings)
    - `<Controls>` (zoom in/out, fit view, lock toggle)
    - `<MiniMap>` (with C4 type color coding)
- [ ] Pan controls (built-in: mouse drag, scroll wheel zoom, trackpad)
- [ ] Snap-to-grid (built-in `snapToGrid` + `snapGrid` props from diagram settings)
- [ ] Custom C4 node types (registered via `nodeTypes`):
    - **PersonNode** — rounded shape with person icon, name, display description
    - **SystemNode** — large rounded rectangle, name, display description, status badge
    - **ContainerNode** — medium rounded rectangle with technology label
    - **ComponentNode** — rectangle with component icon, technology label
    - All nodes show: name, display description (if set), technology (if set), status badge, external indicator
- [ ] Node style support via `style_json` (custom background color, border color, opacity)
- [ ] Load diagram data: fetch `diagram_elements` → convert to React Flow nodes
- [ ] Save node positions: sync React Flow `onNodesChange` → update `diagram_elements`
- [ ] Editor page layout: canvas (center) + toolbar (top) + placeholder for side panel

## Key Files

- `src/components/editor/canvas.tsx` — React Flow wrapper
- `src/components/editor/nodes/person-node.tsx` — Person custom node
- `src/components/editor/nodes/system-node.tsx` — System custom node
- `src/components/editor/nodes/container-node.tsx` — Container custom node
- `src/components/editor/nodes/component-node.tsx` — Component custom node
- `src/components/editor/canvas-controls.tsx` — zoom/pan controls UI
- `src/routes/_protected/workspace/$workspaceSlug/diagram.$diagramId.tsx` — editor page

## Design Notes

- **React Flow data flow:** Diagram data is loaded from the server (`diagram_elements` + elements) and converted to
  React Flow's `Node[]` format. Position changes from React Flow are synced back to the server. The source of truth
  is the database, not React Flow's internal state.
- **Node sizing:** C4 nodes have default sizes per type but can be resized. The `width`/`height` from
  `diagram_elements` maps to React Flow node dimensions.
- **External elements:** External elements (scope = external) render with a dashed border and subtle background tint
  to visually distinguish them from internal elements.

## Verification

- [ ] Canvas renders with dot grid background
- [ ] Elements display with correct C4 node shapes
- [ ] Person, System, Container, Component nodes all render distinctly
- [ ] Pan and zoom work smoothly
- [ ] Snap-to-grid aligns elements when dragging
- [ ] Minimap shows element positions with type-based colors
- [ ] Node positions persist after page reload
- [ ] `pnpm dev` and `pnpm build` succeed
