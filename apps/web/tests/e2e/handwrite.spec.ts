import { draw, importKnown, MATSU, onboard } from './helpers.ts';
import { expect, test } from './test.ts';

/**
 * Draw a kanji (I4) with the offline recognizer, then describe one (I5) with the mock AI. The
 * strokes are the 待 drawn in the handwriting mockup, in a 342×300 frame.
 */

test('draw 待 in any order, open it, then describe it', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  await page.goto('/handwrite');

  await draw(page);
  const row = page.getByRole('list', { name: 'Candidates' });
  await expect(row.getByRole('button').first()).toHaveText('待');
  await expect(row.getByRole('button')).toHaveCount(5);
  const detail = page.getByRole('region', { name: 'About 待' });
  await expect(detail).toContainText('タイ · ま・つ');
  await expect(detail).toContainText(/In \d+ of your words\.|Not in your words yet\./);

  await page.getByRole('button', { name: 'Undo last stroke' }).click();
  await expect(page.getByText('8 strokes')).toBeAttached();
  await draw(page, MATSU.slice(-1));
  await expect(page.getByText('9 strokes')).toBeAttached();
  await row.getByRole('button', { name: '待' }).click();
  await detail.getByRole('link').click();
  await expect(page).toHaveURL(/\/kanji\/%E5%BE%85$/);
  await page.goBack();

  await page.getByText('Describe', { exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Describe the kanji' })
    .fill('The one from class with a temple on the right, it meant waiting');
  await page.getByRole('button', { name: 'Find the kanji' }).click();
  await expect(row.getByRole('button', { name: '待', pressed: true })).toBeVisible();
  await expect(page.getByRole('note', { name: 'Why 待' })).toContainText('寺 on the right');
});
