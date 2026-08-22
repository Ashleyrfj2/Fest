import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  reporter: process.env.CI ? [['line'], ['html', { outputFolder: '/tmp/festnest-browser-report', open: 'never' }]] : 'line',
  use: {
    baseURL: process.env.FESTNEST_BROWSER_BASE_URL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: 'node scripts/export-browser-app.mjs',
    url: 'http://127.0.0.1:4173/',
    timeout: 180_000,
    reuseExistingServer: false,
  },
});
