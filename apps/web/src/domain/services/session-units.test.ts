import { describe, expect, it } from 'vitest';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { NOW } from '../../test/reading-fixtures.ts';
import type { SessionCard } from '../session-types.ts';
import { isExercise } from './drill-answer.ts';
import { importKnown } from './import-known.ts';
import { buildSession, questionCount } from './session.ts';
import { cardType, longestRun } from './session-mix.ts';
import { sessionOutline } from './session-outline.ts';
import { unitPassageCard } from './unit-passage.ts';

describe('unit sessions (T3, T6)', { timeout: 30_000 }, () => {
  it('builds the Read step as the passage and its questions alone', async () => {
    const repos = await curriculumRepos();
    const cards = await buildSession(repos, { now: NOW, unit: 'family', passage: true });
    expect(cards).toHaveLength(1);
    expect(cards[0]?.passage?.questions.length).toBeGreaterThanOrEqual(2);
    expect(cards[0]?.sentence.level).toBe(5);
    expect(await buildSession(repos, { now: NOW, unit: 'nope', passage: true })).toEqual([]);
    expect(unitPassageCard('nope')).toBeUndefined();
  });

  it('practises a unit with its passage last and its words first', async () => {
    const repos = await curriculumRepos();
    const cards = await buildSession(repos, { now: NOW, unit: 'self-introduction' });
    expect(cards.at(-1)?.passage?.id).toBe('unit:self-introduction');
    expect(cards[0]?.passage).toBeUndefined();
    expect(cards.filter((c) => c.reason !== 'drill').length).toBeGreaterThan(0);
  });

  it('asks enough questions for the mix, or as many as `every` says', () => {
    expect(questionCount(10, 1)).toBe(3);
    expect(questionCount(30, 0)).toBe(14);
    expect(questionCount(10, 0, 2)).toBe(5);
    expect(questionCount(10, 0, 0)).toBe(0);
  });
});

describe('a learner from zero (V2)', { timeout: 60_000 }, () => {
  it('gets exercises between reading cards, never more than two readings in a row', async () => {
    // As onboarding starts them: N5 from zero, N4 with N5 known, N3 with N5 and N4.
    const lists = { 5: [], 4: ['n5'], 3: ['n5', 'n4'] } as const;
    for (const level of [5, 4, 3] as const) {
      const repos = await curriculumRepos();
      await importKnown(repos, { lists: lists[level], now: NOW });
      await repos.settings.patch({ learnerLevel: level });
      const cards = await buildSession(repos, { now: NOW });
      const readings = cards.filter((c) => cardType(c) === 'reading');
      expect(readings.length, `N${level}`).toBeGreaterThanOrEqual(2);
      // From zero, the few new words give few questions: the S4 exercises (S7) or the unit's
      // passage fill the gaps.
      const exercise =
        level === 5
          ? (c: SessionCard) => !!c.passage || (c.drill !== undefined && isExercise(c.drill))
          : (c: SessionCard) => !!c.question;
      expect(cards.some(exercise), `N${level}`).toBe(true);
      expect(longestRun(cards), `N${level}`).toBeLessThanOrEqual(2);
    }
  });

  it('asks about a session word only after the card that introduces it', async () => {
    const repos = await curriculumRepos();
    const cards = await buildSession(repos, { now: NOW });
    const seen = new Set<string>();
    const introduced = new Set(cards.flatMap((c) => c.targets.map((t) => t.wordId)));
    for (const card of cards) {
      for (const t of card.targets) seen.add(t.wordId);
      if (!card.question) continue;
      const shown = card.sentence.wordIds.filter((id) => introduced.has(id));
      expect(
        shown.every((id) => seen.has(id)),
        card.sentence.text,
      ).toBe(true);
    }
  });
});

describe('unitPassageCard in the learner’s language (N9)', () => {
  it('carries the French line translations and explanations, prompts unchanged', async () => {
    const { contentLookup } = await import('../content-language.ts');
    const { FR_UNITS } = await import('../themes/fr/index.ts');
    const fr = contentLookup('fr', { grammar: {}, functionWords: {}, units: FR_UNITS });
    const english = unitPassageCard('family')?.passage;
    const french = unitPassageCard('family', fr)?.passage;
    expect(french?.sentences[0]?.en).toBe(FR_UNITS.family?.sentences[0]);
    expect(french?.questions[0]?.question).toBe(english?.questions[0]?.question);
    const right = french?.questions[0]?.answer ?? 0;
    expect(french?.questions[0]?.options[right]?.note).toBe(FR_UNITS.family?.questions[0]);
  });
});

