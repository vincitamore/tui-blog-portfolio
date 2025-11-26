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
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
    registerType: 'autoUpdate',
    devOptions: { enabled: true },
    manifest: {
        name: 'AMORE.BUILD',
        short_name: 'AMORE',
        description: 'Terminal-style portfolio of a fullstack engineer. Qui vincit, vincit amore.',
        theme_color: '#bd93f9',
        background_color: '#282a36',
        display: 'standalone',
      icons: [
        {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'android-chrome-192x192.png',
          sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  css: {
    postcss: './postcss.config.js',
  },
});
