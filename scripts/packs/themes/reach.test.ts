/**
 * The unit path can be finished (T3, D56): over the committed full pack, every unit word can be
 * met by a learner at the unit's level with that unit current, and a learner who knows the
 * unit's words reaches "done".
 */
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { seededOrder } from '../../../src/domain/drills/seed.ts';
import { type PathInput, unitPathOf } from '../../../src/domain/services/unit-path.ts';
import { UNITS } from '../../../src/domain/themes/index.ts';
import type { KnowledgeLevel } from '../../../src/domain/types.ts';
import { checkReach, loadReachPack, type ReachPack } from './reach.ts';
import { formatViolation } from './rules.ts';

const MANIFEST = resolve(import.meta.dirname, '..', '..', '..', 'public', 'packs', 'manifest.json');

let pack: ReachPack;
beforeAll(() => {
  pack = loadReachPack(MANIFEST);
}, 60_000);

function pathInput(levels: Map<string, KnowledgeLevel>, grammarRight: Set<string>): PathInput {
  return {
    level: 5,
    units: UNITS,
    packs: new Map(pack.units.map((u) => [u.id, u])),
    words: new Map(pack.words.map((w) => [w.id, w])),
    levels,
    grammarRight,
    status: {},
    activeUnit: undefined,
  };
}

describe('unit reach (T3, D56)', () => {
  it('lets a learner at the unit’s level meet every unit word in some sentence', () => {
    expect(checkReach(UNITS, pack).map(formatViolation)).toEqual([]);
  }, 60_000);

  it('reaches done once 80% of a unit’s words are known and its grammar is right', () => {
    const empty = unitPathOf(pathInput(new Map(), new Set()));
    for (const view of empty.units) {
      expect(view.wordIds.length, view.unit.id).toBeGreaterThan(0);
      expect(view.state, view.unit.id).not.toBe('done');
      for (const seed of ['a', 'b', 'c']) {
        const order = seededOrder(view.wordIds, String, `${view.unit.id}|${seed}`);
        const enough = Math.ceil(order.length * 0.8);
        const known = (n: number) => new Map(order.slice(0, n).map((id) => [id, 3 as const]));
        const right = new Set(view.unit.grammar);
        const done = unitPathOf(pathInput(known(enough), right)).units.find(
          (v) => v.unit.id === view.unit.id,
        );
        expect(done?.state, view.unit.id).toBe('done');
        const short = unitPathOf(pathInput(known(enough - 1), right)).units.find(
          (v) => v.unit.id === view.unit.id,
        );
        expect(short?.state, view.unit.id).not.toBe('done');
      }
    }
  }, 120_000);
});
