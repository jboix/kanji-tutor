import { describe, expect, it } from 'vitest';
import type { MetFirst } from '../../domain/services/index.ts';
import type { SessionCard, Target } from '../../domain/session-types.ts';
import type { Grade, Word } from '../../domain/types.ts';
import { S, W } from '../../test/reading-fixtures.ts';
import {
  endCounts,
  metInput,
  missedOf,
  retryCards,
  sessionMinutes,
  splitMet,
} from './session-review.ts';
import type { Answered, DrillResult } from './session-state.ts';

const target = (tokenIndex: number, word: Word): Target => ({
  tokenIndex,
  itemId: `word:${word.id}`,
  wordId: word.id,
  surface: word.forms[0] ?? '',
  readings: [...word.readings],
});

// 駅で友達を待っている間に、本を読みました。: 待っ (4) and 間 (7).
const reading: SessionCard = {
  sentence: S.waiting,
  targets: [target(4, W.matsu), target(7, W.aida)],
  reason: 'new',
  newGrammar: ['te-iru'],
};
const other: SessionCard = { sentence: S.student, targets: [target(0, W.gakusei)], reason: 'due' };
const exercise: SessionCard = {
  sentence: S.came,
  targets: [],
  reason: 'drill',
  drill: { kind: 'lookalike' } as NonNullable<SessionCard['drill']>,
};
const intro: SessionCard = { sentence: S.came, targets: [], reason: 'drill', grammarIntro: 'desu' };
const cards = [reading, intro, exercise, other];

const answer = (card: number, t: Target, grade: Partial<Grade>): Answered => ({
  target: t,
  answer: grade.given ?? '',
  mode: 'typed',
  card,
  grade: { verdict: 'correct', expected: t.readings[0] ?? '', given: '', ...grade },
});

const results = [
  answer(0, target(4, W.matsu), { verdict: 'near-miss', errorType: 'sokuon', given: 'まて' }),
  answer(0, target(7, W.aida), { verdict: 'correct', given: 'あいだ' }),
  answer(3, target(0, W.gakusei), { verdict: 'wrong', skipped: true }),
];
const drills: DrillResult[] = [{ kind: 'lookalike', right: false, card: 2 }];

describe('missedOf (D116)', () => {
  it('lists near-misses, misses, skips and missed exercises in session order', () => {
    const missed = missedOf({ cards, results, drills });
    expect(missed.map((m) => [m.kind, m.index])).toEqual([
      ['reading', 0],
      ['exercise', 2],
      ['reading', 3],
    ]);
  });

  it('leaves out right answers and answers saved without their card', () => {
    const { card: _, ...old } = results[2] as Answered;
    const right = [results[1] as Answered, old];
    expect(
      missedOf({ cards, results: right, drills: [{ kind: 'cloze', right: true, card: 2 }] }),
    ).toEqual([]);
  });
});

describe('retryCards (D117)', () => {
  it('replays only the missed targets and exercises, once per card, no longer new', () => {
    const extra = answer(0, target(7, W.aida), { verdict: 'wrong', given: 'ま' });
    const round = retryCards(missedOf({ cards, results: [...results, extra], drills }));
    expect(round).toHaveLength(3);
    expect(round[0]?.sentence.id).toBe(S.waiting.id);
    expect(round[0]?.targets.map((t) => t.tokenIndex)).toEqual([4, 7]);
    expect(round[0]?.reason).toBe('due');
    expect(round[0]).not.toHaveProperty('newGrammar');
    expect(round[1]).toMatchObject({ reason: 'drill', drill: { kind: 'lookalike' } });
    expect(round[2]?.targets.map((t) => t.wordId)).toEqual([W.gakusei.id]);
  });

  it('cuts a card down to the one target missed', () => {
    const round = retryCards(missedOf({ cards, results: results.slice(0, 2), drills: [] }));
    expect(round.map((card) => card.targets.map((t) => t.tokenIndex))).toEqual([[4]]);
  });

  it('is empty when nothing was missed', () => {
    expect(retryCards([])).toEqual([]);
  });
});

describe('endCounts (D116)', () => {
  it('counts sentences, answers read right, and the rest to look at again', () => {
    expect(endCounts(2, { cards, results, drills: [] })).toEqual({
      label: 'sentences',
      done: 2,
      right: 1,
      again: 2,
    });
  });

  it('counts each exercise once, with the sentences or alone', () => {
    const both = endCounts(2, { cards, results, drills });
    expect(both).toEqual({ label: 'both', done: 3, right: 1, again: 3 });
    const only = endCounts(0, {
      cards,
      results: [],
      drills: [...drills, { kind: 'cloze', right: true }],
    });
    expect(only).toEqual({ label: 'exercises', done: 2, right: 1, again: 1 });
  });
});

describe('sessionMinutes (D116)', () => {
  it('rounds the time taken, at least a minute', () => {
    expect(sessionMinutes(0, 9 * 60_000 + 20_000, 60)).toBe(9);
    expect(sessionMinutes(0, 10_000, 600)).toBe(1);
  });

  it('falls back to the estimate when unknown or stretched by a pause', () => {
    expect(sessionMinutes(undefined, 5, 300)).toBe(5);
    expect(sessionMinutes(0, 3 * 3_600_000, 240)).toBe(4);
  });
});

describe('New today inputs (D115)', () => {
  it('takes the words read and the grammar introduced or marked new', () => {
    expect(metInput({ cards, results, drills }, 7)).toEqual({
      wordIds: [W.matsu.id, W.aida.id, W.gakusei.id],
      grammarIds: ['te-iru', 'desu'],
      since: 7,
    });
  });

  it('shows one of each kind first, at most three, and keeps the rest for the line', () => {
    const word = (w: Word): MetFirst => ({ kind: 'word', word: w });
    const grammar = { kind: 'grammar', entry: { id: 'desu' } } as MetFirst;
    const kanji = { kind: 'kanji', kanji: { char: '待' }, reading: 'ま' } as MetFirst;
    const met = [kanji, word(W.matsu), word(W.eki), word(W.hon), grammar];
    const { shown, rest } = splitMet(met);
    expect(shown).toEqual([kanji, word(W.matsu), grammar]);
    expect(rest).toEqual([word(W.eki), word(W.hon)]);
    expect(splitMet([word(W.eki), word(W.hon)])).toEqual({
      shown: [word(W.eki), word(W.hon)],
      rest: [],
    });
  });
});
