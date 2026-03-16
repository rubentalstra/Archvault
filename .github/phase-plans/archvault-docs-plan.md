# ArchVault Documentation Site — Master Plan

> **Framework:** Astro Starlight · **Deploy:** GitHub Pages via `withastro/action@v5`
> **Location:** `docs/` folder inside the existing `rubentalstra/ArchVault` repo
> **URL:** `https://rubentalstra.github.io/ArchVault/`
> **Primary audiences:** End users (architects & developers) · IT administrators

---

## 1. Why This Plan Exists

ArchVault is a feature-rich, self-hosted C4 architecture platform. Right now, all information lives in a single
`README.md` and a handful of repo files (`ROADMAP.md`, `CONTRIBUTING.md`, `SECURITY.md`). That's not enough for two
distinct audiences who need very different things:

| Audience      | They need to…                                                                 |
|---------------|-------------------------------------------------------------------------------|
| **End users** | Understand C4, learn the UI, create diagrams, manage workspaces               |
| **IT admins** | Deploy securely, configure auth/SSO/SCIM, manage PostgreSQL, tune performance |

A proper documentation website solves this by giving each audience a clear path through the content, with a landing page
that orients newcomers and search that lets experienced users jump straight to answers.

---

## 2. Technology Decisions

### 2.1 Astro Starlight

Starlight is Astro's official documentation theme. It provides everything ArchVault's docs need out of the box:

- **Built-in Pagefind search** — full-text, client-side, zero config
- **Sidebar navigation** — auto-generated from filesystem, manually overridable
- **Dark / light theme** — matches ArchVault's own theme toggle
- **i18n support** — future-ready for Dutch (ArchVault already ships en + nl)
- **Markdown + MDX** — write docs in Markdown, embed interactive components when needed
- **Code highlighting** — Expressive Code with file names, line highlights, diffs
- **SEO** — semantic HTML, sitemap, Open Graph, structured data
- **Accessible by default** — WCAG-compliant navigation, keyboard support

### 2.2 Deployment Pipeline

```
Push to main → GitHub Actions → withastro/action@v5 → GitHub Pages
```

The workflow only builds the `docs/` subfolder. The main ArchVault app build is untouched.

### 2.3 Monorepo Considerations

Since `docs/` lives inside the ArchVault repo:

- The Starlight project gets its own `package.json`, `astro.config.mjs`, and `tsconfig.json`
- The GitHub Actions workflow uses `path: ./docs` in the `withastro/action` config
- The workflow triggers only on changes to `docs/**` (optional, for efficiency)
- `pnpm-workspace.yaml` in the repo root can include `docs` as a workspace member

---

## 3. Site Architecture — The Information Architecture

The sidebar is organized into **five top-level sections** using Starlight's group + autogenerate pattern. Each section
targets a specific intent.

