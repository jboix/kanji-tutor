import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { answerField, beginMix, importKnown, onboard } from './helpers.ts';
import { onlyWithScreenshots, patchSettings, shot, shotBothThemes, typeAnswer } from './shots.ts';
import { expect, type Page, test } from './test.ts';

/** Revision 2 session screens without a mockup: Today, the card states, questions (G, J, L, U). */
onlyWithScreenshots();

const dontKnow = (page: Page) => page.getByRole('button', { name: "I don't know" });
const gotIt = (page: Page) => page.getByRole('button', { name: 'Got it' });
const onward = (page: Page) =>
  page.getByRole('button', { name: /^(Next sentence|Next word|Next question|Done)$/ });
const done = (page: Page) => page.getByText('Session done');

async function ready(page: Page) {
  await onboard(page);
  await importKnown(page);
}

test('today: from zero', async ({ page }) => {
  await onboard(page);
  await expect(page.getByRole('link', { name: /^Daily mix\s?\d+ sentences?/ })).toBeVisible({
    timeout: 20_000,
  });
  await shot(page, 'today-zero', { full: true });
});

test('today: an N4 learner in a unit opened early', async ({ page }) => {
  await onboard(page, /I'm studying N4/);
  await importKnown(page);
  await patchSettings(page, { activeUnit: 'family' });
  await page.reload();
  await expect(page.locator('[data-current-unit]')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('progressbar', { name: /^Kanji: / })).toBeVisible();
  await expect(page.getByText("Choosing today's sentences…")).toBeHidden({ timeout: 20_000 });
  await shot(page, 'today-n4', { full: true });
  await shotBothThemes(page, 'today');
});

test('today: the level-up row once N5 is known', async ({ page }) => {
  await onboard(page);
  await page.goto('/learned');
  await page.getByRole('button', { name: 'Mark N5 words known' }).click();
  await expect(page.getByRole('status')).toContainText('words marked as known');
  // Marking a whole level known moves the learner past it; back to N5 for the suggestion.
  await patchSettings(page, { learnerLevel: 5 });
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Your level' })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Choosing today's sentences…")).toBeHidden({ timeout: 20_000 });
  await shot(page, 'today-level-up', { full: true });
});

test('read: intro card, card, hint, sentence help, skip, wrap-up, particle', async ({ page }) => {
  test.setTimeout(90_000);
  await ready(page);
  await beginMix(page);
  await expect(page.getByRole('region', { name: /^New word: / })).toBeVisible({ timeout: 15_000 });
  await shot(page, 'read-intro', { full: true });
  const input = await answerField(page);
  await shotBothThemes(page, 'read-card');
  // The viewport resizes of the full shot leave the keyboard layout on (U1), where a first tap
  // only closes the keyboard: put the field down first, as a phone user would.
  await input.blur();
  await expect(page.locator('html')).not.toHaveAttribute('data-keyboard', 'open');
  await page.locator('main [data-target] button').first().click();
  await expect(page.getByRole('dialog', { name: /^Hint for / })).toBeVisible();
  await shot(page, 'read-hint');
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).first().click();
  await page.getByRole('button', { name: 'Explain this sentence' }).click();
  await expect(page.getByRole('dialog', { name: 'About this sentence' })).toBeVisible();
  await shot(page, 'read-sentence-help');
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).first().click();
  await dontKnow(page).click();
  await expect(page.locator('[data-answer="skipped"]')).toBeVisible();
  await shot(page, 'read-dont-know');
  const wrapUp = page.getByRole('region', { name: 'This sentence' });
  if ((await wrapUp.count()) > 0) await shot(page, 'read-wrap-up', { at: wrapUp });
  await openParticle(page);
  await shot(page, 'read-particle-sheet');
});

async function openParticle(page: Page) {
  const particle = page
    .locator('p[lang="ja"] button')
    .filter({ hasText: /^(が|は|を|に|で|と|も|の|へ|か|ね|よ)$/ });
  await particle.first().click();
  await expect(page.getByRole('dialog', { name: / in this sentence$/ })).toBeVisible();
}

