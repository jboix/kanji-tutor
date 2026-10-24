import { answerField, beginMix, importKnown, onboard } from './helpers.ts';
import { expect, type Page, test } from './test.ts';

/**
 * Teaching (L1, L2, L3, L5) with the mock provider: a new word is introduced before its first
 * exercise, a target tapped before answering shows a hint without its reading, "Explain this
 * sentence" works offline from the grammar catalogue, and a reading the tutor leaks is removed.
 */

const input = (page: Page) => page.locator('form input[lang="ja"]');
const intro = (page: Page) => page.getByRole('region', { name: /^New word: / });
const next = (page: Page) => page.getByRole('button', { name: /^Next (word|sentence)$/ });

async function begin(page: Page) {
  await onboard(page);
  await importKnown(page);
  await beginMix(page);
}

test('a new word gets its intro card, then the exercise (L1)', async ({ page }) => {
  await begin(page);
  const card = intro(page);
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(card.getByRole('region', { name: "Why it's here" })).toContainText(/JLPT|level/);
  // The parts hook shows first; the tutor writes one (with the 解 seal) only when asked.
  await expect(card.getByRole('region', { name: 'Memory hook' })).toBeVisible();
  await expect(card.getByRole('note')).toHaveCount(0);
  await card.getByRole('button', { name: 'Ask the tutor for a hook' }).click();
  await expect(card.getByRole('note', { name: 'Memory hook' })).toBeVisible();
  await expect(input(page)).toHaveCount(0);
  await card.getByRole('button', { name: 'Got it' }).click();
  await expect(input(page)).toBeVisible();
  await expect(intro(page)).toHaveCount(0);
});

test('a target tapped before answering shows a hint without its reading (L2)', async ({ page }) => {
  await begin(page);
  await answerField(page);
  await page.locator('main [data-target] button').first().click();
  const hint = page.getByRole('dialog', { name: /^Hint for / });
  await expect(hint).toBeVisible();
  await expect(hint.getByRole('region', { name: 'Its kanji' })).toBeVisible();
  await expect(hint.locator('rt')).toHaveCount(0);
  const shown = (await hint.textContent()) ?? '';
  await hint.getByRole('button', { name: 'Show the reading' }).click();

  const skipped = page.locator('[data-answer="skipped"]');
  await expect(skipped).toContainText('Here it is:');
  const reading = (await skipped.locator('[lang="ja"]').first().textContent()) ?? '';
  expect(reading.length).toBeGreaterThan(0);
  expect(shown).not.toContain(reading);
  await expect(page.getByRole('region', { name: /^About / })).toBeVisible();
  if ((await next(page).textContent()) === 'Next sentence') {
    await expect(page.getByRole('region', { name: 'This sentence' })).toBeVisible();
  }
});

/** Skips cards until "Explain this sentence" lists a catalogue grammar point. */
async function openHelpWithGrammar(page: Page) {
  const sheet = page.getByRole('dialog', { name: 'About this sentence' });
  const points = sheet.getByRole('region', { name: 'Grammar in it' }).locator('li');
  for (let card = 0; card < 10; card++) {
    await answerField(page);
    await page.getByRole('button', { name: 'Explain this sentence' }).click();
    await expect(sheet).toBeVisible();
    if ((await points.count()) > 0) return sheet;
    await sheet.getByRole('button', { name: 'Close' }).click();
    await page.getByRole('button', { name: "I don't know" }).click();
    await next(page).click();
  }
  throw new Error('no sentence with catalogue grammar in ten cards');
}

test('"Explain this sentence" offline shows the catalogue grammar (L3)', async ({
  page,
  context,
}) => {
  await onboard(page);
  await importKnown(page);
  // Offline, chunks not loaded yet come from the service worker's precache, so the page must be
  // under its control first (as in offline.spec.ts); otherwise the test depends on chunk grouping.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await beginMix(page);
  // Asking for the intro's hook loads the AI module while online; then the network goes.
  await intro(page).getByRole('button', { name: 'Ask the tutor for a hook' }).click();
  await expect(intro(page).getByRole('note', { name: 'Memory hook' })).toBeVisible();
  await context.setOffline(true);
  const sheet = await openHelpWithGrammar(page);
  await expect(sheet.getByRole('region', { name: 'What it says' })).toBeVisible();
  await expect(sheet.getByRole('note')).toHaveCount(0);
  await sheet.getByRole('button', { name: 'Ask the tutor' }).click();
  await expect(sheet.getByText(/You're offline/)).toBeVisible();
  await expect(sheet.getByRole('note')).toHaveCount(0);
  await context.setOffline(false);
});

test('the tutor explains the sentence with the leaked reading removed (L3)', async ({ page }) => {
  await onboard(page);
  await importKnown(page);
  await page.goto(
    `/read?kanji=${encodeURIComponent('紹')}&reading=${encodeURIComponent('ショウ')}`,
  );
  await answerField(page);
  await expect(page.getByLabel('Reading of 紹介')).toBeVisible();
  await page.getByRole('button', { name: 'Explain this sentence' }).click();
  const sheet = page.getByRole('dialog', { name: 'About this sentence' });
  await sheet.getByRole('button', { name: 'Ask the tutor' }).click();
  const note = sheet.getByRole('note', { name: 'The tutor on this sentence' });
  await expect(note).toContainText('A reading was hidden so you can still answer.');
  await expect(note).toContainText('紹介');
  await expect(sheet).not.toContainText(/しょうかい|ショウカイ|shoukai|shōkai/i);
});
