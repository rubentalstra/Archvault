# Phase 7b — Technology Catalog

## Status: Not Started

## Goal

Build a centralized technology catalog that provides a searchable library of technologies
(languages, frameworks, cloud services, databases, etc.) with icons, descriptions, and
documentation links. Technologies assigned to model objects reference this catalog.

## Prerequisites

- Phase 2e (Groups) — complete

## Tasks

### Database

- [ ] `technology_catalog` table:
  - `id` (uuid, PK)
  - `name` (text, unique) — e.g. "TypeScript", "PostgreSQL", "AWS Lambda"
  - `category` (enum: language, framework, database, cloud_service, gateway, library, tool, other)
  - `icon_url` (text, nullable) — URL to technology icon/logo
  - `icon_slug` (text, nullable) — local icon identifier
  - `description` (text, nullable) — brief description
  - `documentation_url` (text, nullable) — link to official docs
  - `is_builtin` (boolean, default false) — shipped with Archvault
  - `organization_id` (FK, nullable) — custom technologies scoped to org
  - `created_at`, `updated_at`
- [ ] Seed with ~100 popular technologies (languages, frameworks, cloud services, databases)
- [ ] Update `element_technologies` to optionally FK to `technology_catalog`

### Server Functions

- [ ] Search catalog (full-text search on name + category filter)
- [ ] Get technology details
- [ ] Submit custom technology (org admins):
  - Name, category, icon URL, description, docs URL
  - Custom technologies are org-scoped (not public)
- [ ] Admin: manage org technologies (edit, delete)

### UI

- [ ] Technology picker (enhanced version of current technology input):
  - Search-as-you-type against catalog
  - Shows icon, name, category for each result
  - "Add custom" option if not found
  - Multiple selection (add multiple techs at once)
- [ ] Technology detail popover (hover/click on tech badge):
  - Icon, name, category
  - Description
  - Link to documentation
- [ ] Organization technology management (admin settings):
  - Table of custom technologies
  - Add/edit/delete

### i18n

- [ ] Add `technology_*` keys to messages files

## Key Files

- `src/lib/schema/technology-catalog.ts` — catalog table
- `src/lib/technology-catalog.functions.ts` — server functions
- `src/components/technologies/technology-picker.tsx` — enhanced picker
- `src/components/technologies/technology-badge.tsx` — badge with popover

## Verification

- [ ] Catalog search returns relevant results
- [ ] Technology picker shows catalog entries with icons
- [ ] Custom technologies can be created (org-scoped)
- [ ] Technology badges show icon and name
- [ ] Detail popover shows description and docs link
- [ ] `pnpm dev` and `pnpm build` succeed