test('read: a right answer and a wrong one', async ({ page }) => {
  await ready(page);
  await page.goto(
    `/read?kanji=${encodeURIComponent('紹')}&reading=${encodeURIComponent('ショウ')}`,
  );
  await typeAnswer(await answerField(page), 'shoukai');
  await expect(page.locator('[data-answer="correct"]')).toBeVisible();
  await shot(page, 'read-right');
  await shotDark(page, 'read-right-dark');
  await page.goto('/read');
  await typeAnswer(await answerField(page), 'nu');
  await expect(page.getByText('You wrote')).toBeVisible();
  await shot(page, 'read-wrong');
  await shot(page, 'read-wrong-note', { full: true });
});

test('read: a near-miss, a long vowel left out (W-error)', async ({ page }) => {
  await ready(page);
  await page.goto(
    `/read?kanji=${encodeURIComponent('紹')}&reading=${encodeURIComponent('ショウ')}`,
  );
  await typeAnswer(await answerField(page), 'shokai');
  await expect(page.getByText('Almost: long vowel')).toBeVisible();
  await shot(page, 'read-near-miss');
  await shotDark(page, 'read-near-miss-dark');
});

/** The same screen in dark (prefers-color-scheme), then back to light. */
async function shotDark(page: Page, name: string) {
  await page.emulateMedia({ colorScheme: 'dark' });
  await shot(page, name);
  await page.emulateMedia({ colorScheme: 'light' });
}

test('read: the keyboard-open layout at 360×420', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await ready(page);
  await beginMix(page);
  const input = await answerField(page);
  await input.focus();
  await page.setViewportSize({ width: 360, height: 420 });
  await expect(page.locator('html')).toHaveAttribute('data-keyboard', 'open');
  await shot(page, 'read-keyboard');
});

/** Question kinds (J1–J5) and the screenshot each gets. */
const KINDS: Record<string, string> = {
  'kanji-reading': 'question-kanji-reading',
  orthography: 'question-orthography',
  'context-word': 'question-context-word',
  'grammar-form': 'question-grammar-form',
  'sentence-order': 'question-order',
};

/** On to the next card: "Got it" on an intro, else "I don't know" and onward. */
async function advance(page: Page) {
  await expect(gotIt(page).or(dontKnow(page)).or(onward(page)).first()).toBeVisible();
  if (await gotIt(page).isVisible()) return gotIt(page).click();
  if (await dontKnow(page).isVisible()) await dontKnow(page).click();
  await onward(page).first().click();
}

/** The kind of the question card on screen, if one is. */
async function kindOf(page: Page) {
  const card = page.locator('[data-card]').first();
  await expect(card.or(done(page)).first()).toBeVisible({ timeout: 15_000 });
  if ((await card.count()) === 0) return undefined;
  const type = (await card.getAttribute('data-card')) ?? '';
  return type.startsWith('question:') ? type.slice('question:'.length) : undefined;
}

test('questions: each JLPT kind, asked and answered', async ({ page }) => {
  test.setTimeout(150_000);
  await ready(page);
  // A 15-minute session has room for every kind (L6).
  await patchSettings(page, { sessionMinutes: 15 });
  await page.goto('/read?questions=1');
  const left = new Set(Object.keys(KINDS));
  for (let card = 0; card < 60 && left.size > 0 && (await done(page).count()) === 0; card++) {
    const kind = await kindOf(page);
    if (kind && left.has(kind)) {
      left.delete(kind);
      await shot(page, KINDS[kind] ?? kind, { full: true });
    }
    await advance(page);
  }
  expect([...left], 'question kinds never shown').toEqual([]);
});

test('drill: a drill card', async ({ page }) => {
  await ready(page);
  await page.goto('/read?drills=1');
  const drill = page.locator('[data-card^="drill"]');
  for (let card = 0; card < 12 && (await drill.count()) === 0; card++) {
    await expect(page.locator('[data-card]').first()).toBeVisible({ timeout: 15_000 });
    if ((await drill.count()) > 0) break;
    await advance(page);
  }
  await shot(page, 'drill');
});

