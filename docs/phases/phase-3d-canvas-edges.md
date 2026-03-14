# Phase 3d — Canvas Edges & Connections

## Status: Not Started

## Goal

Render connections as interactive edges on the diagram canvas. Support edge creation via drag from
handles, edge labels, direction markers, line styles (curved/straight/orthogonal), and per-diagram
visual properties. This completes the core diagramming experience.

## Prerequisites

- Phase 3c (Editor Interactions & Panel) — complete
- Phase 2d (Naming Migration & Store Type) — complete

## Tasks

### Edge Rendering

- [ ] Map `diagram_connections` to React Flow edges in `diagram-to-flow.ts`:
  - `type` from `path_type` (curved, straight, orthogonal)
  - `markerEnd` / `markerStart` from connection `direction`
  - `label` from connection `description`
  - `style` from `style_json` overrides
  - `animated` = false by default (animated edges used in flows, phase 4)
- [ ] Custom edge components for each path type:
  - **CurvedEdge** — `getBezierPath()` (default)
  - **StraightEdge** — `getStraightPath()`
  - **OrthogonalEdge** — `getSmoothStepPath()` (right-angle routing)
- [ ] Edge labels render connection description with technology badge
- [ ] Direction markers:
  - `outgoing` → arrow at target end
  - `incoming` → arrow at source end
  - `bidirectional` → arrows at both ends
  - `none` → no arrows
- [ ] Edge colors: default muted, highlight on hover/select
- [ ] Dark mode styling via CSS variables

### Edge Creation on Canvas

- [ ] Drag from handle (`onConnect` callback):
  - Show connection creation dialog (description, technology, direction)
  - Or create with defaults and let user edit in properties panel
  - Create connection in model + `diagram_connections` row
- [ ] `isValidConnection` validation:
  - Prevent self-connections
  - Prevent duplicate connections (same source + target)
  - Allow multiple connections between same pair if different description
- [ ] `connectionMode={ConnectionMode.Loose}` for flexible handle targeting

### Edge Interaction

- [ ] Click to select edge → opens connection properties in side panel
- [ ] Right-click context menu on edges:
  - Edit properties
  - Change line style (curved / straight / orthogonal)
  - Flip direction
  - Remove from diagram
  - Delete connection (with confirmation)
- [ ] Multi-select edges (shift-click) for batch operations
- [ ] `elevateEdgesOnSelect={true}` to raise selected edges above nodes

### Connection Properties Panel Updates

- [ ] When edge selected, properties panel shows:
  - Source element (read-only link, click to select node)
  - Target element (read-only link, click to select node)
  - Description (editable text — this is the edge label)
  - Direction selector (outgoing / incoming / bidirectional / none)
  - Technology (editable text)
  - Status (planned / live / deprecated)
  - Tags (tag picker)
  - Per-diagram visual: path type, line style, label position slider
- [ ] Changes to connection properties update across all diagrams (model-level)
- [ ] Changes to visual properties are per-diagram only

### Lower/Higher Connections

- [ ] **Higher connections on lower diagrams:** When an App-level (L2) diagram contains a System from
  another context, connections between that System and the diagram's parent System should display as
  "higher connections" (dashed, lighter color, non-editable)
- [ ] **Lower connections on higher diagrams:** On a Context diagram (L1), if two Systems have Apps
  that are connected, optionally show the "expand" view — display the App-level connections directly
  between the Systems

### Data Loading

- [ ] Update `getDiagramData()` to include `diagram_connections` joined with `connections` table
- [ ] Return connection data: id, source_element_id, target_element_id, direction, description,
  technology, status, tags, and per-diagram visual properties

### i18n

- [ ] Add edge/connection-related canvas keys to messages files

## Key Files

- `src/components/editor/edges/curved-edge.tsx` — custom bezier edge
- `src/components/editor/edges/straight-edge.tsx` — custom straight edge
- `src/components/editor/edges/orthogonal-edge.tsx` — custom step edge
- `src/components/editor/edges/edge-label.tsx` — shared edge label component
- `src/components/editor/edges/index.ts` — edgeTypes registry
- `src/lib/converters/diagram-to-flow.ts` — updated edge conversion
- `src/stores/editor-store.ts` — edge state management
- `src/components/editor/panels/connection-properties.tsx` — edge properties panel

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
- **Technology on edges:** Connections can have a technology label (e.g., "REST/HTTPS", "gRPC", "AMQP")
  that renders as a small badge on the edge label. This helps readers quickly understand the protocol.

## Verification

- [ ] Connections render as edges between nodes on canvas
- [ ] All 3 edge types render correctly (curved, straight, orthogonal)
- [ ] Direction arrows display correctly for all 4 direction types
- [ ] Edge labels show connection description and technology
- [ ] Creating a connection via handle drag works
- [ ] Self-connection and duplicate validation works
- [ ] Edge selection shows connection properties in side panel
- [ ] Editing connection properties persists to server
- [ ] Per-diagram visual properties (path type, line style) persist independently
- [ ] Context menu works on edges
- [ ] Higher connections display on lower diagrams (dashed style)
- [ ] Dark mode renders correctly for all edge types
- [ ] `pnpm dev` and `pnpm build` succeed
