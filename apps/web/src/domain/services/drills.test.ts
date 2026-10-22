import { describe, expect, it } from 'vitest';
import { drillRepos, review, swap } from '../../test/drill-fixtures.ts';
import { knowBasics, NOW, readingRepos, S, track, W } from '../../test/reading-fixtures.ts';
import type { ClozeDrill, Drill, LookalikeDrill, ReadingsDrill } from '../drills/index.ts';
import { isoWeek } from '../ids.ts';
import type { Repos } from '../repos.ts';
import type { SessionCard } from '../session-types.ts';
import type { SessionMix } from '../types.ts';
import { acceptComposition } from './compose.ts';
import { recordDrillChoice, recordDrillReading, recordFamilyGuess } from './drill-answer.ts';
import { mistakeSignals } from './drills.ts';
import { addGrammarPoint } from './grammar.ts';
import { buildSession } from './session.ts';
import { topLookalike } from './summary.ts';

const drills = (cards: readonly SessionCard[]) => cards.flatMap((c) => c.drill ?? []);
const R8: readonly Drill['kind'][] = ['lookalike', 'readings', 'family', 'cloze'];
/** The R8 drill kinds of a session; the S4 exercises (S7) come by their own rule. */
const kinds = (cards: readonly SessionCard[]) =>
  drills(cards)
    .map((d) => d.kind)
    .filter((kind) => R8.includes(kind));

function only<T extends Drill['kind']>(cards: readonly SessionCard[], kind: T) {
  return drills(cards).find((d): d is Extract<Drill, { kind: T }> => d.kind === kind);
}

async function acceptPlan(repos: Repos, mix: Partial<SessionMix>) {
  await repos.plans.put({
    id: isoWeek(new Date(NOW)),
    createdAt: NOW,
    letter: [],
    lines: [],
    mix: { dailyMinutes: 1, focusErrorTypes: {}, grammarIds: [], drillShare: 0.5, ...mix },
    status: 'accepted',
  });
}

/** Moves an item's FSRS card a month out. */
async function notDue(repos: Repos, id: `grammar:${string}`) {
  const item = await repos.items.get(id);
  if (item?.card) await repos.items.put({ ...item, card: { ...item.card, due: NOW + 30 * DAY } });
}

const DAY = 86_400_000;

