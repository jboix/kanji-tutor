import { answerField, beginMix, importKnown, onboard } from './helpers.ts';
import { expect, type Page, test } from './test.ts';

async function answer(page: Page, text: string) {
  const input = await answerField(page);
  await input.fill('');
  await input.pressSequentially(text);
  await input.press('Enter');
}

test('import known words, read a session with a wrong and a right answer, open a kanji', async ({
  page,
}) => {
  await onboard(page);
  await importKnown(page);
  await expect(page.getByText(/\d+ sentences? · \d+ minutes?/)).toBeVisible();
  await beginMix(page);

  await answer(page, 'nu');
  await expect(page.getByText('You wrote')).toBeVisible();
  await expect(page.getByRole('deletion')).toHaveText('ぬ');
  await page.getByRole('button', { name: /^Next (sentence|word)$/ }).press('Enter');

  // The right answer comes from a session focused on 紹 read ショウ, whose only word is 紹介.
  // Before it is answered, tapping it opens the hint, which never shows its reading (L2).
  await page.goto(
    `/read?kanji=${encodeURIComponent('紹')}&reading=${encodeURIComponent('ショウ')}`,
  );
  await expect(page.getByLabel('Reading of 紹介')).toBeVisible();
  await page.getByRole('button', { name: /^紹介(\s*\(?しょうかい\)?)?$/ }).click();
  const hint = page.getByRole('dialog', { name: 'Hint for 紹介' });
  await expect(hint).not.toContainText('しょうかい');
  await hint.getByRole('button', { name: 'Close' }).click();
  await answer(page, 'shoukai');
  await expect(page.getByText('Read as')).toBeVisible();
  await page.getByRole('button', { name: /^紹介(\s*\(?しょうかい\)?)?$/ }).click();
  const sheet = page
    .getByRole('dialog', { name: '紹介 in the dictionary' })
    .or(page.getByRole('dialog', { name: '紹介 in this sentence' }));
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Close' }).click();

  await page.goto(`/kanji/${encodeURIComponent('紹')}`);
  await expect(page.getByRole('heading', { name: '紹' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'How well you read it' })).toBeVisible();
  await expect(page.getByText(/of your words?$/)).toBeVisible();
});
