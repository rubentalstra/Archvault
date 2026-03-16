# Phase 7b — Technology Catalog & Registry

## Status: Not Started

## Goal

Build a **centralized, pre-seeded technology catalog** on top of the workspace technology system (Phase 2f). This adds a global catalog of popular technologies with icons that users can pick from, org-scoped custom technologies, and category-based browsing.

**Key distinction:** Phase 2f builds the workspace-level technology system (CRUD, picker, element/connection assignment, icon tech). Phase 7b adds the **global catalog layer** on top — a built-in library of known technologies with categories, icons, and org-level customization.

## Prerequisites

- Phase 2f (Technology Rewrite) — complete

## Tasks

### Database

- [ ] `technology_catalog` table (global, not workspace-scoped):
  - `id` (uuid, PK)
  - `name` (text, unique) — e.g. "TypeScript", "PostgreSQL", "AWS Lambda"
  - `category` (enum: language, framework, database, cloud_service, gateway, library, tool, other)
  - `icon_url` (text, nullable) — URL to technology icon/logo
  - `icon_slug` (text, nullable) — local icon identifier (e.g. simpleicons slug)
  - `description` (text, nullable) — brief description
  - `documentation_url` (text, nullable) — link to official docs
  - `is_builtin` (boolean, default true) — shipped with Archvault
  - `organization_id` (FK, nullable) — custom technologies scoped to org (null = global)
  - `created_at`, `updated_at`
- [ ] Seed with ~100 popular technologies (languages, frameworks, cloud services, databases)
- [ ] Add optional `catalog_id` FK on workspace `technology` table → links workspace tech to catalog entry

### Server Functions

- [ ] Search catalog (full-text search on name + category filter)
- [ ] Get technology catalog entry details
- [ ] "Import from catalog" — create workspace technology from catalog entry (copies name, icon, description, URLs)
- [ ] Submit custom technology (org admins): org-scoped catalog entry
- [ ] Admin: manage org technologies (edit, delete custom entries)

### UI

- [ ] Enhanced technology picker:
  - Search-as-you-type against catalog
  - Shows icon, name, category for each result
  - "Add custom" option if not found in catalog
  - One-click import from catalog to workspace
- [ ] Technology detail popover (hover/click on tech badge):
  - Icon, name, category
  - Description
  - Link to documentation
- [ ] Organization technology management (admin settings):
  - Table of org-custom technologies
  - Add/edit/delete

### i18n

- [ ] Add `technology_catalog_*` keys to messages files

## Key Files

- `src/lib/schema/technology-catalog.ts` — catalog table
- `src/lib/technology-catalog.functions.ts` — catalog server functions
- Update `src/components/technologies/technology-picker.tsx` — add catalog search
- Update `src/components/technologies/technology-badge.tsx` — add detail popover

## Verification

- [ ] Catalog search returns relevant results with icons
- [ ] Technology picker shows catalog + workspace entries
- [ ] Custom technologies can be created (org-scoped)
- [ ] Import from catalog creates workspace technology
- [ ] Technology badges show icon and name
- [ ] Detail popover shows description and docs link
- [ ] `pnpm dev` and `pnpm build` succeed
