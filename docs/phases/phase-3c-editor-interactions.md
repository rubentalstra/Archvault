# Phase 3c — Editor Interactions & Properties Panel

## Status: Not Started

## Goal

Add Zustand editor store, editor modes, element placement, resize, z-index management, and the element/relationship
properties side panel.

## Prerequisites

- Phase 3b (Canvas Rendering) — complete

## Tasks

### Editor Store

- [ ] Create Zustand editor store (`src/stores/editor-store.ts`) with:
    - `selectedNodeIds: string[]` — synced from React Flow's selection
    - `selectedEdgeIds: string[]` — synced from React Flow's selection
    - `mode: "select" | "pan" | "add_element" | "add_relationship"`
    - `addElementType: ElementType | null` — which type to place in add mode
    - `sidePanel: "properties" | "tree" | null` — which panel is open
    - `clipboard: { elements, relationships } | null`
    - `undoStack / redoStack: DiagramSnapshot[]` (populated in 3e)

### Selection & Interaction (mostly built into React Flow)

- [ ] Click to select element (React Flow built-in)
- [ ] Shift-click for multi-select (React Flow built-in)
- [ ] Selection box / rubber band (React Flow built-in `selectionMode`)
- [ ] Drag to move selected elements (React Flow built-in)
- [ ] Resize elements via handles (React Flow `NodeResizer` component)
- [ ] Z-index management: right-click context menu with "Bring to front" / "Send to back"
- [ ] Sync React Flow selection state → Zustand store → properties panel

### Editor Toolbar

- [ ] Editor mode toolbar (top of canvas):
    - Select mode (pointer icon) — default
    - Pan mode (hand icon) — or hold Space
    - Add element dropdown (person / system / container / component) — click canvas to place
- [ ] Add element mode: click canvas → create element + `diagram_elements` row at click position
- [ ] Scope validation: only allow adding element types valid for the diagram's C4 level

### Properties Side Panel

- [ ] Side panel component (right side, collapsible):
    - Shows when an element or relationship is selected
    - **Details tab** — view/edit the selected element's or relationship's properties
    - **Connections tab** — list of relationships connected to the selected element
- [ ] Element properties panel (matches IcePanel layout):
    - Name (editable)
    - Display description (editable, max 120 chars)
    - Type (read-only badge)
    - Scope (Internal / External toggle)
    - Belongs to (parent element — read-only link)
    - Status (planned / live / deprecated selector)
    - Contains (child count — read-only, clickable)
    - Technologies (list, add/remove)
    - Tags (tag picker — if phase 2c is complete)
    - Links (list, add/remove)
    - In N diagrams (read-only count)
    - Detailed description (rich text editor)
- [ ] Relationship properties panel:
    - Source element (read-only link)
    - Target element (read-only link)
    - Direction (outgoing / incoming / bidirectional / none selector)
    - Description (editable)
    - Technology (editable)
    - Status (planned / live / deprecated)
    - Visual properties (per-diagram): path type, line style, label position
    - Tags (if phase 2c is complete)
- [ ] Empty state when nothing is selected (show diagram settings)

## Key Files

- `src/stores/editor-store.ts` — Zustand store
- `src/components/editor/editor-toolbar.tsx` — mode toolbar
- `src/components/editor/properties-panel.tsx` — side panel wrapper with tabs
- `src/components/editor/element-properties.tsx` — element detail/edit panel
- `src/components/editor/relationship-properties.tsx` — relationship detail/edit panel
- `src/components/editor/add-element-mode.tsx` — element placement interaction

## Design Notes

- **React Flow handles the heavy lifting:** Selection, drag, multi-select, rubber band, and resize are all built into
  React Flow. The Zustand store mainly tracks editor-level state (mode, panel, clipboard) and syncs with React Flow's
  selection via `onSelectionChange`.
- **Properties panel is central to the UX:** This is where users edit element/relationship data. It's the IcePanel-style
  side panel with Details + Connections tabs. Changes here update the core phase 2 data (elements, relationships), not
  just the diagram-level visual properties.
- **Scope validation on add:** When in "add element" mode, the toolbar should gray out element types not valid for the
  current diagram level (e.g., can't add a Component on a Context diagram).

## Verification

- [ ] Click selects element, shift-click multi-selects
- [ ] Drag moves elements, resize works
- [ ] Selection box selects enclosed elements
- [ ] Mode switching works (select, pan, add element)
- [ ] Add element mode places new elements on canvas with correct type
- [ ] Properties panel shows element details when selected
- [ ] Properties panel shows relationship details when selected
- [ ] Editing properties in the panel updates the element/relationship
- [ ] Z-index controls work (bring to front, send to back)
- [ ] `pnpm dev` and `pnpm build` succeed
