import { describe, expect, it } from 'vitest';
import type { SessionCard } from '../session-types.ts';
import type { Sentence } from '../types.ts';
import { grammarIntroCard } from './grammar-intro.ts';
import {
  alternate,
  breakLongestRun,
  cardType,
  exerciseSlots,
  fitReadings,
  longestRun,
  mixCards,
  trimTail,
} from './session-mix.ts';

const sentence = (id: string): Sentence => ({
  id,
  text: id,
  source: 'tatoeba',
  tokens: [],
  wordIds: [],
  verified: true,
});
const reading = (id: string): SessionCard => ({
  sentence: sentence(id),
  targets: [],
  reason: 'new',
});
const question = (id: string): SessionCard => ({
  sentence: sentence(id),
  targets: [],
  reason: 'drill',
  question: { id, kind: 'grammar-form' } as SessionCard['question'] & object,
});
const passage = (id: string): SessionCard => ({
  sentence: sentence(id),
  targets: [],
  reason: 'drill',
  passage: { id, sentences: [], questions: [] },
});
const ids = (cards: readonly SessionCard[]) => cards.map((c) => c.sentence.id);
const readings = (n: number) => Array.from({ length: n }, (_, i) => reading(`r${i}`));
const questions = (n: number) => Array.from({ length: n }, (_, i) => question(`q${i}`));

describe('mixCards (V2)', () => {
  it('spreads exercises evenly, never first, last or adjacent', () => {
    expect(ids(mixCards(readings(5), questions(2)))).toEqual([
      'r0',
      'q0',
      'r1',
      'r2',
      'q1',
      'r3',
      'r4',
    ]);
  });

  it('keeps reading runs to two whenever there are enough exercises', () => {
    for (let n = 1; n <= 30; n++) {
      for (let e = exerciseSlots(n); e <= n + 2; e++) {
        const mixed = mixCards(readings(n), questions(e));
        expect(longestRun(mixed)).toBeLessThanOrEqual(2);
        expect(mixed[0]?.reason).toBe('new');
        expect(mixed.at(-1)?.reason).toBe('new');
      }
    }
  });

  it('places an exercise on the session’s own words only after their cards (D56)', () => {
    const qs = questions(3);
    const after = new Map([
      [qs[0] as SessionCard, 4],
      [qs[1] as SessionCard, 1],
    ]);
    const mixed = mixCards(readings(6), qs, undefined, after);
    expect(ids(mixed)).toEqual(['r0', 'q1', 'r1', 'r2', 'q2', 'r3', 'q0', 'r4', 'r5']);
    for (let n = 2; n <= 24; n++) {
      const late = questions(n);
      const at = new Map(late.map((q, i) => [q, Math.min(i, n - 1)] as const));
      const out = mixCards(readings(n), late, undefined, at);
      out.forEach((card, i) => {
        if (!card.question) return;
        const before = out.slice(0, i).filter((c) => c.reason === 'new').length;
        expect(before).toBeGreaterThanOrEqual(at.get(card) ?? 0);
      });
      expect(longestRun(out)).toBeLessThanOrEqual(2);
    }
  });

  it('cuts the reading cards after the last exercise to two when exercises run short', () => {
    const cards = [...readings(2), question('q'), ...readings(4)];
    expect(ids(trimTail(cards))).toEqual(['r0', 'r1', 'q', 'r0', 'r1']);
    expect(ids(trimTail(readings(3)))).toEqual(['r0', 'r1']);
    expect(ids(trimTail([...readings(3), question('q')]))).toHaveLength(4);
    const late = new Map([[question('q'), 6]]);
    const [q] = late.keys();
    expect(ids(mixCards(readings(6), [q as SessionCard], undefined, late))).toEqual([
      'r0',
      'r1',
      'r2',
      'r3',
      'r4',
      'r5',
    ]);
  });

  it('cuts the session to what the exercises can keep to runs of two (fit, D56)', () => {
    const qs = questions(3);
    expect(fitReadings(readings(20), qs).readings).toHaveLength(8);
    const fitted = mixCards(readings(20), qs, undefined, undefined, true);
    expect(fitted.filter((c) => c.reason === 'new')).toHaveLength(8);
    expect(longestRun(fitted)).toBeLessThanOrEqual(2);
    // A question that needs card 9 cannot stay once the session is cut to 8 cards.
    const late = new Map([[qs[2] as SessionCard, 9]]);
    const cut = fitReadings(readings(20), qs, late);
    expect(cut.exercises).toHaveLength(2);
    expect(cut.readings).toHaveLength(6);
    expect(fitReadings(readings(5), []).readings).toHaveLength(5);
    // Without fit only the tail is cut: runs of 5 stay in the middle.
    expect(longestRun(mixCards(readings(20), qs))).toBe(5);
  });

  it('breaks the longest reading run with a card when nothing else is left', () => {
    const mixed = breakLongestRun([...readings(2), question('q'), ...readings(5)], passage('p'));
    expect(ids(mixed)).toEqual(['r0', 'r1', 'q', 'r0', 'r1', 'p', 'r2', 'r3', 'r4']);
    expect(ids(breakLongestRun(readings(2), passage('p')))).toEqual(['r0', 'r1']);
    const late = breakLongestRun(readings(6), passage('p'), 5);
    expect(ids(late)).toEqual(['r0', 'r1', 'r2', 'r3', 'r4', 'p', 'r5']);
    expect(ids(breakLongestRun(readings(6), passage('p'), 6))).toHaveLength(6);
  });

  it('leaves out exercises beyond the gaps and puts the passage last', () => {
    const mixed = mixCards(readings(2), questions(3), passage('p'));
    expect(ids(mixed)).toEqual(['r0', 'q0', 'r1', 'p']);
    expect(ids(mixCards([], questions(2), passage('p')))).toEqual(['p']);
  });

  it('names card types and counts runs past grammar introductions', () => {
    const cards = [reading('a'), grammarIntroCard('te-iru'), reading('b'), question('q')];
    expect(cards.map(cardType)).toEqual([
      'reading',
      'grammar-intro',
      'reading',
      'question:grammar-form',
    ]);
    expect(longestRun(cards)).toBe(2);
    expect(cardType(passage('p'))).toBe('passage');
  });

  it('alternates two lists', () => {
    expect(alternate<number | string>([1, 2, 3], ['a'])).toEqual([1, 'a', 2, 3]);
    expect(exerciseSlots(0)).toBe(0);
    expect(exerciseSlots(7)).toBe(3);
  });
});