describe('about five minutes, a few new things at a time (L6)', { timeout: 60_000 }, () => {
  const lists = { 5: [], 4: ['n5'], 3: ['n5', 'n4'] } as const;
  const KANJI = /\p{Script=Han}/gu;

  async function session(level: 5 | 4 | 3, extra: { unit?: string; minutes?: 5 | 10 | 15 } = {}) {
    const repos = await curriculumRepos();
    await importKnown(repos, { lists: lists[level], now: NOW });
    await repos.settings.patch({ learnerLevel: level, sessionMinutes: extra.minutes ?? 5 });
    const known = new Set((await repos.items.byKind('word')).map((i) => i.ref));
    const rows = await repos.kanjiReadings.all();
    const kanji = new Set(rows.filter((r) => r.level > 0).map((r) => r.kanji));
    const cards = await buildSession(repos, {
      now: NOW,
      ...(extra.unit ? { unit: extra.unit } : {}),
    });
    return { cards, known, kanji };
  }

  /** New words, and their kanji not met in a known word before. */
  function newItems(found: Awaited<ReturnType<typeof session>>) {
    const targets = found.cards.flatMap((c) => c.targets).filter((t) => !found.known.has(t.wordId));
    const kanji = targets.flatMap((t) => t.surface.match(KANJI) ?? []);
    return {
      words: new Set(targets.map((t) => t.wordId)).size,
      kanji: new Set(kanji.filter((k) => !found.kanji.has(k))).size,
    };
  }

  it('fits the minutes set by the R13 estimate, daily and unit sessions alike', async () => {
    for (const level of [5, 4, 3] as const) {
      const { cards } = await session(level);
      expect(sessionOutline(cards, 0).minutes, `N${level}`).toBeLessThanOrEqual(5);
    }
    const unit = await session(5, { unit: 'i-am-a-student' });
    expect(sessionOutline(unit.cards, 0).minutes).toBeLessThanOrEqual(5);
    expect(unit.cards.at(-1)?.passage).toBeDefined();
  });

  it('brings in at most 3 new kanji and 5 new words at N5, 5 and 8 at N4 and N3', async () => {
    const caps = { 5: [3, 5], 4: [5, 8], 3: [5, 8] } as const;
    for (const level of [5, 4, 3] as const) {
      for (const minutes of [5, 15] as const) {
        const found = newItems(await session(level, { minutes }));
        expect(found.kanji, `N${level} ${minutes} min`).toBeLessThanOrEqual(caps[level][0]);
        expect(found.words, `N${level} ${minutes} min`).toBeLessThanOrEqual(caps[level][1]);
      }
    }
  });

  it('gets longer with a longer setting', async () => {
    const short = await session(4, { minutes: 5 });
    const long = await session(4, { minutes: 15 });
    expect(long.cards.length).toBeGreaterThan(short.cards.length);
    expect(sessionOutline(long.cards, 0).minutes).toBeLessThanOrEqual(15);
  });
});

describe('grammar taught like kanji (L7, L8)', { timeout: 60_000 }, () => {
  it('puts a new point’s intro before its first exercise, the first card too', async () => {
    const repos = await curriculumRepos();
    const cards = await buildSession(repos, { now: NOW, unit: 'i-am-a-student' });
    const at = cards.findIndex((c) => c.grammarIntro === 'desu');
    expect(at).toBeGreaterThanOrEqual(0);
    const first = cards.findIndex(
      (c) => !c.grammarIntro && c.sentence.grammarIds?.includes('desu'),
    );
    expect(at).toBeLessThan(first);
  });

  it('with explanations skipped, has no intro cards and marks the first exercise instead', async () => {
    const repos = await curriculumRepos();
    await repos.settings.patch({ explainFirst: false });
    const cards = await buildSession(repos, { now: NOW, unit: 'i-am-a-student' });
    expect(cards.some((c) => c.grammarIntro)).toBe(false);
    const marked = cards.find((c) => c.newGrammar?.includes('desu'));
    expect(marked?.sentence.grammarIds).toContain('desu');
  });
});
