import { expect, type Page, test } from '@playwright/test';
import { beginMix, onboard } from './helpers.ts';

/** The coverage line of the N5 group of the open tab, e.g. "N5 words: 3 of 120 known". */
function n5(page: Page, noun: string) {
  return page.getByRole('button', { name: new RegExp(`^N5 ${noun}: \\d+ of \\d+ known`) });
}

async function coverage(page: Page, noun: string): Promise<string> {
  const line = n5(page, noun);
  await expect(line).toBeVisible();
  return (await line.textContent()) ?? '';
}

test('a learner starting from zero gets a session on Today', async ({ page }) => {
  await onboard(page);
  await beginMix(page);
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Mark what you already know/ })).toBeVisible();
  await page.goto('/settings/words');
  await expect(page.getByRole('group', { name: 'Your level' }).getByLabel('N5')).toBeChecked();
});

test('applying the N5 list twice keeps the counts stable', async ({ page }) => {
  await onboard(page);
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Learn' }).click();
  await page.getByRole('link', { name: /What you've learned/ }).click();
  await expect(page).toHaveURL(/\/learned$/);
  await page
    .locator('label')
    .filter({ hasText: /^Words$/ })
    .click();
  expect(await coverage(page, 'words')).toMatch(/^N5 words: 0 of \d+ known/);

  await page.getByRole('button', { name: 'Mark N5 words known' }).click();
  await expect(page.getByRole('status')).toContainText('words marked as known');
  const total = (await coverage(page, 'words')).match(/of (\d+) known/)?.[1];
  await expect(n5(page, 'words')).toHaveText(new RegExp(`^N5 words: ${total} of ${total} known`));
  const first = await coverage(page, 'words');

  await page.getByRole('button', { name: 'Mark N5 words known' }).click();
  await expect(page.getByRole('status')).toContainText('Nothing new to mark');
  expect(await coverage(page, 'words')).toBe(first);

  await page.goto('/import');
  await page.getByRole('button', { name: 'Import' }).click();
  await expect(page.getByRole('status')).toContainText('were already known', { timeout: 20_000 });
  await page.goto('/learned');
  await page
    .locator('label')
    .filter({ hasText: /^Words$/ })
    .click();
  expect(await coverage(page, 'words')).toBe(first);
  await page.goto('/settings/words');
  await expect(page.getByRole('group', { name: 'Your level' }).getByLabel('N4')).toBeChecked();
});

test('the learned screen shows N5 kanji coverage and opens a kanji', async ({ page }) => {
  await onboard(page);
  await page.goto('/learned');
  await page.getByRole('button', { name: 'Mark N5 words known' }).click();
  await expect(page.getByRole('status')).toContainText('words marked as known');
  await expect(n5(page, 'kanji')).not.toHaveText(/^N5 kanji: 0 of/);
  await n5(page, 'kanji').click();
  const kanji = page.getByRole('link', { name: /, known$/ }).first();
  const char = ((await kanji.getAttribute('aria-label')) ?? '').split(',')[0] ?? '';
  await kanji.click();
  await expect(page).toHaveURL(new RegExp(`/kanji/${encodeURIComponent(char)}$`));
  await expect(page.getByRole('heading', { name: char })).toBeVisible();
});
