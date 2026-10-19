import { describe, expect, it } from 'vitest';
import { readingRepos, S, W } from '../../test/reading-fixtures.ts';
import type { Repos } from '../repos.ts';
import type { ErrorType, GrammarPoint, Review, Verdict } from '../types.ts';
import { nextWeekId, rankedErrorTypes, weekBounds, weekStats } from './week-stats.ts';

/** Local time, so the Monday boundary holds in any time zone. */
const at = (day: number, hour = 9, minute = 0) => new Date(2026, 9, day, hour, minute).getTime();
/** Sunday 18 October 2026, the last day of 2026-W42 (Mon 12 – Sun 18). */
const NOW = at(18, 20);

interface Answer {
  at: number;
  word: { id: string };
  sentenceId?: string;
  answer: string;
  expected: string;
  verdict?: Verdict;
  errorType?: ErrorType;
}

async function answer(repos: Repos, a: Answer) {
  const review: Review = {
    at: a.at,
    itemId: `word:${a.word.id}`,
    answer: a.answer,
    expected: a.expected,
    verdict: a.verdict ?? (a.errorType ? 'near-miss' : 'correct'),
    durationMs: 3000,
    mode: 'typed',
  };
  if (a.sentenceId) review.sentenceId = a.sentenceId;
  if (a.errorType) review.errorType = a.errorType;
  await repos.reviews.add(review);
}

const grammar = (id: string, pattern: string, lesson: string): GrammarPoint => ({
  id,
  pattern,
  meaning: `${id} meaning`,
  lesson,
  exampleSentenceIds: [],
});

describe('weekBounds', () => {
  it('runs Monday 00:00 to the next Monday 00:00', () => {
    const bounds = weekBounds(NOW);
    expect(bounds.week).toBe('2026-W42');
    expect(bounds.start).toBe(new Date(2026, 9, 12).getTime());
    expect(bounds.end).toBe(new Date(2026, 9, 19).getTime());
    expect(weekBounds(at(12, 0)).week).toBe('2026-W42');
    expect(weekBounds(at(11, 23, 59)).week).toBe('2026-W41');
    expect(nextWeekId(NOW)).toBe('2026-W43');
    expect(weekBounds(new Date(2026, 11, 30).getTime()).week).toBe('2026-W53');
    expect(nextWeekId(new Date(2026, 11, 30).getTime())).toBe('2027-W01');
  });
});

describe('weekStats', () => {
  it('is empty for a week without answers', async () => {
    const repos = await readingRepos();
    const report = await weekStats(repos, { now: NOW });
    expect(report.stats).toEqual({
      week: '2026-W42',
      sentencesRead: 0,
      correct: 0,
      byErrorType: {},
      missExamples: [],
      unusedGrammar: [],
    });
    expect(report.activeDays).toBe(0);
    expect(report.minutesPerDay).toBe(0);
  });

  it('counts sentences, right ones and misses of this week only', async () => {
    const repos = await readingRepos({ currentLesson: 'Tobira 第4課' });
    const shoukai = { word: W.shoukai, expected: 'しょうかい' };
    // Sunday of the week before and Monday of the next: both outside W42.
    await answer(repos, { ...shoukai, at: at(11, 23), answer: 'shokai', errorType: 'long-vowel' });
    await answer(repos, { ...shoukai, at: at(19, 0), answer: 'shokai', errorType: 'long-vowel' });
    // Monday: one sentence, two targets, one wrong (a lookalike).
    const wait = { sentenceId: S.waiting.id, at: at(12) };
    await answer(repos, {
      ...wait,
      word: W.matsu,
      answer: 'もって',
      expected: 'まって',
      verdict: 'wrong',
      errorType: 'wrong-kanji',
    });
    await answer(repos, { ...wait, word: W.hon, answer: 'ほん', expected: 'ほん' });
    // Wednesday: two long-vowel misses and a right answer; a kana variant counts as right.
    await answer(repos, { ...shoukai, at: at(14), answer: 'shokai', errorType: 'long-vowel' });
    await answer(repos, {
      word: W.issho,
      at: at(14, 10),
      answer: 'いっしょ',
      expected: 'いっしょう',
      errorType: 'long-vowel',
    });
    await answer(repos, {
      word: W.eki,
      sentenceId: S.waitPlain.id,
      at: at(14, 11),
      answer: 'えき',
      expected: 'えき',
    });
    await answer(repos, {
      word: W.hon,
      sentenceId: S.student.id,
      at: at(18, 19),
      answer: 'ホン',
      expected: 'ほん',
      verdict: 'correct',
      errorType: 'kana-variant',
    });
    // A wrong answer without an error type counts as "other".
    await answer(repos, {
      word: W.eki,
      at: at(18, 19, 5),
      answer: 'nu',
      expected: 'えき',
      verdict: 'wrong',
    });

    const { stats, activeDays, minutesPerDay } = await weekStats(repos, { now: NOW });
    expect(stats.week).toBe('2026-W42');
    expect(stats.sentencesRead).toBe(6);
    expect(stats.correct).toBe(2);
    expect(stats.byErrorType).toEqual({ 'wrong-kanji': 1, 'long-vowel': 2, other: 1 });
    expect(stats.missExamples).toEqual([
      { surface: '一生', expected: 'いっしょう', given: 'いっしょ' },
      { surface: '紹介', expected: 'しょうかい', given: 'しょかい' },
      { surface: '待っ', expected: 'まって', given: 'もって' },
      { surface: '駅', expected: 'えき', given: 'ぬ' },
    ]);
    expect(stats.lesson).toBe('Tobira 第4課');
    expect(activeDays).toBe(3);
    expect(minutesPerDay).toBeCloseTo((6 * 20) / 60 / 3);
  });

  it('lists the lesson grammar not used yet', async () => {
    const repos = await readingRepos({ currentLesson: 'Tobira 第4課' });
    await repos.grammar.putMany([
      grammar('わけではない', '〜わけではない', 'Tobira 第4課'),
      grammar('に対して', '〜に対して', 'Tobira 第4課'),
      grammar('ことにする', '〜ことにする', 'Tobira 第4課'),
      grammar('ために', '〜ために', 'Tobira 第3課'),
    ]);
    await repos.items.put({
      id: 'grammar:ことにする',
      kind: 'grammar',
      ref: 'ことにする',
      level: 4,
      source: { kind: 'compose', week: '2026-W42', addedAt: NOW },
      updatedAt: NOW,
    });
    const report = await weekStats(repos, { now: NOW });
    expect(report.stats.unusedGrammar).toEqual(['〜わけではない', '〜に対して']);
    expect(report.unusedGrammarIds).toEqual(['わけではない', 'に対して']);
  });
});

describe('rankedErrorTypes', () => {
  it('orders by count and drops zeros', () => {
    expect(rankedErrorTypes({ sokuon: 1, 'long-vowel': 3, rendaku: 0 })).toEqual([
      'long-vowel',
      'sokuon',
    ]);
  });
});
