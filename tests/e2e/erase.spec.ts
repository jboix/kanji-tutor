import { expect, test } from '@playwright/test';
import { onboard, stepHeading } from './helpers.ts';

/** Settings → Delete all my data: one confirmation, then the app starts again at the welcome. */
test('deleting all local data starts the app again from the welcome', async ({ page }) => {
  await onboard(page);
  await page.goto('/settings/backup');
  await page.getByRole('button', { name: 'Delete all my data…' }).click();
  await expect(page.getByRole('button', { name: 'Export a backup first' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete everything' }).click();

  await expect(page).toHaveURL(/\/welcome$/);
  await expect(stepHeading(page, 'Welcome to Kanji Tutor')).toBeVisible();
  // The app opens a fresh, empty database on the new start; nothing from before survives.
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
});
