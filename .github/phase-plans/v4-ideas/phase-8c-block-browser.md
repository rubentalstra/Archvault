# Phase 8c — Block Browser & Install

## Status: Not Started

## Goal

Build the UI for browsing, searching, previewing, and installing blocks into workspaces. This
is the user-facing experience for discovering and using architecture patterns.

## Prerequisites

- Phase 8a (Block Schemas & Validation) — complete

## Tasks

### Block Browser Page

- [ ] Route: `workspace/$workspaceSlug/blocks`
- [ ] Grid/list view of available blocks (official + community)
- [ ] Filter by category, tags, official/community
- [ ] Search by name, description, tags
- [ ] Sort by: popular (downloads), newest, name
- [ ] Each block card shows: icon, name, category badge, short description, download count, author

### Block Detail Page

- [ ] Route: `workspace/$workspaceSlug/blocks/$blockSlug`
- [ ] Full readme rendered as Markdown
- [ ] Manifest preview (elements, connections, diagrams)
- [ ] Visual preview: render the block's diagram(s) in a read-only mini canvas
- [ ] Version info and changelog
- [ ] "Install" button
- [ ] "View source" (show raw manifest JSON)

### Installation Flow

- [ ] Install dialog:
  - Variable configuration form (generated from manifest variables)
  - Target system selector (which System to install into, or create new)
  - Preview of what will be created
  - "Install" confirmation button
- [ ] Progress indicator during installation
- [ ] Success state: link to the created diagram
- [ ] Error handling: show what failed and why

### Installed Blocks Management

- [ ] "Installed" tab in block browser showing blocks in this workspace
- [ ] Each installed block shows: name, version, installed by, date
- [ ] Actions: uninstall (with confirmation), check for updates
- [ ] Update flow: show diff of what changed, confirm update

### i18n

- [ ] Add block browser keys to messages files

## Key Files

- `src/routes/_protected/_onboarded/workspace/$workspaceSlug/blocks.tsx`
- `src/routes/_protected/_onboarded/workspace/$workspaceSlug/blocks/$blockSlug.tsx`
- `src/components/blocks/block-browser.tsx`
- `src/components/blocks/block-card.tsx`
- `src/components/blocks/block-detail.tsx`
- `src/components/blocks/install-dialog.tsx`
- `src/components/blocks/installed-blocks.tsx`

## Verification

- [ ] Block browser shows official and community blocks
- [ ] Search and filters work
- [ ] Block detail page shows full readme and preview
- [ ] Installation flow works with variable configuration
- [ ] Installed blocks list shows correctly
- [ ] Uninstall removes all block-created entities
- [ ] `pnpm dev` and `pnpm build` succeed
