import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { onboard, photograph } from './helpers.ts';
import { expect, test } from './test.ts';

/** A generic page rendered to a PNG; the mock tutor reads each page by its number in the scan. */
const HANDOUT = fileURLToPath(new URL('./fixtures/handout.png', import.meta.url));

/** How much taller the scrolling body is than the viewport, in CSS px. */
const overflow = (page: Page) =>
  page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? Math.max(0, main.scrollHeight - main.clientHeight) : 0;
  });

/**
 * Screenshots of the two screens go to `SCAN_SHOTS` when it names a folder: the viewport, and the
 * whole scrolling body (`-full`).
 */
async function shot(page: Page, name: string) {
  const dir = process.env.SCAN_SHOTS;
  const size = page.viewportSize();
  if (!dir || !size || test.info().project.name !== 'phone-390') return;
  mkdirSync(dir, { recursive: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(dir, `${name}.png`), animations: 'disabled' });
  await page.setViewportSize({ ...size, height: size.height + (await overflow(page)) });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(dir, `${name}-full.png`), animations: 'disabled' });
  await page.setViewportSize(size);
}

/** From the empty list, through the new scan screen, to the review of three read pages. */
async function readThreePages(page: Page) {
  await onboard(page);
  await page.goto('/capture');
  await expect(page.getByRole('heading', { name: 'Scanned lessons' })).toBeVisible();
  await page.getByRole('link', { name: 'New scan' }).click();
  await expect(page.getByRole('heading', { name: 'New scan' })).toBeVisible();
  await photograph(page, [HANDOUT, HANDOUT, HANDOUT]);
  await expect(page.getByRole('img', { name: 'Photo of page 3' })).toBeVisible();
}

test('three handout pages become one scanned lesson', async ({ page }) => {
  await readThreePages(page);
  const read = page.getByRole('button', { name: 'Read 3 pages, 3 requests, uses AI' });
  await expect(read).toBeVisible();
  // The tutor is one tap away before anything is read.
  await expect(
    page.getByRole('button', { name: 'Ask the tutor about scanning a handout' }),
  ).toBeInViewport();
  await shot(page, 'import');

  await read.click();
  const title = page.getByLabel('Title · suggested, edit it');
  await expect(title).toHaveValue('Weather and plans', { timeout: 30_000 });
  await expect(page.getByText('3 pages read')).toBeVisible();
  const pages = page.getByRole('region', { name: 'The pages' });
  await expect(pages.getByText('Kanji list')).toBeVisible();
  await expect(pages.getByText('Grammar explanation')).toBeVisible();
  await expect(pages.getByText('Exercise handout')).toBeVisible();
  await expect(page.getByRole('region', { name: /^Kanji · 5$/ })).toBeVisible();
  await expect(page.getByRole('region', { name: /^Words · 5$/ })).toContainText('not in our lists');
  await expect(page.getByRole('region', { name: 'Exercises from page 3 · 8' })).toContainText(
    'Choose the right form · 2 questions',
  );
  await expect(page.getByText(/They stay hidden until you answer/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Ask the tutor about Weather and plans' }),
  ).toBeInViewport();
  await shot(page, 'review');

  await page.getByRole('button', { name: 'Change what page 2 is' }).click();
  await page.getByRole('radio', { name: 'Mixed page' }).click();
  await expect(pages.getByText('Mixed page')).toBeVisible();
  await page.getByRole('button', { name: /1 line may be misread/ }).click();
  await page.getByRole('button', { name: 'This is right' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /may be misread/ })).toHaveCount(0);
  await title.fill('Weather week');
  await page.getByRole('button', { name: 'Save the lesson' }).click();

  await expect(page.getByRole('heading', { name: 'Weather week' })).toBeVisible();
  await expect(page.getByText(/^Scanned .* · 3 pages$/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'What the lesson holds' })).toContainText('Kanji');
  await expect(page.getByRole('link', { name: /^Practise this lesson/ })).toBeInViewport();
  await page.getByRole('button', { name: 'See the photo of page 1' }).click();
  await expect(page.getByRole('dialog', { name: 'Page 1' }).getByRole('img')).toBeVisible();
  await page.keyboard.press('Escape');
  await shot(page, 'lesson');

  await page.goto('/capture');
  const card = page.getByRole('link', { name: /Weather week/ });
  await expect(card).toContainText('3 pages');
  await expect(card).toContainText('Not started');
  await shot(page, 'list');
});

/** Past the cards before the first handout question: intros, readings and drills skipped. */
async function toHandoutQuestion(page: Page) {
  const handout = page.getByText(/^From your handout · page 3/);
  const gotIt = page.getByRole('button', { name: 'Got it' });
  const dontKnow = page.getByRole('button', { name: "I don't know" });
  const onward = page.getByRole('button', {
    name: /^(Next( sentence| word| question| card)?|Done)$/,
  });
  for (let step = 0; step < 20; step++) {
    await expect(handout.or(gotIt).or(dontKnow).first()).toBeVisible({ timeout: 15_000 });
    if (await handout.isVisible()) return;
    if (await gotIt.isVisible()) await gotIt.click();
    else {
      await dontKnow.click();
      await onward.first().click();
    }
  }
  await expect(handout).toBeVisible();
}

test('a handout question is answered, then the tutor’s answer shows as the tutor’s', async ({
  page,
}) => {
  await readThreePages(page);
  await page.getByRole('button', { name: /^Read 3 pages/ }).click();
  await page.getByRole('button', { name: 'Save the lesson' }).click({ timeout: 30_000 });
  await page.getByRole('link', { name: /^Practise this lesson/ }).click();
  await expect(page).toHaveURL(/\/read\?scan=/);
  await toHandoutQuestion(page);
  const stem = page.locator('p:has([data-blank])', { hasText: '雨が降り' });
  await expect(stem).toBeVisible();
  const line = page.locator('p:has([data-blank])');
  // Its words open the word sheet and take furigana like any sentence's.
  await expect(stem.getByRole('button', { name: '雨', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Show furigana on known words' }).click();
  await expect(line.locator('ruby[data-reading="あめ"]')).toBeVisible();
  await expect(page.getByText(/so it looks about to rain/)).toHaveCount(0);
  await page.getByRole('button', { name: 'そう' }).click();
  await expect(page.getByText('Right', { exact: true })).toBeVisible();
  await expect(page.locator('[data-fill]')).toHaveText('そう');
  const tutor = page.getByLabel('Answer from the tutor');
  await expect(tutor).toContainText('Your handout prints none.');
  await expect(tutor).toContainText('looks about to rain');
  await shot(page, 'practice');
  await page.getByRole('button', { name: 'See the page' }).click();
  const sheet = page.getByRole('dialog', { name: 'Page 3 of your handout' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Close', exact: true }).click();
  const card = page.locator('[data-card]');
  const before = await card.getAttribute('data-sentence');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(card).not.toHaveAttribute('data-sentence', before ?? '');
});
