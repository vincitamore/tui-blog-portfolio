# Fixes & Stub Flush-Out Plan for TUI-Portfolio

## Current State Summary

- **Phase 1 (Foundation)**: ~80% complete. Vite+React+TS+Tailwind+XState setup done, dev server runnable, basic TUI theme/CSS, Husky/lint. Missing: exact dir structure, PWA, some deps (Lucide, Router), tests.
- **Phase 2 (Core UI)**: Partial. Inline TUI menu/screens in `App.tsx`; no modular `<TuiBox>`, `<TuiMenu>`, etc.
- **Phase 3 (Nav)**: Inline XState machine in `App.tsx` works; `src/machines/appMachine.ts` stub fully implemented but unused.
- **Later Phases**: Not started (content, search, QA).
- **Issues**: Duplicate machines, mismatched `tech-spec.md` (Next.js vs Vite), flat structure vs planned feature-sliced, no tests/PWA/status bar/routes.
- **Strengths**: Keyboard nav/focus/ARIA solid, performant inline impl.

## Priority Fixes (Phase 1 Completion)

1. [x] **Align Project Structure**:
   - Create `src/features/portfolio/ui/`, `src/features/blog/ui/`, `src/shared/ui/tui/`, `src/shared/lib/machines/`.
   - Move `App.tsx` logic to `src/app/App.tsx`; screens to features (e.g., `PortfolioScreen.tsx`).
   - Delete inline machine; import from `machines/appMachine.ts`.

2. [x] **Integrate External Machine**:
   - Refactor `App.tsx`: `import { appMachine } from '@/machines/appMachine'; useMachine(appMachine);`.
   - Remove duplicate inline `createMachine`; use typed `AppActorRef`.

3. [x] **Add Missing Deps**:
   - `npm i lucide-react react-router-dom framer-motion` (icons, routes fallback, anims).
   - `npm i -D vitest @testing-library/react @testing-library/jest-dom playwright` (tests).

4. [x] **PWA Setup**:
   - Add `public/manifest.json`, `src/sw.ts` (Vite PWA plugin: `npm i -D vite-plugin-pwa`).
   - Update `vite.config.ts`: `plugins: [react(), VitePWA({ ... })]`.

5. [>] **Fix Docs**:
   - `tech-spec.md`: Replace Next.js refs with Vite; update stack table to match `package.json`.
   - Mark Phase 1 checklist [x] in `implementation-plan.md`.

## Stub Flush-Out (Phase 2-3)

1. **Modularize TUI Components** (`src/shared/ui/tui/`):
   - `<TuiBox border glow>`: Extract from `App.tsx` pre borders/shadows.
   - `<TuiMenu items onSelect>`: Roving focus, ARIA-menu.
   - `<TuiScreen>`: Generic screen w/ title/content/back.
   - `<TuiStatusBar>`: Path/help (e.g., \"home > portfolio | ? help\")

2. **Extract Screens**:
   - `src/features/portfolio/ui/PortfolioScreen.tsx`: Lazy-load, use `<TuiScreen>`.
   - Similar for blog/about; add placeholders (e.g., project cards).

3. **Enhance Nav**:
   - Add React Router sync: `<Routes>` wrapping screens, FSM events on route change.
   - Global `<KeyboardProvider>` hook in `App.tsx`.
   - Status bar integration.

## Next Phases (4-7) Steps

1. **Phase 4 Content**:
   - Add `content/blog/*.mdx`, Remark/Rehype.
   - `src/features/blog/BlogMachine.ts`, Fuse.js search.

2. **Phase 5 Features**:
   - Themes: CSS vars toggle, LocalStorage.
   - Commands: Input parser (e.g., `:open proj1`).

3. **Phase 6 QA**:
   - Vitest units: `npm test` (machines, components).
   - Playwright E2E: Nav flows.
   - `npm run lint && npm run type-check` always.

4. **Phase 7 Deploy**:
   - GitHub Actions CI: lint/test/build.
   - Vercel/Netlify deploy.
     \n## Progress Log\n\n- Lint fixed via task agent (ESLint config/deps updated). Phase 1 1-4 complete. Proceeding PWA/docs.\n\n## Verification Steps

- After each: `npm run lint`, `npm run type-check`, `npm run dev` test nav.
- Commit: \"fix(phase1): align structure/integrate machine\".
- Track: Update checklists in `implementation-plan.md`.

Total est: 2-3 days for fixes/stubs; follow with phases.
