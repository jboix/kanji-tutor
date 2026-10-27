import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Lazy chunks, the handwriting recognizer and fake IndexedDB start cold in each file.
    testTimeout: 20_000,
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'json'],
      reportOnFailure: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/app/boot.ts',
        'src/lang/tokenizer-worker.ts',
        'src/**/*.d.ts',
      ],
      // Domain logic is the most-tested layer (BUILD-PLAN Wave 1: ≥ 90% lines). The domain
      // workstream switches this on when its stubs are real. Never lower thresholds to pass.
      thresholds: { 'src/domain/**': { lines: 90 }, 'src/ai/**': { lines: 85 } },
    },
  },
});
