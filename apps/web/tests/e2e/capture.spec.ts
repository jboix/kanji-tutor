import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Locator, Page } from '@playwright/test';
import { layoutReport, scanHere } from './a11y-checks.ts';
import { onboard, photograph } from './helpers.ts';
import { expect, test } from './test.ts';

/** A generic page rendered to a PNG; the mock tutor reads each page by its number in the scan. */
const HANDOUT = fileURLToPath(new URL('./fixtures/handout.png', import.meta.url));

/** How much taller the scrolling body is than the viewport, in CSS px. */
const overflow = (page: Page) =>
  page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? Math.max(0, main.scrollHeight - main.clientHeight) : 0;
  });

/**
 * Screenshots of the two screens go to `SCAN_SHOTS` when it names a folder: the viewport, and the
 * whole scrolling body (`-full`).
 */
async function shot(page: Page, name: string) {
  const dir = process.env.SCAN_SHOTS;
  const size = page.viewportSize();
  if (!dir || !size || test.info().project.name !== 'phone-390') return;
  mkdirSync(dir, { recursive: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(dir, `${name}.png`), animations: 'disabled' });
  await page.setViewportSize({ ...size, height: size.height + (await overflow(page)) });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(dir, `${name}-full.png`), animations: 'disabled' });
  await page.setViewportSize(size);
}

/** From the empty list, through the new scan screen, to the review of three read pages. */
async function readThreePages(page: Page) {
  await onboard(page);
  await page.goto('/capture');
  await expect(page.getByRole('heading', { name: 'Scanned lessons' })).toBeVisible();
  await page.getByRole('link', { name: 'New scan' }).click();
  await expect(page.getByRole('heading', { name: 'New scan' })).toBeVisible();
  await photograph(page, [HANDOUT, HANDOUT, HANDOUT]);
  await expect(page.getByRole('img', { name: 'Photo of page 3' })).toBeVisible();
}

test('three handout pages become one scanned lesson', async ({ page }) => {
  await readThreePages(page);
  const read = page.getByRole('button', { name: 'Read 3 pages, 3 requests, uses AI' });
  await expect(read).toBeVisible();
  // The tutor is one tap away before anything is read.
  await expect(
    page.getByRole('button', { name: 'Ask the tutor about scanning a handout' }),
  ).toBeInViewport();
  await shot(page, 'import');

  await read.click();
  const title = page.getByLabel('Title · suggested, edit it');
  await expect(title).toHaveValue('Weather and plans', { timeout: 30_000 });
  await expect(page.getByText('3 pages read')).toBeVisible();
  const pages = page.getByRole('region', { name: 'The pages' });
  await expect(pages.getByText('Kanji list')).toBeVisible();
  await expect(pages.getByText('Grammar explanation')).toBeVisible();
  await expect(pages.getByText('Exercise handout')).toBeVisible();
  // Its 5 listed kanji, and those of the other pages' lines the learner cannot read yet.
  await expect(page.getByRole('region', { name: /^Kanji · 14$/ })).toBeVisible();
  await expect(page.getByRole('region', { name: /^Words · 5$/ })).toContainText('not in our lists');
  const exercises = page.getByRole('region', { name: 'Exercises from page 3 · 8' });
  await expect(exercises).toContainText('Choose the right form');
  await expect(exercises.getByRole('checkbox', { name: 'Practise question 8' })).toBeChecked();
  await expect(page.getByText(/They stay hidden until you answer/)).toBeVisible();
  // なさい is only in the handout's instruction: found, listed, and left out until ticked.
  const grammar = page.getByRole('region', { name: 'Grammar · 7 of 8' });
  await expect(grammar.getByRole('checkbox', { name: 'Practise 〜なさい' })).not.toBeChecked();
  await expect(grammar).toContainText('only in the instructions');
  await expect(
    page.getByRole('button', { name: 'Ask the tutor about Weather and plans' }),
  ).toBeInViewport();
  await shot(page, 'review');

  await page.getByRole('button', { name: 'Change what page 2 is' }).click();
  await page.getByRole('radio', { name: 'Mixed page' }).click();
  await expect(pages.getByText('Mixed page')).toBeVisible();
  await page.getByRole('button', { name: /1 line may be misread/ }).click();
  await page.getByRole('button', { name: 'This is right' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /may be misread/ })).toHaveCount(0);
  await title.fill('Weather week');
  await page.getByRole('button', { name: 'Save the lesson' }).click();

  await expect(page.getByRole('heading', { name: 'Weather week' })).toBeVisible();
  await expect(page.getByText(/^Scanned .* · 3 pages$/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'What the lesson holds' })).toContainText('Kanji');
  await expect(page.getByRole('link', { name: /^Practise this lesson/ })).toBeInViewport();
  await page.getByRole('button', { name: 'See the photo of page 1' }).click();
  await expect(page.getByRole('dialog', { name: 'Page 1' }).getByRole('img')).toBeVisible();
  await page.keyboard.press('Escape');
  await shot(page, 'lesson');
  // The ⋯ menu: the lesson's title over its actions, each a row with its icon.
  await page.getByRole('button', { name: /^More: / }).click();
  const menu = page.getByRole('dialog', { name: /^More: / });
  await expect(menu.getByRole('heading', { name: 'Weather week' })).toBeVisible();
  await expect(menu.getByRole('listitem')).toHaveCount(3);
  await expect(menu.getByRole('link', { name: 'Add pages' })).toBeVisible();
  await shot(page, 'menu');
  await page.keyboard.press('Escape');

  await page.goto('/capture');
  const card = page.getByRole('link', { name: /Weather week/ });
  await expect(card).toContainText('3 pages');
  await expect(card).toContainText('Not started');
  await shot(page, 'list');
});

