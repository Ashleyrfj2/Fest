import { defineConfig } from '@playwright/test';

const browserPort = Number(process.env.FESTNEST_BROWSER_PORT || '4173');
if (!Number.isInteger(browserPort) || browserPort < 1 || browserPort > 65535) {
  throw new Error('FESTNEST_BROWSER_PORT must be an integer from 1 to 65535');
}
const browserBaseURL = `http://127.0.0.1:${browserPort}`;

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
    baseURL: browserBaseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: 'node scripts/export-browser-app.mjs',
    url: `${browserBaseURL}/__festnest/browser-health`,
    timeout: 180_000,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
  },
});
