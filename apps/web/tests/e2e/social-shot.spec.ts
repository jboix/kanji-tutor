import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { answerField, importKnown, onboard } from './helpers.ts';

/**
 * The phone screen in the social preview (`bun run social`): a wrong reading of 待って and the
 * tutor's note on it, with the mock tutor. Runs only with SOCIAL=1.
 */
const OUT = fileURLToPath(new URL('../../scripts/social-preview/screen.png', import.meta.url));

test.skip(!process.env.SOCIAL, 'only for `bun run social`');
test.use({ deviceScaleFactor: 3, colorScheme: 'light' });

test('the social preview screen', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  await page.goto(`/read?kanji=${encodeURIComponent('待')}&reading=${encodeURIComponent('ま.つ')}`);
  const input = await answerField(page);
  await input.pressSequentially('motte');
  await input.press('Enter');
  await page.getByRole('button', { name: 'Ask the tutor why' }).click();
  const note = page.getByRole('note', { name: 'Why this reading' });
  await expect(note).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT });
});
