import { onboard } from './helpers.ts';
import { card, passIntro, playCard } from './lesson-play.ts';
import { expect, test } from './test.ts';

/**
 * "Don't explain new grammar first", ticked on a grammar intro in a session: the intros still
 * ahead are passed over, their points come as "New grammar" chips, and the chip's sheet shows
 * the box ticked, to untick it there.
 */
test('a grammar intro’s box stops the next intros, and a chip’s sheet unticks it', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await onboard(page);
  await page.goto('/units/i-am-a-student');
  await page.getByRole('button', { name: /^文法/ }).click();
  await expect(card(page)).toHaveAttribute('data-card', 'grammar-intro');
  const box = page.getByRole('checkbox', { name: 'Don’t explain new grammar first' });
  await box.check();
  await expect(page.getByText(/Settings › Sessions/)).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('ticked.png') });
  await passIntro(page);

  const chip = page.locator('[data-new-chip="grammar"]');
  for (let i = 0; i < 20 && !(await chip.isVisible()); i++) {
    expect(await card(page).getAttribute('data-card')).not.toBe('grammar-intro');
    await playCard(page);
    await expect(card(page)).toBeVisible();
  }
  await chip.first().click();
  const sheet = page.getByRole('dialog', { name: /^New grammar/ });
  const again = sheet.getByRole('checkbox', { name: 'Don’t explain new grammar first' });
  await expect(again).toBeChecked();
  await page.waitForTimeout(400);
  await page.screenshot({ path: test.info().outputPath('chip-sheet.png') });
  await again.uncheck();
  await expect(sheet.getByText(/Settings › Sessions/)).toHaveCount(0);
});
