```javascript
/**
 * lint-staged configuration for pre-commit hooks via Husky.
 * 
 * - Runs ONLY on staged Git files for efficiency (no full-repo scans).
 * - Sequence: Prettier FIRST (broad formatting across file types) → ESLint LAST (TS/TSX linting/fixing).
 *   - Rationale: Prettier handles whitespace/formatting universally; ESLint focuses on code quality/rules.
 *   - Avoids conflicts: Prettier won't override ESLint fixes, ensuring iterative consistency.
 * 
 * Globs & Commands:
 * - `*.{ts,tsx,css,md,json}`: Prettier --write (formats TS/TSX/CSS/MD/JSON without linting rules).
 * - `*.{ts,tsx}`: ESLint --fix (auto-fixes lint violations in TS/TSX after formatting).
 * 
 * Production Notes:
 * - Zero extra deps: Relies on project-installed ESLint/Prettier.
 * - Fast execution: Native lint-staged Git integration (staged files only).
 * - CI/CD safe: Deterministic, no side-effects.
 * 
 * Testing:
 * 1. Stage a file: `git add src/App.tsx`
 * 2. Commit: `git commit -m "test"` → Auto-runs on staged files.
 * 3. Manual: `npx lint-staged` (simulates pre-commit).
 * 4. Verify: Check diffs (`git diff --staged`) pre/post-commit.
 * 
 * Maintainability: Add new globs/commands here; order matters (broad → specific).
 */

module.exports = {
  // Broad Prettier formatting FIRST: Handles all common file types consistently
  '*.{ts,tsx,css,md,json}': ['prettier', '--write'],

  // Narrow ESLint fixing SECOND: Applies code rules post-formatting (TS/TSX only)
  '*.{ts,tsx}': ['eslint', '--fix'],
};
```