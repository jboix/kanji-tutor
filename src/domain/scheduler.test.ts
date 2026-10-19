import { describe, expect, it } from 'vitest';
import { estimateMinutes, newCard, ratingFor, reviewCard } from './scheduler.ts';
import type { Grade } from './types.ts';

const NOW = Date.UTC(2026, 9, 17, 9, 0, 0);
const DAY = 86_400_000;

const grade = (verdict: Grade['verdict']): Grade => ({ verdict, expected: 'て', given: 'て' });

describe('newCard', () => {
  it('is new and due now', () => {
    const card = newCard(NOW);
    expect(card).toMatchObject({ due: NOW, state: 0, reps: 0, lapses: 0 });
    expect(card.lastReview).toBeUndefined();
  });
});

describe('ratingFor', () => {
  it.each([
    ['wrong', 10_000, 1],
    ['wrong', 1_000, 1],
    ['near-miss', 10_000, 2],
    ['near-miss', 1_000, 2],
    ['correct', 10_000, 3],
    ['correct', 4_000, 3],
    ['correct', 3_999, 4],
    ['correct', 0, 3],
  ] as const)('%s in %i ms → %i', (verdict, ms, rating) => {
    expect(ratingFor(grade(verdict), ms)).toBe(rating);
  });
});

describe('reviewCard', () => {
  it('schedules a Good review later than a Hard one, and Again soonest', () => {
    const card = newCard(NOW);
    const again = reviewCard(card, 1, NOW);
    const hard = reviewCard(card, 2, NOW);
    const good = reviewCard(card, 3, NOW);
    expect(again.due).toBeLessThanOrEqual(hard.due);
    expect(hard.due).toBeLessThanOrEqual(good.due);
    expect(good).toMatchObject({ reps: 1, lastReview: NOW });
    expect(good.state).not.toBe(0);
  });

  it('round-trips through ts-fsrs and grows intervals on repeated Good reviews', () => {
    let card = newCard(NOW);
    let at = NOW;
    const intervals: number[] = [];
    for (let i = 0; i < 4; i++) {
      card = reviewCard(card, 3, at);
      intervals.push(card.due - at);
      at = card.due;
    }
    expect(card.state).toBe(2);
    expect(intervals.at(-1)).toBeGreaterThan(DAY);
    expect(intervals.at(-1)).toBeGreaterThan(intervals[1] ?? 0);
  });

  it('counts a lapse when a review card is forgotten', () => {
    let card = newCard(NOW);
    for (let i = 0; i < 3; i++) card = reviewCard(card, 4, card.due);
    const lapsed = reviewCard(card, 1, card.due);
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.state).toBe(3);
  });

  it('is deterministic', () => {
    expect(reviewCard(newCard(NOW), 3, NOW)).toEqual(reviewCard(newCard(NOW), 3, NOW));
  });
});

describe('estimateMinutes', () => {
  it.each([
    [0, 0],
    [1, 1],
    [3, 1],
    [4, 2],
    [12, 4],
    [20, 7],
  ])('%i sentences ≈ %i min', (count, minutes) => {
    expect(estimateMinutes(count)).toBe(minutes);
  });
});
