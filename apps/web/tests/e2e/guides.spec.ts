import { onboard } from './helpers.ts';
import { expect, test } from './test.ts';

/** The guides from Learn, each saved as a full-page screenshot to look at, and a grammar link. */
const GUIDES = ['verb-groups', 'plain-polite', 'te-form', 'adjectives', 'conjugation', 'keigo'];

test('the guides open from Learn and fit the screen', async ({ page }) => {
  test.setTimeout(120_000);
  await onboard(page);
  await page.goto('/learn');
  await page.getByRole('link', { name: /^Guides/ }).click();
  await expect(page.getByRole('heading', { name: 'Guides' })).toBeVisible();
  const size = page.viewportSize() ?? { width: 360, height: 740 };
  for (const id of GUIDES) {
    // Moved within the app: a reload would show the start-up splash over the guide.
    await page.locator(`a[href="/guides/${id}"]`).click();
    await expect(page.locator('h1')).toBeVisible();
    await page.waitForTimeout(1200);
    await expect(page.locator('[data-tutor-float]')).toBeInViewport();
    const wide = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 0.5,
    );
    expect(wide, `${id}: nothing runs off the side`).toBe(false);
    const clipped = await page.evaluate(() =>
      [...document.querySelectorAll('table')].some(
        (table) => table.getBoundingClientRect().right > window.innerWidth + 0.5,
      ),
    );
    expect(clipped, `${id}: every table fits the width`).toBe(false);
    // The body scrolls inside the frame: a viewport as tall as it shows the whole guide.
    const tall = await page.evaluate(() => document.querySelector('main')?.scrollHeight ?? 0);
    await page.setViewportSize({ width: size.width, height: tall + 120 });
    await page.screenshot({ path: test.info().outputPath(`${id}.png`) });
    await page.setViewportSize(size);
    await page.goBack();
  }
});

test('a grammar point’s page links to its guide', async ({ page }) => {
  await onboard(page);
  await page.goto('/grammar/te-kudasai');
  await page.getByRole('link', { name: /^Guide: The て-form/ }).click();
  await expect(page.getByRole('heading', { name: 'て形とた形' })).toBeVisible();
});
