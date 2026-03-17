# Phase 4b — Flow Steps & Playback

## Status: Not Started

## Goal

Build the interactive flow playback experience — stepping through flows with Back/Next navigation,
path branching UI, sequence-style presentation, and connection name/title display toggles.

## Prerequisites

- Phase 4a (Flow Schema & CRUD) — complete

## Tasks

### Playback Controls

- [ ] Playback toolbar (appears when flow is active, replaces or overlays editor toolbar):
  - Play button (starts from step 0)
  - Back button (previous step)
  - Next button (next step)
  - Step counter: "Step 3 of 12"
  - Step title display
  - Exit flow button
- [ ] Arrow key navigation: Left = back, Right = next
- [ ] Step dropdown: click to jump to any step directly
- [ ] Click a step in the sidebar to jump to it
- [ ] Click a highlighted connection on canvas to advance to its step

### Step Visualization

- [ ] **Introduction step:** Show all flow objects and connections at once (overview),
  then transition to step-by-step mode on "Next"
- [ ] **Message step:**
  - Highlight source element, target element, and connection
  - Animate edge with directional pulse (flow direction)
  - Show step title as floating label near the connection
  - Support direction override (response = reversed arrow)
- [ ] **Process step:**
  - Highlight single element with pulsing border
  - Show step title as floating label on the element
- [ ] **Alternate paths:**
  - Show tab buttons for each path (e.g., "Path A", "Path B")
  - Click tab to view that path's steps
  - Default to first path
  - Each path plays sequentially within
- [ ] **Parallel paths:**
  - Show first step of ALL paths simultaneously (highlighted together)
  - Navigation steps through all paths in interleaved order
- [ ] **Go to flow step:**
  - Show "Go to flow" button that navigates to the linked flow
  - Linked flow opens on its diagram with playback starting
  - Back button returns to the original flow
- [ ] **Information step:**
  - Show floating info card on canvas (not attached to any object)
  - Card displays title and description
- [ ] **Conclusion step:**
  - Show all flow objects at full opacity (summary view)
  - Display conclusion title and description overlay

### Visual Toggles

- [ ] Toggle connection name display (show/hide edge labels during playback)
- [ ] Toggle step titles display (show/hide all step titles at once vs. one at a time)
- [ ] Toggle sequence numbers on connections (show "1", "2", "3" order badges)

### Animation

- [ ] Edge pulse animation for message steps:
  - SVG animated dot traveling along the edge path
  - Direction follows the step's direction (or override)
  - Subtle, not distracting (~2s loop)
- [ ] Element highlight animation:
  - Glowing border effect on active elements
  - Color matches the element type
- [ ] Transition animation between steps:
  - Smooth opacity transitions (fade out previous, fade in next)
  - Canvas auto-pans to keep the active step's objects in view

### Flow State Management

- [ ] Add to Zustand store:
  ```ts
  {
    activeFlowId: string | null,
    currentStepIndex: number,
    isPlaying: boolean,
    activePath: number, // for alternate/parallel
    flowHistory: string[], // for go-to-flow back navigation
  }
  ```
- [ ] When flow is active, canvas enters "presentation mode":
  - Toolbar shows playback controls
  - Nodes are not draggable (view-only during playback)
  - Edit mode can be toggled to modify steps while flow is active

### i18n

- [ ] Add playback-related keys to messages files

## Key Files

- `apps/web/src/components/flows/flow-playback-toolbar.tsx` — playback controls
- `apps/web/src/components/flows/flow-step-visualizer.tsx` — step rendering on canvas
- `apps/web/src/components/flows/flow-path-tabs.tsx` — alternate/parallel path tabs
- `apps/web/src/components/flows/flow-info-card.tsx` — floating info/conclusion cards
- `apps/web/src/hooks/use-flow-playback.ts` — playback state and navigation logic
- `apps/web/src/stores/editor-store.ts` — flow state additions

## Design Notes

- **Presentation mode is view-only.** During flow playback, the canvas is read-only (no drag, no
  resize, no connection creation). Users can toggle edit mode to modify steps.
- **Auto-pan:** The canvas smoothly pans and zooms to keep the active step's objects in view. Use
  React Flow's `fitBounds()` with animation to transition between steps.
- **Go-to-flow navigation stack:** When following a "Go to flow" step, push the current flow onto
  a stack. The Back button pops the stack to return to the previous flow. This enables flow chains
  across multiple diagrams and C4 levels.

## Verification

- [ ] Playback controls work (play, back, next, exit)
- [ ] Arrow key navigation works
- [ ] Jump to step via dropdown and sidebar click
- [ ] All 8 step types render correctly during playback
- [ ] Edge animation plays for message steps
- [ ] Element highlighting works for process steps
- [ ] Alternate path tabs work correctly
- [ ] Parallel paths show simultaneous highlights
- [ ] Go to flow navigates to linked flow, Back returns
- [ ] Information/Conclusion cards display properly
- [ ] Visual toggles work (labels, titles, sequence numbers)
- [ ] Canvas auto-pans between steps
- [ ] `pnpm dev` and `pnpm build` succeed
