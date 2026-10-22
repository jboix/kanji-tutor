import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { answerField, beginMix, draw, importKnown, onboard, photograph } from './helpers.ts';

/**
 * Screenshots of every mockup screen next to the mockup itself (BUILD-PLAN Wave 5 step 2), in
 * `notes/screenshots/<screen>.png` and `<screen>-mockup.png`. Runs only with SCREENSHOTS=1
 * (`bun run screenshots`), at 390×844, against the mock-AI fixture-pack build.
 */
test.skip(!process.env.SCREENSHOTS, 'run with bun run screenshots');
test.use({
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
  permissions: ['microphone'],
});

const OUT = fileURLToPath(new URL('../../notes/screenshots/', import.meta.url));
const DESIGN = new URL('../../notes/design/', import.meta.url).href;
const HANDOUT = fileURLToPath(new URL('./fixtures/handout.png', import.meta.url));

async function shoot(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  // The launch screen (U12) must have left, or a cold page load shows it fading over the screen.
  await expect(page.locator('#launch')).toHaveCount(0, { timeout: 10_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${OUT}${name}.png` });
  const mockup = await page.context().newPage();
  await mockup.goto(`${DESIGN}${name}.html`);
  await mockup.evaluate(() => document.fonts.ready);
  await mockup.screenshot({ path: `${OUT}${name}-mockup.png` });
  await mockup.close();
}

async function ready(page: Page) {
  await onboard(page);
  await importKnown(page);
}

async function answerWrong(page: Page) {
  await beginMix(page);
  const input = await answerField(page);
  await input.pressSequentially('nu');
  await input.press('Enter');
  await expect(page.getByText('You wrote')).toBeVisible();
}

test('today', async ({ page }) => {
  await ready(page);
  await expect(page.getByText(/sentences? (to read|and \d+ exercises?)/)).toBeVisible();
  await shoot(page, 'today');
});

test('read: wrong answer, explained', async ({ page }) => {
  await ready(page);
  await answerWrong(page);
  await page.getByRole('button', { name: 'Ask the tutor why' }).click();
  await expect(page.getByRole('note', { name: 'Why this reading' })).toBeVisible();
  await shoot(page, 'read');
});

test('explain: tap a word', async ({ page }) => {
  await ready(page);
  await answerWrong(page);
  await page.getByRole('button', { name: 'Ask the tutor why' }).click();
  await page.getByRole('button', { name: 'Break down the sentence' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Break down with the tutor' }).click();
  await expect(page.getByText(/how this sentence is built/i)).toBeVisible();
  // The tutor's word note too, in its AI box.
  await page.getByRole('button', { name: 'Ask the tutor about this word' }).click();
  await expect(
    page.getByRole('dialog').getByRole('note', { name: /^The tutor on / }),
  ).toBeVisible();
  await shoot(page, 'explain');
});

test('voice: answer by voice', async ({ page }) => {
  await ready(page);
  await beginMix(page);
  await answerField(page);
  await page.getByRole('button', { name: 'Answer by voice' }).click();
  const hold = page.getByRole('button', { name: 'Hold to speak' });
  const box = await hold.boundingBox();
  if (!box) throw new Error('no hold button');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(900);
  await page.mouse.up();
  await expect(page.getByText('What you said', { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Ask the tutor why' }).click();
  await expect(page.getByRole('note', { name: 'Why this reading' })).toBeVisible();
  await shoot(page, 'voice');
});

test('compose: red-pen correction', async ({ page }) => {
  await ready(page);
  await page.goto('/compose');
  await page.getByLabel('Pattern').fill('〜わけではない');
  await page.getByLabel('Meaning').fill("It's not that…");
  await page.getByRole('button', { name: /add/i }).first().click();
  await page
    .getByLabel('Your sentence', { exact: true })
    .fill('日本語が嫌いわけではないが、漢字を書くのは好きじゃない。');
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Needed: な.')).toBeVisible();
  await shoot(page, 'compose');
});

test('kanji: readings you know', async ({ page }) => {
  await ready(page);
  await page.goto(`/kanji/${encodeURIComponent('生')}`);
  await expect(page.getByRole('heading', { name: '生' })).toBeVisible();
  await shoot(page, 'kanji');
});

test('handwrite: draw a kanji', async ({ page }) => {
  await ready(page);
  await page.goto('/handwrite');
  await draw(page);
  await expect(page.getByRole('link', { name: /待/ }).first()).toBeVisible();
  await shoot(page, 'handwrite');
});

test('capture: explain a line', async ({ page }) => {
  await ready(page);
  await page.goto('/capture');
  await photograph(page, HANDOUT);
  await expect(page.getByRole('heading', { name: /You can read/ })).toBeVisible({
    timeout: 30_000,
  });
  await page
    .getByRole('button', { name: 'しかし、方言を話す人が減っているわけではない。' })
    .click();
  await page.getByRole('button', { name: 'Ask the tutor about this line' }).click();
  await expect(page.getByRole('note', { name: 'Explanation of this line' })).toBeVisible();
  await shoot(page, 'capture');
});

test('notes: weekly letter', async ({ page }) => {
  await ready(page);
  await answerWrong(page);
  await page.goto('/notes');
  await expect(page.getByRole('heading', { name: 'This week' })).toBeVisible();
  await page.getByRole('button', { name: "Ask the tutor to write this week's letter" }).click();
  await expect(page.getByRole('note', { name: 'The tutor’s letter' })).toBeVisible();
  await shoot(page, 'notes');
});
