import { expect, type Locator, type Page, test } from '@playwright/test';
import { answerField, importKnown, launched, onboard } from './helpers.ts';

/**
 * The real-iPhone checks (N1, U10, U12) as far as WebKit with iPhone emulation can take them
 * (D97): only in the opt-in `iphone-webkit` project (`PW_WEBKIT=1`). Safari on a phone, the
 * home-screen launch and a finger drag still need checking by hand.
 */

const FOCUS = `/read?kanji=${encodeURIComponent('紹')}&reading=${encodeURIComponent('ショウ')}`;

async function settled(page: Page, handle: Locator): Promise<{ x: number; y: number }> {
  let last = '';
  for (let tries = 0; tries < 40; tries++) {
    const box = await handle.boundingBox();
    const now = box ? `${box.x},${box.y}` : '';
    if (box && now === last) return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    last = now;
    await page.waitForTimeout(50);
  }
  throw new Error('the sheet never settled');
}

test('the launch screen shows on a cold start and leaves (U12)', async ({ page }) => {
  await page.goto('/', { waitUntil: 'commit' });
  await expect(page.locator('#launch')).toBeAttached();
  await launched(page);
  await expect(page).toHaveURL(/\/welcome$/);
});

test('the install banner gives the Share steps on an iPhone (N1d)', async ({ page }) => {
  await onboard(page);
  const banner = page.getByRole('complementary', { name: 'Install the app' });
  await expect(banner).toBeVisible();
  await expect(banner.getByText(/then Add to Home Screen/)).toBeVisible();
});

test('a bottom sheet springs back from a short pull and goes with a long one (U10)', async ({
  page,
}) => {
  await onboard(page);
  await importKnown(page);
  await page.goto(FOCUS);
  await answerField(page);
  const sheet = page.getByRole('dialog', { name: 'About this sentence' });
  await page.getByRole('button', { name: 'Explain this sentence' }).click();
  await expect(sheet).toBeVisible();
  const handle = sheet.locator('[data-sheet-handle]');
  let { x, y } = await settled(page, handle);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 40, { steps: 5 });
  await page.waitForTimeout(250);
  await page.mouse.up();
  await expect(sheet).toBeVisible();
  ({ x, y } = await settled(page, handle));
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 400, { steps: 10 });
  await page.mouse.up();
  await expect(sheet).toBeHidden();
});
