# Phase 3f — Autosave, Hotkeys & Undo/Redo

## Status: Not Started

## Goal

Add autosave for diagram state, comprehensive keyboard shortcuts, clipboard support (copy/paste),
and undo/redo with history stack.

## Prerequisites

- Phase 3d (Canvas Edges & Connections) — complete

## Current State

The editor store (`src/stores/editor-store.ts`) manages nodes, edges, mode (select/pan/add_connection),
selection state, grid/minimap toggles, and context menus via Zustand. There is **no undo/redo stack or
autosave logic** — changes are persisted immediately via fire-and-forget server function calls triggered
by node drag/resize callbacks.

The toolbar (`src/components/editor/editor-toolbar.tsx`) has mode toggles (select, pan, connection),
add-element popover with drag-to-add, and grid/minimap/element-picker toggles. Undo/redo buttons and
save indicators do not yet exist.

## Tasks

### Autosave

- [ ] Debounced autosave (500ms after last change):
  - Node position/size changes
  - Edge visual property changes
- [ ] Save indicator in toolbar: "Saving..." → "Saved" with timestamp
- [ ] Batch persistence: collect all pending changes and send in a single server call

### Keyboard Shortcuts

- [ ] Standard shortcuts:
  - `Backspace` / `Delete` — delete selected elements (with confirmation for model delete)
  - `Cmd/Ctrl + A` — select all
  - `Cmd/Ctrl + Z` — undo
  - `Cmd/Ctrl + Shift + Z` — redo
  - `Cmd/Ctrl + C` — copy selected
  - `Cmd/Ctrl + V` — paste
  - `Cmd/Ctrl + D` — duplicate selected
  - `Escape` — deselect all / exit current mode
  - `Space` (hold) — activate pan mode
- [ ] Element creation shortcuts:
  - `Shift + P` — add Actor
  - `Shift + S` — add System
  - `Shift + A` — add App
  - `Shift + D` — add Store
  - `Shift + X` — add Component
- [ ] Navigation shortcuts:
  - `Cmd/Ctrl + +` — zoom in
  - `Cmd/Ctrl + -` — zoom out
  - `Cmd/Ctrl + 0` — fit view
  - `Cmd/Ctrl + 1` — zoom to 100%
- [ ] Editor mode shortcuts:
  - `V` — select mode
  - `H` — pan mode
  - `C` — connection mode
- [ ] Keyboard shortcut reference panel (show with `?`):
  - Use shadcn `Kbd` and `KbdGroup` components (`src/components/ui/kbd.tsx`) for all key displays
  - Example: `<KbdGroup><Kbd>Cmd</Kbd><Kbd>Z</Kbd></KbdGroup>` for undo
  - Use `Kbd` in toolbar tooltips to show shortcut hints alongside button labels

### Undo/Redo

- [ ] Create undo/redo history stack in Zustand store:
  ```ts
  {
    undoStack: DiagramAction[],
    redoStack: DiagramAction[],
    pushAction: (action: DiagramAction) => void,
    undo: () => void,
    redo: () => void,
  }
  ```
- [ ] Action types tracked:
  - `move_node` — position change (stores old + new position)
  - `resize_node` — size change
  - `add_node` — element added to diagram
  - `remove_node` — element removed from diagram
  - `add_edge` — connection added to diagram
  - `remove_edge` — connection removed from diagram
  - `update_properties` — any property change
- [ ] Batch actions: group rapid changes (e.g., moving multiple selected nodes) into single undo step
- [ ] Undo/redo buttons in toolbar with disabled state when stack is empty
- [ ] Clear redo stack when a new action is pushed

### Copy/Paste

- [ ] Copy: serialize selected nodes + edges to clipboard (JSON in clipboard data transfer)
- [ ] Paste: deserialize and create new elements with offset position (+20px, +20px)
- [ ] Paste creates new model objects (copies, not references to originals)
- [ ] Copy across diagrams: paste in a different diagram creates elements + diagram placements
- [ ] Duplicate (`Cmd/Ctrl + D`): copy + paste in place with offset

### i18n

- [ ] Add autosave status keys and shortcut labels to messages files

## Key Files

- `src/stores/editor-store.ts` — undo/redo stack, autosave state (extend existing store)
- `src/hooks/use-autosave.ts` — debounced save logic (new)
- `src/hooks/use-editor-hotkeys.ts` — keyboard shortcut handler (new)
- `src/hooks/use-clipboard.ts` — copy/paste logic (new)
- `src/components/editor/editor-toolbar.tsx` — undo/redo buttons, save indicator (extend existing)
- `src/components/editor/shortcuts-dialog.tsx` — keyboard shortcut reference (new)
- `src/components/ui/kbd.tsx` — shadcn `Kbd` / `KbdGroup` components (installed)

## Design Notes

- **Undo is local only.** The undo/redo stack is per-session, stored in Zustand (not persisted to DB).
  It tracks diagram-level actions, not model-level changes. If you rename an element in the properties
  panel, that's a model change and is NOT undoable (it would need a different mechanism).
- **Autosave debouncing:** Currently changes fire immediately via server functions on drag end. This
  phase replaces that with a debounced batch approach to prevent hammering the server.
- **Clipboard format:** Use `application/json` MIME type in the clipboard to avoid conflicts with
  plain text paste. Store enough data to recreate elements (name, type, connections, position delta).

## Verification

- [ ] Autosave triggers after position/size changes
- [ ] Save indicator shows correct status
- [ ] All keyboard shortcuts work as documented
- [ ] Undo reverses the last action
- [ ] Redo re-applies the undone action
- [ ] Multi-node move is a single undo step
- [ ] Copy/paste creates new elements at offset position
- [ ] Duplicate works for nodes and edges
- [ ] Shortcut reference panel displays all shortcuts
- [ ] `pnpm dev` and `pnpm build` succeed
