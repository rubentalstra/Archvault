# Phase 1g — ESLint

## Status: Not Started

## Goal

Set up a comprehensive ESLint configuration using the modern flat config format (`eslint.config.mjs`), including
TypeScript-aware rules, React-specific linting, and TanStack-specific plugins for Router and Query.

## Prerequisites

- Phase 1a (Scaffold) — project structure exists

## Context

The project currently has **no ESLint configuration**. TypeScript's `tsc --noEmit` provides type checking, but there is
no linting for code quality, best practices, or TanStack-specific patterns. This phase introduces ESLint with flat
config to catch bugs early, enforce consistent code style, and leverage TanStack-specific rules.

## Dependencies to Install

```bash
pnpm add -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh @tanstack/eslint-plugin-query @tanstack/eslint-plugin-router
```

| Package                          | Purpose                                           |
|----------------------------------|---------------------------------------------------|
| `eslint`                         | Core linter                                       |
| `@eslint/js`                     | ESLint recommended JS rules                       |
| `typescript-eslint`              | TypeScript-aware ESLint rules                     |
| `eslint-plugin-react-hooks`      | Enforces Rules of Hooks + exhaustive deps         |
| `eslint-plugin-react-refresh`    | Validates components work with React Fast Refresh |
| `@tanstack/eslint-plugin-query`  | TanStack Query specific rules                     |
| `@tanstack/eslint-plugin-router` | TanStack Router specific rules                    |

> **Note:** There are no ESLint plugins for TanStack Form, Table, or Virtual.

---

## Files to Create

| # | File               | Purpose                      |
|---|--------------------|------------------------------|
| 1 | `eslint.config.mjs` | Flat config with all plugins |

## Files to Modify

| File           | Change                                    |
|----------------|-------------------------------------------|
| `package.json` | Add `lint` and `lint:fix` scripts         |
| `CLAUDE.md`    | Add lint commands to the Commands section |

---

## Implementation Steps

### Step 1: Create `eslint.config.mjs`

Use the modern flat config format (ESLint 9+):

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import pluginQuery from "@tanstack/eslint-plugin-query";
import pluginRouter from "@tanstack/eslint-plugin-router";

export default tseslint.config(
    // Global ignores
    {
        ignores: [
            "dist/",
            ".output/",
            ".vinxi/",
            "node_modules/",
            "src/routeTree.gen.ts",
        ],
    },

    // Base JS recommended rules
    js.configs.recommended,

    // TypeScript recommended (type-checked)
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },

    // TanStack plugins (recommended presets)
    ...pluginQuery.configs["flat/recommended"],
    ...pluginRouter.configs["flat/recommended"],

    // React Hooks
    {
        plugins: {
            "react-hooks": reactHooks,
        },
        rules: reactHooks.configs.recommended.rules,
    },

    // React Refresh
    {
        plugins: {
            "react-refresh": reactRefresh,
        },
        rules: {
            "react-refresh/only-export-components": [
                "warn",
                {allowConstantExport: true},
            ],
        },
    },

    // Project-specific overrides
    {
        rules: {
            // TanStack Router uses throw redirect() / throw notFound()
            "@typescript-eslint/only-throw-error": [
                "error",
                {
                    allow: [
                        {from: "package", package: "@tanstack/router-core", name: "Redirect"},
                        {from: "package", package: "@tanstack/router-core", name: "NotFoundError"},
                    ],
                },
            ],
            // Allow unused vars prefixed with _
            "@typescript-eslint/no-unused-vars": [
                "error",
                {argsIgnorePattern: "^_", varsIgnorePattern: "^_"},
            ],
        },
    },
);
```

### Step 2: Add Scripts to `package.json`

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

### Step 3: Update CLAUDE.md

Add to the Commands section:

```
pnpm lint            # Run ESLint on entire project
pnpm lint:fix        # Run ESLint with auto-fix
```

### Step 4: Initial Lint Pass

Run `pnpm lint` and fix any violations. Expect common issues:

- Missing return types (from `recommendedTypeChecked`)
- Unsafe `any` usage
- React Hooks dependency warnings
- TanStack Router property ordering in `createFileRoute`

Fix auto-fixable issues with `pnpm lint:fix`, then manually address remaining violations. If certain rules produce too
many false positives for the codebase, disable them in the overrides section with a comment explaining why.

---

## TanStack Plugin Rules Reference

### `@tanstack/eslint-plugin-router`

| Rule                          | Default | Description                                                                                                                                                                                          |
|-------------------------------|---------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `create-route-property-order` | warn    | Enforces correct property order in `createFileRoute`/`createRoute` for proper TypeScript inference. Order: `params` → `validateSearch` → `loaderDeps` → `context` → `beforeLoad` → `loader` → `head` |

### `@tanstack/eslint-plugin-query`

| Rule                            | Default | Description                                                    |
|---------------------------------|---------|----------------------------------------------------------------|
| `exhaustive-deps`               | error   | Ensures query key dependencies are exhaustive                  |
| `no-rest-destructuring`         | warn    | Prevents `...rest` on query results (causes over-subscription) |
| `stable-query-client`           | error   | Ensures QueryClient is created stably                          |
| `no-unstable-states`            | warn    | Prevents deriving unstable state from query results            |
| `infinite-query-property-order` | warn    | Enforces correct property order in infinite queries            |

---

## Key Files

- `eslint.config.mjs` — flat config with all plugins
- `package.json` — lint scripts

## Verification

- [ ] `pnpm lint` runs without crashing
- [ ] All auto-fixable issues resolved via `pnpm lint:fix`
- [ ] Remaining violations reviewed and either fixed or intentionally suppressed
- [ ] TanStack Router property order rule works on route files
- [ ] TanStack Query rules detect issues in query hooks
- [ ] `pnpm dev` starts without errors
- [ ] `pnpm build` succeeds
