import { expect, test, type Page } from '@playwright/test';

const PASSWORD = process.env.FESTNEST_DEMO_PASSWORD || 'FestNestLocalOnly!2026';
const TRIP_NAME = 'Thesis Demo Festival Trip';

async function signInAndOpenSupplyList(page: Page, email: string) {
  await page.goto('/auth/sign-in');
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(PASSWORD);
  await page.getByText('Sign In', { exact: true }).click();
  await expect(page.getByText(TRIP_NAME, { exact: true })).toBeVisible();
  await page.getByText(TRIP_NAME, { exact: true }).click();
  await page.getByText('Supply List', { exact: true }).click();
  await expect(page.getByText('Shared Canopy', { exact: true })).toBeVisible();
}

test('two signed-in browser sessions share supply state and preserve viewer controls', async ({ browser }) => {
  const editorContext = await browser.newContext();
  const viewerContext = await browser.newContext();
  const editorPage = await editorContext.newPage();
  const viewerPage = await viewerContext.newPage();
  await Promise.all([
    signInAndOpenSupplyList(editorPage, 'editor-a@example.test'),
    signInAndOpenSupplyList(viewerPage, 'viewer-b@example.test'),
  ]);

  const editorCanopy = editorPage.getByText('Shared Canopy', { exact: true }).locator('..').locator('..').locator('..');
  await editorCanopy.getByText('Claim', { exact: true }).click();
  await expect(editorCanopy.getByText('You', { exact: true })).toBeVisible();
  await expect(viewerPage.getByText('Editor A', { exact: true })).toBeVisible();

  await editorCanopy.locator('[role="button"]').first().click();
  await expect(editorPage.getByText('1 of 4 packed (25%)', { exact: true })).toBeVisible();
  await expect(viewerPage.getByText('1 of 4 packed (25%)', { exact: true })).toBeVisible();

  const viewerCanopy = viewerPage.getByText('Shared Canopy', { exact: true }).locator('..').locator('..').locator('..');
  await expect(viewerCanopy.locator('[role="button"]')).toHaveCount(0);
  await editorContext.close();
  await viewerContext.close();
});
