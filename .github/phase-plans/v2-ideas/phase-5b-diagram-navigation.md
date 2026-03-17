# Phase 5b — Multi-Level Diagram Navigation

## Status: Not Started

## Goal

Enable seamless navigation between C4 diagram levels — zoom into a System to see its Apps/Stores,
zoom into an App to see its Components, and navigate back. This is the core "abstraction-first,
overlay details when needed" experience.

## Prerequisites

- Phase 3d (Canvas Edges & Connections) — complete

## Tasks

### Zoom In (Drill Down)

- [ ] **Zoom icon on nodes:** Show a magnifying glass (+) icon on System and App nodes:
  - On System nodes: shows count of child Apps/Stores
  - On App nodes: shows count of child Components
  - Click to navigate to the child diagram
- [ ] **Double-click to zoom:** Double-click a System node → navigate to its App diagram
  (if one exists). Double-click an App → navigate to its Component diagram.
- [ ] **Automatic diagram selection:**
  - If the target element has exactly one scoped diagram → navigate directly
  - If multiple diagrams exist → show picker dropdown
  - If no diagram exists → offer to create one ("Create App diagram for {System name}?")
- [ ] **Custom landing diagram:** Allow setting a specific diagram as the "default zoom target"
  for an element:
  - Hover zoom icon → `...` menu → "Set as custom landing diagram"
  - "Remove custom landing diagram" to clear
  - Stored as `default_diagram_id` on the element (nullable FK)

### Zoom Out (Navigate Up)

- [ ] **Back button** in diagram toolbar (top-left) — navigates to parent diagram
- [ ] **Breadcrumb trail** showing the navigation path:
  - `Context: My System Landscape` → `App: Payment System` → `Component: Auth Service`
  - Each segment is clickable to jump back to that level
- [ ] **Parent element link** in diagram header — click to go to the diagram containing this
  element at the higher level

### Horizontal Navigation (Same Level)

- [ ] **Diagram switcher dropdown** (top-left):
  - Shows all diagrams at the same C4 level
  - Current diagram highlighted
  - Grouped by scope element
  - Quick search filter
- [ ] **Navigate between sibling diagrams:** Arrow buttons (← →) to cycle through diagrams
  at the same level within the same workspace

### Diagram Navigation Bar

- [ ] Navigation bar component (top of editor):
  - Current diagram name and type badge (Context / App / Component)
  - Back button (to parent level)
  - Breadcrumb trail
  - Diagram switcher dropdown
  - Last editor info ("Edited by {name} {time ago}")
  - Diagram details button (opens diagram settings)

### Canvas Transitions

- [ ] Smooth transition when navigating between diagrams:
  - Zoom-in animation when drilling down (expand from the clicked node)
  - Zoom-out animation when going up (contract to the parent node position)
  - Cross-fade for horizontal navigation
- [ ] Preserve viewport position when navigating back (remember where user was)

### i18n

- [ ] Add navigation-related keys to messages files

## Key Files

- `apps/web/src/components/editor/diagram-nav-bar.tsx` — navigation bar with breadcrumbs
- `apps/web/src/components/editor/zoom-indicator.tsx` — zoom icon overlay on nodes
- `apps/web/src/components/editor/diagram-switcher.tsx` — diagram picker dropdown
- `apps/web/src/hooks/use-diagram-navigation.ts` — navigation logic and history
- `apps/web/src/stores/editor-store.ts` — navigation state (history stack, viewport memory)

## Design Notes

- **Navigation history as a stack.** Maintain a stack of `{ diagramId, viewport }` entries. Zoom-in
  pushes, zoom-out pops. This lets users drill down multiple levels and retrace their path.
- **Default diagram creation:** When a user tries to zoom into a System that has no App diagram,
  the UX should make it easy to create one. Pre-fill the diagram name and scope from the parent.
- **Viewport memory:** When navigating back to a previously visited diagram, restore the exact
  viewport position (pan + zoom) the user had when they left. This prevents disorientation.

## Verification

- [ ] Zoom icon appears on System and App nodes with child counts
- [ ] Click zoom icon navigates to child diagram
- [ ] Double-click navigates to child diagram
- [ ] Custom landing diagram can be set and cleared
- [ ] Back button navigates to parent level
- [ ] Breadcrumb trail shows correct path and is clickable
- [ ] Diagram switcher shows same-level diagrams
- [ ] Navigation transitions animate smoothly
- [ ] Viewport position is restored when navigating back
- [ ] Create diagram prompt appears when no child diagram exists
- [ ] `pnpm dev` and `pnpm build` succeed
