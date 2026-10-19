import { describe, expect, it } from 'vitest';
import type { Review } from '../types.ts';
import { lastTime } from './last-time.ts';

const NOW = new Date(2026, 9, 19, 9, 0).getTime();
const YESTERDAY = new Date(2026, 9, 18, 20, 0).getTime();

function review(at: number, sentenceId: string, verdict: Review['verdict'], errorType = '') {
  const r: Review = {
    at,
    itemId: 'word:1',
    sentenceId,
    answer: 'x',
    expected: 'y',
    verdict,
    durationMs: 1000,
    mode: 'typed',
  };
  if (errorType) r.errorType = errorType as NonNullable<Review['errorType']>;
  return r;
}

describe('lastTime (IA2)', () => {
  it('counts the latest day: sentences, read right, and the top slip', () => {
    const reviews = [
      review(YESTERDAY, 's1', 'correct'),
      review(YESTERDAY + 1, 's1', 'correct'),
      review(YESTERDAY + 2, 's2', 'near-miss', 'long-vowel'),
      review(YESTERDAY + 3, 's3', 'wrong', 'long-vowel'),
      review(YESTERDAY + 4, 's4', 'wrong', 'sokuon'),
      review(YESTERDAY - 2 * 86_400_000, 's9', 'wrong', 'rendaku'),
    ];
    expect(lastTime(reviews, NOW)).toEqual({
      daysAgo: 1,
      sentences: 4,
      right: 1,
      miss: { type: 'long-vowel', count: 2, given: 'x', expected: 'y' },
    });
  });

  it('says today, with no slip when all were right', () => {
    expect(lastTime([review(NOW - 1000, 's1', 'correct')], NOW)).toEqual({
      daysAgo: 0,
      sentences: 1,
      right: 1,
    });
  });

  it('has nothing to say without reviews', () => {
    expect(lastTime([], NOW)).toBeUndefined();
  });
});
