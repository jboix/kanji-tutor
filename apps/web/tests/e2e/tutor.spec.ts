import { onboard } from './helpers.ts';
import { expect, test } from './test.ts';

/**
 * The Tutor tab: ask the tutor anything and carry the conversation on later; without a key, one
 * card to set it up, and what needs the tutor says so.
 */

test('a starter asks the tutor, and the conversation can be carried on', async ({ page }) => {
  await onboard(page);
  await page.goto('/tutor');
  await page.getByRole('button', { name: /^は or が\?, 1 request/ }).click();
  const sheet = page.getByRole('dialog', { name: /anything Japanese/ });
  await expect(sheet.getByRole('note', { name: 'Answer' })).toBeVisible();
  await sheet.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: /^Carry on · today/ }).click();
  await expect(sheet.getByText('は or が?', { exact: true })).toBeVisible();
  await expect(sheet.getByRole('note', { name: /Answer/ })).toBeVisible();
});

test('without a key, the tab offers to set the tutor up', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __kanjiMockAi: object }).__kanjiMockAi = { calls: 0, noKey: true };
  });
  await onboard(page);
  await page.goto('/tutor');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link', { name: 'Tutor, not set up yet' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The tutor isn’t set up yet' })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByText('Needs the tutor')).toHaveCount(2);
  await page.getByRole('button', { name: 'Where do I get a key?' }).click();
  const help = page.getByRole('dialog', { name: 'Getting a Gemini key' });
  await expect(help.getByText(/aistudio\.google\.com/)).toBeVisible();
  await help.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('link', { name: 'Set up the tutor' }).click();
  await expect(page).toHaveURL(/\/settings\/tutor$/);
});
