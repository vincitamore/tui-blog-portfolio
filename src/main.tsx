/**
 * React 18+ Entry Point for Vite + React + TypeScript + TailwindCSS + XState Application
 *
 * This is the client-side bootstrapper for the application, responsible for:
 * - Locating the root DOM container (`#root`) in `public/index.html`
 * - Creating a React 18 `createRoot` fiber reconciler instance
 * - Rendering the root `<App />` component wrapped in `<StrictMode>` for:
 *   - Double-invocation detection in development
 *   - Additional deprecation warnings and unsafe lifecycles checks
 *   - Future concurrent features readiness
 *
 * Aligns with Phase 1 Foundation milestone: enables `npm run dev` with smoke-testable TUI placeholder.
 *
 * Stack Context:
 * - Vite: Fast HMR and bundling
 * - React 18+: Concurrent rendering support
 * - TypeScript: Type-safe JSX and component props
 * - TailwindCSS: Utility-first styling via `./index.css`
 * - XState: Delegated to `<App />` for machine orchestration
 *
 * Production Robustness:
 * - Explicit null guard on `document.getElementById('root')` prevents silent failures
 * - Throws descriptive `TypeError` for malformed HTML or build issues
 * - Minimal SRP: No providers, global state, or hydration—delegates entirely to `./App.tsx`
 * - Browser DOM coupling: Acceptable for integration/E2E smoke tests (no unit isolation needed)
 *
 * Usage: Automatically executed by Vite on `npm run dev` or `npm run build && npm run preview`
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './index.css';

// Locate root container with explicit null safety (no `!` assertion)
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new TypeError(
    'Root element `#root` not found. ' +
      'Ensure `<div id="root"></div>` exists in `public/index.html` ' +
      'and the DOM is fully loaded before mounting.',
  );
}

// Create fiber root and render App within StrictMode
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
