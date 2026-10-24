import { onboard } from './helpers.ts';
import { expect, test } from './test.ts';

/** The mockup's sentence: the mock correctSentence fixture answers it (A6). */
const SENTENCE = '日本語が嫌いわけではないが、漢字を書くのは好きじゃない。';

test('write a sentence with a grammar point, read the red pen, accept it', async ({ page }) => {
  await onboard(page);
  await page.goto('/compose');

  const pattern = page.getByLabel('PATTERN');
  await expect(pattern.or(page.getByLabel('Your sentence', { exact: true }))).toBeVisible();
  if (await pattern.isVisible()) {
    await pattern.fill('〜わけではない');
    await page.getByLabel('MEANING').fill("It's not that…");
    await page.getByRole('button', { name: 'Add grammar point' }).click();
  }
  await expect(page.getByRole('heading', { name: /^Use it · grammar 1 of 1$/ })).toBeVisible();
  await expect(page.getByText('〜わけではない')).toBeVisible();

  await page.getByLabel('Your sentence', { exact: true }).fill(SENTENCE);
  await page.getByRole('button', { name: 'Check' }).click();

  const correction = page.getByRole('note', { name: 'Correction' });
  await expect(correction).toContainText('Needed: な.');
  await expect(page.getByRole('note', { name: 'Style note' })).toContainText(
    'Correct, but casual.',
  );
  await expect(page.locator('rt', { hasText: 'な' })).toBeVisible();
  await expect(page.getByText(/^Otherwise natural\./)).toBeVisible();

  await page.getByRole('button', { name: 'Rewrite' }).click();
  await expect(page.getByLabel('Your sentence', { exact: true })).toHaveValue(SENTENCE);
  await page.getByRole('button', { name: 'Check' }).click();

  await page.getByRole('button', { name: 'Accept corrections' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: '今日' })).toBeVisible();
});
