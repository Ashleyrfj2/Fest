import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/demo',
  testMatch: '**/equipment-handoff.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: 'line',
  use: {
    baseURL: process.env.FESTNEST_BROWSER_BASE_URL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
});
