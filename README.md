<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo/logo.svg" />
    <source media="(prefers-color-scheme: light)" srcset="public/logo/logo-dark.svg" />
    <img alt="ArchVault" src="public/logo/logo-dark.svg" width="48" height="48" />
  </picture>
</p>

<h1 align="center">ArchVault</h1>

<p align="center">
  Self-hosted visual C4 architecture platform
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/rubentalstra/ArchVault?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/TanStack_Start-React_19-blue?style=flat-square" alt="TanStack Start" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square" alt="TypeScript strict" />
  <img src="https://img.shields.io/badge/PostgreSQL-18-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/pnpm-10-F69220?style=flat-square" alt="pnpm" />
  <a href="https://github.com/rubentalstra/ArchVault/stargazers"><img src="https://img.shields.io/github/stars/rubentalstra/ArchVault?style=flat-square" alt="Stars" /></a>
  <a href="https://github.com/rubentalstra/ArchVault/issues"><img src="https://img.shields.io/github/issues/rubentalstra/ArchVault?style=flat-square" alt="Issues" /></a>
  <a href="https://github.com/rubentalstra/ArchVault/discussions"><img src="https://img.shields.io/github/discussions/rubentalstra/ArchVault?style=flat-square" alt="Discussions" /></a>
</p>

---

<p align="center">
  <img src="docs/src/assets/screenshots/12-editor-level2-container.png" alt="ArchVault — Visual C4 diagram editor" width="800" />
</p>

ArchVault is an open-source, self-hosted platform for modeling software architecture using
the [C4 model](https://c4model.com) (Levels 1-3). Users create systems, diagrams, and reusable architecture blocks
entirely through a visual UI — no code required.

## Features

- **C4 Modeling (L1-L3)** — Context, Container, and Component diagrams with full CRUD
- **Visual Editor** — Interactive canvas powered by React Flow with drag-and-drop, connections, and a properties panel
- **Organizations & Workspaces** — Multi-tenant structure with org-level management
- **Authentication** — Email/password, SSO, two-factor authentication, and SCIM provisioning via Better Auth
- **Role-Based Access Control** — Granular permissions at the organization level
- **Internationalization** — English and Dutch out of the box, powered by Paraglide JS (compile-time, type-safe)
- **Dark & Light Theme** — Automatic theme switching
- **Planned: Blocks Registry** — Save and share reusable architecture blocks with the community

<details> 
<summary><strong>More Screenshots</strong></summary>

<br />

| Dashboard                                          | Workspace                                                    |
|----------------------------------------------------|--------------------------------------------------------------|
| ![Dashboard](docs/src/assets/screenshots/01-dashboard.png) | ![Workspace](docs/src/assets/screenshots/04-workspace-dashboard.png) |

| Elements                                         | Connections                                            |
|--------------------------------------------------|--------------------------------------------------------|
| ![Elements](docs/src/assets/screenshots/06-elements.png) | ![Connections](docs/src/assets/screenshots/07-connections.png) |

| Diagrams                                         | Tags                                     |
|--------------------------------------------------|------------------------------------------|
| ![Diagrams](docs/src/assets/screenshots/05-diagrams.png) | ![Tags](docs/src/assets/screenshots/08-tags.png) |

| Technologies                                             | Workspace Settings                                         |
|----------------------------------------------------------|------------------------------------------------------------|
| ![Technologies](docs/src/assets/screenshots/09-technologies.png) | ![Settings](docs/src/assets/screenshots/10-workspace-settings.png) |

| Members                                        | Teams                                      |
|------------------------------------------------|--------------------------------------------|
| ![Members](docs/src/assets/screenshots/02-members.png) | ![Teams](docs/src/assets/screenshots/03-teams.png) |

**Diagram Editor**

| Level 1 — System Context                                       | Level 2 — Container                                       | Level 3 — Component                                       |
|----------------------------------------------------------------|-----------------------------------------------------------|-----------------------------------------------------------|
| ![L1](docs/src/assets/screenshots/11-editor-level1-system-context.png) | ![L2](docs/src/assets/screenshots/12-editor-level2-container.png) | ![L3](docs/src/assets/screenshots/13-editor-level3-component.png) |

> [!NOTE]
> ArchVault is under active development. Features like autosave, keyboard shortcuts, versioning, and a community blocks
> registry are coming soon. See the [Roadmap](#roadmap) for details.

</details>

## Quick Start (Docker Compose)

```bash
git clone https://github.com/rubentalstra/ArchVault.git
cd ArchVault
cp .env.example .env    # Edit with your secrets
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000).

## Manual Setup

**Prerequisites:** Node.js 24+, pnpm 10+, PostgreSQL 18+

```bash
git clone https://github.com/rubentalstra/ArchVault.git
cd ArchVault
pnpm install
cp .env.example .env    # Configure DATABASE_URL, BETTER_AUTH_SECRET, etc.
pnpm db:migrate
pnpm dev
```

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Framework  | TanStack Start (React 19 + Nitro)             |
| Router     | TanStack Router (file-based, type-safe)       |
| Data       | TanStack Query, TanStack Form, TanStack Table |
| State      | Zustand                                       |
| Styling    | Tailwind CSS v4                               |
| Components | shadcn/ui (base-nova)                         |
| Auth       | Better Auth (admin, org, SSO, SCIM, 2FA)      |
| Database   | PostgreSQL 18 + Drizzle ORM                   |
| Diagrams   | React Flow                                    |
| i18n       | Paraglide JS v2                               |
| Build      | Vite 8, TypeScript (strict)                   |

## Roadmap

See **[ROADMAP.md](ROADMAP.md)** for the full list of planned features and current progress.

**Completed:** Project scaffold, auth, organizations, workspaces, model objects, connections, tags, diagrams, canvas
editor, autosave, keyboard shortcuts, i18n, Docker setup.

**In progress:** Autosave & keyboard shortcuts UI/UX polish, undo/redo.

**Up next:** Node focus & animation, versions & timeline.

**Future ideas:** Flows & navigation, tech catalog, import/export, blocks registry, community platform.

## Internationalization

ArchVault ships with English (default) and Dutch. Translations are compile-time type-safe
via [Paraglide JS](https://inlang.com/m/gerre34r/paraglide-js). All locales use a URL prefix (`/en/...`, `/nl/...`).

Adding a new locale:

1. Add the locale to `project.inlang/settings.json`
2. Add a URL pattern in `vite.config.ts`
3. Create `messages/{locale}.json`

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

## Community

- [GitHub Discussions](https://github.com/rubentalstra/ArchVault/discussions) — Questions, ideas, and general chat
- [Issue Tracker](https://github.com/rubentalstra/ArchVault/issues) — Bug reports and feature requests

## Security

To report a vulnerability, please
use [GitHub Security Advisories](https://github.com/rubentalstra/ArchVault/security/advisories/new) instead of public
issues. See [SECURITY.md](SECURITY.md) for details.

## License

ArchVault is licensed under the [GNU General Public License v3.0](LICENSE).
