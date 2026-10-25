import { describe, expect, it } from 'vitest';
import type { UnitView } from './unit-path.ts';
import { lastPractised, levelUnits, sectionsDone, unitPractised } from './unit-progress.ts';

const counts = (known: number, total: number, reviewed: number, points: number) => ({
  words: { known, met: known, total },
  grammar: { reviewed, total: points },
});

describe('sectionsDone', () => {
  const sections = {
    words: { parts: 2, done: 2 },
    grammar: { parts: 1, done: 1 },
    practice: { parts: 2, done: 2 },
    reading: { parts: 1, done: 1 },
    review: { parts: 2, done: 1 },
  };
  const progress = { sections } as unknown as UnitView['progress'];

  it('counts the sections with all their parts done', () => {
    expect(sectionsDone({ progress })).toBe(4);
    expect(sectionsDone({ progress: {} as UnitView['progress'] })).toBe(0);
  });
});

describe('levelUnits (T4, T7)', () => {
  const view = (level: number, state: UnitView['state'], introducedAt?: number) =>
    ({ unit: { level }, state, progress: { introducedAt } }) as unknown as UnitView;

  it('counts done and introduced units of one level only', () => {
    const views = [
      view(5, 'done', 1),
      view(5, 'current', 1),
      view(5, 'open', 2),
      view(5, 'current'),
    ];
    expect(levelUnits([...views, view(4, 'done')], 5)).toEqual({ done: 1, started: 2, total: 4 });
  });
});

describe('unitPractised and lastPractised', () => {
  const none = {} as UnitView['progress'];

  it('counts words met and grammar reviewed right, not started before any', () => {
    const words = { known: 2, met: 5, total: 13 };
    const grammar = { reviewed: 1, total: 3 };
    expect(
      unitPractised({ words, grammar, state: 'open', skipped: false, progress: none }),
    ).toEqual({
      done: 6,
      total: 16,
      started: true,
    });
    const fresh = {
      ...counts(0, 13, 0, 3),
      state: 'current' as const,
      skipped: false,
      progress: none,
    };
    expect(unitPractised(fresh)).toEqual({ done: 0, total: 16, started: false });
    const opened = { ...fresh, progress: { introducedAt: 1 } };
    expect(unitPractised(opened).started).toBe(true);
  });

  it('counts every item of a done unit, and only its own of a skipped one', () => {
    const done = { ...counts(2, 13, 0, 3), state: 'done' as const, skipped: false, progress: none };
    expect(unitPractised(done)).toEqual({ done: 16, total: 16, started: true });
    expect(unitPractised({ ...done, skipped: true })).toEqual({
      done: 2,
      total: 16,
      started: true,
    });
  });

  it('takes the latest part or passage read', () => {
    expect(lastPractised({ progress: none })).toBeUndefined();
    const progress = {
      readAt: 5,
      sections: { words: { parts: 2, done: 1, at: 9 }, grammar: { parts: 1, done: 0 } },
    } as UnitView['progress'];
    expect(lastPractised({ progress })).toBe(9);
  });
});