describe('buildSession with drills', () => {
  it('mixes drills in after reading cards, never first and never two in a row', async () => {
    const repos = await drillRepos();
    await repos.reviews.add(swap);
    const cards = await buildSession(repos, { now: NOW, drillShare: 0.5 });
    expect(cards.filter((c) => !c.drill)).toHaveLength(3);
    expect(cards[0]?.drill).toBeUndefined();
    cards.forEach((card, i) => {
      if (card.drill) expect(cards[i - 1]?.drill).toBeUndefined();
    });
    for (const card of cards.filter((c) => c.drill)) {
      expect(card).toMatchObject({ reason: 'drill', targets: [] });
    }
    expect(drills(cards).length).toBeGreaterThanOrEqual(2);
  });

  it('drills the pair the learner swapped first', async () => {
    const repos = await drillRepos();
    await repos.reviews.add(swap);
    const cards = await buildSession(repos, { now: NOW, drillShare: 0.5 });
    const first = drills(cards)[0] as LookalikeDrill;
    expect(first).toMatchObject({ kind: 'lookalike', answer: '待', confused: true });
    expect(first.choices.map((c) => c.char).sort()).toEqual(['待', '持']);
    expect([S.waiting.id, S.waitPlain.id]).toContain(first.sentence.id);
  });

  it('builds one kanji, many readings for a kanji just read, from the words that prove it', async () => {
    const repos = await drillRepos();
    await repos.reviews.add(
      review({ itemId: `word:${W.ikiru.id}`, answer: 'いきる', expected: 'いきる' }),
    );
    const cards = await buildSession(repos, { now: NOW, drillShare: 0.5 });
    const drill = only(cards, 'readings') as ReadingsDrill;
    expect(drill.kanji).toBe('生');
    // 学生 and 先生 are read in this session already, so they are left out.
    expect(drill.items.map((i) => i.form).sort()).toEqual(['一生', '生きる'].sort());
    const card = cards.find((c) => c.drill === drill);
    expect(card?.sentence).toMatchObject({ id: 'drill:readings:生', verified: true });
    expect(card?.sentence.text.split('、').sort()).toEqual(['一生', '生きる'].sort());
  });

  it('builds a phonetic family drill from two members the learner reads', async () => {
    const repos = await drillRepos();
    await repos.kanjiReadings.put({
      id: '生:セイ',
      kanji: '生',
      reading: 'セイ',
      level: 3,
      wordIds: [],
    });
    await repos.kanjiReadings.put({
      id: '星:セイ',
      kanji: '星',
      reading: 'セイ',
      level: 3,
      wordIds: [],
    });
    await repos.reviews.add(
      review({ itemId: `word:${W.gakusei.id}`, answer: 'がくせい', expected: 'がくせい' }),
    );
    const cards = await buildSession(repos, { now: NOW, drillShare: 0.5 });
    expect(only(cards, 'family')).toMatchObject({ part: '生', sound: 'セイ', guess: '性' });
  });

  it('asks a grammar cloze first when the plan names grammar, with the lesson patterns', async () => {
    const repos = await drillRepos();
    for (const pattern of ['〜ている', '〜ながら', '〜ことにする']) {
      await addGrammarPoint(repos, { pattern, meaning: pattern, lesson: 'L4', now: NOW });
    }
    await acceptPlan(repos, { grammarIds: ['ている'] });
    await repos.reviews.add(review({}));
    const cards = await buildSession(repos, { now: NOW, size: 3 });
    const drill = drills(cards)[0] as ClozeDrill;
    expect(drill).toMatchObject({ kind: 'cloze', grammarId: 'ている' });
    expect(drill.sentence.text.slice(drill.start, drill.end)).toBe('ている');
    expect(drill.choices).toHaveLength(3);
  });

  it('reviews a due grammar point through a cloze on an accepted Use it sentence', async () => {
    const repos = await drillRepos();
    const points = [];
    for (const pattern of ['〜ている', '〜ながら', '〜ことにする']) {
      points.push(
        await addGrammarPoint(repos, { pattern, meaning: pattern, lesson: 'L4', now: NOW }),
      );
    }
    for (const id of ['ながら', 'ことにする']) await notDue(repos, `grammar:${id}`);
    const [teiru] = points;
    if (!teiru) throw new Error('no grammar point');
    const { sentence } = await acceptComposition(repos, {
      grammar: teiru,
      original: S.waiting.text,
      correction: { corrected: S.waiting.text, marks: [], usesTarget: true, readings: [] },
      now: NOW,
      lang: { tokenize: async () => structuredClone(S.waiting.tokens) },
    });
    const cards = await buildSession(repos, { now: NOW, drillShare: 0.5 });
    const cloze = only(cards, 'cloze');
    expect(cloze).toMatchObject({ grammarId: 'ている', sentence: { id: sentence.id } });
    expect(cloze?.sentence).toMatchObject({ source: 'compose', grammarIds: ['ている'] });
    if (!cloze) return;
    await recordDrillChoice(repos, { drill: cloze, choice: 'ている', durationMs: 2000, now: NOW });
    const card = (await repos.items.get('grammar:ている'))?.card;
    expect(card?.reps).toBe(1);
    expect(card?.due).toBeGreaterThan(NOW);
  });

  it('follows the plan share: none at 0, none by default for a short session', async () => {
    const repos = await drillRepos();
    await repos.reviews.add(swap);
    const plain = await buildSession(repos, { now: NOW });
    expect(kinds(plain)).toEqual([]);
    expect(drills(plain).length).toBeGreaterThan(0);
    await acceptPlan(repos, { drillShare: 0 });
    expect(kinds(await buildSession(repos, { now: NOW, size: 3 }))).toEqual([]);
    await acceptPlan(repos, { drillShare: 0.5 });
    expect(kinds(await buildSession(repos, { now: NOW, size: 3 }))).toContain('lookalike');
  });

  it('has no drills in a focused session', async () => {
    const repos = await drillRepos();
    await repos.reviews.add(swap);
    const focus = { kanji: '来', reading: 'く.る' };
    const cards = await buildSession(repos, { now: NOW, focus, drillShare: 0.5 });
    expect(kinds(cards)).toEqual([]);
  });

  it('builds no drill when nothing allows one', async () => {
    const repos = await readingRepos();
    await knowBasics(repos);
    await track(repos, [[W.kuru, 2]]);
    const cards = await buildSession(repos, { now: NOW, drillShare: 0.5 });
    expect(cards.length).toBeGreaterThan(0);
    expect(kinds(cards)).toEqual([]);
  });
});

