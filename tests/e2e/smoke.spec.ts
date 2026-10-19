import { expect, test } from '@playwright/test';
import { onboard } from './helpers.ts';

test('first run loads the dictionary, then the bottom nav reaches every tab', async ({ page }) => {
  await onboard(page);
  const nav = page.getByRole('navigation', { name: 'Main' });
  for (const tab of ['Learn', 'Add', 'Settings', 'Home']) {
    await nav.getByRole('link', { name: tab }).click();
    await expect(nav.getByRole('link', { name: tab })).toHaveAttribute('aria-current', 'page');
  }
});

test('settings shows dictionary attribution and keeps the key out of view', async ({ page }) => {
  await page.goto('/settings/about');
  await expect(page.getByRole('link', { name: 'JMdict' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tatoeba' })).toBeVisible();
  await page.goto('/settings/tutor');
  await expect(page.getByLabel('API key', { exact: true })).toHaveAttribute('type', 'password');
});
