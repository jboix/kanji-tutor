import { describe, expect, it, vi } from 'vitest';
import { knowBasics, NOW, readingRepos, S, track, W } from '../../test/reading-fixtures.ts';
import type { Repos } from '../repos.ts';
import type { ErrorType, Review, Verdict } from '../types.ts';
import { sessionOutline } from './session-outline.ts';
import { todayOverview, todaySession, todaySummary, trainerNote } from './summary.ts';

function review(
  verdict: Verdict,
  errorType: ErrorType | undefined,
  answer: string,
  expected: string,
  at = NOW - 1000,
  itemId: Review['itemId'] = `word:${W.matsu.id}`,
): Review {
  const r: Review = { at, itemId, answer, expected, verdict, durationMs: 4000, mode: 'typed' };
  if (errorType) r.errorType = errorType;
  return r;
}

async function addAll(repos: Repos, reviews: readonly Review[]) {
  for (const r of reviews) await repos.reviews.add(r);
}

describe('trainerNote', () => {
  it('is undefined without answers this week', () => {
    expect(trainerNote([])).toBeUndefined();
  });

  it('says nothing was missed when every answer was right', () => {
    expect(trainerNote([review('correct', 'kana-variant', 'マツ', 'まつ')])).toEqual({
      count: 0,
      answers: 1,
    });
  });

  it('names the most frequent slip with its latest example', () => {
    const note = trainerNote([
      review('near-miss', 'long-vowel', 'しょかい', 'しょうかい', NOW - 5000),
      review('near-miss', 'long-vowel', 'いっしょ', 'いっしょう', NOW - 1000),
      review('near-miss', 'sokuon', 'まて', 'まって'),
      review('correct', undefined, 'まつ', 'まつ'),
    ]);
    expect(note).toEqual({
      errorType: 'long-vowel',
      count: 2,
      answers: 4,
      example: { given: 'いっしょ', expected: 'いっしょう' },
    });
  });
});

describe('todaySummary', () => {
  it('counts the session, its minutes and the cards with new readings', async () => {
    const repos = await readingRepos();
    await knowBasics(repos);
    await track(repos, [[W.matsu, 2]]);
    const summary = await todaySummary(repos, NOW);
    expect(summary.cards.length).toBeGreaterThan(0);
    expect(summary.minutes).toBe(sessionOutline(summary.cards, 0).minutes);
    expect(summary.minutes).toBeLessThanOrEqual(6);
    expect(summary.newReadings).toBe(summary.cards.filter((c) => !c.drill).length);
    expect(summary.trackedWords).toBe(5);
    expect(summary.note).toBeUndefined();
    expect(summary.lookalike).toBeUndefined();
  });

  it('splits into an overview that builds no session and the session (N10)', async () => {
    const repos = await readingRepos();
    await knowBasics(repos);
    await track(repos, [[W.matsu, 2]]);
    const containingWord = vi.spyOn(repos.sentences, 'containingWord');
    const overview = await todayOverview(repos, NOW);
    expect(containingWord).not.toHaveBeenCalled();
    expect(overview).not.toHaveProperty('cards');
    const session = await todaySession(repos, NOW);
    expect({ ...overview, ...session }).toEqual(await todaySummary(repos, NOW));
  });

  it('reports class progress for the current lesson, ignoring imported words', async () => {
    const lesson = 'Tobira 第4課';
    const repos = await readingRepos({ currentLesson: lesson });
    await track(
      repos,
      [
        [W.gakusei, 4],
        [W.issho, 1],
      ],
      { lesson },
    );
    await track(repos, [[W.hon, 3]], { lesson, kind: 'import' });
    await repos.grammar.putMany([
      {
        id: 'wake',
        pattern: '〜わけではない',
        meaning: 'not that',
        lesson,
        exampleSentenceIds: [],
      },
      { id: 'ni-yotte', pattern: '〜によって', meaning: 'by', lesson, exampleSentenceIds: [] },
      {
        id: 'other',
        pattern: '〜ば',
        meaning: 'if',
        lesson: 'Tobira 第3課',
        exampleSentenceIds: [],
      },
    ]);
    await repos.items.put({
      id: 'grammar:ni-yotte',
      kind: 'grammar',
      ref: 'ni-yotte',
      level: 1,
      source: { kind: 'compose', week: '2026-W42', addedAt: NOW },
      updatedAt: NOW,
    });
    const { progress } = await todaySummary(repos, NOW);
    expect(progress.lesson).toBe(lesson);
    expect(progress.words).toEqual({ done: 1, total: 2 });
    expect(progress.grammar).toEqual({ done: 1, total: 2 });
    expect(progress.nextGrammar?.pattern).toBe('〜わけではない');
  });

  it('uses this week when no lesson is set', async () => {
    const repos = await readingRepos();
    await track(repos, [[W.gakusei, 2]]);
    const { progress } = await todaySummary(repos, NOW);
    expect(progress.lesson).toBeUndefined();
    expect(progress.words).toEqual({ done: 0, total: 1 });
    expect(progress.grammar).toEqual({ done: 0, total: 0 });
  });

  it('finds the lookalike pair swapped most often this week', async () => {
    const repos = await readingRepos();
    await addAll(repos, [
      review('wrong', 'wrong-kanji', 'もって', 'まっ'),
      review('wrong', 'wrong-kanji', 'もつ', 'まつ'),
      review('wrong', 'wrong-kanji', 'zzz', 'まつ'),
      review('wrong', 'other', 'たべ', 'まつ'),
      review('wrong', 'wrong-kanji', 'もつ', 'まつ', NOW - 9 * 86_400_000),
    ]);
    const summary = await todaySummary(repos, NOW);
    expect(summary.lookalike).toEqual({ pair: ['待', '持'], times: 2 });
    expect(summary.note).toMatchObject({ errorType: 'wrong-kanji', count: 3, answers: 4 });
  });

  it('ignores wrong-kanji reviews of words missing from the dictionary', async () => {
    const repos = await readingRepos();
    await addAll(repos, [review('wrong', 'wrong-kanji', 'もつ', 'まつ', NOW - 1, 'word:999')]);
    expect((await todaySummary(repos, NOW)).lookalike).toBeUndefined();
    expect(S.waiting.text).toBe('駅で友達を待っている間に、本を読みました。');
  });
});
