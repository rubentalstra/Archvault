# Phase 7a — Import & Export

## Status: Not Started

## Goal

Enable importing workspace data from JSON/YAML files and exporting diagrams (PNG, SVG) and model
data (JSON, YAML). This makes Archvault data portable and integrable with other tools.

## Prerequisites

- Phase 6a (Versions & Timeline) — complete

## Tasks

### Import

- [ ] Import from JSON and YAML files:
  - Model objects (actors, systems, apps, stores, components)
  - Connections with source/target references
  - Tags and tag groups
  - Groups and element-group assignments
- [ ] Import schema definition (JSON Schema for validation)
- [ ] Import wizard UI:
  - File upload (drag-and-drop or file picker)
  - Schema validation with error display
  - Preview of objects/connections to be imported
  - Conflict resolution (skip, overwrite, rename)
  - Import progress indicator
- [ ] Server function: `importWorkspaceData(workspaceId, data)` with transaction
- [ ] Technology mapping: match imported technology names to catalog entries
- [ ] Permission: admin only

### Diagram Export

- [ ] **PNG export:** Render canvas to PNG image via `html-to-image` or React Flow's built-in export
- [ ] **SVG export:** Export diagram as vector SVG
- [ ] Export options: include/exclude background grid, minimap, title
- [ ] Resolution selector for PNG (1x, 2x, 3x)
- [ ] Export current viewport or full diagram

### Model Export

- [ ] **JSON export:** Full workspace model as structured JSON
- [ ] **YAML export:** Same structure in YAML format
- [ ] Export scope: entire workspace or filtered (by diagram, by tag, by type)
- [ ] Include/exclude options: elements, connections, tags, groups, diagrams, flows

### Export UI

- [ ] Export button in diagram editor toolbar (dropdown: PNG, SVG)
- [ ] Export button in workspace settings (dropdown: JSON, YAML)
- [ ] Download file with generated filename (`{workspace}-{date}.json`)

### i18n

- [ ] Add `import_*` and `export_*` keys to messages files

## Key Files

- `apps/web/src/lib/import/workspace-importer.ts` — import logic with validation
- `apps/web/src/lib/import/import-schema.ts` — JSON Schema definition
- `apps/web/src/lib/export/diagram-exporter.ts` — PNG/SVG export
- `apps/web/src/lib/export/model-exporter.ts` — JSON/YAML model export
- `apps/web/src/components/import/import-wizard.tsx` — import UI
- `apps/web/src/components/export/export-dialog.tsx` — export options dialog

## Verification

- [ ] Import JSON file creates correct model objects and connections
- [ ] Import YAML file works identically
- [ ] Schema validation catches invalid files
- [ ] Conflict resolution works (skip/overwrite/rename)
- [ ] PNG export generates correct image
- [ ] SVG export generates valid SVG
- [ ] JSON/YAML model export contains all workspace data
- [ ] Re-importing an exported file produces identical results
- [ ] `pnpm dev` and `pnpm build` succeed
