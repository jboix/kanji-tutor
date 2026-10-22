import { expect, type Page, test } from '@playwright/test';
import { N5_FIRST } from '../../src/domain/themes/n5-first.ts';
import { onboard } from './helpers.ts';
import { card, fakeJapaneseVoice, playCard, playUntil, sessionDone } from './lesson-play.ts';

/**
 * Each S4 exercise type in a unit lesson, answered on the phone: a meaning check, a pattern
 * drill typed in kana, sentence building, a particle fill, a conjugation drill, listening with
 * a Japanese voice (and none without one), and a grammar page's "Practise this point" (S5).
 */

const lessonPart = (unit: string, section: string, part = 1) =>
  `/read?unit=${unit}&section=${section}&part=${part}`;
const answered = (page: Page) => page.locator('[data-answer]');
const nextCard = (page: Page) => page.getByRole('button', { name: 'Next sentence' });
const choices = (page: Page) => page.getByRole('group', { name: 'Choices' }).getByRole('button');

/** Plays a lesson part until a card of `type`, trying the section's later parts too. */
async function reach(page: Page, unit: string, section: string, type: string) {
  for (let part = 1; part <= 3; part++) {
    await page.goto(lessonPart(unit, section, part));
    if (await playUntil(page, type)) return;
  }
  throw new Error(`no ${type} in ${unit} ${section}`);
}

test('a meaning check: the word, four meanings, then its reading', async ({ page }) => {
  await onboard(page);
  await reach(page, 'i-am-a-student', 'words', 'drill:meaning');
  await expect(page.getByText(/^(What does it mean\?|Which word means this\?)$/)).toBeVisible();
  await expect(choices(page)).toHaveCount(4);
  await choices(page).first().click();
  await expect(answered(page)).toBeVisible();
  await expect(page.locator('main ruby[data-reading]').first()).toBeVisible();
  await nextCard(page).click();
});

test('a pattern drill typed in kana, checked by the conjugation engine', async ({ page }) => {
  await onboard(page);
  await reach(page, 'i-am-a-student', 'grammar', 'drill:pattern');
  const shape = (await page.locator('main [data-shape]').textContent()) ?? '';
  const reading =
    (await page.locator('main [data-cue-reading]').getAttribute('data-cue-reading')) ?? '';
  // Nouns at this unit: the reading and the shape's ending (がくせい + です).
  const input = page.getByLabel('Type it in kana');
  await input.fill(`${reading}${shape.replace(/^〜/u, '')}`);
  await input.press('Enter');
  await expect(answered(page)).toHaveAttribute('data-answer', 'correct');
  await nextCard(page).click();
});

/** The pieces in the order of a passage line they make, if any. */
function orderOf(pieces: string[]): string[] | undefined {
  const lines = N5_FIRST.flatMap((u) => u.passage.sentences.map((s) => s.ja.replace(/。$/u, '')));
  const line = lines.find(
    (l) => l.length === pieces.join('').length && pieces.every((p) => l.includes(p)),
  );
  if (!line) return undefined;
  return [...pieces].sort((a, b) => line.indexOf(a) - line.indexOf(b));
}

test('sentence building: the pieces in order, Check once all are placed', async ({ page }) => {
  await onboard(page);
  await reach(page, 'i-am-a-student', 'grammar', 'drill:build');
  const check = page.getByRole('button', { name: 'Check' });
  await expect(check).toBeDisabled();
  const bank = page.getByRole('group', { name: 'Pieces' });
  const pieces = await bank.getByRole('button').allTextContents();
  const order = orderOf(pieces) ?? pieces;
  for (const piece of order) await bank.getByRole('button', { name: piece, exact: true }).click();
  await check.click();
  await expect(answered(page)).toHaveAttribute('data-answer', 'correct');
  await nextCard(page).click();
});