```
📖 ArchVault Docs
│
├── 🏠 Home (Landing Page)            ← index.mdx — custom hero + feature cards
│
├── 📘 Getting Started                 ← New user onboarding (end users + admins)
│   ├── Introduction                   ← What is ArchVault? What is C4?
│   ├── Quick Start (Docker)           ← 5-minute docker compose up
│   ├── Quick Start (Manual)           ← Node.js + pnpm + PostgreSQL
│   └── Core Concepts                  ← Systems, Containers, Components, Diagrams
│
├── 📗 User Guide                      ← Day-to-day usage (end users)
│   ├── Dashboard & Navigation
│   ├── Organizations & Teams
│   ├── Workspaces
│   │   ├── Creating a Workspace
│   │   ├── Elements & Connections
│   │   ├── Tags & Technologies
│   │   └── Workspace Settings
│   ├── Diagrams
│   │   ├── Creating Diagrams
│   │   ├── L1 — System Context
│   │   ├── L2 — Container
│   │   └── L3 — Component
│   ├── Visual Editor
│   │   ├── Canvas Basics (pan, zoom, select)
│   │   ├── Drag & Drop Elements
│   │   ├── Connections & Routing
│   │   ├── Properties Panel
│   │   ├── Keyboard Shortcuts
│   │   └── Autosave & Undo/Redo
│   └── Account & Profile
│       ├── Authentication
│       ├── Two-Factor Authentication (2FA)
│       └── Theme & Language
│
├── 🔧 Administration Guide            ← IT admins / self-hosting operators
│   ├── Deployment
│   │   ├── Docker Compose (Production)
│   │   ├── Environment Variables Reference
│   │   ├── Reverse Proxy (Nginx / Traefik / Caddy)
│   │   └── Upgrading & Migrations
│   ├── Database
│   │   ├── PostgreSQL Setup & Tuning
│   │   ├── Drizzle Migrations
│   │   └── Backups & Restore
│   ├── Authentication & Security
│   │   ├── Better Auth Configuration
│   │   ├── SSO / SAML / OIDC Setup
│   │   ├── SCIM Provisioning
│   │   ├── Role-Based Access Control (RBAC)
│   │   └── Security Hardening
│   ├── Organizations & Multi-Tenancy
│   │   ├── Creating & Managing Orgs
│   │   ├── Member Roles & Permissions
│   │   └── Teams
│   └── Monitoring & Troubleshooting
│       ├── Logs & Health Checks
│       ├── Common Issues & Fixes
│       └── Performance Tuning
│
├── 🏗️ Architecture & Technical Docs   ← How it works under the hood
│   ├── Tech Stack Overview
│   ├── Project Structure
│   ├── Data Model (Drizzle Schema)
│   ├── Authentication Flow
│   ├── Routing & API Layer
│   ├── Diagram Engine (React Flow)
│   └── Internationalization (Paraglide JS)
│
└── 🤝 Community                       ← Contributing, roadmap, links
    ├── Contributing Guide
    ├── Code of Conduct
    ├── Roadmap
    ├── Security Policy
    ├── Changelog
    └── Support & Discussions
```

---

## 4. Page-by-Page Content Plan

### 4.1 Landing Page (`index.mdx`)

This is the most important page. It uses Starlight's hero component + custom card grids.

**Content blocks:**

1. **Hero section** — ArchVault logo, tagline ("Self-hosted visual C4 architecture platform"), two CTA buttons: "Get
   Started" and "View on GitHub"
2. **What is ArchVault?** — 2-sentence elevator pitch
3. **Feature highlights** — Card grid with 6 cards: C4 Modeling, Visual Editor, Organizations & Workspaces, Auth & SSO,
   RBAC, i18n
4. **Screenshot showcase** — Editor screenshot (the L2 container diagram screenshot from the repo)
5. **Quick links** — Link cards pointing to Getting Started, User Guide, Admin Guide
6. **Open source callout** — GPL-3.0, link to GitHub, star badge

### 4.2 Getting Started Section

| Page                     | Purpose                 | Key content                                                                                                  |
|--------------------------|-------------------------|--------------------------------------------------------------------------------------------------------------|
| **Introduction**         | Orient the reader       | What is ArchVault, what is C4 modeling, who is this for, what can you build                                  |
| **Quick Start (Docker)** | Fastest path to running | `git clone` → `cp .env.example .env` → `docker compose up -d` → open browser. Include `.env` variable table. |
| **Quick Start (Manual)** | Dev/contributor setup   | Prerequisites (Node 24+, pnpm 10+, PostgreSQL 18+), install steps, `pnpm db:migrate`, `pnpm dev`             |
| **Core Concepts**        | Mental model            | Explain: Systems, Containers, Components, Diagrams, Organizations, Workspaces. Diagram showing hierarchy.    |

### 4.3 User Guide Section

Detailed walkthrough of every UI feature, organized by task. Each page should include:

- A brief intro explaining the feature's purpose
- Step-by-step instructions with annotated screenshots
- Tips/notes using Starlight's `<Aside>` components
- Links to related pages

**Key pages worth highlighting:**

- **Visual Editor pages** are the heart of the product docs. These should be the most detailed, with GIF/video
  walkthroughs showing drag-and-drop, connection creation, and property editing.
- **L1/L2/L3 Diagram pages** should each explain the C4 level's purpose, what elements are available at that level, and
  show a complete example.

