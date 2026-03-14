# Phase 3d — Canvas Relationships

## Status: Not Started

## Goal

Render relationships as React Flow edges with direction arrows, custom paths, labels, and add-relationship interaction.

## Prerequisites

- Phase 3b (Canvas Rendering) — complete
- Phase 3c (Editor Interactions) — complete (needs selection, toolbar, properties panel)

## Tasks

### Edge Rendering

- [ ] Load `diagram_relationships` → convert to React Flow `Edge[]` format
- [ ] Custom edge types (registered via `edgeTypes`):
    - **StraightEdge** — direct line between nodes
    - **CurvedEdge** — bezier curve (default)
    - **OrthogonalEdge** — right-angle stepped path
- [ ] Line styles: solid, dashed, dotted (via SVG `strokeDasharray`)
- [ ] Edge labels: show relationship description at the configured `label_position`

### Direction & Arrow Markers

- [ ] Arrow marker rendering based on relationship `direction` (from phase 2b):
    - `outgoing` → arrow at target end (source → target)
    - `incoming` → arrow at source end (source ← target)
    - `bidirectional` → arrows at both ends (source ↔ target)
    - `none` → no arrows, plain line (source — target)
- [ ] SVG marker definitions for arrow heads (`<defs>` + `<marker>`)

### Anchor Points

- [ ] Source/target anchor configuration: `auto`, `top`, `bottom`, `left`, `right`
- [ ] `auto` mode: connect to the nearest point on the node boundary (React Flow `Position` handles)
- [ ] Fixed anchors: connect to specific sides via React Flow `Handle` components on custom nodes

### Interaction

- [ ] Click to select edge (React Flow built-in)
- [ ] Add relationship mode in toolbar: click source node → click target node → create relationship + `diagram_relationships` row
- [ ] Visual feedback during add-relationship mode (highlight valid targets, show preview line)
- [ ] Selected edge shows in properties panel (handled in 3c)

### Control Points (stretch goal)

- [ ] Custom waypoints for orthogonal/curved paths via `control_points_json`
- [ ] Drag control point handles to adjust path shape

## Key Files

- `src/components/editor/edges/straight-edge.tsx` — straight custom edge
- `src/components/editor/edges/curved-edge.tsx` — bezier custom edge
- `src/components/editor/edges/orthogonal-edge.tsx` — right-angle custom edge
- `src/components/editor/edge-label.tsx` — label positioning on edges
- `src/components/editor/arrow-markers.tsx` — SVG arrow marker definitions
- `src/components/editor/add-relationship-mode.tsx` — creation interaction

## Design Notes

- **Direction is semantic, not visual rearrangement:** The `direction` field from the relationship (phase 2b) controls
  which end(s) get arrow markers. It does NOT swap which node is source/target in React Flow — the edge always goes
  from `source_element_id` to `target_element_id`, only the arrow markers change.
- **Label position:** Stored as a float (0.0–1.0) where 0 = at source, 0.5 = center, 1.0 = at target. React Flow's
  `EdgeLabelRenderer` positions the label along the path.
- **Animation deferred:** Animated edges (pulsing data flow indicators) are a nice-to-have for a future phase, not MVP.

## Verification

- [ ] Relationships render between elements with correct paths
- [ ] All 3 path types work (straight, curved, orthogonal)
- [ ] Line styles render correctly (solid, dashed, dotted)
- [ ] Direction arrows render correctly for all 4 direction types
- [ ] Labels show at correct positions along the edge
- [ ] Click selects an edge
- [ ] Add relationship mode creates connections between nodes
- [ ] Anchor points work (auto + fixed sides)
- [ ] `pnpm dev` and `pnpm build` succeed
