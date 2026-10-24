import { onboard } from './helpers.ts';
import { expect, test } from './test.ts';

test('the learned screen opens a grammar page with examples and related points', async ({
  page,
}) => {
  await onboard(page);
  await page.goto('/learned');
  await page
    .locator('label')
    .filter({ hasText: /^Grammar$/ })
    .click();
  await page.getByRole('checkbox', { name: 'Show not started' }).check();
  await page.getByRole('button', { name: /^N5 grammar/ }).click();
  await page
    .getByRole('link', { name: /^〜です/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/grammar\/desu$/);
  await expect(page.getByRole('heading', { level: 1, name: '〜です' })).toBeVisible();

  const where = page.getByRole('region', { name: "Where you'll see it" });
  const span = where.locator('[data-target]').first();
  await expect(span).toBeVisible();
  await expect(span).toContainText('です');
  await expect(where.locator('li').first()).toContainText('“');

  const related = page.getByRole('region', { name: 'Easy to confuse with' });
  await related.getByRole('link', { name: /〜だ/ }).first().click();
  await expect(page).toHaveURL(/\/grammar\/da$/);
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveURL(/\/grammar\/desu$/);
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveURL(/\/learned$/);
});

test('the grammar index searches and lists particles', async ({ page }) => {
  await onboard(page);
  await page.goto('/learned');
  await page
    .locator('label')
    .filter({ hasText: /^Grammar$/ })
    .click();
  await page.getByRole('link', { name: /All grammar points/ }).click();
  await expect(page).toHaveURL(/\/grammar$/);
  await expect(page.getByRole('region', { name: 'Particles and function words' })).toBeVisible();
  await page.getByRole('searchbox', { name: /Search grammar/ }).fill('all right to');
  await page.getByRole('link', { name: /〜てもいい/ }).click();
  await expect(page).toHaveURL(/\/grammar\/te-mo-ii$/);
});

test('the grammar intro card goes on to the page', async ({ page }) => {
  await onboard(page);
  await page.goto('/grammar/desu?intro=1');
  const card = page.getByRole('region', { name: 'New grammar: 〜です' });
  await expect(card).toBeVisible();
  await expect(card.locator('[data-target]').first()).toBeVisible();
  await card.getByRole('button', { name: 'Got it' }).click();
  await expect(page).toHaveURL(/\/grammar\/desu$/);
  await expect(page.getByRole('heading', { level: 1, name: '〜です' })).toBeVisible();
});
