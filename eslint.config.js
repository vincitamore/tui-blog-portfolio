/*
 * ESLint Flat Configuration for Vite + React 18 + TypeScript Project
 *
 * Purpose:
 *   Defines a production-ready ESLint v9+ flat configuration optimized for a Vite application
 *   using React 18 (with automatic JSX runtime transform), TypeScript, and JavaScript.
 *   Ensures code quality, catches common errors, enforces best practices for React Hooks,
 *   Vite Fast Refresh, and TypeScript-specific patterns. Integrates seamlessly with Vite dev
 *   server, Husky pre-commit hooks, lint-staged, and CI/CD pipelines without performance overhead.
 *
 * Tech Stack:
 *   - Build Tool: Vite (with React Refresh plugin)
 *   - UI Framework: React 18
 *   - Languages: TypeScript (TS/TSX), JavaScript (JS/JSX)
 *   - Formatting/Linting: ESLint v9+ (flat config), Prettier (via separate config)
 *
 * ESLint Version & Format:
 *   - Flat config format (eslint.config.js, ESLint v9+)
 *   - No legacy .eslintrc migration needed
 *
 * Config Composition (Hierarchical Inheritance):
 *   1. Global ignores: Excludes build artifacts (dist/**)
 *   2. Base JavaScript: Spreads @eslint/js recommended (core rules, sourceType: 'module')
 *   3. TypeScript Layer: Spreads ...typescript-eslint recommended configs
 *      - Automatically configures @typescript-eslint/parser for TS/TSX/JS/JSX
 *      - Inherits essential languageOptions (ecmaVersion, parserOptions)
 *      - Includes recommended and strict rules (no-unused-vars, no-redeclare, etc.)
 *   4. React Overrides: Applies only to target files
 *      - Plugins: eslint-plugin-react-hooks, eslint-plugin-react-refresh
 *      - No eslint-plugin-react (unnecessary with React 18 auto JSX transform)
 *
 * Target Files:
 *   - **/*.{js,mjs,cjs,ts,jsx,tsx} (source code, configs, tests)
 *   - Excludes: dist/**, node_modules/** (via ignores + CLI defaults)
 *
 * Language Options (Inherited + Explicit):
 *   - Parser: @typescript-eslint/parser (handles TS/JSX automatically)
 *   - Globals: browser (window, document, navigator, etc.)
 *   - ecmaFeatures: jsx (implicit via parser)
 *   - No project: './tsconfig.json' (avoids perf overhead; add for type-aware rules if needed)
 *
 * Key Rules & Overrides Rationale:
 *   - Inherits all recommended rules from JS + TS (full spread, no cherry-picking)
 *   - 'react-refresh/only-export-components': 'warn'
 *     → Allows utility exports alongside React components (common in Vite HMR)
 *   - 'react-hooks/rules-of-hooks': 'error'
 *     → Strictly enforces Hooks call order/location (critical for React correctness)
 *   - 'react-hooks/exhaustive-deps': 'warn'
 *     → Flags missing deps but warns (allows manual disable for complex cases)
 *   - No additional overrides to preserve core functionality/minimalism
 *
 * Maintainability & Extensibility:
 *   - Add new configs: Append to tseslint.config(..., newConfigObject)
 *   - New plugins/rules: Extend the overrides object (plugins/rules)
 *   - Type-aware linting: Insert ...tseslint.configs['recommended-type-checked'], { languageOptions: { parserOptions: { project: './tsconfig.json' } } }
 *   - Stylistic rules: Add ...tseslint.configs.stylistic
 *   - Perf tweaks: Limit files to 'src/**/*.{ts,tsx}' if linting configs unnecessary
 *   - Upgrade path: Update deps, monitor changelogs for @eslint/js, typescript-eslint
 *
 * Validation & Integration:
 *   - Test locally: `npx eslint .` (no parse errors, reports issues)
 *   - Dev workflow: `npm run lint` (scripts in package.json)
 *   - Husky pre-commit: lint-staged on staged *.ts,*.tsx,*.js,*.jsx
 *   - Vite: Zero startup overhead, no conflicts with esbuild/SWC
 *   - CI/CD: Fast, reliable in GitHub Actions/Netlify/Vercel
 *
 * Dependencies (package.json):
 *   - eslint@^9.0.0
 *   - @eslint/js@^9.0.0
 *   - globals@^15.0.0
 *   - typescript-eslint@^8.0.0 (includes parser, plugin)
 *   - eslint-plugin-react-hooks@^5.0.0
 *   - eslint-plugin-react-refresh@^0.4.0
 */

import js from '@eslint/js';
import globals from 'globals';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  // Global ignores (applies to all configs)
  {
    ignores: ['dist/**'],
  },
  // Core JS recommended (inherits languageOptions: sourceType: 'module', rules)
  js.configs.recommended,
  // Full TypeScript recommended (spreads array: parser, base rules, strict rules)
  ...tsPlugin.configs.recommended,
  // React/Vite-specific overrides (applies only to specified files)
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      // Browser globals (window, document, fetch, etc.)
      globals: globals.browser,
    },
    plugins: {
      // React Hooks plugin
      'react-hooks': reactHooks,
      // Vite React Refresh plugin
      'react-refresh': reactRefresh,
    },
    rules: {
      // Vite HMR: Warn on non-component exports (allows utils/hooks)
      'react-refresh/only-export-components': 'warn',
      // React Hooks: Strict enforcement
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  }
];