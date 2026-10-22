import { expect, test } from '@playwright/test';
import { importKnown, onboard } from './helpers.ts';

/**
 * Answer by voice (I2) with the mock AI, which always transcribes しょかい. Chromium gets a fake
 * microphone, so a real recording is made and sent to transcribeReading. The session is focused
 * on 紹 read ショウ, so the target is always 紹介 (the Phase 4 gate: a mispronounced long vowel
 * is caught, not auto-corrected).
 */
test.use({
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
  permissions: ['microphone'],
});

test('hold to speak, let go, and the transcribed reading is graded as said', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  await page.goto(
    `/read?kanji=${encodeURIComponent('紹')}&reading=${encodeURIComponent('ショウ')}`,
  );
  await expect(page.getByLabel('Reading of 紹介')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Answer by voice' }).click();
  await expect(page.getByText('Say the underlined word out loud')).toBeVisible();
  const hold = page.getByRole('button', { name: 'Hold to speak' });
  const box = await hold.boundingBox();
  if (!box) throw new Error('no hold button');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(hold).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(900);
  await page.mouse.up();

  // The mock says しょかい: a long-vowel near-miss for 紹介, never accepted as right.
  await expect(page.getByText('What you said', { exact: true })).toBeVisible({ timeout: 15_000 });
  const expected = page.getByText('Expected', { exact: true });
  await expect(expected).toBeVisible();
  await expect(expected.locator('..')).toContainText('しょうかい');
  await expect(page.getByText('· long vowel')).toBeVisible();
  await expect(page.getByText('Read as', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Next (sentence|word)$/ })).toBeVisible();
});
