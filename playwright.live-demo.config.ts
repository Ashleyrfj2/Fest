import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/demo',
  testMatch: '**/shared-browser-state.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: 'node scripts/export-browser-app.mjs',
    url: 'http://127.0.0.1:4173/',
    timeout: 180_000,
    reuseExistingServer: false,
  },
});
