import { answerField, importKnown, onboard } from './helpers.ts';
import { expect, test } from './test.ts';

/**
 * A1–A4 with the mock provider: a wrong answer gets the app's note, "Ask the tutor why" the 解
 * explanation and all five chips, "Break down the sentence" opens the word sheet, whose own
 * button breaks it down, and the sheet closes.
 */
test('a wrong answer is explained and the sentence broken down', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  // A session on 待 read ま.つ, so the card is the 待って sentence the mock tutor knows.
  await page.goto(`/read?kanji=${encodeURIComponent('待')}&reading=${encodeURIComponent('ま.つ')}`);

  const input = await answerField(page);
  await input.pressSequentially('nu');
  await input.press('Enter');
  await expect(page.getByText('You wrote')).toBeVisible();
  // Static first (A13): the app's note, then the tutor only when asked.
  await expect(page.getByRole('region', { name: 'What went wrong' })).toBeVisible();
  await page.getByRole('button', { name: 'Ask the tutor why' }).click();

  const note = page.getByRole('note', { name: 'Why this reading' });
  await expect(note).toContainText('You read it as');
  await expect(note.locator('[lang="ja"]').first()).toBeVisible();
  for (const chip of [/side by side|lookalike/, /^One more/, 'Simpler, please', /^Quiz me/]) {
    await expect(note.getByRole('button', { name: chip })).toBeVisible();
  }
  await expect(note.getByRole('button', { name: 'Keep in my notes' })).toBeVisible();
  await note.getByRole('button', { name: 'Keep in my notes' }).click();
  await expect(page.getByText('Kept in your notes.')).toBeVisible();

  await note.getByRole('button', { name: 'Break down the sentence' }).click();
  const sheet = page.getByRole('dialog', { name: / in this sentence$/ });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Break down with the tutor' }).click();
  await expect(sheet.getByRole('region', { name: 'How this sentence is built' })).toBeVisible();
  await expect(sheet.getByLabel(/^Ask about /)).toBeVisible();
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();

  await expect(page.getByRole('button', { name: /^Next (sentence|word)$/ })).toBeVisible();
});
