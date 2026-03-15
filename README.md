<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo/logo.svg" />
    <source media="(prefers-color-scheme: light)" srcset="public/logo/logo-dark.svg" />
    <img alt="Archvault" src="public/logo/logo-dark.svg" width="48" height="48" />
  </picture>
</p>

<h1 align="center">Archvault</h1>

<p align="center">
  Self-hosted visual C4 architecture platform
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/rubentalstra/Archvault?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/TanStack_Start-React_19-blue?style=flat-square" alt="TanStack Start" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square" alt="TypeScript strict" />
  <img src="https://img.shields.io/badge/PostgreSQL-18-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/pnpm-10-F69220?style=flat-square" alt="pnpm" />
  <a href="https://github.com/rubentalstra/Archvault/stargazers"><img src="https://img.shields.io/github/stars/rubentalstra/Archvault?style=flat-square" alt="Stars" /></a>
  <a href="https://github.com/rubentalstra/Archvault/issues"><img src="https://img.shields.io/github/issues/rubentalstra/Archvault?style=flat-square" alt="Issues" /></a>
  <a href="https://github.com/rubentalstra/Archvault/discussions"><img src="https://img.shields.io/github/discussions/rubentalstra/Archvault?style=flat-square" alt="Discussions" /></a>
</p>

---

<!-- TODO: Add screenshot -->

Archvault is an open-source, self-hosted platform for modeling software architecture using
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

## Quick Start (Docker Compose)

```bash
git clone https://github.com/rubentalstra/Archvault.git
cd Archvault
cp .env.example .env    # Edit with your secrets
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000).

## Manual Setup

**Prerequisites:** Node.js 24+, pnpm 10+, PostgreSQL 16+

```bash
git clone https://github.com/rubentalstra/Archvault.git
cd Archvault
pnpm install
cp .env.example .env    # Configure DATABASE_URL, AUTH_SECRET, etc.
pnpm drizzle-kit migrate
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

Archvault is built in phases. See the full phase tracker and dependency graph in [
`docs/phases/README.md`](docs/phases/README.md).

**Completed:** Project scaffold, auth, organizations, workspaces, model objects, connections, tags, diagrams, canvas
editor, i18n, Docker setup.

**Next up:** Autosave & hotkeys (3f), node focus & animation (3g), versions & timeline (6a).

**Future ideas:** Flows & navigation, tech catalog, import/export, blocks registry, community platform.

## Internationalization

Archvault ships with English (default) and Dutch. Translations are compile-time type-safe
via [Paraglide JS](https://inlang.com/m/gerre34r/paraglide-js). All locales use a URL prefix (`/en/...`, `/nl/...`).

Adding a new locale:

1. Add the locale to `project.inlang/settings.json`
2. Add a URL pattern in `vite.config.ts`
3. Create `messages/{locale}.json`

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

## Community

- [GitHub Discussions](https://github.com/rubentalstra/Archvault/discussions) — Questions, ideas, and general chat
- [Issue Tracker](https://github.com/rubentalstra/Archvault/issues) — Bug reports and feature requests

## Security

To report a vulnerability, please
use [GitHub Security Advisories](https://github.com/rubentalstra/Archvault/security/advisories/new) instead of public
issues. See [SECURITY.md](SECURITY.md) for details.

## License

Archvault is licensed under the [GNU General Public License v3.0](LICENSE).
