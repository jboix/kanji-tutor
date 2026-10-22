import { expect, type Locator, type Page, test } from '@playwright/test';
import { importKnown, onboard } from './helpers.ts';

const DRILL =
  /^(Which kanji fits\?|Which pattern fits\?|One kanji, several readings|Same part, same sound)/;
const next = (page: Page) => page.getByRole('button', { name: /^Next (sentence|word)$/ });
const words = (page: Page) => page.locator('main [data-word]');
const sheet = (page: Page) => page.getByRole('dialog');

/** Answers sentence cards wrongly until `found` shows (exercises never come first). */
async function readUntil(page: Page, found: Locator) {
  const input = page.locator('form input[lang="ja"]');
  const intro = page.getByRole('button', { name: 'Got it' });
  // Any other exercise (a drill in a questions session): "I don't know" and on.
  const skip = page.getByRole('button', { name: "I don't know" });
  for (let card = 0; card < 12; card++) {
    // Choosing a session's sentences can take a while on a loaded machine.
    await expect(found.or(intro).or(input).or(skip).first()).toBeVisible({ timeout: 30_000 });
    if ((await found.count()) > 0) return;
    if ((await intro.count()) > 0) {
      await intro.click();
      continue;
    }
    if ((await input.count()) > 0) {
      await input.pressSequentially('nu');
      await input.press('Enter');
    } else await skip.click();
    await next(page).click();
  }
}

/** Taps the first tappable word of the card and checks the word sheet opens, then closes it. */
async function tapAWord(page: Page) {
  await expect(words(page).first()).toBeVisible();
  await words(page).first().click();
  await expect(sheet(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet(page)).toHaveCount(0);
}

/** U5: a word in a JLPT question opens its sheet, and the options open once answered. */
test('words in a JLPT question open their sheet after answering', async ({ page }) => {
  test.setTimeout(120_000);
  await onboard(page);
  await importKnown(page);
  await page.goto('/read?questions=1');
  const section = page.locator('main header p').filter({ hasText: /^問題 · / });
  await readUntil(page, section);
  await expect(section).toBeVisible();
  const options = page.getByRole('list', { name: 'Options' });
  if ((await options.count()) > 0) {
    await options.getByRole('button').first().click();
  } else {
    // 文の組み立て: four pieces in any order, then Check.
    const chips = page.getByRole('list', { name: 'Pieces' }).getByRole('button');
    for (let i = 0; i < 4; i++) await chips.nth(i).click();
    await page.getByRole('button', { name: 'Check' }).click();
  }
  await expect(page.locator('[data-answer]')).toBeVisible();
  await tapAWord(page);
});

/** U5: a word in a drill opens its sheet (around the blank before, everywhere after). */
test('words in a drill open their sheet', async ({ page }) => {
  test.setTimeout(120_000);
  await onboard(page);
  await importKnown(page);
  await page.goto('/read?drills=1');
  await readUntil(page, page.getByText(DRILL));
  await expect(page.getByText(DRILL)).toBeVisible();
  const input = page.locator('form input[lang="ja"]');
  if ((await input.count()) > 0) {
    await input.pressSequentially('nu');
    await input.press('Enter');
  } else {
    await page.getByRole('group', { name: 'Choices' }).getByRole('button').first().click();
  }
  await expect(next(page)).toBeVisible();
  await tapAWord(page);
});
