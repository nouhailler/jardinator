import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons.svg'],
      manifest: {
        name: 'Jardinator — Calendrier du jardinier',
        short_name: 'Jardinator',
        description: 'Planification du potager avec IA : 220+ variétés, compagnonnage, météo, diagnostic phytosanitaire.',
        theme_color: '#1b5e20',
        background_color: '#1b1f17',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        lang: 'fr',
        categories: ['lifestyle', 'utilities'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          {
            src: 'screenshot-desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Jardinator — Vue principale',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
        runtimeCaching: [
          {
            // Météo Open-Meteo — NetworkFirst, cache 1h
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'meteo-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 3600 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Images Wikimedia — CacheFirst, cache 7j
            urlPattern: /^https:\/\/upload\.wikimedia\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wikimedia-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 604800 },
            },
          },
          {
            // OpenRouter API — NetworkOnly (pas de cache pour les LLM)
            urlPattern: /^https:\/\/openrouter\.ai\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Gemini API — NetworkOnly
            urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          zustand: ['zustand'],
          markdown: ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: !!process.env.PORT,
  },
})
