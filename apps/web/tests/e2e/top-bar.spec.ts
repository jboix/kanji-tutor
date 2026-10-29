import { onboard } from './helpers.ts';
import { expect, test } from './test.ts';

/**
 * The top bar on a detail page: back's arrow lines up with the content, close to the tab sits at
 * the bar's end, and the list's name is centred between them. Saved as a screenshot to look at.
 */
test('back lines up with the content, close sits at the end, the list is named', async ({
  page,
}) => {
  await onboard(page);
  await page.goto('/learn');
  await page.getByRole('link', { name: /^Guides/ }).click();
  await page.locator('a[href="/guides/te-form"]').click();
  const bar = page.locator('header').first();
  await expect(bar.getByText('Guides', { exact: true })).toBeVisible();
  const close = page.getByRole('button', { name: 'Close these pages' });
  await expect(close).toBeVisible();
  await page.waitForTimeout(400);
  const at = await page.evaluate(() => {
    const arrow = document.querySelector('header button svg path')?.getBoundingClientRect();
    const heading = document.querySelector('main h1')?.getBoundingClientRect();
    return { arrow: arrow?.left ?? 0, content: heading?.left ?? 0, width: window.innerWidth };
  });
  const closeBox = await close.boundingBox();
  await page.screenshot({ path: test.info().outputPath('guide-top-bar.png') });
  expect(Math.abs(at.arrow - at.content), 'the arrow lines up with the content').toBeLessThan(3);
  expect(closeBox && closeBox.x + closeBox.width, 'close sits at the end').toBeGreaterThan(
    at.width - 8,
  );
});
