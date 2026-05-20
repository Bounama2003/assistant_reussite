import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import type { Connect } from 'vite'

function spaBypass(req: Connect.IncomingMessage): string | undefined | null {
  const accept = req.headers?.accept;
  if (accept && typeof accept === 'string' && accept.includes('text/html')) {
    return '/index.html';
  }
  return undefined;
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: "Assistant Réussite - Tutorat IA",
        short_name: "Assistant Réussite",
        description: "Plateforme de tutorat IA multi-école pour la réussite scolaire",
        theme_color: "#020617",
        background_color: "#020617",
        display: "standalone",
        display_override: ["standalone", "minimal-ui", "window-controls-overlay"],
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        categories: ["education", "productivity"],
        lang: "fr",
        dir: "ltr",
        prefer_related_applications: false,
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
        screenshots: [],
        shortcuts: [
          {
            name: "Chat IA",
            short_name: "Chat",
            description: "Poser une question à l'assistant",
            url: "/chat",
            icons: [{ src: "/icons/android/launchericon-96x96.png", sizes: "96x96" }],
          },
          {
            name: "Quiz",
            short_name: "Quiz",
            description: "Démarrer un quiz",
            url: "/quiz",
            icons: [{ src: "/icons/android/launchericon-96x96.png", sizes: "96x96" }],
          },
          {
            name: "Tableau de bord",
            short_name: "Dashboard",
            description: "Voir le tableau de bord",
            url: "/dashboard",
            icons: [{ src: "/icons/android/launchericon-96x96.png", sizes: "96x96" }],
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-css',
              expiration: { maxEntries: 10, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 * 365 },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/school\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-school',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/chat\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'api-chat',
            },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Public & health - no SPA conflict
      '/health': 'http://localhost:8000',
      // File downloads - direct URLs
      '/exports': 'http://localhost:8000',
      // All other API routes - use bypass to not intercept SPA navigations
      '/school': { target: 'http://localhost:8000', bypass: spaBypass },
      '/lead': { target: 'http://localhost:8000', bypass: spaBypass },
      '/chat': { target: 'http://localhost:8000', bypass: spaBypass },
      '/student': { target: 'http://localhost:8000', bypass: spaBypass },
      '/admin': { target: 'http://localhost:8000', bypass: spaBypass },
      '/upload': { target: 'http://localhost:8000', bypass: spaBypass },
      '/stats': { target: 'http://localhost:8000', bypass: spaBypass },
      '/professor': { target: 'http://localhost:8000', bypass: spaBypass },
      '/professors': { target: 'http://localhost:8000', bypass: spaBypass },
      '/quiz': { target: 'http://localhost:8000', bypass: spaBypass },
      '/notifications': { target: 'http://localhost:8000', bypass: spaBypass },
      '/documents': { target: 'http://localhost:8000', bypass: spaBypass },
      '/chat-sessions': { target: 'http://localhost:8000', bypass: spaBypass },
      '/leads': { target: 'http://localhost:8000', bypass: spaBypass },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
