import { onboard } from './helpers.ts';
import { expect, type Page, test } from './test.ts';

/**
 * The lesson path (T3, T4) and level gating (G3) with the fixture pack: from zero, Today shows
 * the first unit; its 練習 and 読み物 sections work; every card's sentence is at or
 * below the learner level (the read screen exposes it as `data-level`); and the progression
 * screen shows the unit in progress.
 */

const card = (page: Page) => page.locator('[data-card]').first();
const next = (page: Page) => page.getByRole('button', { name: /^Next (sentence|word)$/ });
const gotIt = (page: Page) => page.getByRole('button', { name: 'Got it' });
const dontKnow = (page: Page) => page.getByRole('button', { name: "I don't know" });
const done = (page: Page) => page.getByText('Session done');

/** Answers a reading card wrongly ("nu"), past its intro card. */
async function readCard(page: Page) {
  const input = page.locator('form input[lang="ja"]');
  await expect(input.or(gotIt(page))).toBeVisible();
  if (await gotIt(page).isVisible()) await gotIt(page).click();
  await input.pressSequentially('nu');
  await input.press('Enter');
  await next(page).click();
}

/** "I don't know" on a question or drill, then on to the next card. */
async function skipExercise(page: Page) {
  for (let step = 0; step < 6; step++) {
    const onward = page.getByRole('button', {
      name: /^(Next sentence|Next word|Next question|Done)$/,
    });
    await expect(dontKnow(page).or(onward).first()).toBeVisible();
    if (await dontKnow(page).isVisible()) await dontKnow(page).click();
    const label = await onward.first().textContent();
    await onward.first().click();
    if (label !== 'Next word' && label !== 'Next question') return;
  }
}

/** Plays up to `count` cards of a session, returning the level of each card's sentence. */
async function playCards(page: Page, count: number): Promise<number[]> {
  const levels: number[] = [];
  for (let i = 0; i < count; i++) {
    await expect(card(page).or(done(page)).first()).toBeVisible({ timeout: 15_000 });
    if (await done(page).isVisible()) break;
    const type = (await card(page).getAttribute('data-card')) ?? '';
    const level = await card(page).getAttribute('data-level');
    if (level) levels.push(Number(level));
    if (type === 'reading') await readCard(page);
    else if (type === 'grammar-intro') await gotIt(page).click();
    else await skipExercise(page);
  }
  return levels;
}

test('from zero: the first unit, practised and read, then in progress', async ({ page }) => {
  test.setTimeout(150_000);
  await onboard(page);
  const next = page.getByRole('region', { name: 'Next up' });
  await expect(next.getByText('Words, next')).toBeVisible({ timeout: 20_000 });
  const lesson = next.getByRole('link', { name: 'わたしは学生です' });
  await lesson.click();
  await expect(page.getByRole('heading', { name: 'わたしは学生です' })).toBeVisible();
  const sections = page.getByRole('region', { name: 'Sections' });

  // 練習: a few cards, none above N5.
  await sections.getByRole('button', { name: /^練習/ }).click();
  await expect(page).toHaveURL(/\/read\?unit=i-am-a-student&section=practice&part=1$/);
  const levels = await playCards(page, 4);
  expect(levels.length).toBeGreaterThan(0);
  for (const level of levels) expect(level).toBe(5);

  // 読み物: the passage, then a comprehension question with the line that proves it.
  await page.goto('/units/i-am-a-student');
  await sections.getByRole('button', { name: /^読み物/ }).click();
  await expect(page.getByRole('region', { name: 'Passage' })).toContainText('わたしはアンナです');
  await page.getByRole('button', { name: /Answer the questions/ }).click();
  await expect(card(page)).toHaveAttribute('data-card', 'passage');
  await page.getByRole('list', { name: 'Options' }).getByRole('button').first().click();
  await expect(page.locator('[data-evidence]')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Why each option' })).toBeVisible();

  // The progression screen shows the unit as the current one, still on its words.
  await page.goto('/units');
  const row = page.locator('[data-unit="i-am-a-student"]');
  await expect(row).toHaveAttribute('data-state', 'current');
  await expect(row).toContainText('Current · Words');
  await expect(page.getByRole('region', { name: 'N5 known' })).toBeVisible();
  await expect(row).toContainText(/\d+ of \d+ practised/);
});

test('an N4 learner never sees a sentence above N4', async ({ page }) => {
  test.setTimeout(120_000);
  await onboard(page, /I'm studying N4/);
  await page.goto('/read');
  const levels = await playCards(page, 8);
  expect(levels.length).toBeGreaterThan(0);
  for (const level of levels) expect(level).toBeGreaterThanOrEqual(4);
});
