import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'assets/aistudio/logo_dan_pavicon_f5e028e6.png',
          'assets/aistudio/file_0000000001d0820799e3ae2eb34d615c_080ce864.png',
          'assets/aistudio/gambar_OG_39d1f12c.png',
        ],
        manifest: {
          id: '/',
          name: 'House Drama',
          short_name: 'HouseDrama',
          description:
            'Multi-provider Chinese & Vertical Short Drama streaming platform across DramaBox & NetShort.',
          theme_color: '#090706',
          background_color: '#090706',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/assets/aistudio/logo_dan_pavicon_f5e028e6.png',
              sizes: '1254x1254',
              type: 'image/png',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\/api\/home(?:\?.*)?$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'home-catalog-api-cache',
                networkTimeoutSeconds: 4,
                expiration: {
                  maxEntries: 12,
                  maxAgeSeconds: 60 * 60 * 24,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\/api\/mola\/.*(?:detail|allepisode|episode|foryou|ranking|trending|new|terbaru|rank)/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'episodes-catalog-api-cache',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 60 * 60 * 24 * 3,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\.(?:jpg|jpeg|png|webp|gif)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'poster-images-cache',
                expiration: {
                  maxEntries: 180,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: false as const,
      ws: false as const,
      watch: null,
    },
  };
});
