import { answerField, importKnown, onboard } from './helpers.ts';
import { expect, type Locator, type Page, test } from './test.ts';

const FOCUS = `/read?kanji=${encodeURIComponent('紹')}&reading=${encodeURIComponent('ショウ')}`;

/** U9: the typed answer goes with the field's own arrow, no return key, keyboard closed. */
test('sends a typed answer with the submit arrow, without Enter', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  await page.goto(FOCUS);
  const input = await answerField(page);
  const send = page.getByRole('button', { name: 'Send answer' });
  await expect(send).toBeDisabled();
  await input.pressSequentially('shoukai');
  // The keyboard closed: the field is no longer focused when the arrow is tapped.
  await input.blur();
  await expect(send).toBeEnabled();
  await send.tap();
  await expect(page.getByText('Read as')).toBeVisible();
});

/** U10: the sheet with a handle goes with a drag down, springs back from a short one. */
/** The handle's centre once the sheet has stopped moving (it rises, and springs back after a pull). */
async function settledCentre(page: Page, handle: Locator): Promise<{ x: number; y: number }> {
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

test('drags a bottom sheet down to dismiss it', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  await page.goto(FOCUS);
  await answerField(page);
  const open = page.getByRole('button', { name: 'Explain this sentence' });
  const sheet = page.getByRole('dialog', { name: 'About this sentence' });
  await open.click();
  await expect(sheet).toBeVisible();
  const handle = sheet.locator('[data-sheet-handle]');
  // A short, slow pull springs back.
  let { x, y } = await settledCentre(page, handle);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 40, { steps: 5 });
  await page.waitForTimeout(250);
  await page.mouse.up();
  await expect(sheet).toBeVisible();
  // A long pull closes it, and focus goes back to the button that opened it.
  ({ x, y } = await settledCentre(page, handle));
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 400, { steps: 10 });
  await page.mouse.up();
  await expect(sheet).toBeHidden();
  await expect(open).toBeFocused();
  // A tap on the dimmed area above it closes it too.
  await open.click();
  await expect(sheet).toBeVisible();
  await page.mouse.click(x, 20);
  await expect(sheet).toBeHidden();
});
