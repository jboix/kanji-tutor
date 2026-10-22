import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { kuromojiDict } from './scripts/vite-kuromoji-dict.ts';

/**
 * `VITE_BASE` is the GitHub Pages base path: `/` on app.kanjitutor.ch, as for local builds.
 * `VITE_AI_PROVIDER=mock` builds the app against recorded AI fixtures (e2e and screenshots only).
 */
const base = process.env.VITE_BASE ?? '/';

/** The short commit this build came from, with "+" when the tree had changes (N1e). */
function buildId(): string {
  try {
    const commit = execSync('git rev-parse --short HEAD').toString().trim();
    return execSync('git status --porcelain').toString().trim() ? `${commit}+` : commit;
  } catch {
    return 'unknown';
  }
}

/** The released version: semantic-release writes it into package.json with each release. */
const version = (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version;

export default defineConfig({
  base,
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId()),
    'import.meta.env.VITE_BUILD_AT': JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    kuromojiDict(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      // Send cookies with the manifest request, so a gated host (an ngrok tunnel) serves the manifest, not its warning page.
      useCredentials: true,
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        name: 'Kanji Tutor',
        short_name: 'Kanji Tutor',
        description: 'Read Japanese kanji in real sentences, up to JLPT N3.',
        lang: 'en',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        // Light --paper from src/ui/tokens.css (B2).
        background_color: '#F7F8F6',
        theme_color: '#F7F8F6',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: 'icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,txt}'],
        // iOS reads its launch images itself, once, at install: no need to precache them (N1c).
        globIgnores: ['**/packs/**', '**/dict/**', '**/icons/startup/**'],
        navigateFallback: `${base}index.html`,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\.(woff2?|ttf)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 400 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/dict/'),
            handler: 'CacheFirst',
            options: { cacheName: 'tokenizer-dict', expiration: { maxEntries: 40 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/packs/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'packs', expiration: { maxEntries: 40 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 650,
  },
});
