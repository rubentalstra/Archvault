# Archvault — Phase Tracker

Archvault is an open-source visual C4 architecture platform inspired by [IcePanel](https://icepanel.io).
It supports C4 Levels 1–3 (Context, Container/App, Component). Level 4 (Code) is out of scope —
instead, model objects link to source code directly.

## Naming Convention

Archvault uses the same terminology as IcePanel:

| Term         | Description                                                           |
|--------------|-----------------------------------------------------------------------|
| Organization | Top-level billing/team container                                      |
| Workspace    | Contains all model objects, diagrams, flows (= Landscape in IcePanel) |
| Actor        | External user or system actor (C4 "Person")                           |
| System       | Software system (internal or external)                                |
| App          | Deployed/runnable unit within a system (C4 "Container")               |
| Store        | Data store within a system                                            |
| Component    | Building block within an app                                          |
| Group        | Visual overlay around objects in diagrams                             |
| Connection   | Directed link between model objects                                   |
| Tag Group    | Category container for related tags                                   |
| Tag          | Flexible property applied to objects                                  |
| Flow         | Step-by-step sequence across connections                              |
| Version      | Snapshot of workspace state at a point in time                        |

## Progress Overview

| Phase | Title                          | Status      | Dependencies |
|-------|--------------------------------|-------------|--------------|
| 1a    | Project Scaffold               | Complete    | —            |
| 1b    | Database & Docker              | Complete    | 1a           |
| 1c    | Authentication                 | Complete    | 1b           |
| 1d    | Platform Admin                 | Complete    | 1c           |
| 1e    | Organizations & Teams          | Complete    | 1c           |
| 1f    | Workspaces                     | Complete    | 1e           |
| 1g    | ESLint                         | Complete    | 1a           |
| 1h    | Internationalization (i18n)    | Complete    | 1a, 1c       |
| 1i    | SSO (Single Sign-On)           | Complete    | 1c           |
| 1j    | SCIM Provisioning              | Complete    | 1i           |
| 2a    | Model Objects (Elements)       | Complete    | 1f           |
| 2b    | Connections (Relationships)    | Complete    | 2a           |
| 2c    | Tags                           | Complete    | 2b           |
| 2d    | Naming Migration & Store Type  | Not Started | 2a, 2b, 2c   |
| 2e    | Groups                         | Complete    | 2d           |
| 2f    | Technology Rewrite             | Complete    | 2a, 2b       |
| 3a    | Diagram CRUD & Schema          | Complete    | 2a, 2b       |
| 3b    | Canvas Rendering (React Flow)  | Complete    | 3a           |
| 3c    | Editor Interactions & Panel    | Complete    | 3b           |
| 3d    | Canvas Edges & Connections     | Complete    | 3c, 2d       |
| 3e    | Groups on Canvas               | Not Started | 3d, 2e       |
| 3f    | Autosave, Hotkeys & Undo/Redo  | Not Started | 3d           |
| 4a    | Flow Schema & CRUD             | Not Started | 3d           |
| 4b    | Flow Steps & Playback          | Not Started | 4a           |
| 4c    | Flow Export                    | Not Started | 4b           |
| 5a    | Tag Groups & Perspectives      | Not Started | 3d, 2c       |
| 5b    | Multi-Level Diagram Navigation | Not Started | 3d           |
| 5c    | Dependencies View              | Not Started | 3d           |
| 5d    | Global Search                  | Not Started | 4a, 5a       |
| 6a    | Versions & Timeline            | Not Started | 3f           |
| 6b    | Share Links                    | Not Started | 5b           |
| 7a    | Import & Export                | Not Started | 6a           |
| 7b    | Technology Catalog             | Not Started | 2f           |
| 7c    | Activity Log & Audit           | Not Started | 6a           |
| 7d    | Trash UI & Permanent Delete    | Not Started | 2d           |
| 7e    | Docker Self-Hosting            | Not Started | 7a           |
| 7f    | E2E Testing & CI               | Not Started | 7a           |
| 7g    | Documentation Site             | Not Started | 7a           |
| 8a    | Block Schemas & Validation     | Not Started | 7a           |
| 8b    | Official Blocks Library        | Not Started | 8a           |
| 8c    | Block Browser & Install        | Not Started | 8a           |
| 8d    | Save as Block                  | Not Started | 8c           |
| 8e    | Community Registry             | Not Started | 8c           |

## Dependency Graph

```mermaid
graph TD
    1a["1a: Scaffold"] --> 1b["1b: Database & Docker"]
    1b --> 1c["1c: Authentication"]
    1c --> 1d["1d: Platform Admin"]
    1c --> 1e["1e: Organizations & Teams"]
    1e --> 1f["1f: Workspaces"]
    1a --> 1g["1g: ESLint"]
    1a --> 1h["1h: i18n"]
    1c --> 1h
    1c --> 1i["1i: SSO"]
    1i --> 1j["1j: SCIM"]
    1f --> 2a["2a: Model Objects"]
    2a --> 2b["2b: Connections"]
    2b --> 2c["2c: Tags"]
    2a --> 2d["2d: Naming & Store"]
    2b --> 2d
    2c --> 2d
    2d --> 2e["2e: Groups"]
    2a --> 2f["2f: Tech Rewrite"]
    2b --> 2f
    2a --> 3a["3a: Diagram CRUD"]
    2b --> 3a
    3a --> 3b["3b: Canvas"]
    3b --> 3c["3c: Editor & Panel"]
    3c --> 3d["3d: Canvas Edges"]
    2d --> 3d
    3d --> 3e["3e: Groups on Canvas"]
    2e --> 3e
    2f["2f: Tech Rewrite"] --> 7b
    3d --> 3f["3f: Autosave & Hotkeys"]
    3d --> 4a["4a: Flow Schema"]
    4a --> 4b["4b: Flow Steps"]
    4b --> 4c["4c: Flow Export"]
    3d --> 5a["5a: Tag Perspectives"]
    2c --> 5a
    3d --> 5b["5b: Diagram Navigation"]
    3d --> 5c["5c: Dependencies View"]
    4a --> 5d["5d: Global Search"]
    5a --> 5d
    3f --> 6a["6a: Versions"]
    5b --> 6b["6b: Share Links"]
    6a --> 7a["7a: Import & Export"]
    2f --> 7b["7b: Tech Catalog"]
    6a --> 7c["7c: Activity Log"]
    2e --> 7d["7d: Trash UI"]
    7a --> 7e["7e: Docker Deploy"]
    7a --> 7f["7f: E2E Tests"]
    7a --> 7g["7g: Docs Site"]
    7a --> 8a["8a: Block Schemas"]
    8a --> 8b["8b: Official Blocks"]
    8a --> 8c["8c: Block Browser"]
    8c --> 8d["8d: Save as Block"]
    8c --> 8e["8e: Community Registry"]
    style 1a fill: #e0e7ff, stroke: #4f46e5
    style 1b fill: #e0e7ff, stroke: #4f46e5
    style 1c fill: #e0e7ff, stroke: #4f46e5
    style 1d fill: #e0e7ff, stroke: #4f46e5
    style 1e fill: #e0e7ff, stroke: #4f46e5
    style 1f fill: #e0e7ff, stroke: #4f46e5
    style 1g fill: #e0e7ff, stroke: #4f46e5
    style 1h fill: #e0e7ff, stroke: #4f46e5
    style 1i fill: #e0e7ff, stroke: #4f46e5
    style 1j fill: #e0e7ff, stroke: #4f46e5
    style 2a fill: #dcfce7, stroke: #16a34a
    style 2b fill: #dcfce7, stroke: #16a34a
    style 2c fill: #dcfce7, stroke: #16a34a
    style 2d fill: #fef9c3, stroke: #ca8a04
    style 2e fill: #dcfce7, stroke: #16a34a
    style 2f fill: #dcfce7, stroke: #16a34a
    style 3a fill: #dcfce7, stroke: #16a34a
    style 3b fill: #dcfce7, stroke: #16a34a
    style 3c fill: #dcfce7, stroke: #16a34a
    style 3d fill: #dcfce7, stroke: #16a34a
    style 3e fill: #fef9c3, stroke: #ca8a04
    style 3f fill: #fef9c3, stroke: #ca8a04
    style 4a fill: #ffe4e6, stroke: #e11d48
    style 4b fill: #ffe4e6, stroke: #e11d48
    style 4c fill: #ffe4e6, stroke: #e11d48
    style 5a fill: #f3e8ff, stroke: #9333ea
    style 5b fill: #f3e8ff, stroke: #9333ea
    style 5c fill: #f3e8ff, stroke: #9333ea
    style 5d fill: #f3e8ff, stroke: #9333ea
    style 6a fill: #e0f2fe, stroke: #0284c7
    style 6b fill: #e0f2fe, stroke: #0284c7
    style 7a fill: #fef3c7, stroke: #d97706
    style 7b fill: #fef3c7, stroke: #d97706
    style 7c fill: #fef3c7, stroke: #d97706
    style 7d fill: #fef3c7, stroke: #d97706
    style 7e fill: #fef3c7, stroke: #d97706
    style 7f fill: #fef3c7, stroke: #d97706
    style 7g fill: #fef3c7, stroke: #d97706
    style 8a fill: #ccfbf1, stroke: #0d9488
    style 8b fill: #ccfbf1, stroke: #0d9488
    style 8c fill: #ccfbf1, stroke: #0d9488
    style 8d fill: #ccfbf1, stroke: #0d9488
    style 8e fill: #ccfbf1, stroke: #0d9488
```

**Legend:** Phase 1 (indigo, complete) | Phase 2 (green, mostly complete) | Phase 2d-3f (yellow, in progress / next) |
Phase 4 (rose, flows) | Phase 5 (purple, perspectives & navigation) | Phase 6 (sky, versioning & sharing) | Phase 7 (
amber, platform polish)

## Feature Priority Summary

### Core Loop (Phases 2–3): Model → Diagram → Edit

Build the C4 model, place objects on diagrams, render edges, support groups.

### Visual Storytelling (Phases 4–5): Flows → Perspectives → Navigation

Flows let users walk through use cases step by step. Tag perspectives let different audiences focus on what matters.
Multi-level navigation and dependencies view complete the exploration story.

### Collaboration & History (Phase 6): Versions → Share

Version snapshots track architecture evolution. Share links let anyone explore read-only.

### Platform Polish (Phase 7): Import/Export → Catalog → Deploy → Docs

Round out the platform with data portability, tech catalog, self-hosting, testing, and docs.

### Blocks & Community (Phase 8): Schemas → Library → Registry

Archvault-original feature. Package architecture patterns as reusable blocks. Official blocks provide starter templates.
Community registry lets users publish and install shared blocks.

## Cross-Cutting Concerns

These are NOT separate phases — they are built into every phase:

- **Soft delete:** All entity tables have `deleted_at`. All queries filter `WHERE deleted_at IS NULL`. Implemented from
  phase 2 onwards. Phase 7d adds the trash UI and cleanup.
- **Unit/integration tests:** Written alongside each phase (not deferred to 7f). Phase 7f adds E2E tests.
- **Internationalization:** All user-facing strings use Paraglide `m.key()`. Added in each phase.
- **Permission checks:** All server functions check org role-based permissions. Added in each phase.

## Verification Protocol

After each sub-phase:

1. `pnpm dev` — app starts without errors
2. `pnpm build` — production build succeeds
3. `pnpm test` — all tests pass (including new phase tests)
4. Manual end-to-end verification
5. Update status in this table
