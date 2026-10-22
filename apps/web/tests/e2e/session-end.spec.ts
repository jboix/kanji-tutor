import { expect, type Page, test } from '@playwright/test';
import { toRomaji } from 'wanakana';
import { layoutReport, scanHere } from './a11y-checks.ts';
import { importKnown, onboard } from './helpers.ts';
import { card, playCard, playSession, sessionDone } from './lesson-play.ts';

/**
 * The session's end (W-end): the check, お疲れさまでした, three counts, what was new,
 * what to look at again, then Retry N missed and Next session. Retry plays only the missed cards
 * and ends on its own; with nothing missed there is no list and no Retry.
 */
const KANJI = `kanji=${encodeURIComponent('待')}&reading=${encodeURIComponent('ま.つ')}`;
const FOCUS = `/read?${KANJI}`;
/** The same focus with sentences only, so every miss can be answered right in the retry. */
const READING_ONLY = `/read?${KANJI}&only=reading`;

const retryButton = (page: Page) => page.getByRole('button', { name: /^Retry \d+ missed$/ });
const lookAgain = (page: Page) => page.getByRole('region', { name: 'To look at again' });

/** Opens every missed entry and returns them: sentence id and the reading missed, in order. */
async function missedEntries(page: Page) {
  const seeAll = page.getByRole('button', { name: /^See all \d+$/ });
  if (await seeAll.isVisible()) await seeAll.click();
  return page.locator('[data-missed]').evaluateAll((els) =>
    els.map((el) => ({
      sentence: el.getAttribute('data-sentence') ?? '',
      reading: el.getAttribute('data-reading') ?? '',
    })),
  );
}

async function playToEnd(page: Page, path: string) {
  await onboard(page);
  await importKnown(page);
  await page.goto(path);
  await playSession(page);
  await expect(sessionDone(page)).toBeVisible();
}

test('the end shows the check, the counts, the misses and both actions', async ({ page }) => {
  await playToEnd(page, FOCUS);
  const title = page.getByRole('heading', { level: 1 });
  await expect(title).toHaveAccessibleName('お疲れさまでした');
  await expect(title.locator('rt')).toHaveText('つか');
  await expect(page.getByText(/^Session done · about \d+ minutes?$/)).toBeVisible();
  const counts = page.getByRole('list', { name: 'Counts' }).getByRole('listitem');
  await expect(counts).toHaveCount(3);
  await expect(counts.nth(1)).toHaveText(/^0 (read right|right)$/);
  await expect(lookAgain(page)).toBeVisible();
  await expect(page.locator('[data-done-mark]')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('main')).not.toContainText(/great|amazing|well done|congrat|!/i);
  await expect(page.getByRole('link', { name: 'Back to Home' })).toHaveCount(0);

  const retry = retryButton(page);
  const next = page.getByRole('button', { name: 'Next session' });
  for (const button of [retry, next]) {
    const box = await button.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
  // The raised Start disc stays below the buttons.
  const disc = page.getByRole('navigation').getByRole('link', { name: /Start/ });
  const discTop = (await disc.locator('span').first().boundingBox())?.y ?? 0;
  const nextBox = await next.boundingBox();
  expect(discTop).toBeGreaterThanOrEqual((nextBox?.y ?? 0) + (nextBox?.height ?? 0));

  // Let the parts rise in, then axe in light and dark, no sideways scroll, 44px targets.
  await expect(next.locator('..')).toHaveCSS('opacity', '1', { timeout: 5000 });
  expect(await scanHere(page, 'session end')).toEqual([]);
  const layout = await layoutReport(page);
  expect(layout.wide).toBe(false);
  expect(layout.small).toEqual([]);
  await page.evaluate(() => {
    delete document.documentElement.dataset.theme;
  });

  await next.click();
  await expect(card(page)).toBeVisible({ timeout: 20_000 });
  expect(decodeURIComponent(page.url())).toContain('/read?kanji=待&reading=ま.つ');
});

test('Retry plays only the missed cards, then offers Retry again', async ({ page }) => {
  await playToEnd(page, FOCUS);
  const label = (await retryButton(page).textContent()) ?? '';
  const missed = await missedEntries(page);
  expect(label).toBe(`Retry ${missed.length} missed`);
  const sentences = new Set(missed.map((m) => m.sentence));
  await retryButton(page).click();
  // The finished round's end stays a moment after the click; the retry starts once it has gone.
  await expect(sessionDone(page)).toBeHidden();
  const played: string[] = [];
  for (let i = 0; i <= missed.length; i++) {
    await expect(card(page).or(sessionDone(page)).first()).toBeVisible({ timeout: 20_000 });
    if (await sessionDone(page).isVisible()) break;
    played.push((await card(page).getAttribute('data-sentence')) ?? '');
    await playCard(page);
  }
  await expect(sessionDone(page)).toBeVisible();
  expect(played.length).toBeGreaterThan(0);
  expect(played.length).toBeLessThanOrEqual(missed.length);
  for (const id of played) expect(sentences.has(id)).toBe(true);
  // Missed again: the retry round's own end offers another retry, and the next session.
  await expect(retryButton(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next session' })).toBeVisible();
});

/** Answers the current reading card with the readings it missed before, in order. */
async function answerRight(page: Page, readings: string[]) {
  const input = page.locator('form input[lang="ja"]');
  const gotIt = page.getByRole('button', { name: 'Got it' });
  for (const reading of readings) {
    await expect(input.or(gotIt).first()).toBeVisible();
    if (await gotIt.isVisible()) await gotIt.click();
    await input.pressSequentially(toRomaji(reading));
    await input.press('Enter');
    await page.getByRole('button', { name: /^Next (sentence|word)$/ }).click();
  }
}

test('with nothing missed, there is no list to look at again and no Retry', async ({ page }) => {
  await playToEnd(page, READING_ONLY);
  const missed = await missedEntries(page);
  await retryButton(page).click();
  await expect(sessionDone(page)).toBeHidden();
  for (let i = 0; i <= missed.length; i++) {
    await expect(card(page).or(sessionDone(page)).first()).toBeVisible({ timeout: 20_000 });
    if (await sessionDone(page).isVisible()) break;
    const id = await card(page).getAttribute('data-sentence');
    await answerRight(
      page,
      missed.filter((m) => m.sentence === id).map((m) => m.reading),
    );
  }
  await expect(sessionDone(page)).toBeVisible();
  await expect(lookAgain(page)).toHaveCount(0);
  await expect(retryButton(page)).toHaveCount(0);
  const counts = page.getByRole('list', { name: 'Counts' }).getByRole('listitem');
  await expect(counts.nth(2)).toHaveText('0 to look at again');
  await expect(page.getByRole('button', { name: 'Next session' })).toBeVisible();
});

test('everything simply shows under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await playToEnd(page, FOCUS);
  const mark = page.locator('[data-done-mark]');
  await expect(mark).toBeVisible();
  expect(await mark.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  const row = retryButton(page).locator('..');
  const names = await page
    .locator('main *')
    .or(row)
    .evaluateAll((els) => [...new Set(els.map((el) => getComputedStyle(el).animationName))]);
  expect(names).toEqual(['none']);
  expect(await row.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
});
