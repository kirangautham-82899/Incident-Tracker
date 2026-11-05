import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Incident Tracker',
        short_name: 'IncidentTracker',
        description: 'Real-Time Incident Reporting Platform',
        theme_color: '#3b82f6',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
        // No runtime caching: API responses are live data and must never be served stale
      }
    })
  ],
})
