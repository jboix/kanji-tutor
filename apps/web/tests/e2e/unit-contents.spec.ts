import { onboard } from './helpers.ts';
import { expect, test } from './test.ts';

/** A unit's "In this unit" card: its words and its grammar under their own labels, saved to look at. */
test('the unit card shows words and grammar apart', async ({ page }) => {
  await onboard(page);
  await page.goto('/units/i-am-a-student');
  const card = page.getByRole('region', { name: 'In this unit' });
  await expect(card.getByRole('heading', { name: 'Words' })).toBeVisible();
  await expect(card.getByRole('heading', { name: 'Grammar' })).toBeVisible();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await card.screenshot({ path: test.info().outputPath('unit-contents.png') });
});
