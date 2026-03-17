# Phase 8d — Save as Block

## Status: Not Started

## Goal

Enable users to package their own architecture patterns as blocks. Select elements and connections
from a workspace, configure variables, and save as a reusable block that can be shared or published.

## Prerequisites

- Phase 8c (Block Browser & Install) — complete

## Tasks

### "Save as Block" Flow

- [ ] "Save as Block" action in diagram editor (toolbar or context menu)
- [ ] Block creation wizard:
  1. **Select scope:** Pick elements and connections to include (multi-select on canvas or tree)
  2. **Define variables:** Mark element names/descriptions as configurable variables
  3. **Metadata:** Name, slug, description, category, tags, readme
  4. **Preview:** Show generated manifest and diagram preview
  5. **Save:** Create block (org-scoped by default)
- [ ] Auto-generate manifest from selected workspace entities
- [ ] Smart variable detection: suggest names that look parameterizable

### Manifest Generation

- [ ] Convert selected elements to manifest format (with ref strings)
- [ ] Convert connections between selected elements
- [ ] Capture diagram layout (positions relative to bounding box origin)
- [ ] Detect potential variables (common patterns like service names)
- [ ] Generate readme template

### Block Management

- [ ] "My Blocks" section in workspace/organization settings
- [ ] Edit block (update manifest, metadata, readme)
- [ ] Version management: create new version, maintain changelog
- [ ] Visibility: private (org only) or public (community registry)
- [ ] Delete block

### i18n

- [ ] Add save-as-block keys to messages files

## Key Files

- `apps/web/src/components/blocks/save-as-block-wizard.tsx`
- `apps/web/src/lib/block-generator.ts` — workspace entities to manifest converter
- `apps/web/src/components/blocks/block-manager.tsx` — my blocks management

## Verification

- [ ] Save as Block creates a valid manifest from selected entities
- [ ] Variables are correctly defined and interpolatable
- [ ] Generated block can be installed into a different workspace
- [ ] Block versioning works
- [ ] Visibility control (private/public) works
- [ ] `pnpm dev` and `pnpm build` succeed
