import { answerField, importKnown, onboard } from './helpers.ts';
import { expect, test } from './test.ts';

/**
 * A session keeps its place (R14): a grammar link inside it opens in a sheet instead of leaving,
 * and leaving the session and coming back resumes at the same card. The progress bar opens a
 * small panel, not a sheet (R13).
 */

const FOCUS = `/read?kanji=${encodeURIComponent('紹')}&reading=${encodeURIComponent('ショウ')}`;
const progress = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: /^\d+\/\d+, Sentence \d+ of \d+\. Show what is left$/ });

test('a grammar link in a session opens in a sheet, and the exercise is still there', async ({
  page,
}) => {
  await onboard(page);
  await importKnown(page);
  await page.goto(FOCUS);
  await answerField(page);
  await page.getByRole('button', { name: 'Explain this sentence' }).click();
  const help = page.getByRole('dialog', { name: 'About this sentence' });
  const pattern = help.locator('a[href^="/grammar/"]').first();
  await expect(pattern).toBeVisible();
  const name = (await pattern.textContent()) ?? '';
  await pattern.click();
  await expect(page.getByRole('dialog', { name })).toBeVisible();
  await expect(page).toHaveURL(/\/read\?/);
});

test('leaving a session and coming back resumes at the same card', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  await page.goto('/read');
  const input = await answerField(page);
  await input.pressSequentially('nu');
  await input.press('Enter');
  await page.getByRole('button', { name: /^Next (sentence|word)$/ }).click();
  await expect(progress(page)).toHaveAccessibleName(/^2\/\d+, Sentence 2 of/);
  await page.goto('/kanji');
  await page.goto('/read');
  await expect(progress(page)).toHaveAccessibleName(/^2\/\d+, Sentence 2 of/);
});

test('the progress bar opens a small panel of what is done and left', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  await page.goto(FOCUS);
  await answerField(page);
  await progress(page).click();
  const panel = page.getByRole('dialog', { name: 'This session' });
  await expect(panel).toContainText('Sentences');
  // The exercise stays on screen under the panel.
  await expect(page.locator('form input[lang="ja"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});
