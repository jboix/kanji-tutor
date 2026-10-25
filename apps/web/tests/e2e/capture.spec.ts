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

test('three handout pages become one scanned lesson', async ({ page }) => {
  await onboard(page);
  await page.goto('/capture');
  await expect(page.getByRole('heading', { name: 'New scan' })).toBeVisible();
  await photograph(page, [HANDOUT, HANDOUT, HANDOUT]);
  await expect(page.getByRole('img', { name: 'Photo of page 3' })).toBeVisible();
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
  await expect(page.getByText(/^Scanned /)).toBeVisible();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Weather week');
  await expect(page.getByText(/^0 of \d+ practised$/)).toBeVisible();

  await page.goto('/capture');
  const recent = page.getByRole('region', { name: 'Your scanned lessons' });
  await expect(recent.getByRole('link', { name: /Weather week/ })).toContainText('3 pages');
});
