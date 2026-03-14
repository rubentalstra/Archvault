# Phase 3e — Autosave, Hotkeys, Undo/Redo

## Status: Not Started

## Goal

Add autosave, keyboard shortcuts, undo/redo, and clipboard to the editor.

## Prerequisites

- Phase 3c (Editor Interactions) — complete
- Phase 3d (Canvas Relationships) — complete

## Tasks

### Autosave

- [ ] Autosave with debounce (~1500ms trailing) — saves all pending position/property changes to server
- [ ] Throttle position updates during drag (~16ms / 60fps) to avoid excessive re-renders
- [ ] Autosave status indicator in toolbar (saved / saving / error)
- [ ] Force save on `Ctrl/Cmd+S`

### Undo/Redo

- [ ] Undo/redo stacks in Zustand store (`DiagramSnapshot[]`)
- [ ] Capture snapshot before each meaningful change (debounced at ~300ms to batch rapid changes)
- [ ] Undo restores previous snapshot, redo re-applies
- [ ] Stack size limit (e.g., 50 snapshots) to avoid memory bloat

### Clipboard

- [ ] Copy selected elements + their relationships (`Ctrl/Cmd+C`)
- [ ] Paste duplicates elements at offset position (`Ctrl/Cmd+V`)
- [ ] Pasted elements get new IDs (deep copy) and are added to both core tables and diagram

### Keyboard Shortcuts

- [ ] Keyboard shortcut system (consider `react-hotkeys-hook` or custom hook):
    - `Ctrl/Cmd+Z` → Undo
    - `Ctrl/Cmd+Shift+Z` → Redo
    - `Ctrl/Cmd+C` → Copy selected
    - `Ctrl/Cmd+V` → Paste
    - `Ctrl/Cmd+A` → Select all
    - `Delete/Backspace` → Remove selected from diagram (or delete element — confirm first)
    - `Escape` → Deselect / cancel current mode
    - `Ctrl/Cmd+S` → Force save
    - `Ctrl/Cmd+G` → Toggle grid visibility
    - `Space` (hold) → Pan mode
    - `+/-` → Zoom in/out
    - `Ctrl/Cmd+0` → Fit view (reset zoom)
    - `?` → Show shortcuts overlay
- [ ] Shortcuts overlay dialog (lists all bindings)
- [ ] Shortcuts should be disabled when typing in input fields / properties panel

## Key Files

- `src/hooks/use-autosave.ts` — autosave hook with debounce
- `src/hooks/use-editor-hotkeys.ts` — hotkey bindings
- `src/components/editor/shortcuts-overlay.tsx` — shortcuts help dialog
- `src/components/editor/autosave-indicator.tsx` — save status badge
- `src/stores/editor-store.ts` — undo/redo/clipboard actions

## Design Notes

- **Debounce vs. throttle:** Autosave is _debounced_ (save after user stops making changes). Drag position updates are
  _throttled_ (limit how often we process during continuous drag). These are different timing strategies.
- **Snapshot granularity:** Undo snapshots capture the full diagram state (node positions, edges, visual properties).
  This is simpler than operation-based undo and works well for diagram editors.
- **Delete behavior:** `Delete` key removes the element from the current diagram (removes `diagram_elements` row).
  To delete the element entirely (from all diagrams), the user should use the properties panel or a confirm dialog.

## Verification

- [ ] Autosave triggers after inactivity (no manual save needed)
- [ ] Autosave indicator shows correct state (saved/saving/error)
- [ ] All keyboard shortcuts work
- [ ] Shortcuts are disabled when typing in text inputs
- [ ] Undo/redo restores previous states correctly
- [ ] Copy/paste duplicates elements at offset position
- [ ] Shortcuts overlay shows all bindings
- [ ] `pnpm dev` and `pnpm build` succeed
