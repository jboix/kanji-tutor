import { fileURLToPath } from 'node:url';
import { onboard, photograph } from './helpers.ts';
import { expect, test } from './test.ts';

/** Three generic lines rendered to a PNG; the mock OCR returns the same lines for any image. */
const HANDOUT = fileURLToPath(new URL('./fixtures/handout.png', import.meta.url));
const LINE_3 = 'しかし、方言を話す人が減っているわけではない。';

test('a handout becomes this week’s items', async ({ page }) => {
  await onboard(page);
  await page.getByRole('link', { name: 'Mark what you already know' }).click();
  await page.getByRole('checkbox', { name: 'JLPT N4 (approximate list)' }).check();
  await page.getByRole('button', { name: 'Import' }).click();
  await expect(page.getByRole('status')).toContainText('words marked as known', {
    timeout: 20_000,
  });

  const started = Date.now();
  await page.goto('/capture');
  await photograph(page, HANDOUT);
  const heading = page.getByRole('heading', { name: /^You can read \d+% of this$/ });
  await expect(heading).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Handout · photographed today')).toBeVisible();

  await page.getByRole('button', { name: LINE_3 }).click();
  // The line's words and grammar show first; the tutor explains it only when asked (A13).
  await expect(page.getByRole('region', { name: 'Grammar in this line' })).toBeVisible();
  await page.getByRole('button', { name: 'Ask the tutor about this line' }).click();
  const note = page.getByRole('note', { name: 'Explanation of this line' });
  await expect(note).toContainText("it isn't that fewer people speak dialects");

  const list = page.getByRole('region', { name: 'New words and grammar points' });
  await list.getByRole('button', { name: 'Review list' }).click();
  await list.getByLabel('Lesson tag').fill('Tobira 第4課');
  await expect(list.getByRole('checkbox', { name: /方言/ })).toBeChecked();
  await expect(list.getByText('ほうげん')).toBeVisible();
  await list.getByRole('checkbox', { name: /〜わけではない/ }).check();
  await page.getByRole('button', { name: 'Add to Tobira 第4課' }).click();
  await expect(page.getByRole('status')).toContainText(/^Added \d+ words? and 1 grammar point/);
  const seconds = (Date.now() - started) / 1000;
  test
    .info()
    .annotations.push({ type: 'handout-to-items', description: `${seconds.toFixed(1)} s` });

  await page.getByRole('link', { name: 'Go to Home' }).click();
  const week = page.getByRole('region', { name: 'This week in class' });
  await expect(week).toContainText('Tobira 第4課');
  await expect(week).toContainText(/0 of \d+/);
  await expect(week).toContainText('0 of 1');

  await page.goto('/capture');
  await expect(page.getByRole('link', { name: /日本には地域/ })).toContainText('You can read');
});
