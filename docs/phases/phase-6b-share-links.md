# Phase 6b — Share Links

## Status: Not Started

## Goal

Create read-only interactive share links that let anyone browse diagrams, flows, and tag perspectives
without needing an account. Share links are context-aware — they preserve the viewer's position,
active flow, and tag state.

## Prerequisites

- Phase 5b (Multi-Level Diagram Navigation) — complete

## Data Model

**`share_links`** (share link definitions):

| Column                     | Type             | Notes                                |
|----------------------------|------------------|--------------------------------------|
| `id`                       | uuid, PK         |                                      |
| `workspace_id`             | FK → workspaces  |                                      |
| `token`                    | varchar(64)      | Unique, URL-safe random token        |
| `name`                     | text, nullable   | Label for the link                   |
| `diagram_id`               | FK → diagrams, nullable | Start on this diagram          |
| `flow_id`                  | FK → flows, nullable    | Start with this flow active    |
| `context_json`             | jsonb, nullable  | Viewport, pinned tags, etc.          |
| `password_hash`            | text, nullable   | Optional password protection         |
| `expires_at`               | timestamp, nullable | Optional expiration                |
| `is_active`                | boolean, true    | Enable/disable without deleting      |
| `view_count`               | integer, 0       | Track usage                          |
| `created_by`               | FK → users       |                                      |
| `created_at`, `updated_at` | timestamps       |                                      |

### Context JSON Structure

```json
{
  "viewport": { "x": 0, "y": 0, "zoom": 1.0 },
  "selectedObjectId": "uuid-or-null",
  "pinnedTags": ["tag-id-1", "tag-id-2"],
  "focusedTag": "tag-id-or-null",
  "flowStepIndex": 3
}
```

## Tasks

### Server Functions

- [ ] Create share link (workspace admin/editor only)
- [ ] List share links for workspace
- [ ] Update share link (name, context, password, expiration, active status)
- [ ] Delete share link
- [ ] Resolve share link by token (public endpoint, no auth required)
- [ ] Increment view count on access
- [ ] Validate password if set
- [ ] Check expiration

### Share Link Creation UI

- [ ] "Share" button in diagram editor toolbar
- [ ] Share dialog:
  - Link preview with copy button
  - "Capture current view" toggle — saves viewport, active flow, pinned tags
  - Optional: start diagram picker
  - Optional: start flow picker
  - Optional: password protection
  - Optional: expiration date
  - Link name for management
- [ ] Share links management page (workspace settings):
  - Table of all share links with: name, URL, view count, created by, expiration, status
  - Enable/disable toggle
  - Edit and delete actions

### Public Viewer Route

- [ ] New route: `/share/$token` (outside auth guard)
- [ ] Loads workspace data via share link server function (no auth required)
- [ ] Renders diagram canvas in full read-only mode:
  - No editing, no drag, no context menus
  - Pan and zoom work
  - Click to select objects (view properties in read-only panel)
  - Flow playback works (if flow is part of the shared workspace)
  - Tag perspectives work (pin, focus, hide)
  - Multi-level navigation works
- [ ] Applies saved context (viewport, flow, tags) from share link
- [ ] Password gate: if share link has password, show password input first
- [ ] Expired link: show "This link has expired" message

### i18n

- [ ] Add `share_*` keys to messages files

## Key Files

- `src/lib/schema/share-links.ts` — share_links table
- `src/lib/share-link.functions.ts` — server functions
- `src/routes/share/$token.tsx` — public viewer route
- `src/components/share/share-dialog.tsx` — share link creation
- `src/components/share/share-viewer.tsx` — read-only viewer wrapper
- `src/components/share/share-links-manager.tsx` — management table

## Design Notes

- **No account required.** Share links are completely public (unless password-protected). The
  viewer route is outside the auth guard. All workspace data needed for rendering is loaded
  server-side and sent to the client.
- **Security:** Share link tokens are 64-character random strings (cryptographically secure).
  The token is the only thing needed to access the link — there's no session or cookie involved.
  Optional password adds a second layer.
- **Context-aware:** The share link captures the exact state the sharer was in — their viewport
  position, which diagram they were on, which flow was playing, which tags were pinned. This
  means the recipient sees exactly what the sharer intended to show.

## Verification

- [ ] Create share link from diagram editor
- [ ] Share link URL is copyable
- [ ] Opening share link loads the diagram in read-only mode
- [ ] Saved context (viewport, flow, tags) is applied
- [ ] Navigation between diagrams works in shared view
- [ ] Flow playback works in shared view
- [ ] Tag perspectives work in shared view
- [ ] Password protection works
- [ ] Expired links show appropriate message
- [ ] View count increments
- [ ] Share links can be managed (enable/disable/delete)
- [ ] `pnpm dev` and `pnpm build` succeed
