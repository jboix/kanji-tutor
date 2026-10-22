import { expect, test } from '@playwright/test';
import { onboard } from './helpers.ts';

/**
 * Back follows the history (S1): deep in, then back one screen at a time, never forward; a page
 * opened directly goes back to its parent; a session's close returns to where it was started.
 */

const back = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Back', exact: true });

const tab = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name });

test('back walks the history one screen at a time, never forward', async ({ page }) => {
  await onboard(page);
  await tab(page, 'Learn').click();
  await page.getByRole('link', { name: /^Lessons/ }).click();
  await expect(page.getByRole('heading', { name: 'Lessons', level: 1 })).toBeVisible();
  await page
    .getByRole('link', { name: /わたしは学生です/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/units\/.+/);
  await page.getByRole('link', { name: /〜/ }).first().click();
  await expect(page).toHaveURL(/\/grammar\/.+/);

  await back(page).click();
  await expect(page).toHaveURL(/\/units\/.+/);
  await back(page).click();
  await expect(page).toHaveURL(/\/units$/);
  await back(page).click();
  await expect(page).toHaveURL(/\/learn$/);
  // Nothing was pushed on the way back: the browser's own back leaves the app's start.
  expect(await page.evaluate(() => history.length)).toBeLessThanOrEqual(6);
});

test('a page opened directly goes back to its parent', async ({ page }) => {
  await onboard(page);
  await page.goto('/settings/backup');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await page.goto('/kanji');
  await back(page).click();
  await expect(page).toHaveURL(/\/learn$/);
  await page.goto('/plan');
  await back(page).click();
  await expect(page).toHaveURL(/\/$/);
});

test("a session's close returns to the screen Start was pressed on", async ({ page }) => {
  await onboard(page);
  await tab(page, 'Learn').click();
  await expect(page).toHaveURL(/\/learn$/);
  await page.getByRole('link', { name: 'Start the next round' }).click();
  await expect(page).toHaveURL(/\/read\?/);
  await page.getByRole('button', { name: 'End session' }).click();
  await expect(page).toHaveURL(/\/learn$/);
});
