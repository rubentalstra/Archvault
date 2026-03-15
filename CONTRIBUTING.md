# Contributing to ArchVault

Thank you for your interest in contributing! This guide will help you get started.

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Setup

### Prerequisites

- Node.js 24+
- pnpm 10+
- PostgreSQL 18+
- Docker (optional, for running PostgreSQL)

### Getting Started

```bash
# Fork and clone
git clone https://github.com/<your-username>/ArchVault.git
cd ArchVault

# Install dependencies
pnpm install

# Start PostgreSQL (via Docker or your local installation)
docker compose up -d db

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, BETTER_AUTH_SECRET, etc.

# Run migrations
pnpm db:migrate

# Start dev server
pnpm dev
```

## Commands

| Command                     | Description                               |
|-----------------------------|-------------------------------------------|
| `pnpm dev`                  | Start dev server on http://localhost:3000 |
| `pnpm build`                | Production build                          |
| `pnpm test`                 | Run all tests (Vitest)                    |
| `pnpm lint`                 | Run ESLint                                |
| `pnpm lint:fix`             | Run ESLint with auto-fix                  |
| `pnpm db:generate`          | Generate migration from schema changes    |
| `pnpm db:migrate`           | Apply migrations                          |
| `pnpm db:studio`            | Open Drizzle Studio (DB GUI)              |

## Code Style

- **TypeScript strict mode** — `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` are enabled
- **ESLint** — Run `pnpm lint` before committing
- **Tailwind CSS v4** — All theme config is CSS-based in `src/styles.css`, no `tailwind.config`
- **shadcn/ui only** — Never create custom UI components; use shadcn/ui via `pnpm dlx shadcn@latest add <component>`
- **Paraglide i18n** — All user-facing strings must use `m.key()` from `#/paraglide/messages`. Never hardcode text
- **Path alias** — Use `#/*` (resolves to `src/*`)

## Database Changes

**Never write SQL migrations manually.** Always modify the Drizzle schema files and then run:

```bash
pnpm db:generate
```

This generates the migration automatically. Commit both the schema change and the generated migration.

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add diagram export button
fix: prevent duplicate connections on fast clicks
docs: update roadmap with phase 3f status
refactor: extract canvas toolbar into separate component
test: add unit tests for tag filtering
chore: bump TanStack Router to v1.x
```

## Branch Strategy

Create branches from `main`:

- `feat/<description>` — New features
- `fix/<description>` — Bug fixes
- `docs/<description>` — Documentation changes
- `refactor/<description>` — Code refactoring

## Pull Request Process

1. Ensure your branch is up to date with `main`
2. Run `pnpm build` and `pnpm test` — both must pass
3. Run `pnpm lint` — no errors
4. Fill out the [PR template](.github/PULL_REQUEST_TEMPLATE.md)
5. Link any related issues
6. Request a review

PRs are squash-merged into `main`.