### 4.4 Administration Guide Section

This is where IT admins live. Tone should be more technical, with complete config examples.

**Key pages worth highlighting:**

- **Environment Variables Reference** — A comprehensive table of every `.env` variable: name, type, default,
  required/optional, description. This is the single most-visited admin page on any self-hosted project.
- **Docker Compose (Production)** — Full `compose.yaml` walkthrough with production hardening (resource limits, restart
  policies, volume mounts, networking).
- **SSO Setup** — Step-by-step for at least SAML and OIDC providers (Okta, Azure AD, Google Workspace as examples).
- **SCIM Provisioning** — How to enable auto user/group sync.
- **RBAC** — Table of all roles, their permissions, and how to assign them.
- **Reverse Proxy** — Nginx, Traefik, and Caddy example configs.

### 4.5 Architecture & Technical Docs Section

For contributors and curious admins who want to understand internals.

| Page                    | Content                                                                                    |
|-------------------------|--------------------------------------------------------------------------------------------|
| **Tech Stack Overview** | The full table from README, but with explanations of why each tool was chosen              |
| **Project Structure**   | File tree of `src/` with annotations. Explain routes, server functions, components layout  |
| **Data Model**          | Drizzle schema visualized — entities, relationships, key fields                            |
| **Authentication Flow** | Sequence diagram of login, SSO, 2FA, session handling via Better Auth                      |
| **Routing & API**       | How TanStack Router + TanStack Start handle file-based routes and server functions         |
| **Diagram Engine**      | How React Flow is configured, custom node types, edge types, state management with Zustand |
| **i18n**                | How Paraglide JS works, how to add a new locale, URL prefix strategy                       |

### 4.6 Community Section

Mostly mirrors existing repo files, but formatted as proper doc pages with better navigation.

---

## 5. Sidebar Configuration

```js
// astro.config.mjs — sidebar excerpt
sidebar: [
    {
        label: 'Getting Started',
        items: [
            {slug: 'getting-started/introduction'},
            {slug: 'getting-started/quick-start-docker'},
            {slug: 'getting-started/quick-start-manual'},
            {slug: 'getting-started/core-concepts'},
        ],
    },
    {
        label: 'User Guide',
        items: [
            {slug: 'guide/dashboard'},
            {
                label: 'Organizations & Teams',
                autogenerate: {directory: 'guide/organizations'},
            },
            {
                label: 'Workspaces',
                autogenerate: {directory: 'guide/workspaces'},
            },
            {
                label: 'Diagrams',
                autogenerate: {directory: 'guide/diagrams'},
            },
            {
                label: 'Visual Editor',
                autogenerate: {directory: 'guide/editor'},
            },
            {
                label: 'Account & Profile',
                autogenerate: {directory: 'guide/account'},
            },
        ],
    },
    {
        label: 'Administration',
        badge: {text: 'Admin', variant: 'caution'},
        items: [
            {
                label: 'Deployment',
                autogenerate: {directory: 'admin/deployment'},
            },
            {
                label: 'Database',
                autogenerate: {directory: 'admin/database'},
            },
            {
                label: 'Auth & Security',
                autogenerate: {directory: 'admin/auth'},
            },
            {
                label: 'Multi-Tenancy',
                autogenerate: {directory: 'admin/multi-tenancy'},
            },
            {
                label: 'Operations',
                autogenerate: {directory: 'admin/operations'},
            },
        ],
    },
    {
        label: 'Architecture',
        collapsed: true,
        autogenerate: {directory: 'architecture'},
    },
    {
        label: 'Community',
        collapsed: true,
        autogenerate: {directory: 'community'},
    },
],
```

**Design decisions:**

- Getting Started is **not collapsed** — it's the entry point
- User Guide uses **mixed manual + autogenerate** for precise ordering
- Administration gets a **caution badge** to visually separate admin content
- Architecture and Community are **collapsed by default** — secondary audiences

---

## 6. File Structure

