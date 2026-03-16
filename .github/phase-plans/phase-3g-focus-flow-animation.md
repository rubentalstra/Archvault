# Phase 3g — Node Focus & Flow Animation

## Status: Not Started

## Goal

When a user clicks a node on the diagram canvas, animate its outgoing connections with a blue flow
effect and dim all non-connected elements. This creates a focus mode that highlights how data or
control flows out of the selected element.

## Prerequisites

- Phase 3d (Canvas Edges & Connections) — complete

## Current State

- Three edge types exist: `curved-edge.tsx`, `straight-edge.tsx`, `orthogonal-edge.tsx` — all use
  React Flow's `getBezierPath` / `getStraightPath` / `getSmoothStepPath` with `BaseEdge`-style rendering.
  No custom stroke styles are applied beyond defaults.
- The editor store tracks `selectedNodeIds` and `selectedEdgeIds` in Zustand.
- React Flow CSS variables are defined in `src/styles.css` (`.react-flow` block) including
  `--xy-edge-stroke-default` and `--xy-edge-stroke-selected`.

## Tasks

### Focus State Logic

- [ ] When a node is selected (`selectedNodeIds` has exactly one entry):
  - Compute all edges where `source === selectedNodeId` (outgoing connections)
  - Mark those edges as "focused"
  - Mark the source node + all target nodes of focused edges as "focused"
  - All other nodes and edges are "dimmed"
- [ ] When no node is selected or multiple nodes are selected: clear focus state (everything normal)
- [ ] Store focus state in editor store or derive it via `useMemo` in canvas component

### Edge Animation

- [ ] Set `animated: true` on focused edges — React Flow's built-in SVG `stroke-dasharray` animation
- [ ] Override stroke color on focused edges to blue (`var(--primary)` or a dedicated focus color)
- [ ] Ensure animation direction flows from source to target

### Dimming Effect

- [ ] Non-focused nodes: reduce opacity (e.g., `opacity: 0.3`) via `style` prop on React Flow nodes
- [ ] Non-focused edges: reduce opacity (e.g., `opacity: 0.15`) via `style` prop on React Flow edges
- [ ] Transition: use CSS `transition: opacity 200ms ease` for smooth dim/undim

### i18n

- [ ] No user-facing strings expected (visual-only feature)

## Key Files

- `src/components/editor/diagram-canvas.tsx` — apply focus styles to nodes/edges before passing to React Flow
- `src/components/editor/edges/curved-edge.tsx` — accept animated/style overrides
- `src/components/editor/edges/straight-edge.tsx` — accept animated/style overrides
- `src/components/editor/edges/orthogonal-edge.tsx` — accept animated/style overrides
- `src/stores/editor-store.ts` — derive or store focus state from selection
- `src/styles.css` — optional CSS classes for focus/dim transitions

## Design Notes

- **React Flow native animation:** The `animated` prop on edges adds a CSS `stroke-dasharray`
  animation to the SVG path. No custom SVG animation is needed.
- **Performance:** Deriving focus state from `selectedNodeIds` is O(edges) — fine for typical
  diagram sizes (< 200 edges). Use `useMemo` with proper deps to avoid re-computing on every render.
- **Single selection only:** Focus mode activates on single-node selection. Multi-select is for
  bulk operations (move, delete) where focus dimming would be confusing.

## Verification

- [ ] Clicking a node highlights its outgoing edges with blue animated flow
- [ ] Target nodes of outgoing edges remain fully visible
- [ ] All other nodes and edges dim to low opacity
- [ ] Clicking canvas background or selecting multiple nodes clears focus
- [ ] Transition between focus and normal is smooth (no flicker)
- [ ] Edge animation direction is source → target
- [ ] `pnpm dev` and `pnpm build` succeed
