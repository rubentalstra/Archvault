# ArchVault — Phase Tracker

ArchVault is an open-source visual C4 architecture platform inspired by [IcePanel](https://icepanel.io).
It supports C4 Levels 1-3 (Context, Container/App, Component). Level 4 (Code) is out of scope —
instead, model objects link to source code directly.

## What's Built (Phases 1-3d)

All foundational phases are complete:

- **Phase 1 (a-j):** Project scaffold, database, auth (Better Auth with admin/org/SSO/SCIM plugins), workspaces, ESLint,
  i18n (Paraglide)
- **Phase 2 (a-d, f):** Model objects (Actor, System, App, Store, Component), connections, tags, naming conventions,
  technology system
- **Phase 3 (a-d):** Diagram CRUD & schema, React Flow canvas rendering, editor interactions & properties panel, canvas
  edges & connections

Groups (2e, 3e) were dropped from the design.

## Active Phases

| Phase | Title                         | Status      | Doc                                                                  |
|-------|-------------------------------|-------------|----------------------------------------------------------------------|
| 3f    | Autosave, Hotkeys & Undo/Redo | Not Started | [phase-3f-autosave-hotkeys.md](phase-3f-autosave-hotkeys.md)         |
| 3g    | Node Focus & Flow Animation   | Not Started | [phase-3g-focus-flow-animation.md](phase-3g-focus-flow-animation.md) |
| 6a    | Versions & Timeline           | Not Started | [phase-6a-versions.md](phase-6a-versions.md)                         |

### Dependencies

```
3d (complete) → 3f → 6a
3d (complete) → 3g
```

Phase 3f and 3g can be built in parallel (both depend only on 3d). Phase 6a depends on 3f.

## Future Ideas (Archived)

Ideas for future versions are archived but not scheduled:

| Archive                | Scope              | Phases                                                                                                                |
|------------------------|--------------------|-----------------------------------------------------------------------------------------------------------------------|
| [v2-ideas/](v2-ideas/) | Flows & navigation | 4a-4c (flow schema, playback, export), 5a-5d (tag perspectives, diagram navigation, dependencies view, global search) |
| [v3-ideas/](v3-ideas/) | Platform polish    | 7a-7g (import/export, tech catalog, activity log, trash UI, Docker deploy, E2E testing, docs site)                    |
| [v4-ideas/](v4-ideas/) | Blocks & community | 8a-8e (block schemas, official blocks, block browser, save as block, community registry)                              |

## Cross-Cutting Concerns

These are NOT separate phases — they are built into every phase:

- **Soft delete:** All entity tables have `deleted_at`. All queries filter `WHERE deleted_at IS NULL`.
- **Unit/integration tests:** Written alongside each phase.
- **Internationalization:** All user-facing strings use Paraglide `m.key()`.
- **Permission checks:** All server functions check org role-based permissions.

## Verification Protocol

After each sub-phase:

1. `pnpm dev` — app starts without errors
2. `pnpm build` — production build succeeds
3. `pnpm test` — all tests pass (including new phase tests)
4. Manual end-to-end verification
5. Update status in this table
