import { describe, expect, it } from 'vitest';
import { readingRepos, S, W } from '../../test/reading-fixtures.ts';
import type { Sentence } from '../types.ts';
import {
  fitsGate,
  gateSentences,
  maxLevelFor,
  stretchLevel,
  taughtLevels,
  wordJlptOf,
} from './level-gate.ts';

const gate = (level: 5 | 4 | 3, stretch: string[] = []) => ({ level, stretch: new Set(stretch) });
const known = new Map([W.eki, W.tomodachi, W.hon, W.yomu].map((w) => [w.id, 3 as const]));
/** 駅で友達を待っている間に、本を読みました。 with 待つ and 間 (N4) to learn. */
const waiting = (level: 5 | 4 | 3): Sentence => ({ ...S.waiting, level });
const own = (): Sentence => {
  const { level: _level, ...rest } = S.waiting;
  return { ...rest, source: 'capture' };
};

describe('the level gate (G3)', () => {
  it('lets a sentence through only at or below the learner level', () => {
    const jlpt = new Map([
      [W.matsu.id, 5],
      [W.aida.id, 4],
    ] as const);
    expect(fitsGate(gate(4), waiting(4), known, jlpt)).toBe(true);
    expect(fitsGate(gate(5), waiting(4), known, jlpt)).toBe(false);
    expect(fitsGate(gate(4), waiting(3), known, jlpt)).toBe(false);
  });

  it('checks the words a levelled sentence would teach, too', () => {
    const jlpt = new Map([
      [W.matsu.id, 5],
      [W.aida.id, 3],
    ] as const);
    expect(fitsGate(gate(4), waiting(4), known, jlpt)).toBe(false);
    expect(fitsGate(gate(4, [W.aida.id]), waiting(4), known, jlpt)).toBe(true);
  });

  it('lets class-lesson words come one level harder', () => {
    const jlpt = new Map([
      [W.matsu.id, 5],
      [W.aida.id, 4],
    ] as const);
    expect(fitsGate(gate(5, [W.aida.id]), waiting(4), known, jlpt)).toBe(true);
    expect(maxLevelFor(gate(5, [W.aida.id]), W.aida.id)).toBe(4);
    expect(maxLevelFor(gate(5), W.aida.id)).toBe(5);
    expect(stretchLevel(3)).toBe(2);
  });

  it('lets a unit’s taught words through whatever their tag, up to their unit level (D56)', () => {
    const jlpt = new Map([
      [W.matsu.id, 5],
      [W.aida.id, 1],
    ] as const);
    const taught = { ...gate(5), taught: taughtLevels([{ level: 5, wordIds: [W.aida.id] }], 5) };
    expect(fitsGate(gate(5), waiting(5), known, jlpt)).toBe(false);
    expect(fitsGate(taught, waiting(5), known, jlpt)).toBe(true);
    expect(fitsGate(taught, waiting(4), known, jlpt)).toBe(true);
    expect(fitsGate(taught, waiting(3), known, jlpt)).toBe(false);
    expect(maxLevelFor(taught, W.aida.id)).toBe(4);
  });

  it('gives taught words one level above the learner, or their unit’s level when harder', () => {
    const units = [
      { level: 4 as const, wordIds: ['a', 'b'] },
      { level: 3 as const, wordIds: ['b', 'c'] },
    ];
    expect(Object.fromEntries(taughtLevels(units, 4))).toEqual({ a: 3, b: 3, c: 3 });
    expect(Object.fromEntries(taughtLevels(units, 5))).toEqual({ a: 4, b: 3, c: 3 });
  });

  it('judges a sentence without a level by its unknown words; unknown levels count as N1', () => {
    expect(
      fitsGate(
        gate(4),
        own(),
        known,
        new Map([
          [W.matsu.id, 5],
          [W.aida.id, 4],
        ] as const),
      ),
    ).toBe(true);
    expect(fitsGate(gate(4), own(), known, new Map([[W.matsu.id, 5]] as const))).toBe(false);
  });

  it('looks word levels up in the dictionary and filters a list', async () => {
    const repos = await readingRepos();
    const jlpt = await wordJlptOf(repos, [W.aida.id, W.koohii.id, 'missing']);
    expect(jlpt.get(W.aida.id)).toBe(4);
    expect(jlpt.has('missing')).toBe(false);
    const kept = await gateSentences(repos, gate(4), [own(), waiting(4), waiting(3)], known);
    expect(kept.map((s) => s.level)).toEqual([undefined, 4]);
    expect(await gateSentences(repos, gate(5), [own()], known)).toEqual([]);
  });
});
