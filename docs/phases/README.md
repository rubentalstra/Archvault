# Archvault — Phase Tracker

## Progress Overview

| Phase | Title                        | Status      | Dependencies | 
|-------|------------------------------|-------------|--------------|
| 1a    | Project Scaffold             | Complete    | —            |
| 1b    | Database & Docker            | Complete    | 1a           |
| 1c    | Authentication               | Complete    | 1b           |
| 1d    | Platform Admin               | Complete    | 1c           |
| 1e    | Organizations & Teams        | Complete    | 1c           |
| 1f    | Workspaces                   | Complete    | 1e           |
| 1g    | ESLint                       | Complete    | 1a           |
| 1h    | Internationalization (i18n)  | Complete    | 1a, 1c       |
| 1i    | SSO (Single Sign-On)         | Complete    | 1c           |
| 1j    | SCIM Provisioning            | Complete    | 1i           |
| 2a    | Elements                     | Complete    | 1f           |
| 2b    | Relationships                | Complete    | 2a           |
| 2c    | Tags                         | Not Started | 2b           |
| 3a    | Diagram CRUD & Schema        | Not Started | 2a, 2b       |
| 3b    | Canvas Rendering             | Not Started | 3a           |
| 3c    | Editor Interactions & Panel  | Not Started | 3b           |
| 3d    | Canvas Relationships         | Not Started | 3b, 3c       |
| 3e    | Autosave, Hotkeys, Undo/Redo | Not Started | 3c, 3d       |
| 3f    | Revisions                    | Not Started | 3e           |
| 4a    | Block Schemas & Validation   | Not Started | 3f           |
| 4b    | Official Blocks              | Not Started | 4a           |
| 4c    | Block Browser & Install      | Not Started | 4a           |
| 5a    | Community Registry           | Not Started | 4c           |
| 5b    | Save as Block                | Not Started | 4c           |
| 5c    | Export                       | Not Started | 4c           |
| 6a    | Activity Log & Search        | Not Started | 5a, 5b, 5c   |
| 6b    | Soft Delete & Trash          | Not Started | 5a, 5b, 5c   |
| 6c    | Docker Deployment            | Not Started | 5a, 5b, 5c   |
| 6d    | Testing & Docs               | Not Started | 5a, 5b, 5c   |

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
    1f --> 2a["2a: Elements"]
    2a --> 2b["2b: Relationships"]
    2b --> 2c["2c: Tags"]
    2a --> 3a["3a: Diagram CRUD"]
    2b --> 3a
    3a --> 3b["3b: Canvas Rendering"]
    3b --> 3c["3c: Editor Interactions & Panel"]
    3b --> 3d["3d: Canvas Relationships"]
    3c --> 3d
    3c --> 3e["3e: Autosave & Hotkeys"]
    3d --> 3e
    3e --> 3f["3f: Revisions"]
    3f --> 4a["4a: Block Schemas"]
    4a --> 4b["4b: Official Blocks"]
    4a --> 4c["4c: Block Browser & Install"]
    4c --> 5a["5a: Community Registry"]
    4c --> 5b["5b: Save as Block"]
    4c --> 5c["5c: Export"]
    5a --> 6a["6a: Activity & Search"]
    5b --> 6a
    5c --> 6a
    5a --> 6b["6b: Soft Delete & Trash"]
    5b --> 6b
    5c --> 6b
    5a --> 6c["6c: Docker Deployment"]
    5b --> 6c
    5c --> 6c
    5a --> 6d["6d: Testing & Docs"]
    5b --> 6d
    5c --> 6d
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
    style 3a fill: #fef9c3, stroke: #ca8a04
    style 3b fill: #fef9c3, stroke: #ca8a04
    style 3c fill: #fef9c3, stroke: #ca8a04
    style 3d fill: #fef9c3, stroke: #ca8a04
    style 3e fill: #fef9c3, stroke: #ca8a04
    style 3f fill: #fef9c3, stroke: #ca8a04
    style 4a fill: #ffe4e6, stroke: #e11d48
    style 4b fill: #ffe4e6, stroke: #e11d48
    style 4c fill: #ffe4e6, stroke: #e11d48
    style 5a fill: #f3e8ff, stroke: #9333ea
    style 5b fill: #f3e8ff, stroke: #9333ea
    style 5c fill: #f3e8ff, stroke: #9333ea
    style 6a fill: #e0f2fe, stroke: #0284c7
    style 6b fill: #e0f2fe, stroke: #0284c7
    style 6c fill: #e0f2fe, stroke: #0284c7
    style 6d fill: #e0f2fe, stroke: #0284c7
```

**Legend:** Phase 1 (indigo) | Phase 2 (green) | Phase 3 (yellow) | Phase 4 (rose) | Phase 5 (purple) | Phase 6 (sky)

## Verification Protocol

After each sub-phase:

1. `pnpm dev` — app starts without errors
2. `pnpm build` — production build succeeds
3. Run phase-specific tests
4. Manual end-to-end verification
5. Update status in this table
