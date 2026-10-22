import { defineConfig, devices } from '@playwright/test';

/**
 * E2E runs against a production build that uses the mock AI provider, at the two phone sizes the
 * spec cares about (N6). No test ever talks to the real Gemini API.
 */
const port = Number(process.env.PW_PORT ?? 4173);

const E2E_DIST = '.cache/e2e-dist';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // On CI: annotations on the run, and an HTML report that the workflows upload when a test fails.
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  // The first tutor answer loads the 17.8 MB tokenizer dictionary to verify readings; on a busy
  // machine that alone can pass 5 s, so waits allow for a cold start (D70).
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
    serviceWorkers: 'allow',
  },
  projects: [
    {
      name: 'phone-390',
      testIgnore: /iphone\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'phone-360',
      testIgnore: /iphone\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 360, height: 740 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 2,
      },
    },
    // Opt-in (D97): WebKit as an iPhone, for the checks a real phone would otherwise need.
    ...(process.env.PW_WEBKIT
      ? [{ name: 'iphone-webkit', testMatch: /iphone\.spec\.ts/, use: { ...devices['iPhone 13'] } }]
      : []),
  ],
  // The mock build goes to its own folder, so `dist/` only ever holds a real build: a preview of
  // `dist/` never answers with the recorded fixtures.
  webServer: {
    command: `VITE_AI_PROVIDER=mock VITE_PACKS=fixture VITE_SYNC_URL=https://sync.test bunx vite build --outDir ${E2E_DIST} && bunx vite preview --outDir ${E2E_DIST} --port ${port} --strictPort`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
