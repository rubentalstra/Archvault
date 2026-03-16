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
      "migrations/",
      "packages/",
      "eslint.config.mjs",
      "docs/",
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

  // React Hooks (flat config preset)
  reactHooks.configs.flat.recommended,

  // React Refresh
  {
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },

  // Disable react-refresh for route files (they export Route + component by design)
  {
    files: ["src/routes/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  // Project-specific overrides
  {
    rules: {
      // TanStack Router uses throw redirect() / throw notFound() which return
      // Redirect and NotFoundError types from @tanstack/router-core
      "@typescript-eslint/only-throw-error": [
        "error",
        {
          allow: [
            {
              from: "package",
              package: "@tanstack/router-core",
              name: ["Redirect", "NotFoundError"],
            },
          ],
        },
      ],
      // Allow unused vars prefixed with _
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // React event handlers and callback props commonly use async functions
      // where a void return is expected — disable void-return checks for
      // JSX attributes and object properties
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false, properties: false } },
      ],
      // drizzle-orm (beta) and TanStack Start's createServerFn have types that
      // don't fully resolve through the TS project service, causing cascading
      // "error typed value" and unresolved-any reports. These are library type
      // resolution issues, not code quality problems. Re-enable once the
      // libraries ship stable types.
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
);
