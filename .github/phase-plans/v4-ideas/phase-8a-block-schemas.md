# Phase 8a — Block Schemas & Validation

## Status: Not Started

## Goal

Define the block format — a portable package of model objects, connections, diagrams, and flows
that can be installed into any workspace. Blocks are Archvault's original feature for sharing
reusable architecture patterns.

A block is a JSON manifest that describes a set of C4 elements, their connections, diagram
layouts, and optionally flows. Think of it as an architecture template: "here's how to set up
a microservice with an API gateway, message queue, and database."

## Prerequisites

- Phase 7a (Import & Export) — complete

## Data Model

**`blocks`** (block definitions):

| Column                     | Type                | Notes                                |
|----------------------------|---------------------|--------------------------------------|
| `id`                       | uuid, PK            |                                      |
| `organization_id`          | FK → organizations, nullable | null = published to registry |
| `name`                     | text                |                                      |
| `slug`                     | text, unique        | URL-safe identifier                  |
| `version`                  | text                | Semver, e.g. "1.0.0"                 |
| `description`              | text                |                                      |
| `readme`                   | text, nullable      | Markdown documentation               |
| `manifest_json`            | jsonb               | Block content (see schema below)     |
| `category`                 | enum                | Pattern type (see categories)        |
| `icon_url`                 | text, nullable      |                                      |
| `tags`                     | text[], nullable    | Searchable tags                      |
| `is_official`              | boolean, false      | Curated by Archvault team            |
| `is_public`                | boolean, false      | Visible in community registry        |
| `download_count`           | integer, 0          |                                      |
| `created_by`               | FK → users          |                                      |
| `deleted_at`, `created_at`, `updated_at` | timestamps |                          |

**`block_installations`** (installed blocks in workspaces):

| Column                     | Type             | Notes                                |
|----------------------------|------------------|--------------------------------------|
| `id`                       | uuid, PK         |                                      |
| `workspace_id`             | FK → workspaces  |                                      |
| `block_id`                 | FK → blocks       |                                      |
| `installed_version`        | text             | Version at install time              |
| `config_json`              | jsonb, nullable  | Customization applied during install |
| `installed_by`             | FK → users       |                                      |
| `created_at`               | timestamp        |                                      |

### Block Manifest Schema

```json
{
  "$schema": "https://archvault.io/schemas/block-manifest.json",
  "name": "Microservice with API Gateway",
  "version": "1.0.0",
  "elements": [
    {
      "ref": "api-gateway",
      "type": "app",
      "name": "API Gateway",
      "display_description": "Routes requests to services",
      "technologies": ["Kong", "NGINX"],
      "external": false
    },
    {
      "ref": "service",
      "type": "app",
      "name": "{{serviceName}}",
      "display_description": "Core business logic",
      "technologies": ["Node.js", "TypeScript"],
      "parent_ref": "system"
    }
  ],
  "connections": [
    {
      "source_ref": "api-gateway",
      "target_ref": "service",
      "description": "Routes API calls",
      "technology": "REST/HTTPS",
      "direction": "outgoing"
    }
  ],
  "diagrams": [
    {
      "name": "Service Architecture",
      "type": "app",
      "scope_ref": "system",
      "placements": [
        { "element_ref": "api-gateway", "x": 100, "y": 200 },
        { "element_ref": "service", "x": 400, "y": 200 }
      ]
    }
  ],
  "variables": {
    "serviceName": {
      "label": "Service Name",
      "type": "string",
      "default": "My Service"
    }
  }
}
```

### Block Categories

- `microservice` — Microservice patterns
- `event_driven` — Event-driven architectures
- `data_pipeline` — Data processing pipelines
- `api` — API patterns (gateway, BFF, GraphQL)
- `auth` — Authentication/authorization patterns
- `infrastructure` — Cloud infrastructure patterns
- `frontend` — Frontend architecture patterns
- `other` — Uncategorized

## Tasks

### Schema & Validation

- [ ] Define JSON Schema for block manifests
- [ ] Zod validator for block manifests
- [ ] Variable interpolation engine (`{{varName}}` → user-provided values)
- [ ] Reference resolution: `ref` strings map to actual UUIDs during installation
- [ ] Validate element hierarchy rules within manifests
- [ ] Validate connection references (source_ref and target_ref exist)

### Database

- [ ] Drizzle schema for `blocks` table
- [ ] Drizzle schema for `block_installations` table
- [ ] Drizzle enum for `block_category`
- [ ] Run migration

### Server Functions

- [ ] Create block (from manifest JSON)
- [ ] Validate block manifest (returns errors/warnings)
- [ ] Install block into workspace:
  - Resolve variables (prompt user for values)
  - Create elements from manifest
  - Create connections from manifest
  - Create diagrams with placements
  - Record installation in `block_installations`
  - Set `source_block_installation_id` on created elements/connections
- [ ] Uninstall block (remove all entities with matching `source_block_installation_id`)
- [ ] Check for block updates (compare installed_version with latest)

### i18n

- [ ] Add `block_*` keys to messages files

## Key Files

- `apps/web/src/lib/schema/blocks.ts` — blocks and block_installations tables
- `apps/web/src/lib/block-manifest.schema.ts` — JSON Schema + Zod validator
- `apps/web/src/lib/block.functions.ts` — server functions
- `apps/web/src/lib/block-installer.ts` — installation engine

## Design Notes

- **Variables enable customization.** Block manifests can contain `{{variable}}` placeholders.
  During installation, the user is prompted to fill in values. This lets a single block template
  serve many use cases (e.g., `{{serviceName}}` = "Payment Service").
- **Refs, not UUIDs.** Within a manifest, elements reference each other by `ref` strings (short,
  human-readable). During installation, these are resolved to actual UUIDs. This keeps manifests
  portable.
- **source_block_installation_id** on elements and connections tracks which block created them.
  This enables clean uninstallation — remove everything from a specific block install.

## Verification

- [ ] Block manifest validates correctly against schema
- [ ] Invalid manifests produce clear error messages
- [ ] Variables are correctly interpolated during install
- [ ] Block installation creates all expected elements, connections, diagrams
- [ ] Uninstallation removes all block-created entities
- [ ] `pnpm dev` and `pnpm build` succeed
