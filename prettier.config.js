```javascript
/**
 * @prettier-config
 * Prettier configuration for the Vite + React + TypeScript project with Tailwind CSS and retro TUI aesthetics.
 *
 * Purpose: Enforces consistent, opinionated code formatting to ensure readable, maintainable code across the team.
 * Integrated with ESLint (flat config), Husky + lint-staged for pre-commit auto-formatting and checks, and Vite for seamless dev workflow.
 *
 * Key benefits:
 * - Reduces bike-shedding on style debates.
 * - Improves git diffs with trailing commas.
 * - Aligns with TypeScript, React/JSX, and modern JS conventions (e.g., single quotes common in JSX).
 * - Runs on `npm run format`, `npm run lint`, and pre-commit hooks.
 *
 * Official docs (version-agnostic): https://prettier.io/docs/configuration
 * Options reference: https://prettier.io/docs/options.html
 *
 * Usage:
 *   - Format all: `npm run format`
 *   - Check: `prettier --check .`
 *   - Pre-commit: Automatically handled by Husky + lint-staged.
 *
 * This config is minimal, standalone, and zero-dependency for broad Node/Vite compatibility.
 */

module.exports = {
  /**
   * Use single quotes instead of double quotes for strings.
   * Rationale: Matches common React/JSX patterns (less escaping in attributes), TypeScript preferences,
   * and reduces visual noise. Aligns with ESLint `jsx-single-quote` if enabled.
   */
  singleQuote: true,

  /**
   * Print semicolons at the end of statements.
   * Rationale: Explicit semicolons prevent Automatic Semicolon Insertion (ASI) edge cases in complex TS/JS codebases,
   * improve readability, and pair well with ESLint's semi rule for consistency.
   */
  semi: true,

  /**
   * Print trailing commas wherever valid in ES5 (e.g., arrays, objects, function params).
   * Rationale: Cleaner git diffs/hunks when adding items, reduces merge conflicts, standard in modern JS/TS.
   * 'es5' ensures broad compatibility (no ES2017+ function param support needed here).
   */
  trailingComma: 'es5',
};
```