```
docs/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   ├── favicon.svg
│   └── logo/
│       ├── logo-dark.svg          ← from ArchVault's public/logo/
│       └── logo-light.svg
├── src/
│   ├── assets/
│   │   └── screenshots/           ← annotated UI screenshots
│   │       ├── dashboard.png
│   │       ├── editor-l1.png
│   │       ├── editor-l2.png
│   │       ├── editor-l3.png
│   │       ├── workspace.png
│   │       └── ...
│   └── content/
│       └── docs/
│           ├── index.mdx                          ← Landing page
│           ├── getting-started/
│           │   ├── introduction.mdx
│           │   ├── quick-start-docker.mdx
│           │   ├── quick-start-manual.mdx
│           │   └── core-concepts.mdx
│           ├── guide/
│           │   ├── dashboard.mdx
│           │   ├── organizations/
│           │   │   ├── overview.mdx
│           │   │   └── teams.mdx
│           │   ├── workspaces/
│           │   │   ├── creating-a-workspace.mdx
│           │   │   ├── elements-and-connections.mdx
│           │   │   ├── tags-and-technologies.mdx
│           │   │   └── workspace-settings.mdx
│           │   ├── diagrams/
│           │   │   ├── creating-diagrams.mdx
│           │   │   ├── l1-system-context.mdx
│           │   │   ├── l2-container.mdx
│           │   │   └── l3-component.mdx
│           │   ├── editor/
│           │   │   ├── canvas-basics.mdx
│           │   │   ├── drag-and-drop.mdx
│           │   │   ├── connections-and-routing.mdx
│           │   │   ├── properties-panel.mdx
│           │   │   ├── keyboard-shortcuts.mdx
│           │   │   └── autosave-and-history.mdx
│           │   └── account/
│           │       ├── authentication.mdx
│           │       ├── two-factor-auth.mdx
│           │       └── theme-and-language.mdx
│           ├── admin/
│           │   ├── deployment/
│           │   │   ├── docker-compose-production.mdx
│           │   │   ├── environment-variables.mdx
│           │   │   ├── reverse-proxy.mdx
│           │   │   └── upgrading.mdx
│           │   ├── database/
│           │   │   ├── postgresql-setup.mdx
│           │   │   ├── migrations.mdx
│           │   │   └── backups.mdx
│           │   ├── auth/
│           │   │   ├── better-auth-config.mdx
│           │   │   ├── sso-setup.mdx
│           │   │   ├── scim-provisioning.mdx
│           │   │   ├── rbac.mdx
│           │   │   └── security-hardening.mdx
│           │   ├── multi-tenancy/
│           │   │   ├── organizations.mdx
│           │   │   ├── roles-and-permissions.mdx
│           │   │   └── teams.mdx
│           │   └── operations/
│           │       ├── logs-and-health.mdx
│           │       ├── common-issues.mdx
│           │       └── performance.mdx
│           ├── architecture/
│           │   ├── tech-stack.mdx
│           │   ├── project-structure.mdx
│           │   ├── data-model.mdx
│           │   ├── authentication-flow.mdx
│           │   ├── routing-and-api.mdx
│           │   ├── diagram-engine.mdx
│           │   └── internationalization.mdx
│           └── community/
│               ├── contributing.mdx
│               ├── code-of-conduct.mdx
│               ├── roadmap.mdx
│               ├── security.mdx
│               ├── changelog.mdx
│               └── support.mdx
└── .gitignore
```

**Total: ~45 documentation pages** (plus the landing page).

---

## 7. Astro Configuration

```js
// docs/astro.config.mjs
import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
    site: 'https://rubentalstra.github.io',
    base: '/ArchVault',
    integrations: [
        starlight({
            title: 'ArchVault',
            logo: {
                light: './src/assets/logo-light.svg',
                dark: './src/assets/logo-dark.svg',
                replacesTitle: true,
            },
            social: [
                {icon: 'github', label: 'GitHub', href: 'https://github.com/rubentalstra/ArchVault'},
            ],
            editLink: {
                baseUrl: 'https://github.com/rubentalstra/ArchVault/edit/main/docs/',
            },
            customCss: ['./src/styles/custom.css'],
            sidebar: [
                // ... (see Section 5 above)
            ],
            head: [
                {
                    tag: 'meta',
                    attrs: {
                        property: 'og:image',
                        content: 'https://rubentalstra.github.io/ArchVault/og-image.png',
                    },
                },
            ],
            lastUpdated: true,
            pagination: true,
            tableOfContents: {minHeadingLevel: 2, maxHeadingLevel: 3},
        }),
    ],
});
```

