import { onboard } from './helpers.ts';
import { expect, test } from './test.ts';

/** The kanji wall: from Home's Where you are, a tile per kanji of the level, each to its page. */

test('Home opens the kanji wall, a tile opens its kanji, and its page shows the wall around it', async ({
  page,
}) => {
  await onboard(page);
  const where = page.getByRole('region', { name: 'Where you are' });
  await where.getByRole('link', { name: 'Kanji wall' }).click();
  await expect(page).toHaveURL(/\/kanji\/wall$/);
  await expect(page.getByRole('heading', { name: /Your kanji wall · 0 you read/ })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'N5' })).toBeChecked();
  const first = page.getByRole('list').getByRole('link').first();
  const char = (await first.textContent()) ?? '';
  await first.click();
  await expect(page.getByRole('heading', { name: char, exact: true })).toBeVisible();
  const glimpse = page.getByRole('region', { name: 'Your kanji wall' });
  await expect(
    glimpse.getByRole('link', { name: `${char}: Not yet, the one you are on` }),
  ).toBeVisible();
  await glimpse.getByRole('link', { name: /^All \d+$/ }).click();
  await expect(page).toHaveURL(/\/kanji\/wall\?at=/);
  await expect(page.getByRole('link', { name: /the one you are on/ })).toHaveAccessibleName(
    `${char}: Not yet, the one you are on`,
  );
});
