import { describe, expect, it } from 'vitest';
import { ungroundedClaims } from './letter-check.ts';
import type { WeekStats } from './week-stats.ts';

const stats: WeekStats = {
  week: '2026-W42',
  sentencesRead: 40,
  correct: 31,
  byErrorType: { 'long-vowel': 6, sokuon: 3 },
  missExamples: [
    { surface: '紹介', expected: 'しょうかい', given: 'しょかい' },
    { surface: '一生', expected: 'いっしょう', given: 'いっしょ' },
  ],
  unusedGrammar: ['〜わけではない', '〜に対して'],
  lesson: 'Tobira 第4課',
};

describe('ungroundedClaims', () => {
  it('accepts a letter that quotes only the stats', () => {
    const letter = [
      'You read 40 sentences and got 31 right (78%). Nine missed, six of them long vowels.',
      'Like 紹介 as しょかい and 一生 as いっしょ, words from 第4課.',
      "You haven't used わけではない or 〜に対して yet. Week 42, 12–18 October.",
    ];
    expect(ungroundedClaims(letter, stats, [12, 18])).toEqual([]);
  });

  it('lists invented numbers and Japanese', () => {
    const letter = [
      'You read 212 sentences and got the reading right in 186. On 31 of 34 words…',
      '学校 as がっこ.',
    ];
    expect(ungroundedClaims(letter, stats)).toEqual(['212', '186', '34', '学校', 'がっこ']);
  });

  it('handles an empty week', () => {
    const empty: WeekStats = { ...stats, sentencesRead: 0, correct: 0, byErrorType: {} };
    const { lesson: _, ...noLesson } = empty;
    expect(ungroundedClaims(['Nothing read yet, 0 sentences.'], noLesson)).toEqual([]);
  });
});