---

## 8. GitHub Actions Workflow

```yaml
# .github/workflows/deploy-docs.yml
name: Deploy Docs to GitHub Pages

on:
  push:
    branches: [ main ]
    paths: [ 'docs/**' ]          # Only rebuild when docs change
  workflow_dispatch:             # Manual trigger for emergencies

permissions:
  contents: read
  pages: write
  id-token: write

# Cancel in-flight deployments for the same branch
concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v5

      - name: Build docs with Astro
        uses: withastro/action@v5
        with:
          path: ./docs
          node-version: 22
          package-manager: pnpm@latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Key details:**

- `path: ./docs` tells the action to build from the docs subfolder
- `paths: ['docs/**']` ensures the workflow only runs when docs change (not on every app commit)
- `concurrency` prevents parallel deployments from conflicting
- Node 22 is the Astro action default and is stable
- pnpm is auto-detected from the lockfile but explicitly set for clarity

---

## 9. GitHub Repository Settings

After merging the first docs workflow:

1. Go to **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Optionally configure a **custom domain** (e.g., `docs.archvault.dev`) later

---

## 10. Content Writing Guidelines

### 10.1 Tone & Voice

- **End user pages:** Friendly, task-oriented. "Create a new workspace" not "The workspace creation interface allows..."
- **Admin pages:** Professional, precise. Include full config blocks, don't skip steps.
- **Architecture pages:** Technical but explanatory. Assume the reader is a developer, not necessarily familiar with
  this specific stack.

### 10.2 Page Template

Every documentation page should follow this structure:

```markdown
---
title: Page Title
description: One-sentence summary for SEO and search.
sidebar:
  order: 1          # Control ordering within autogenerated groups
---

Brief intro paragraph (2-3 sentences max) explaining what this page covers
and why the reader should care.

## Prerequisites (if applicable)

What the reader needs before starting.

## Main Content

Step-by-step sections with clear headings.

:::tip
Helpful tips go in tip asides.
:::

:::caution
Warnings about destructive actions or common mistakes.
:::

## Next Steps

