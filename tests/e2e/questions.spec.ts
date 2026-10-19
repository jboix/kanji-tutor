import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { answerField, importKnown, onboard } from './helpers.ts';

/** The fixture pack's sentences, to work out each question's right answer from the source. */
interface PackToken {
  surface: string;
  reading: string;
}
interface PackSentence {
  text: string;
  translation?: string;
  tokens: PackToken[];
}
const SENTENCES = JSON.parse(
  gunzipSync(
    readFileSync(
      fileURLToPath(new URL('../../public/packs/fixture/sentences-00.json.gz', import.meta.url)),
    ),
  ).toString('utf8'),
) as PackSentence[];

type Want = 'right' | 'wrong';

/** Right then wrong for 漢字読み and 文の組み立て, wrong then right for 文法形式の判断. */
const PLAN: Record<string, Want[]> = {
  漢字読み: ['right', 'wrong'],
  文法形式の判断: ['wrong', 'right'],
  文の組み立て: ['right', 'wrong'],
};

const DRILL =
  /^(Which kanji fits\?|Which pattern fits\?|One kanji, several readings|Same part, same sound)/;
const next = (page: Page) => page.getByRole('button', { name: /^Next (sentence|word)$/ });
const stem = (page: Page) => page.locator('main p[lang="ja"]').first();
const options = (page: Page) => page.getByRole('list', { name: 'Options' }).getByRole('button');

/** The stem's text before and after its marked part (the blank, or the ★ slots). */
async function around(page: Page, marked: string) {
  return stem(page).evaluate((p, selector) => {
    const marks = p.querySelectorAll(selector);
    const first = marks[0];
    const last = marks[marks.length - 1];
    if (!first || !last) return { before: p.textContent ?? '', after: '' };
    // Ranges, not child nodes: the last slot and the ？ after it share a span (U8).
    const range = document.createRange();
    range.selectNodeContents(p);
    range.setEndBefore(first);
    const before = range.toString();
    range.selectNodeContents(p);
    range.setStartAfter(last);
    return { before, after: range.toString() };
  }, marked);
}

function source(match: (s: PackSentence) => boolean): PackSentence {
  const found = SENTENCES.find(match);
  if (!found) throw new Error('question sentence not in the fixture pack');
  return found;
}

/** 漢字読み: the readings of the tokens under the underline. */
async function rightReading(page: Page): Promise<string> {
  const text = (await stem(page).textContent()) ?? '';
  const target = (await stem(page).locator('[data-mark]').textContent()) ?? '';
  const sentence = source((s) => s.text === text);
  let at = 0;
  let reading = '';
  for (const token of sentence.tokens) {
    const start = at;
    at += token.surface.length;
    const inside = start >= text.indexOf(target) && at <= text.indexOf(target) + target.length;
    if (inside) reading += token.reading;
  }
  return reading;
}

/**
 * 文法形式の判断: the text the blank hides. Before the answer Show meaning gives only the masked
 * translation (U6, D94), which tells two sentences of the same shape apart.
 */
async function rightForm(page: Page): Promise<string> {
  const { before, after } = await around(page, '[data-blank]');
  const shaped = SENTENCES.filter((s) => s.text.startsWith(before) && s.text.endsWith(after));
  let sentence = shaped.length === 1 ? shaped[0] : undefined;
  const show = page.getByRole('button', { name: 'Show meaning' });
  if (!sentence && (await show.count()) > 0) {
    await show.click();
    const hint = (await page.locator('[data-meaning]').textContent()) ?? '';
    const escaped = hint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll('___', '.+');
    const pattern = new RegExp(`^${escaped}$`);
    sentence = shaped.find((s) => pattern.test(s.translation ?? ''));
  }
  if (!sentence) throw new Error('question sentence not in the fixture pack');
  return sentence.text.slice(before.length, sentence.text.length - after.length);
}

async function chooseOption(page: Page, right: string, want: Want) {
  const texts = (await options(page).locator('span[lang="ja"]').allTextContents()).map((t) =>
    t.trim(),
  );
  const index = texts.indexOf(right);
  expect(index).toBeGreaterThanOrEqual(0);
  await options(page)
    .nth(want === 'right' ? index : (index + 1) % 4)
    .click();
}

function permutations(items: string[]): string[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
  );
}

