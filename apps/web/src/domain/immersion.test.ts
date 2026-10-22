import { describe, expect, it } from 'vitest';
import { immersionMode, knownShare } from './immersion.ts';
import type { LearnerOverview } from './learner-view.ts';
import type { LearnerLevel } from './types.ts';

function learner(level: LearnerLevel, known: number): Pick<LearnerOverview, 'level' | 'coverage'> {
  return {
    level,
    coverage: { words: [{ level, known, total: 100 }], kanji: [], grammar: [] },
  };
}

describe('immersionMode (M1, D51)', () => {
  it('keeps a fixed setting whatever the level', () => {
    expect(immersionMode(learner(5, 0), 'japanese')).toBe('japanese');
    expect(immersionMode(learner(3, 99), 'native')).toBe('native');
    expect(immersionMode(learner(5, 0), 'mixed')).toBe('mixed');
  });

  it('stays in the learner language at N5 or under 30% of the current level', () => {
    expect(immersionMode(learner(5, 95), 'auto')).toBe('native');
    expect(immersionMode(learner(4, 29), 'auto')).toBe('native');
    expect(immersionMode(learner(3, 10), undefined)).toBe('native');
  });

  it('mixes at N4 from 30%, and turns Japanese at N4 from 70% or at N3', () => {
    expect(immersionMode(learner(4, 30), 'auto')).toBe('mixed');
    expect(immersionMode(learner(4, 69), 'auto')).toBe('mixed');
    expect(immersionMode(learner(4, 70), 'auto')).toBe('japanese');
    expect(immersionMode(learner(3, 30), undefined)).toBe('japanese');
  });

  it('reads 0 for a level without a list', () => {
    expect(knownShare([], 4)).toBe(0);
    expect(knownShare([{ level: 4, known: 0, total: 0 }], 4)).toBe(0);
  });
});