describe('recording drills', () => {
  async function lookalike(repos: Repos): Promise<LookalikeDrill> {
    const cards = await buildSession(repos, { now: NOW, drillShare: 0.5 });
    return only(cards, 'lookalike') as LookalikeDrill;
  }

  it('logs a wrong lookalike choice as wrong-kanji, which Today and the next session see', async () => {
    const repos = await drillRepos();
    await repos.reviews.add(review({}));
    const drill = await lookalike(repos);
    expect(drill.confused).toBe(false);
    const grade = await recordDrillChoice(repos, {
      drill,
      choice: '持',
      durationMs: 2000,
      now: NOW,
    });
    expect(grade).toMatchObject({
      verdict: 'wrong',
      errorType: 'wrong-kanji',
      expected: '待',
      given: '持',
    });
    const logged = (await repos.reviews.all()).at(-1);
    expect(logged).toMatchObject({
      mode: 'drill',
      answer: '持',
      expected: '待',
      sentenceId: drill.sentence.id,
    });
    expect(await topLookalike(repos, await repos.reviews.all())).toEqual({
      pair: ['待', '持'],
      times: 1,
    });
    const next = await lookalike(repos);
    expect(next.confused).toBe(true);
    expect((await repos.items.get(drill.itemId))?.level).toBe(3);
  });

  it('logs a right lookalike choice and a cloze choice without error types', async () => {
    const repos = await drillRepos();
    await repos.reviews.add(swap);
    const drill = await lookalike(repos);
    expect(
      await recordDrillChoice(repos, { drill, choice: '待', durationMs: 1, now: NOW }),
    ).toMatchObject({ verdict: 'correct' });
    const cloze: ClozeDrill = {
      kind: 'cloze',
      sentence: S.waiting,
      grammarId: 'ている',
      itemId: 'grammar:ている',
      meaning: 'ongoing',
      start: 7,
      end: 10,
      choices: [
        { grammarId: 'ている', pattern: 'ている' },
        { grammarId: 'ながら', pattern: 'ながら' },
      ],
    };
    const grade = await recordDrillChoice(repos, {
      drill: cloze,
      choice: 'ながら',
      durationMs: 1,
      now: NOW,
    });
    expect(grade).toEqual({ verdict: 'wrong', expected: 'ている', given: 'ながら' });
    const logged = (await repos.reviews.all()).at(-1);
    expect(logged).toMatchObject({ itemId: 'grammar:ている', mode: 'drill', verdict: 'wrong' });
    expect(logged?.errorType).toBeUndefined();
    expect(mistakeSignals(await repos.reviews.all()).clozeMisses).toBe(1);
  });

  it('logs a skipped choice or guess as a skip, never as a swap (L4)', async () => {
    const repos = await drillRepos();
    await repos.reviews.add(swap);
    const drill = await lookalike(repos);
    const before = (await repos.reviews.all()).length;
    const skip = { choice: '', durationMs: 1, now: NOW, skipped: true };
    expect(await recordDrillChoice(repos, { drill, ...skip })).toEqual({
      verdict: 'wrong',
      expected: '待',
      given: '',
      skipped: true,
    });
    const logged = await repos.reviews.all();
    expect(logged).toHaveLength(before + 1);
    expect(logged.at(-1)).toMatchObject({ skipped: true, answer: '', verdict: 'wrong' });
    expect(logged.at(-1)?.errorType).toBeUndefined();
    const family = {
      kind: 'family' as const,
      part: '生',
      sound: 'セイ',
      known: ['生', '星'],
      guess: '性',
      itemId: 'kanjiReading:性:セイ' as const,
      accepted: ['せい', 'しょう'],
    };
    expect(await recordFamilyGuess(repos, { drill: family, answer: '', ...skip })).toMatchObject({
      verdict: 'wrong',
      expected: 'せい',
      skipped: true,
    });
  });

  it('reads a drill word like a session answer: level, FSRS and a drill review without sentence', async () => {
    const repos = await drillRepos();
    const item = {
      wordId: W.gakusei.id,
      itemId: `word:${W.gakusei.id}` as const,
      form: '学生',
      kanjiReading: 'セイ',
      readings: ['がくせい'],
    };
    const grade = await recordDrillReading(repos, {
      item,
      answer: 'gakusei',
      durationMs: 5000,
      now: NOW,
    });
    expect(grade.verdict).toBe('correct');
    const stored = await repos.items.get(item.itemId);
    expect(stored?.level).toBe(3);
    expect(stored?.card?.reps).toBe(1);
    const [logged] = await repos.reviews.all();
    expect(logged).toMatchObject({ mode: 'drill', verdict: 'correct' });
    expect(logged?.sentenceId).toBeUndefined();
    const skip = { item, answer: '', durationMs: 1, now: NOW + 1000, skipped: true };
    expect(await recordDrillReading(repos, skip)).toMatchObject({ skipped: true });
    expect((await repos.items.get(item.itemId))?.level).toBe(2);
  });

  it('grades a family guess against the member and logs it to its kanji reading', async () => {
    const repos = await drillRepos();
    const drill = {
      kind: 'family' as const,
      part: '生',
      sound: 'セイ',
      known: ['生', '星'],
      guess: '性',
      itemId: 'kanjiReading:性:セイ' as const,
      accepted: ['せい', 'しょう'],
    };
    expect(
      await recordFamilyGuess(repos, { drill, answer: 'se', durationMs: 1, now: NOW }),
    ).toMatchObject({ verdict: 'near-miss', errorType: 'long-vowel' });
    expect(
      await recordFamilyGuess(repos, { drill, answer: 'shou', durationMs: 1, now: NOW }),
    ).toMatchObject({ verdict: 'correct' });
    expect((await repos.reviews.all()).map((r) => r.itemId)).toEqual([
      'kanjiReading:性:セイ',
      'kanjiReading:性:セイ',
    ]);
  });
});
