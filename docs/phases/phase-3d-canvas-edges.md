# Phase 3d — Canvas Edges & Connections

## Status: Complete

## Goal

Render connections as interactive edges on the diagram canvas. Support edge creation via drag from
handles, edge labels, direction markers, line styles (curved/straight/orthogonal), and per-diagram
visual properties. This completes the core diagramming experience.

## Prerequisites

- Phase 3c (Editor Interactions & Panel) — complete
- Phase 2d (Naming Migration & Store Type) — complete

## Tasks

### Edge Rendering

- [x] Map `diagram_connections` to React Flow edges in `diagram-to-flow.ts`:
  - `type` from `path_type` (curved, straight, orthogonal)
  - `markerEnd` / `markerStart` from connection `direction`
  - `style` from `strokeDasharray` for line styles
- [x] Custom edge components for each path type:
  - **CurvedEdge** — `getBezierPath()` (default)
  - **StraightEdge** — `getStraightPath()`
  - **OrthogonalEdge** — `getSmoothStepPath()` (right-angle routing)
- [x] Edge labels render connection description with technology badges via `EdgeLabelRenderer`
- [x] Direction markers:
  - `outgoing` → arrow at target end
  - `incoming` → arrow at source end
  - `bidirectional` → arrows at both ends
  - `none` → no arrows
- [x] Edge colors: default muted, highlight on select with primary color
- [x] Dark mode styling via CSS variables (`hsl(var(--primary))`, `hsl(var(--muted-foreground))`)

### Edge Creation on Canvas

- [x] Drag from handle (`onConnect` callback):
  - Create with defaults (curved, outgoing) and let user edit in properties panel
  - Create connection in model + `diagram_connections` row
- [x] `isValidConnection` validation:
  - Prevent self-connections
  - Prevent duplicate connections (same source + target)
- [x] `connectionMode={ConnectionMode.Loose}` for flexible handle targeting

### Edge Interaction

- [x] Click to select edge → opens connection properties in side panel
- [x] Right-click context menu on edges:
  - Edit properties
  - Remove from diagram
  - Delete connection (with confirmation)
- [x] `elevateEdgesOnSelect={true}` to raise selected edges above nodes

### Connection Properties Panel Updates

- [x] When edge selected, properties panel shows:
  - Source element (read-only link, click to select node)
  - Target element (read-only link, click to select node)
  - Description (editable text — this is the edge label)
  - Direction selector (outgoing / incoming / bidirectional / none)
  - Technologies (multi-select with icon support)
  - Per-diagram visual: path type, line style, label position slider
- [x] Changes to connection properties update the store live (no reload needed)
- [x] Changes to visual properties are per-diagram only

### Deferred

- Higher/Lower connections (cross-level display) — complex feature, deferred to a later phase
- Context menu path type submenu — deferred (users can change path type in properties panel)

### Data Loading

- [x] `getDiagramData()` includes `diagram_connections` joined with `connections` table
- [x] Return connection data: id, source_element_id, target_element_id, direction, description,
  technologies, iconTechSlug, and per-diagram visual properties

### i18n

- [x] Add edge/connection-related canvas keys to messages files (EN + NL)

## Key Files

- `src/components/editor/edges/curved-edge.tsx` — custom bezier edge
- `src/components/editor/edges/straight-edge.tsx` — custom straight edge
- `src/components/editor/edges/orthogonal-edge.tsx` — custom step edge
- `src/components/editor/edges/edge-label.tsx` — shared edge label component
- `src/components/editor/edges/index.ts` — edgeTypes registry
- `src/lib/converters/diagram-to-flow.ts` — updated edge conversion
- `src/lib/types/diagram-nodes.ts` — PATH_TYPE_TO_EDGE_TYPE mapping
- `src/stores/editor-store.ts` — edge state management (updateEdgeData)
- `src/components/editor/panels/connection-properties.tsx` — edge properties panel
- `src/components/editor/diagram-canvas.tsx` — edgeTypes wiring

## Design Notes

- **edgeTypes must be stable references** — defined outside the component or via `useMemo`, same as
  nodeTypes. Changing identity causes React Flow to re-mount all edges.
- **Connection vs. Diagram Connection:** A "connection" is the model-level relationship (stored in
  `connections` table). A "diagram connection" is the per-diagram visual placement (stored in
  `diagram_connections` table with path type, line style, label position, etc.). Editing the
  connection's description or direction updates the model. Editing path type or line style is per-diagram.
- **Connection handles:** All nodes have handles on all 4 sides (top, bottom, left, right). The
  `sourceAnchor` and `targetAnchor` properties in `diagram_connections` control which handle is used.
  Default is `auto` (React Flow picks the closest handle).
- **Technology on edges:** Connections can have technology badges (e.g., "REST/HTTPS", "gRPC", "AMQP")
  that render on the edge label via `EdgeLabelRenderer`. An optional icon (via `iconTechSlug`) is
  displayed above the description text.

## Verification

- [x] Connections render as edges between nodes on canvas
- [x] All 3 edge types render correctly (curved, straight, orthogonal)
- [x] Direction arrows display correctly for all 4 direction types
- [x] Edge labels show connection description and technology badges
- [x] Dashed/dotted line styles render correctly
- [x] Selected edges highlight with primary color
- [x] Creating a connection via handle drag works (defaults to curved + outgoing)
- [x] Edge context menu: edit properties, remove from diagram, delete connection all work
- [x] Properties panel changes update edge live without reload
- [x] Dark mode renders correctly for all edge types
- [x] `pnpm build` succeeds