/** 文の組み立て: fills the slots in the sentence's order (or with the ★ piece swapped). */
async function order(page: Page, want: Want) {
  const { before, after } = await around(page, '[data-slot]');
  const chips = page.getByRole('list', { name: 'Pieces' }).getByRole('button');
  const pieces = await chips.locator('span[lang="ja"]').allTextContents();
  const orders = permutations(pieces);
  const middle = (s: PackSentence) => s.text.slice(before.length, s.text.length - after.length);
  const rebuilt = (s: PackSentence) => orders.find((o) => o.join('') === middle(s));
  const sentence = source(
    (s) => s.text.startsWith(before) && s.text.endsWith(after) && !!rebuilt(s),
  );
  const right = rebuilt(sentence);
  if (!right) throw new Error('no order rebuilds the sentence');
  const label =
    (await stem(page).getByRole('button', { name: /★/ }).getAttribute('aria-label')) ?? '';
  const star = Number(/Slot (\d)/.exec(label)?.[1]) - 1;
  const chosen = [...right];
  if (want === 'wrong')
    [chosen[star], chosen[(star + 1) % 4]] = [chosen[(star + 1) % 4] ?? '', chosen[star] ?? ''];
  for (const piece of chosen) await chips.nth(pieces.indexOf(piece)).click();
  await page.getByRole('button', { name: 'Check' }).click();
}

async function answerQuestion(
  page: Page,
  section: string,
  seen: Map<string, number>,
  looks: string[],
) {
  const kind = section.replace(/^問題 · /, '');
  const times = seen.get(kind) ?? 0;
  seen.set(kind, times + 1);
  const want = PLAN[kind]?.[times] ?? 'right';
  if (kind === '漢字読み') await chooseOption(page, await rightReading(page), want);
  else if (kind === '文法形式の判断') await chooseOption(page, await rightForm(page), want);
  else if (kind === '文の組み立て') await order(page, want);
  else await options(page).first().click();
  if (PLAN[kind]) {
    const look = want === 'right' ? 'correct' : 'wrong';
    await expect(page.locator(`[data-answer="${look}"]`)).toBeVisible();
    looks.push(look);
  }
  const why = page.getByRole('list', { name: 'Why each option' });
  await expect(why.getByRole('listitem')).toHaveCount(4);
  await page.getByRole('button', { name: 'Next sentence' }).click();
}

async function answerOther(page: Page, input: Locator) {
  if ((await page.getByText(DRILL).count()) > 0) {
    const choices = page.getByRole('group', { name: 'Choices' }).getByRole('button');
    if ((await input.count()) > 0) {
      await input.pressSequentially('nu');
      await input.press('Enter');
    } else await choices.first().click();
  } else {
    await answerField(page);
    await input.pressSequentially('nu');
    await input.press('Enter');
  }
  await next(page).click();
}

/**
 * JLPT-shaped questions in a session (J1–J5, J7), forced with `/read?questions=1`: 漢字読み,
 * 文法形式の判断 and 文の組み立て are answered (right or wrong as PLAN says, worked out from the
 * fixture pack), each answer shows the right state and explains all four options, and the
 * session goes on to its end.
 */
test('questions in a session are answered right and wrong', async ({ page }) => {
  test.setTimeout(120_000);
  await onboard(page);
  await importKnown(page);
  await page.goto('/read?questions=1');
  const input = page.locator('form input[lang="ja"]');
  const section = page.locator('main header p').filter({ hasText: /^問題 · / });
  const done = page.getByText('Session done');
  // A new word's intro card (L1) can come before a sentence: "Got it" goes on to it.
  const intro = page.getByRole('button', { name: 'Got it' });
  await answerField(page);
  await expect(section).toHaveCount(0);
  const seen = new Map<string, number>();
  const looks: string[] = [];
  for (let card = 0; card < 60 && (await done.count()) === 0; card++) {
    await expect(
      input.or(intro).or(section).or(page.getByText(DRILL)).or(done).first(),
    ).toBeVisible();
    if ((await done.count()) > 0) break;
    if ((await section.count()) > 0)
      await answerQuestion(page, (await section.textContent()) ?? '', seen, looks);
    else await answerOther(page, input);
  }
  expect(seen.get('漢字読み')).toBeGreaterThanOrEqual(1);
  expect(seen.get('文法形式の判断')).toBeGreaterThanOrEqual(1);
  expect(seen.get('文の組み立て')).toBeGreaterThanOrEqual(1);
  expect(looks).toContain('correct');
  expect(looks).toContain('wrong');
  await expect(done).toBeVisible();
});
