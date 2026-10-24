import { answerField, beginMix, importKnown, onboard } from './helpers.ts';
import { expect, type Page, test } from './test.ts';

/**
 * A13, A14, A16, G5 against the mock build: the mock's request counter (`window.__kanjiMockAi`)
 * shows that tapping a word calls nothing and "Ask" calls once; a particle opens its static
 * note; a 429 shows the countdown; the AI use section draws its charts.
 */

interface Probe {
  calls: number;
  failNext?: { status: number; message: string };
}

async function mockCalls(page: Page): Promise<number> {
  return page.evaluate(
    () => (window as unknown as { __kanjiMockAi?: Probe }).__kanjiMockAi?.calls ?? 0,
  );
}

async function failNextWith429(page: Page, seconds: number) {
  const message = JSON.stringify({
    error: {
      code: 429,
      message: 'You exceeded your current quota.',
      status: 'RESOURCE_EXHAUSTED',
      details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: `${seconds}s` }],
    },
  });
  await page.evaluate((body) => {
    const holder = window as unknown as { __kanjiMockAi?: Probe };
    holder.__kanjiMockAi ??= { calls: 0 };
    holder.__kanjiMockAi.failNext = { status: 429, message: body };
  }, message);
}

/** Starts a session and skips the first target, so every word of its sentence can be tapped. */
async function readAndSkip(page: Page) {
  await onboard(page);
  await importKnown(page);
  await beginMix(page);
  await answerField(page);
  await page.getByRole('button', { name: "I don't know" }).click();
  await expect(page.getByText('Here it is:')).toBeVisible();
}

const sentenceButtons = (page: Page) => page.locator('p[lang="ja"] button');

/** Opens the word sheet of the first word (not a particle) in the sentence. */
async function openWordSheet(page: Page) {
  const buttons = sentenceButtons(page);
  for (let i = 0; i < (await buttons.count()); i++) {
    await buttons.nth(i).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    const ask = sheet.getByRole('button', { name: 'Ask the tutor about this word' });
    if (await ask.isVisible()) return sheet;
    await sheet.getByRole('button', { name: 'Close' }).first().click();
    await expect(sheet).toBeHidden();
  }
  throw new Error('no word to tap');
}

test('tapping a word calls nothing; "Ask the tutor" calls once (A13)', async ({ page }) => {
  await readAndSkip(page);
  const before = await mockCalls(page);
  const sheet = await openWordSheet(page);
  await expect(sheet.getByRole('region', { name: 'In the dictionary' })).toBeVisible();
  await page.waitForTimeout(300);
  expect(await mockCalls(page)).toBe(before);
  await sheet.getByRole('button', { name: 'Ask the tutor about this word' }).click();
  await expect(sheet.getByRole('note', { name: /^The tutor on / })).toBeVisible();
  expect(await mockCalls(page)).toBe(before + 1);
});

test('a tapped particle shows its static note (G5)', async ({ page }) => {
  await readAndSkip(page);
  const before = await mockCalls(page);
  const particle = sentenceButtons(page).filter({
    hasText: /^(が|は|を|に|で|と|も|の|へ|か|ね|よ)$/,
  });
  await particle.first().click();
  const sheet = page.getByRole('dialog', { name: / in this sentence$/ });
  await expect(sheet.getByRole('list').first()).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Ask the tutor about it here' })).toBeVisible();
  expect(await mockCalls(page)).toBe(before);
});

test('a rate limit shows "The tutor needs a minute" and a Retry after the wait (A14)', async ({
  page,
}) => {
  await readAndSkip(page);
  const sheet = await openWordSheet(page);
  await failNextWith429(page, 3);
  await sheet.getByRole('button', { name: 'Ask the tutor about this word' }).click();
  await expect(
    sheet.getByText(/The tutor needs a minute\. You can ask again in \d s\./),
  ).toBeVisible();
  const retry = sheet.getByRole('button', { name: 'Retry' });
  await expect(retry).toBeDisabled();
  await expect(retry).toBeEnabled({ timeout: 6000 });
  const calls = await mockCalls(page);
  await retry.click();
  await expect(sheet.getByRole('note', { name: /^The tutor on / })).toBeVisible();
  expect(await mockCalls(page)).toBe(calls + 1);
});

test('the AI use section draws its charts (A16)', async ({ page }) => {
  await readAndSkip(page);
  const sheet = await openWordSheet(page);
  await sheet.getByRole('button', { name: 'Ask the tutor about this word' }).click();
  await expect(sheet.getByRole('note', { name: /^The tutor on / })).toBeVisible();
  await page.goto('/settings/tutor');
  await page.getByText('AI use this month').click();
  for (const title of ['Calls per day', 'Estimated cost per day', 'Calls by task', 'Tokens']) {
    await expect(page.locator('figcaption', { hasText: new RegExp(`^${title}$`) })).toBeVisible();
  }
  await expect(page.getByRole('table', { name: 'Calls by task, last 30 days' })).toContainText(
    'Explain a word',
  );
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
});
