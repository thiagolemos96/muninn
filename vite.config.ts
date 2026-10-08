import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // A new deploy takes over on the next load, no "update available" prompt
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Muninn',
        short_name: 'Muninn',
        description: 'A memória da campanha: o Escudo do mestre e o Grimório do grupo.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // Manifests cannot read CSS variables: these mirror --bg and --bar (light theme)
        background_color: '#EFE6D2',
        theme_color: '#F4ECDA',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Only the app shell is cached. Supabase responses never are:
        // what RLS returns depends on who is asking.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
});
