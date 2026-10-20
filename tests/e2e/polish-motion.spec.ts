import { expect, type Page, test } from '@playwright/test';
import { answerField, beginMix, importKnown, launched, onboard } from './helpers.ts';
import { fakeJapaneseVoice } from './lesson-play.ts';

/** The polish round (D122–D125): the entrance, sound off everywhere, the Settings icons. */

const speaker = (page: Page) => page.getByRole('button', { name: 'Play the sentence' });

test('Sound off in Appearance silences the session: no speaker, no speech (D125)', async ({
  page,
}) => {
  await fakeJapaneseVoice(page);
  await onboard(page);
  await importKnown(page);
  await page.goto('/settings/appearance');
  const knob = page.getByRole('slider', { name: 'Sound' });
  await knob.fill('0');
  await expect(knob).toHaveAttribute('aria-valuetext', 'Off');
  await page.goto('/settings');
  await expect(page.getByRole('link', { name: /^Appearance/ })).toContainText('Sound off');
  await page.goto('/');
  await beginMix(page);
  await answerField(page);
  await expect(speaker(page)).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { spoken: string[] }).spoken)).toEqual([]);
});

test('with sound on, the speaker plays the sentence (D125)', async ({ page }) => {
  await fakeJapaneseVoice(page);
  await onboard(page);
  await importKnown(page);
  await page.goto('/');
  await beginMix(page);
  await answerField(page);
  await speaker(page).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { spoken: string[] }).spoken.length))
    .toBe(1);
});

test("a screen's sections fade in top to bottom, and settle within 850ms (D124, D131)", async ({
  page,
}) => {
  await onboard(page);
  await launched(page);
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Learn' }).click();
  await expect(page.getByRole('heading', { name: 'Learn', level: 1 })).toBeVisible();
  const timings = await page.evaluate(() =>
    [...document.querySelectorAll('[data-screen-body] > *')].map((el) => {
      const style = getComputedStyle(el);
      return {
        name: style.animationName,
        delay: style.animationDelay,
        length: style.animationDuration,
      };
    }),
  );
  expect(timings.length).toBeGreaterThan(2);
  expect(timings.every((t) => t.name === 'enter')).toBe(true);
  const delays = timings.map((t) => Number.parseFloat(t.delay));
  expect(delays).toEqual([...delays].sort((a, b) => a - b));
  const ends = timings.map((t) => Number.parseFloat(t.delay) + Number.parseFloat(t.length));
  expect(Math.max(...ends)).toBeLessThanOrEqual(0.85);
});

test('no entrance with reduced motion, nor on a session card (D124)', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  await page.goto('/');
  await beginMix(page);
  await answerField(page);
  const card = await page.evaluate(() =>
    [...document.querySelectorAll('[data-screen-body] > *')].map(
      (el) => getComputedStyle(el).animationName,
    ),
  );
  expect(card.includes('enter')).toBe(false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/learn');
  await expect(page.getByRole('heading', { name: 'Learn', level: 1 })).toBeVisible();
  const names = await page.evaluate(() =>
    [...document.querySelectorAll('[data-screen-body] > *')].map(
      (el) => getComputedStyle(el).animationName,
    ),
  );
  expect(names.every((name) => name === 'none')).toBe(true);
});

test('Settings and the bar use line icons, not kanji (D122)', async ({ page }) => {
  await onboard(page);
  await page.goto('/settings');
  const rows = page.getByRole('main').getByRole('link');
  await expect(rows.first()).toBeVisible();
  // The square icon and the chevron.
  for (const row of await rows.all()) await expect(row.locator('svg')).toHaveCount(2);
  await expect(page.getByRole('main').locator('[lang="ja"]')).toHaveCount(0);
  const learn = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Learn' });
  await expect(learn.locator('svg')).toHaveCount(1);
  await expect(learn).toHaveText('Learn');
});
