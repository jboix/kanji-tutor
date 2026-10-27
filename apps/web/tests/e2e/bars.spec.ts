import { beginMix, importKnown, onboard } from './helpers.ts';
import { expect, type Page, test } from './test.ts';

/**
 * Every kind of bottom bar sits wholly on the screen: the tab bar, a session's answer bar, a
 * lesson's opening and an episode's player. Each screen is saved as a screenshot, kept in the
 * test's output folder, to look at.
 */

/** The screen frame's bottom and its last child's (the bar), against the viewport's height. */
async function barFits(page: Page, name: string) {
  await page.waitForTimeout(400);
  const fit = await page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>('[class*="_frame_"]');
    const bar = frame?.lastElementChild?.getBoundingClientRect();
    return {
      height: window.innerHeight,
      frame: frame?.getBoundingClientRect().bottom ?? Number.NaN,
      bar: bar?.bottom ?? Number.NaN,
      barTop: bar?.top ?? Number.NaN,
    };
  });
  const file = test.info().outputPath(`${name.replace(/\W+/g, '-')}.png`);
  await page.screenshot({ path: file });
  expect(fit.frame, `${name}: the frame ends on screen`).toBeLessThanOrEqual(fit.height + 0.5);
  expect(fit.bar, `${name}: the bar ends on screen`).toBeLessThanOrEqual(fit.height + 0.5);
  expect(fit.barTop, `${name}: the bar starts on screen`).toBeLessThan(fit.height);
}

test('every bottom bar sits wholly on the screen', async ({ page }) => {
  test.setTimeout(120_000);
  await onboard(page);
  await importKnown(page);
  await page.goto('/settings');
  await expect(page.locator('[data-bottom-nav]')).toBeVisible();
  await barFits(page, 'settings: tab bar');
  await page.goto('/');
  await beginMix(page);
  await expect(page.locator('[data-card]')).toBeVisible();
  await barFits(page, 'session: answer bar');
  await page.goto('/read?unit=family&section=words&part=1');
  await expect(page.getByRole('button', { name: /^Start: / })).toBeVisible();
  await barFits(page, 'lesson opening: player and Start');
  await page.goto('/kanji/wall');
  await expect(page.getByRole('heading', { name: 'Kanji wall' })).toBeVisible();
  await barFits(page, 'kanji wall: no bar');
  await page.goto('/units/family/episode');
  await expect(page.getByRole('button', { name: /^Play/ })).toBeVisible();
  await barFits(page, 'episode: player');
});