test('what a scan makes is chosen in the review and can be changed on the lesson', async ({
  page,
}) => {
  await readThreePages(page);
  // Before reading: the kinds to practise, all ticked, on the same screen.
  const making = page.getByRole('group', { name: 'Practise from these pages' });
  await expect(making.getByRole('checkbox')).toHaveCount(4);
  await expect(making.getByRole('checkbox', { name: 'Exercises' })).toBeChecked();
  expect(await scanHere(page, 'new scan with pages')).toEqual([]);
  await page.getByRole('button', { name: /^Read 3 pages/ }).click();
  const all = page.getByRole('checkbox', { name: 'Practise all the kanji' });
  await expect(all).toBeChecked({ timeout: 30_000 });
  await all.click();
  await expect(page.getByRole('region', { name: 'Kanji · 0 of 14' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Practise question 8' }).click();
  await expect(page.getByRole('region', { name: 'Exercises from page 3 · 7 of 8' })).toBeVisible();
  const issues = await scanHere(page, 'review with things left out');
  const report = await layoutReport(page);
  expect([...issues, ...report.small, report.wide ? 'scrolls sideways' : '']).toEqual(['']);
  await shot(page, 'review-chosen');
  await page.getByRole('button', { name: 'Save the lesson' }).click();

  // The kanji are still on the lesson, left out; the exercises count what is kept.
  const parts = page.getByRole('region', { name: 'What the lesson holds' });
  await expect(parts.getByRole('button', { name: /^Kanji.*Left out/ })).toBeVisible();
  await expect(parts.getByRole('button', { name: /^Exercises.*0 of 7/ })).toBeVisible();
  await parts.getByRole('button', { name: /^Kanji/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Kanji' });
  await sheet.getByRole('checkbox', { name: 'Practise 雨' }).click();
  await expect(sheet.getByRole('region', { name: 'Kanji · 1 of 14' })).toBeVisible();
  expect(await scanHere(page, 'part sheet with things left out')).toEqual([]);
  await shot(page, 'lesson-sheet');
  await page.keyboard.press('Escape');
  await expect(parts.getByRole('button', { name: /^Kanji.*0 of 1/ })).toBeVisible();
  await page.reload();
  await expect(parts.getByRole('button', { name: /^Kanji.*0 of 1/ })).toBeVisible();
});

test('a saved scan reads like its page, and an exercise is practised on its own', async ({
  page,
}) => {
  await readThreePages(page);
  await page.getByRole('button', { name: /^Read 3 pages/ }).click();
  // The review says what could not be made into questions; nothing is dropped.
  await expect(page.getByRole('region', { name: 'The pages' })).toContainText(
    '8 questions, 2 exercises can’t be imported',
    { timeout: 30_000 },
  );
  await page.getByRole('button', { name: 'Save the lesson' }).click();

  const handout = page.getByRole('region', { name: 'Page 3 · Exercise handout' });
  await expect(handout.getByText('Can’t be imported')).toHaveCount(2);
  await expect(handout).toContainText(
    'The tutor: The answers depend on the pictures printed on the page.',
  );
  // Instruction, exercise, instruction, exercise, as printed.
  const text = await handout.evaluate((el) => {
    const copy = el.cloneNode(true) as HTMLElement;
    for (const thumb of copy.querySelectorAll('button[aria-label^="See the photo"]'))
      thumb.remove();
    return copy.textContent ?? '';
  });
  const order = [
    '正しいものを選びなさい。',
    '1. 空が暗いですね。',
    '＿＿に助詞を入れなさい。',
    '3. 駅＿＿友達を待ちます。',
    '絵を見て、天気を書きなさい。',
    '①＿＿＿＿',
    '読み方を書きなさい。',
    '5. 明日の天気予報を見ましたか。',
  ];
  const places = order.map((part) => text.indexOf(part));
  expect(places.every((at) => at >= 0)).toBe(true);
  expect(places).toEqual([...places].sort((a, b) => a - b));
  // Asking stays in reach, and a printed line is a tap from the tutor.
  await expect(page.getByRole('button', { name: /^Ask the tutor about/ })).toBeInViewport();
  await handout.getByRole('button', { name: '線で結びなさい。' }).click();
  await expect(
    handout.getByRole('button', { name: /^Ask the tutor about this line/ }),
  ).toBeVisible();
  const issues = await scanHere(page, 'lesson pages');
  const report = await layoutReport(page);
  expect([...issues, ...report.small, report.wide ? 'scrolls sideways' : '']).toEqual(['']);
  await shot(page, 'lesson-pages');

  // The first exercise alone: its two questions, then back to the page.
  await handout.getByRole('link', { name: 'Practise these 2' }).first().click();
  await expect(page).toHaveURL(/\/read\?scan=.*&exercise=2\.1$/);
  await expect(page.getByText(/^From your handout · page 3/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'そう', exact: true }).click();
  await expect(page.getByText('Right', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('p:has([data-blank])', { hasText: 'りんご' })).toBeVisible();
  await page.getByRole('button', { name: 'らしい', exact: true }).click();
  await page.getByRole('button', { name: /^(Next|Done)$/ }).click();
  await page.getByRole('link', { name: 'Back to the lesson' }).click();
  const first = page
    .getByRole('region', { name: 'Page 3 · Exercise handout' })
    .getByRole('listitem')
    .filter({ hasText: '空が暗いですね' });
  await expect(first).toContainText('Practised:');
  await expect(page.getByText('1 of 2 practised')).toBeVisible();
});

/** Past the cards before the first handout question: intros, readings and drills skipped. */
async function toHandoutQuestion(page: Page) {
  const handout = page.getByText(/^From your handout · page 3/);
  const gotIt = page.getByRole('button', { name: 'Got it' });
  const dontKnow = page.getByRole('button', { name: "I don't know" });
  const onward = page.getByRole('button', {
    name: /^(Next( sentence| word| question| card)?|Done)$/,
  });
  // A card can change between looking and clicking: a missed click just goes round again.
  const tap = (button: Locator) =>
    button
      .first()
      .click({ timeout: 3_000 })
      .catch(() => undefined);
  for (let step = 0; step < 30; step++) {
    await expect(handout.or(gotIt).or(dontKnow).first()).toBeVisible({ timeout: 15_000 });
    if (await handout.isVisible()) return;
    if (await gotIt.isVisible()) await tap(gotIt);
    else {
      await tap(dontKnow);
      await tap(onward);
    }
  }
  await expect(handout).toBeVisible();
}

test('a handout question is answered, then the tutor’s answer shows as the tutor’s', async ({
  page,
}) => {
  await readThreePages(page);
  await page.getByRole('button', { name: /^Read 3 pages/ }).click();
  await page.getByRole('button', { name: 'Save the lesson' }).click({ timeout: 30_000 });
  await page.getByRole('link', { name: /^Practise this lesson/ }).click();
  await expect(page).toHaveURL(/\/read\?scan=/);
  await toHandoutQuestion(page);
  const stem = page.locator('p:has([data-blank])', { hasText: '雨が降り' });
  await expect(stem).toBeVisible();
  const line = page.locator('p:has([data-blank])');
  // Its words open the word sheet and take furigana like any sentence's.
  await expect(stem.getByRole('button', { name: '雨', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Show furigana on known words' }).click();
  await expect(line.locator('ruby[data-reading="あめ"]')).toBeVisible();
  await expect(page.getByText(/so it looks about to rain/)).toHaveCount(0);
  await page.getByRole('button', { name: 'そう' }).click();
  await expect(page.getByText('Right', { exact: true })).toBeVisible();
  await expect(page.locator('[data-fill]')).toHaveText('そう');
  const tutor = page.getByLabel('Answer from the tutor');
  await expect(tutor).toContainText('Your handout prints none.');
  await expect(tutor).toContainText('looks about to rain');
  await shot(page, 'practice');
  await page.getByRole('button', { name: 'See the page' }).click();
  const viewer = page.getByRole('dialog', { name: 'Page 3 of your handout' });
  await expect(viewer.getByRole('img', { name: 'Page 3 of your handout' })).toBeVisible();
  await viewer.getByRole('button', { name: 'Close', exact: true }).click();
  const card = page.locator('[data-card]');
  const before = await card.getAttribute('data-sentence');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(card).not.toHaveAttribute('data-sentence', before ?? '');
});

test('a typed answer turns romaji into hiragana, with kanji to pick where the answer has some', async ({
  page,
}) => {
  await readThreePages(page);
  await page.getByRole('button', { name: /^Read 3 pages/ }).click();
  await page.getByRole('button', { name: 'Save the lesson' }).click({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/capture\?id=/);
  const scan = new URL(page.url()).searchParams.get('id') ?? '';
  const field = page.getByLabel('Your answer');

  // A particle is kana alone: the answer field of the readings.
  await page.goto(`/read?scan=${scan}&exercise=2.3`);
  await field.pressSequentially('de');
  await expect(field).toHaveValue('で');
  await field.press('Enter');
  await expect(page.getByText('Right', { exact: true })).toBeVisible();

  // A word to write in kanji: kana as it is typed, the あ switch, and its spellings to pick.
  await page.goto(`/read?scan=${scan}&exercise=2.9`);
  await field.pressSequentially('hare');
  await expect(field).toHaveValue('はれ');
  await expect(page.getByRole('button', { name: 'Romaji turns into hiragana' })).toBeVisible();
  const spelling = page.getByRole('option', { name: '晴れ', exact: true });
  await expect(spelling).toBeVisible();
  const issues = await scanHere(page, 'written handout answer');
  const report = await layoutReport(page);
  expect([...issues, ...report.small, report.wide ? 'scrolls sideways' : '']).toEqual(['']);
  await shot(page, 'practice-written');
  await spelling.click();
  await expect(field).toHaveValue('晴れ');
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.getByText('Right', { exact: true })).toBeVisible();
});