test('a particle fill: the blank, particles of the level, then the sentence', async ({ page }) => {
  await onboard(page);
  await reach(page, 'i-am-a-student', 'review', 'drill:particle');
  await expect(page.getByText('Which particle fits?')).toBeVisible();
  await expect(choices(page)).toHaveCount(4);
  await choices(page).first().click();
  await expect(answered(page)).toBeVisible();
  await nextCard(page).click();
});

test('a conjugation drill on a verb of the lesson', async ({ page }) => {
  await onboard(page);
  await reach(page, 'self-introduction', 'review', 'drill:conjugation');
  await expect(page.getByText(/^Make it the /)).toBeVisible();
  const input = page.getByLabel('Type it in kana');
  await input.fill('ああ');
  await input.press('Enter');
  await expect(answered(page)).toHaveAttribute('data-answer', 'wrong');
  await expect(page.getByRole('deletion')).toHaveText('ああ');
  await nextCard(page).click();
});

test('listening, with a Japanese voice: hear it, then choose its meaning', async ({ page }) => {
  await fakeJapaneseVoice(page);
  await onboard(page);
  await page.goto(lessonPart('i-am-a-student', 'review'));
  const play = page.getByRole('button', { name: 'Play the sentence' });
  for (let i = 0; i < 12 && !(await play.isVisible()); i++) {
    await expect(card(page).or(sessionDone(page)).first()).toBeVisible();
    if (await sessionDone(page).isVisible()) break;
    if (await play.isVisible()) break;
    await playCard(page);
  }
  await expect(play).toBeVisible();
  const spoken = await page.evaluate(() => (window as unknown as { spoken: string[] }).spoken);
  expect(spoken.length).toBeGreaterThan(0);
  await expect(page.locator('main').getByText(spoken.at(-1) ?? '')).toHaveCount(0);
  await choices(page).first().click();
  await expect(answered(page)).toBeVisible();
  await expect(page.locator('main')).toContainText(spoken.at(-1) ?? '');
});

test('no listening without a Japanese voice', async ({ page }) => {
  await onboard(page);
  await page.goto(lessonPart('i-am-a-student', 'review'));
  for (let i = 0; i < 12; i++) {
    await expect(card(page).or(sessionDone(page)).first()).toBeVisible();
    if (await sessionDone(page).isVisible()) break;
    await expect(page.getByRole('button', { name: 'Play the sentence' })).toHaveCount(0);
    await playCard(page);
  }
});

test('a grammar page practises its point inline, with the full session one tap away', async ({
  page,
}) => {
  await onboard(page);
  await page.goto('/grammar/desu');
  const practice = page.getByRole('region', { name: 'Practise this point' });
  const first = practice.getByText(/^Drill 1 of \d$/);
  await expect(first).toBeVisible();
  const total = Number((await first.textContent())?.at(-1));
  await expect(page.locator('input:focus')).toHaveCount(0);
  for (let at = 1; at <= total; at++) {
    await expect(practice.getByText(`Drill ${at} of ${total}`)).toBeVisible();
    await practice.getByRole('button', { name: "I don't know" }).click();
    await expect(practice.locator('[data-answer="skipped"]')).toBeVisible();
    await practice.getByRole('button', { name: at === total ? 'Finish' : 'Next drill' }).click();
  }
  await expect(practice.getByText(`0 of ${total} right.`)).toBeVisible();
  await expect(page).toHaveURL(/\/grammar\/desu$/);
  const full = page.getByRole('link', { name: 'A full session on this point' });
  await expect(full).toHaveAttribute('href', '/read?grammar=desu');
});

test('a particle page practises that particle inline', async ({ page }) => {
  await onboard(page);
  await page.goto('/grammar/particle-ga');
  const practice = page.getByRole('region', { name: 'Practise this point' });
  await expect(practice.getByText(/^Drill 1 of \d$/)).toBeVisible();
  await practice.getByRole('button', { name: 'が', exact: true }).click();
  await expect(practice.locator(`[data-answer="correct"]`)).toBeVisible();
});
