/**
 * Unit reach check (T3, D56): with a unit current, a learner at the unit's level can meet each
 * of its kanji words in at least one pack sentence (a passage line counts), so the unit's 80%
 * "done" rule can be met. Uses the app's own gate and path code over the committed packs.
 */
import { type WordJlpt, wordJlptFrom } from '../../../src/domain/services/level-gate.ts';
import { unitWordIds } from '../../../src/domain/services/unit-path.ts';
import type { Unit } from '../../../src/domain/themes/types.ts';
import type { Kanji, Sentence, UnitPack, Word } from '../../../src/domain/types.ts';
import { type ReachUnit, reaches, type UnitLearner, unitLearners, without } from '../unit-reach.ts';
import { loadStore } from './pack-words.ts';
import type { Violation } from './rules.ts';

/** The pack rows the check reads. */
export interface ReachPack {
  words: readonly Word[];
  kanji: readonly Kanji[];
  sentences: readonly Sentence[];
  units: readonly UnitPack[];
}

export function loadReachPack(manifestPath: string): ReachPack {
  return {
    words: loadStore<Word>(manifestPath, 'words'),
    kanji: loadStore<Kanji>(manifestPath, 'kanji'),
    sentences: loadStore<Sentence>(manifestPath, 'sentences'),
    units: loadStore<UnitPack>(manifestPath, 'units'),
  };
}

function reachUnits(units: readonly Unit[], pack: ReachPack): ReachUnit[] {
  const packs = new Map(pack.units.map((u) => [u.id, u]));
  const words = new Map(pack.words.map((w) => [w.id, w]));
  return units.map((unit) => ({
    id: unit.id,
    order: unit.order,
    level: unit.level,
    wordIds: unitWordIds(unit, packs.get(unit.id), words),
  }));
}

function byWord(sentences: readonly Sentence[]): Map<string, Sentence[]> {
  const out = new Map<string, Sentence[]>();
  for (const s of sentences) {
    for (const id of s.wordIds) {
      const list = out.get(id);
      if (list) list.push(s);
      else out.set(id, [s]);
    }
  }
  return out;
}

/** True when some sentence lets the learner meet the word (see `unit-reach.ts`). */
function reachable(learner: UnitLearner, id: string, list: readonly Sentence[], jlpt: WordJlpt) {
  const fresh = without(learner, id);
  return list.some((s) => reaches(fresh, s, id, jlpt));
}

/** Unit words no sentence of the pack lets the unit's learner meet. */
export function checkReach(units: readonly Unit[], pack: ReachPack): Violation[] {
  const wordJlpt = wordJlptFrom(pack.words, new Map(pack.kanji.map((k) => [k.char, k])));
  const sentences = byWord(pack.sentences);
  const words = new Map(pack.words.map((w) => [w.id, w]));
  return unitLearners(reachUnits(units, pack), wordJlpt).flatMap(({ unit, ...learner }) =>
    unit.wordIds
      .filter((id) => !reachable({ unit, ...learner }, id, sentences.get(id) ?? [], wordJlpt))
      .map((id) => ({
        unit: unit.id,
        where: 'words',
        message: `${words.get(id)?.forms[0] ?? id}: no sentence an N${unit.level} learner can meet it in`,
      })),
  );
}