test('immersion: a Japanese mistake note with furigana', async ({ page }) => {
  await ready(page);
  await page.goto('/settings/language');
  const group = page.getByRole('group', { name: 'Explanations in' });
  await group.getByLabel('Japanese').click();
  await expect(group.getByLabel('Japanese')).toBeChecked();
  await page.goto('/');
  await beginMix(page);
  await typeAnswer(await answerField(page), 'nu');
  await page.getByRole('button', { name: 'Ask the tutor why' }).click();
  const note = page.getByRole('note', { name: 'Why this reading' });
  await note.getByRole('button', { name: /^差.*: meaning$/ }).click();
  await expect(note.getByRole('status')).toContainText('difference');
  await shot(page, 'read-mistake-ja', { at: note });
});

test('french: Today and a session card', async ({ page }) => {
  await ready(page);
  await page.goto('/settings/language');
  await page.getByRole('region', { name: 'Language' }).getByText('Français').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await page.goto('/');
  await expect(page.getByText('Appuyez sur Commencer.')).toBeVisible({ timeout: 20_000 });
  await shot(page, 'today-fr');
  await page.getByRole('link', { name: 'Commencer la prochaine série' }).click();
  const input = page.locator('form input[lang="ja"]');
  const compris = page.getByRole('button', { name: 'Compris' });
  await expect(input.or(compris)).toBeVisible({ timeout: 15_000 });
  if (await compris.isVisible()) await compris.click();
  await shot(page, 'read-card-fr');
});

test('read: "New" chips with explanations skipped (L7)', async ({ page }) => {
  test.setTimeout(90_000);
  await onboard(page);
  await patchSettings(page, { explainFirst: false });
  await page.goto('/read?unit=i-am-a-student');
  const chip = page.locator('[data-new-chip]').first();
  await expect(chip).toBeVisible({ timeout: 20_000 });
  await shot(page, 'read-new-chip');
  await chip.click();
  await expect(page.getByRole('dialog', { name: /^New (word|grammar): / })).toBeVisible();
  await shot(page, 'read-new-chip-sheet');
});

/** A fixture-pack sentence by id, with its tokens. */
function packSentence(id: string) {
  const url = new URL('../../public/packs/fixture/sentences-00.json.gz', import.meta.url);
  const all = JSON.parse(gunzipSync(readFileSync(fileURLToPath(url))).toString('utf8')) as {
    id: string;
    tokens: { surface: string; wordId?: string }[];
  }[];
  const found = all.find((s) => s.id === id);
  if (!found) throw new Error(`${id} not in the fixture pack`);
  return found;
}

test('read: the intro card teaches the reading in this sentence (R15)', async ({ page }) => {
  await onboard(page);
  await page.goto('/read?unit=family');
  await expect(page.locator('[data-card]').first()).toBeVisible({ timeout: 20_000 });
  // The saved session (R14) resumes on a card on 四 read よん, which JMdict reads し first.
  const sentence = packSentence('unit:family:1');
  const at = sentence.tokens.findIndex((t) => t.surface === '四');
  const wordId = sentence.tokens[at]?.wordId ?? '';
  await page.evaluate(
    ({ sentence, at, wordId }) => {
      const key = 'kanji-reader:session';
      const saved = JSON.parse(localStorage.getItem(key) ?? '{}');
      const target = {
        tokenIndex: at,
        itemId: `word:${wordId}`,
        wordId,
        surface: '四',
        readings: ['よん'],
      };
      const card = { sentence, targets: [target], reason: 'new' };
      saved.state = { ...saved.state, cards: [card, ...saved.state.cards], index: 0, step: 0 };
      saved.state.answered = undefined;
      localStorage.setItem(key, JSON.stringify(saved));
    },
    { sentence, at, wordId },
  );
  await page.reload();
  await expect(page.getByText('Here: よん · usually: し')).toBeVisible({ timeout: 20_000 });
  await shot(page, 'read-intro-here-usually', { full: true });
});
