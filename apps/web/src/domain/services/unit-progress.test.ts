import { describe, expect, it } from 'vitest';
import type { UnitView } from './unit-path.ts';
import { levelUnits, sectionShare, sectionsDone, unitShare } from './unit-progress.ts';

const counts = (known: number, total: number, reviewed: number, points: number) => ({
  words: { known, met: known, total },
  grammar: { reviewed, total: points },
});

describe('unitShare (T7)', () => {
  it('counts known words and right grammar points together', () => {
    expect(unitShare({ ...counts(6, 13, 1, 3), state: 'open' })).toBeCloseTo(7 / 16);
  });

  it('is 1 for a done unit and 0 for an empty one', () => {
    expect(unitShare({ ...counts(2, 13, 0, 3), state: 'done' })).toBe(1);
    expect(unitShare({ ...counts(0, 0, 0, 0), state: 'not-started' })).toBe(0);
  });
});

describe('sectionShare and sectionsDone', () => {
  const sections = {
    words: { parts: 2, done: 2 },
    grammar: { parts: 1, done: 1 },
    practice: { parts: 2, done: 2 },
    reading: { parts: 1, done: 1 },
    review: { parts: 2, done: 1 },
  };
  const progress = { sections } as unknown as UnitView['progress'];

  it('counts the sections done, with a started one in part', () => {
    expect(sectionsDone({ progress })).toBe(4);
    expect(sectionShare({ progress, state: 'current' })).toBeCloseTo(4.5 / 5);
  });

  it('is 1 for a done unit and 0 before any section', () => {
    expect(sectionShare({ progress, state: 'done' })).toBe(1);
    expect(sectionShare({ progress: {} as UnitView['progress'], state: 'open' })).toBe(0);
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
