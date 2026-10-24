import { onboard } from './helpers.ts';
import { fakeJapaneseVoice, playCard, playUntil } from './lesson-play.ts';
import { onlyWithScreenshots, shot } from './shots.ts';
import { expect, type Page, test } from './test.ts';

/** The S4 exercise types, asked and answered, and a grammar page's inline practice (S5). */
onlyWithScreenshots();

const lessonPart = (unit: string, section: string, part: number) =>
  `/read?unit=${unit}&section=${section}&part=${part}`;

/** The first card of `type` in a section's parts; false when none has one. */
async function reach(page: Page, unit: string, section: string, type: string, read?: boolean) {
  for (let part = 1; part <= 3; part++) {
    await page.goto(lessonPart(unit, section, part));
    for (let tries = 0; tries < 6; tries++) {
      if (!(await playUntil(page, type))) break;
      const play = page.getByRole('button', { name: 'Play the sentence' });
      if (read === undefined || (await play.isVisible()) !== read) return true;
      await playCard(page);
    }
  }
  return false;
}

/** A shot of the exercise asked, then answered with "I don't know" or the first choice. */
async function askedAndAnswered(page: Page, name: string, answer: () => Promise<void>) {
  await shot(page, name, { full: true });
  await answer();
  await expect(page.locator('[data-answer]')).toBeVisible();
  await shot(page, `${name}-answered`, { full: true });
}

const firstChoice = (page: Page) => () =>
  page.getByRole('group', { name: 'Choices' }).getByRole('button').first().click();
const dontKnow = (page: Page) => () => page.getByRole('button', { name: "I don't know" }).click();

test('exercises: each S4 type, asked and answered', async ({ page }) => {
  test.setTimeout(240_000);
  await onboard(page);
  const plan: [string, string, string, string, () => Promise<void>, boolean?][] = [
    ['exercise-meaning', 'i-am-a-student', 'words', 'drill:meaning', firstChoice(page)],
    ['exercise-pattern', 'i-am-a-student', 'grammar', 'drill:pattern', dontKnow(page)],
    ['exercise-build', 'i-am-a-student', 'grammar', 'drill:build', dontKnow(page)],
    ['exercise-particle', 'i-am-a-student', 'review', 'drill:particle', firstChoice(page)],
    ['exercise-conjugation', 'self-introduction', 'review', 'drill:conjugation', dontKnow(page)],
    [
      'exercise-sentence',
      'self-introduction',
      'review',
      'drill:listening',
      firstChoice(page),
      true,
    ],
  ];
  for (const [name, unit, section, type, answer, read] of plan) {
    expect(await reach(page, unit, section, type, read), name).toBe(true);
    await askedAndAnswered(page, name, answer);
  }
});

test('exercises: listening, with a Japanese voice', async ({ page }) => {
  await fakeJapaneseVoice(page);
  await onboard(page);
  expect(await reach(page, 'i-am-a-student', 'review', 'drill:listening', false)).toBe(true);
  await askedAndAnswered(page, 'exercise-listening', firstChoice(page));
});

test('grammar: a point practised on its page', async ({ page }) => {
  await onboard(page);
  await page.goto('/grammar/desu');
  const practice = page.getByRole('region', { name: 'Practise this point' });
  await expect(practice.getByText(/^Drill 1 of/)).toBeVisible();
  await shot(page, 'grammar-practice', { at: practice });
  await practice.getByRole('button', { name: "I don't know" }).click();
  await shot(page, 'grammar-practice-answered', { at: practice });
});
