/**
 * Vite configuration file for a React + TypeScript + TailwindCSS project.
 *
 * Key features:
 * - React support with Fast Refresh using @vitejs/plugin-react
 * - PWA support via vite-plugin-pwa for offline TUI browsing
 * - PostCSS integration via './postcss.config.js' for TailwindCSS processing
 * - TypeScript-safe configuration via defineConfig helper
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'TUI-Portfolio',
        short_name: 'TUI-Portfolio',
        description: 'Terminal User Interface Portfolio/Blog',
        theme_color: '#00ff00',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  css: {
    postcss: './postcss.config.js',
  },
});
