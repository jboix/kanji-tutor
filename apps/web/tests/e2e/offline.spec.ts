import { answerField, beginMix, importKnown, onboard } from './helpers.ts';
import { expect, test } from './test.ts';

/**
 * N1: after one online visit, the app reloads offline from the service worker, and the reading
 * loop, dictionary and kanji pages keep working. AI features say they are offline.
 */
test('the reading loop and kanji pages work after an offline reload', async ({ page, context }) => {
  await onboard(page);
  await importKnown(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // A reload puts the page under the now-active service worker's control.
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText(/\d+ sentences? · \d+ minutes?/)).toBeVisible();

  await beginMix(page);
  const input = await answerField(page);
  await input.pressSequentially('nu');
  await input.press('Enter');
  await expect(page.getByText('You wrote')).toBeVisible();
  // The app's own note works offline; the tutor says it needs a connection when asked (A13).
  await expect(page.getByRole('region', { name: 'What went wrong' })).toBeVisible();
  await page.getByRole('button', { name: 'Ask the tutor why' }).click();
  await expect(page.getByText(/You're offline/)).toBeVisible();

  await page.goto(`/kanji/${encodeURIComponent('生')}`);
  await expect(page.getByRole('heading', { name: '生' })).toBeVisible();
  await page.goto('/kanji');
  await expect(page.getByRole('heading', { name: '漢字' })).toBeVisible();
  // Dictionary lookup (I1) needs no network: romaji turns into kana and finds words.
  await page
    .getByRole('textbox', { name: 'Look up a kanji or a reading' })
    .pressSequentially('eki');
  await expect(page.getByRole('button', { name: /駅/ }).first()).toBeVisible();
});
