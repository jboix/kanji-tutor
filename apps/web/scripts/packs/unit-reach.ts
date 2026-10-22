/**
 * Unit word reach (T3): for each unit word, the sentences a learner can meet it in while the
 * unit is current. Uses the app's own gate (`fitsGate`, `isIPlusOne`), so the pipeline keeps the
 * sentences the session will actually show. Pure and deterministic.
 *
 * The simulated learner of a unit is at the unit's level with the unit current, and has learnt
 * what the path offers so far: every word at or below that level (the lists and clusters) and
 * every word of this and earlier units, except the word being checked. The unit's own words are
 * taught (`taughtLevels`). So a word is reachable when the gate lets some sentence teach it.
 */
import type { JlptLevel } from '../../src/domain/learner-view.ts';
import { isIPlusOne } from '../../src/domain/selector.ts';
import {
  fitsGate,
  type LevelGate,
  taughtLevels,
  type WordJlpt,
} from '../../src/domain/services/level-gate.ts';
import type { KnowledgeLevel, LearnerLevel, Sentence } from '../../src/domain/types.ts';

/** A unit as the reach check needs it: path order, level and its kanji word ids. */
export interface ReachUnit {
  id: string;
  order: number;
  level: LearnerLevel;
  wordIds: readonly string[];
}

/** One unit's simulated learner. */
export interface UnitLearner {
  unit: ReachUnit;
  gate: LevelGate;
  /** Known words (level 3): at or below the unit's level, or from this or an earlier unit. */
  levels: ReadonlyMap<string, KnowledgeLevel>;
}

const KNOWN: KnowledgeLevel = 3;

function upTo(wordJlpt: WordJlpt, level: JlptLevel): Map<string, KnowledgeLevel> {
  const out = new Map<string, KnowledgeLevel>();
  for (const [id, jlpt] of wordJlpt) if (jlpt >= level) out.set(id, KNOWN);
  return out;
}

/** The learner of each unit, in path order (see the module comment). */
export function unitLearners(units: readonly ReachUnit[], wordJlpt: WordJlpt): UnitLearner[] {
  const base = new Map<number, Map<string, KnowledgeLevel>>();
  const earlier = new Set<string>();
  const out: UnitLearner[] = [];
  for (const unit of [...units].sort((a, b) => a.order - b.order)) {
    const easy = base.get(unit.level) ?? upTo(wordJlpt, unit.level);
    base.set(unit.level, easy);
    for (const id of unit.wordIds) earlier.add(id);
    const levels = new Map(easy);
    for (const id of earlier) levels.set(id, KNOWN);
    const taught = taughtLevels([unit], unit.level);
    out.push({ unit, gate: { level: unit.level, stretch: new Set(), taught }, levels });
  }
  return out;
}

/** The learner's word levels with `wordId` not known yet: the word being checked. */
export function without(learner: UnitLearner, wordId: string): UnitLearner {
  const levels = new Map(learner.levels);
  levels.delete(wordId);
  return { ...learner, levels };
}

/**
 * True when `sentence` can teach `wordId` to the learner (who must not know it, see
 * {@link without}): an i+1 sentence with it as a target that the gate lets through.
 */
export function reaches(
  learner: UnitLearner,
  sentence: Sentence,
  wordId: string,
  wordJlpt: WordJlpt,
): boolean {
  if (!sentence.wordIds.includes(wordId) || !isIPlusOne(sentence, learner.levels)) return false;
  return fitsGate(learner.gate, sentence, learner.levels, wordJlpt);
}

const ranked = (a: Sentence, b: Sentence) =>
  (b.level ?? 0) - (a.level ?? 0) ||
  a.text.length - b.text.length ||
  (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Key of a unit word in {@link unitReach}. */
export const reachKey = (unitId: string, wordId: string) => `${unitId}:${wordId}`;

/**
 * For each unit word, every candidate it can be met in, easiest and shortest first. Words with
 * no such candidate map to an empty list.
 */
export function unitReach(
  learners: readonly UnitLearner[],
  candidates: readonly Sentence[],
  wordJlpt: WordJlpt,
): Map<string, Sentence[]> {
  const wanted = new Set(learners.flatMap((l) => l.unit.wordIds));
  const byWord = new Map<string, Sentence[]>();
  for (const s of candidates) {
    for (const id of s.wordIds.filter((w) => wanted.has(w))) {
      const list = byWord.get(id);
      if (list) list.push(s);
      else byWord.set(id, [s]);
    }
  }
  const out = new Map<string, Sentence[]>();
  for (const learner of learners) {
    for (const id of learner.unit.wordIds) {
      const fresh = without(learner, id);
      const found = (byWord.get(id) ?? []).filter((s) => reaches(fresh, s, id, wordJlpt));
      out.set(reachKey(learner.unit.id, id), found.sort(ranked));
    }
  }
  return out;
}
