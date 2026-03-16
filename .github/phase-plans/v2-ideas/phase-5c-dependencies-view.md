# Phase 5c — Dependencies View

## Status: Not Started

## Goal

Build a dedicated dependencies analysis view that lets users explore incoming and outgoing
connections for any model object, identify risk areas (objects with too many dependencies),
and understand the impact of changes.

## Prerequisites

- Phase 3d (Canvas Edges & Connections) — complete

## Tasks

### Dependencies Page

- [ ] New route: `workspace/$workspaceSlug/dependencies`
- [ ] Default view selects the internal System with the most connections
- [ ] Object selector (search + dropdown) to pick any model object as the focus
- [ ] Two-column layout:
  - **Left: Incoming connections** — objects that connect TO the focused object
  - **Right: Outgoing connections** — objects that the focused object connects TO

### Connection Analysis

- [ ] For each dependency, show:
  - Object name, type badge, and technology icons
  - Connection description and technology
  - Connection direction indicator
  - Click to view/edit the connection details
  - Click the object name to switch focus to that object
- [ ] Connection count badges: "12 incoming, 8 outgoing"
- [ ] **Direct connections only** — lower/inferred connections are not counted
  (matching IcePanel behavior)

### Filtering

- [ ] Filter by object type (Actor, System, App, Store, Component)
- [ ] Filter by connection technology
- [ ] Filter by tags
- [ ] Filter by status (planned, live, deprecated)
- [ ] Search within incoming/outgoing lists

### Risk Indicators

- [ ] Highlight objects with high dependency counts (configurable threshold)
- [ ] Sort objects by connection count to surface the most coupled components
- [ ] Visual indicator (color gradient) showing dependency density

### Navigation Integration

- [ ] Link from element properties panel → "View dependencies" button
- [ ] Link from dependencies view → diagrams containing the focused object
- [ ] Link from dependencies view → flows involving the focused object

### i18n

- [ ] Add `dependencies_*` keys to messages files

## Key Files

- `src/routes/_protected/_onboarded/workspace/$workspaceSlug/dependencies.tsx` — dependencies page
- `src/components/dependencies/dependency-explorer.tsx` — main explorer component
- `src/components/dependencies/dependency-list.tsx` — incoming/outgoing list
- `src/lib/dependency.functions.ts` — server functions for dependency queries

## Design Notes

- **Direct connections only.** The count represents unique direct connections. If System A has an
  App that connects to System B's App, that lower connection does NOT count toward System A↔B
  dependencies in this view. Only explicit connections between the two Systems count.
- **Performance.** The dependencies query joins connections with elements. For workspaces with
  many connections, use a materialized count or indexed query to avoid slow page loads.

## Verification

- [ ] Dependencies page loads with most-connected object selected
- [ ] Object selector works (search, switch focus)
- [ ] Incoming and outgoing connections display correctly
- [ ] Connection counts are accurate
- [ ] Filters work (type, technology, tags, status)
- [ ] Click object name switches focus
- [ ] Navigation to diagrams and flows works
- [ ] `pnpm dev` and `pnpm build` succeed
