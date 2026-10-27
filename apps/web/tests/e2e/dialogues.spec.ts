import { GRAMMAR_DIALOGUES } from '../../src/domain/dialogues/catalogue.ts';
import type { Dialogue } from '../../src/domain/dialogues/types.ts';
import { onboard } from './helpers.ts';
import { card, fakeJapaneseVoice, playUntil, sessionDone } from './lesson-play.ts';
import { expect, type Page, test } from './test.ts';

/**
 * Grammar dialogues, added beside what the grammar point already shows: a conversation on the
 * intro card, the point's dialogues on its page, and "complete the line" in a focus session,
 * with the tutor in reach before the answer.
 */

const NARU = GRAMMAR_DIALOGUES.find((set) => set.grammarId === 'koto-ni-naru');
const answerOf = (d: Dialogue) => d.lines[d.blank.line]?.focus ?? '';

/** The dialogue a drill shows, found by its four choices. */
function shownDialogue(choices: string[]): Dialogue {
  const found = NARU?.dialogues.find((d) =>
    [answerOf(d), ...d.blank.distractors].every((form) => choices.includes(form)),
  );
  if (!found) throw new Error(`no dialogue with ${choices.join(', ')}`);
  return found;
}

const spoken = (page: Page) => page.evaluate(() => (window as { spoken?: string[] }).spoken ?? []);

test('the intro card keeps its content and adds a conversation, Got it still in reach', async ({
  page,
}) => {
  await onboard(page);
  await page.goto('/grammar/koto-ni-naru?intro=1');
  const intro = page.getByRole('region', { name: 'New grammar: 〜ことになる' });
  await expect(intro.getByText('it has been decided that')).toBeVisible();
  // Got it opens the page here, so there is no "More about this" to open it again.
  await expect(intro.getByRole('link', { name: 'More about this' })).toHaveCount(0);
  await expect(intro.getByRole('button', { name: 'Got it' })).toBeInViewport();
  await expect(intro.locator('[data-tutor]')).toBeInViewport();

  const talk = intro.getByRole('region', { name: 'In a conversation' });
  const line = talk.getByRole('button').filter({ hasText: '社長が決めて' });
  await expect(line).toHaveAttribute('aria-expanded', 'false');
  await line.scrollIntoViewIfNeeded();
  await expect(talk.locator('[data-focus="focus"]').first()).toHaveText('ことになった');
  await line.click();
  await expect(line).toHaveAttribute('aria-expanded', 'true');
  await expect(talk.getByText(/work at the Osaka shop/)).toBeVisible();
  await expect(intro.getByRole('button', { name: 'Got it' })).toBeInViewport();
});

test('the grammar page lists the dialogues and compares with the point they are confused with', async ({
  page,
}) => {
  await onboard(page);
  await page.goto('/grammar/koto-ni-naru');
  await expect(page.getByRole('heading', { level: 1, name: '〜ことになる' })).toBeVisible();
  await expect(page.getByRole('region', { name: "How it's formed" })).toBeVisible();
  await expect(page.getByRole('region', { name: "Where you'll see it" })).toBeVisible();
  const section = page.getByRole('region', { name: 'In conversation' });
  await expect(section.getByRole('article')).toHaveCount(NARU?.dialogues.length ?? 0);
  await expect(section.getByText('At school · plain')).toBeVisible();
  await section.getByRole('link', { name: 'Compare with 〜ことにする' }).click();
  await expect(page).toHaveURL(/\/grammar\/koto-ni-suru$/);
  await expect(page.getByRole('region', { name: 'In conversation' })).toBeVisible();
});

test('a focus session ends with a line to complete, the tutor there before the answer', async ({
  page,
}) => {
  await fakeJapaneseVoice(page);
  await onboard(page);
  await page.goto('/read?grammar=koto-ni-naru');
  await expect(card(page)).toHaveAttribute('data-card', 'grammar-intro');
  expect(await playUntil(page, 'drill:dialogue')).toBe(true);

  await expect(page.getByText('Complete the line')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Explain this conversation' })).toBeInViewport();
  const group = page.getByRole('group', { name: 'Choices' });
  await expect(group.getByRole('button')).toHaveCount(4);
  const dialogue = shownDialogue(await group.getByRole('button').allTextContents());
  const answer = answerOf(dialogue);
  await expect(page.locator('main [data-focus="blank"]')).toBeVisible();

  await page.getByRole('button', { name: 'Play the conversation' }).click();
  await expect.poll(async () => (await spoken(page)).length).toBe(dialogue.lines.length);
  expect((await spoken(page)).join('')).not.toContain(answer);

  await page.getByRole('button', { name: 'Show translation' }).click();
  const context = dialogue.lines.find((_, i) => i !== dialogue.blank.line);
  await expect(page.getByText(context?.tr.en ?? '')).toBeVisible();
  const blanked = dialogue.lines[dialogue.blank.line];
  await expect(page.getByText(blanked?.tr.en ?? '')).toHaveCount(0);

  const wrong = dialogue.blank.distractors[0];
  await group.getByRole('button', { name: wrong, exact: true }).click();
  const miss = page.locator('[data-answer="wrong"]');
  await expect(miss).toContainText('Not quite');
  await expect(miss.locator('del')).toHaveText(wrong);
  await expect(miss).toContainText(dialogue.blank.why.en);
  await expect(page.locator('main [data-focus="missed"]')).toHaveText(answer);
  for (const line of dialogue.lines) await expect(page.getByText(line.tr.en)).toBeVisible();

  const next = page.getByRole('button', { name: 'Next sentence' });
  await expect(next).toBeInViewport();
  await expect(page.locator('[data-tutor]').last()).toBeInViewport();
  await next.click();
  await expect(sessionDone(page)).toBeVisible();
});