Link to the logical next page in the reader's journey.
```

### 10.3 Screenshot Standards

- Capture at **1280×800** viewport for consistency
- Use ArchVault's **dark theme** for primary screenshots (matches the docs dark theme)
- Add a **light theme** variant for key screenshots (editor, dashboard)
- Annotate with numbered callouts for complex UIs
- Store in `docs/src/assets/screenshots/` with descriptive names
- Use Astro's `<Image>` component for automatic optimization

---

## 11. Implementation Phases

### Phase 1 — Foundation (Week 1)

**Goal:** Docs site is live with core structure.

- [ ] Scaffold Starlight project in `docs/`
- [ ] Configure `astro.config.mjs` (site, base, logo, sidebar, social)
- [ ] Set up GitHub Actions workflow (`deploy-docs.yml`)
- [ ] Create landing page (`index.mdx`) with hero + feature cards
- [ ] Write Getting Started section (4 pages)
- [ ] Deploy to GitHub Pages — site is live
- [ ] Add `pnpm-workspace.yaml` entry for docs

### Phase 2 — User Guide (Week 2-3)

**Goal:** End users can learn every feature.

- [ ] Dashboard & Navigation page
- [ ] Organizations & Teams (2 pages)
- [ ] Workspaces section (4 pages)
- [ ] Diagrams section (4 pages) — with C4 level explanations
- [ ] Visual Editor section (6 pages) — the most detailed section
- [ ] Account & Profile (3 pages)
- [ ] Capture and optimize all screenshots

### Phase 3 — Administration Guide (Week 3-4)

**Goal:** IT admins can deploy and manage ArchVault confidently.

- [ ] Docker Compose production guide
- [ ] Environment Variables reference (comprehensive table)
- [ ] Reverse proxy configs (Nginx, Traefik, Caddy)
- [ ] Upgrading & Migrations
- [ ] PostgreSQL setup, Drizzle migrations, backups
- [ ] Better Auth, SSO, SCIM, RBAC, security hardening
- [ ] Multi-tenancy management
- [ ] Monitoring, troubleshooting, performance

### Phase 4 — Architecture & Community (Week 4-5)

**Goal:** Contributors and technical users understand internals.

- [ ] All 7 architecture pages
- [ ] Port CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, ROADMAP.md, CHANGELOG.md
- [ ] Support & Discussions page with links

### Phase 5 — Polish & Optimization (Week 5-6)

**Goal:** Production-quality documentation site.

- [ ] Custom CSS styling (brand colors, font refinements)
- [ ] Open Graph image for social sharing
- [ ] Add `<Aside>` tips/cautions throughout all pages
- [ ] Cross-link between related pages
- [ ] Review all pages for completeness and accuracy
- [ ] Add search indexing keywords via frontmatter descriptions
- [ ] (Optional) Add Dutch translations for Getting Started
- [ ] (Optional) Add Algolia DocSearch or keep Pagefind

---

## 12. Content Priority Matrix

Ranked by impact and urgency:

| Priority | Page / Section                  | Why                               |
|----------|---------------------------------|-----------------------------------|
| 🔴 P0    | Landing page                    | First impression, SEO entry point |
| 🔴 P0    | Quick Start (Docker)            | Most common first action          |
| 🔴 P0    | Environment Variables reference | #1 question from self-hosters     |
| 🟠 P1    | Core Concepts                   | Users need C4 mental model        |
| 🟠 P1    | Visual Editor (all pages)       | Core product feature              |
| 🟠 P1    | Docker Compose production       | Admin's primary deployment path   |
| 🟠 P1    | SSO Setup                       | Enterprise deal-breaker           |
| 🟡 P2    | Diagrams (L1, L2, L3)           | Feature documentation             |
| 🟡 P2    | Workspaces                      | Feature documentation             |
| 🟡 P2    | RBAC                            | Admin feature                     |
| 🟡 P2    | Reverse proxy configs           | Common admin need                 |
| 🟢 P3    | Architecture docs               | Contributor audience              |
| 🟢 P3    | Community pages                 | Already exist in repo             |
| 🟢 P3    | i18n docs                       | Niche audience                    |

---

## 13. SEO & Discoverability

- Every page gets a unique `description` in frontmatter (used for `<meta>` and search)
- Landing page targets: "ArchVault docs", "C4 architecture tool", "self-hosted architecture diagram"
- Starlight generates a sitemap automatically when `site` is configured
- The `lastUpdated` flag shows freshness signals
- `editLink` encourages community contributions (Google values frequently updated content)

---

## 14. Future Enhancements (Post-Launch)

These are not in scope for the initial launch but should be planned for:

1. **Dutch translations** — Starlight has first-class i18n; ArchVault already supports nl
2. **API reference** — If ArchVault exposes a REST/RPC API, auto-generate docs
3. **Interactive examples** — Embed React Flow playground in editor docs
4. **Version selector** — When ArchVault releases v2, v3, etc.
5. **Algolia DocSearch** — Free for open-source projects, superior to Pagefind for large sites
6. **Blog section** — Release announcements via `starlight-blog` plugin
7. **Video tutorials** — Embed YouTube/Loom walkthroughs for complex flows

---

## 15. Summary

This plan delivers a **45+ page documentation website** using Astro Starlight, deployed automatically to GitHub Pages
from the `docs/` folder in the ArchVault repo. The site serves two distinct audiences through clearly separated
sections (User Guide vs. Administration Guide), with a strong landing page and progressive onboarding flow.

The phased approach ensures the site goes live quickly (Phase 1, ~1 week) with the most critical content, then fills in
progressively over 5-6 weeks.

**Ready to start building? Phase 1 begins with scaffolding the Starlight project.**
