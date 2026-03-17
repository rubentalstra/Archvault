# Phase 5d — Global Search

## Status: Not Started

## Goal

Implement a global search dialog (Cmd/Ctrl + K) that searches across all workspace entities:
diagrams, flows, model objects, connections, and groups. Results navigate directly to the
relevant location.

## Prerequisites

- Phase 4a (Flow Schema & CRUD) — complete
- Phase 5a (Tag Groups & Perspectives) — complete

## Tasks

### Search Dialog

- [ ] Command palette dialog triggered by `Cmd/Ctrl + K` or search icon in top nav
- [ ] Full-text search input with auto-focus
- [ ] Results grouped by category:
  - **Diagrams** — name, type badge, scope element
  - **Flows** — name, associated diagram
  - **Model Objects** — name, type badge, parent element
  - **Connections** — description, source → target names
  - **Groups** — name, color indicator
  - **Tags** — name, color/icon, tag group
- [ ] Results render with icons matching their type
- [ ] Keyboard navigation: arrow keys to move, Enter to select, Escape to close
- [ ] Recent searches shown when dialog opens with empty query
- [ ] "No results" state with helpful suggestion

### Search Implementation

- [ ] Server function: `globalSearch(workspaceId, query)` — searches across all entity tables
- [ ] Search uses `ILIKE` with trigram index for fuzzy matching (or `ts_vector` for full-text)
- [ ] Results ranked by relevance:
  1. Exact name match
  2. Name starts with query
  3. Name contains query
  4. Description contains query
- [ ] Limit to top 20 results across all categories
- [ ] Debounce search input (200ms)

### Result Navigation

- [ ] Click a **diagram** → navigate to editor with that diagram open
- [ ] Click a **flow** → navigate to editor with flow active in playback mode
- [ ] Click a **model object** → navigate to model objects list, highlight the row
  (or if on a diagram, select the node)
- [ ] Click a **connection** → navigate to connections list, highlight the row
- [ ] Click a **group** or **tag** → navigate to workspace settings

### Integration

- [ ] Search icon in workspace top navigation bar
- [ ] Works from any page within the workspace
- [ ] Preserves workspace context (only searches within current workspace)

### i18n

- [ ] Add `search_*` keys to messages files

## Key Files

- `apps/web/src/components/search/global-search-dialog.tsx` — search dialog component
- `apps/web/src/components/search/search-result-item.tsx` — result row component
- `apps/web/src/lib/search.functions.ts` — server-side search function
- `apps/web/src/hooks/use-global-search.ts` — search state and keyboard handling

## Design Notes

- **Everything is searchable.** IcePanel's principle: "everything in IcePanel is part of the model
  and can be searched." We follow the same approach — all entities that have a name or description
  are included in search results.
- **Client-side shortcut.** The `Cmd/Ctrl + K` shortcut is registered globally via a `useEffect`
  on the workspace layout component. It prevents default browser behavior and opens the dialog.
- **Search is workspace-scoped.** Unlike a platform-wide search, this only searches within the
  current workspace. Cross-workspace search is out of scope.

## Verification

- [ ] Cmd/Ctrl + K opens search dialog from any workspace page
- [ ] Search returns results across all entity types
- [ ] Results are grouped by category with correct icons
- [ ] Keyboard navigation works (arrows, enter, escape)
- [ ] Clicking a result navigates to the correct location
- [ ] Empty state shows recent searches
- [ ] No results state is helpful
- [ ] Debounced input doesn't lag
- [ ] `pnpm dev` and `pnpm build` succeed
