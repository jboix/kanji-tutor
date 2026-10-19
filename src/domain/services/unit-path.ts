/**
 * The lesson path (T3, T4, D49), pure: each thematic unit's state, step and counts, worked out
 * from the learner's word levels, grammar reviews and stored unit progress. The loaders over the
 * `Repos` port are in `units.ts`.
 */
import { hasKanji } from '../kana.ts';
import type { Unit } from '../themes/index.ts';
import type {
  KnowledgeLevel,
  LearnerLevel,
  LessonSection,
  UnitPack,
  UnitProgress,
  Word,
} from '../types.ts';
import { currentSection } from './lesson-sections.ts';

/** Done, the path's current unit, started but not done, or not opened yet (T4). */
export type UnitState = 'done' | 'current' | 'open' | 'not-started';
/** The step a unit is on: the lesson section to do next (S3), or done. */
export type UnitStep = LessonSection | 'done';

/** Share of a unit's words known (level ≥ 3) for it to count as done. */
export const UNIT_DONE_SHARE = 0.8;

export interface UnitCounts {
  /** Kanji words of the unit known (level ≥ 3), out of all of them. */
  words: { known: number; met: number; total: number };
  /** Grammar points with at least one right review, out of the unit's points. */
  grammar: { reviewed: number; total: number };
}

export interface UnitView extends UnitCounts {
  unit: Unit;
  /** The unit resolved against the packs; undefined when the installed packs lack it. */
  pack: UnitPack | undefined;
  state: UnitState;
  step: UnitStep;
  /** Below the learner's level: a review unit, which can be marked done or skipped. */
  review: boolean;
  skipped: boolean;
  /** The unit's words with kanji (JMdict ids): the ones sessions can teach and count. */
  wordIds: string[];
  progress: UnitProgress;
}

/** Everything the path is worked out from. */
export interface PathInput {
  level: LearnerLevel;
  units: readonly Unit[];
  packs: ReadonlyMap<string, UnitPack>;
  /** Dictionary entries of the packs' unit words. */
  words: ReadonlyMap<string, Word>;
  levels: ReadonlyMap<string, KnowledgeLevel>;
  /** Grammar ids with at least one right review. */
  grammarRight: ReadonlySet<string>;
  status: Readonly<Record<string, UnitProgress>>;
  activeUnit: string | undefined;
}

/**
 * The pack words of a unit that are written with kanji as the unit writes them: kana words
 * (さん, よろしく) are never reading targets (D9), so they are not counted.
 */
export function unitWordIds(unit: Unit, pack: UnitPack | undefined, words: PathInput['words']) {
  const written = new Set(unit.words.map((w) => w.written).filter(hasKanji));
  return (pack?.wordIds ?? []).filter((id) =>
    (words.get(id)?.forms ?? []).some((form) => written.has(form)),
  );
}

function countsOf(unit: Unit, wordIds: readonly string[], input: PathInput): UnitCounts {
  const level = (id: string) => input.levels.get(id) ?? 0;
  return {
    words: {
      known: wordIds.filter((id) => level(id) >= 3).length,
      met: wordIds.filter((id) => level(id) >= 1).length,
      total: wordIds.length,
    },
    grammar: {
      reviewed: unit.grammar.filter((id) => input.grammarRight.has(id)).length,
      total: unit.grammar.length,
    },
  };
}

/** The done rule (T3): ≥ 80% of its words known and each grammar point reviewed right once. */
export function meetsDone({ words, grammar }: UnitCounts): boolean {
  const wordsDone = words.total > 0 && words.known / words.total >= UNIT_DONE_SHARE;
  return wordsDone && grammar.reviewed >= grammar.total;
}

/** The first section not done (S3); まとめ again once all are, until the unit is done. */
function stepOf(done: boolean, progress: UnitProgress): UnitStep {
  if (done) return 'done';
  return currentSection(progress) ?? 'review';
}

function draft(unit: Unit, input: PathInput): UnitView {
  const pack = input.packs.get(unit.id);
  const wordIds = unitWordIds(unit, pack, input.words);
  const progress = input.status[unit.id] ?? {};
  const counts = countsOf(unit, wordIds, input);
  const marked = progress.doneAt !== undefined || progress.skippedAt !== undefined;
  const done = marked || (pack !== undefined && meetsDone(counts));
  return {
    ...counts,
    unit,
    pack,
    state: done ? 'done' : progress.introducedAt !== undefined ? 'open' : 'not-started',
    step: stepOf(done, progress),
    review: unit.level > input.level,
    skipped: progress.skippedAt !== undefined && progress.doneAt === undefined,
    wordIds,
    progress,
  };
}

const workable = (view: UnitView) => view.pack !== undefined && view.state !== 'done';

/**
 * The current unit: one opened early while it is not done, else the first unit of the learner's
 * level on the path that is not done. Review units below the level are never current.
 */
function currentOf(views: readonly UnitView[], input: PathInput): UnitView | undefined {
  const active = views.find((v) => v.unit.id === input.activeUnit);
  if (active && workable(active)) return active;
  return views.find((v) => v.unit.level === input.level && workable(v));
}

/** Every unit in path order with its state, and the current one (T3, T4). */
export function unitPathOf(input: PathInput): { units: UnitView[]; current?: UnitView } {
  const views = input.units.map((unit) => draft(unit, input));
  const current = currentOf(views, input);
  if (!current) return { units: views };
  const marked = { ...current, state: 'current' as const };
  return { units: views.map((v) => (v === current ? marked : v)), current: marked };
}

/** Units that meet the done rule but are not stored as done yet. */
export function newlyDone(units: readonly UnitView[]): UnitView[] {
  return units.filter(
    (v) =>
      v.state === 'done' && v.progress.doneAt === undefined && v.progress.skippedAt === undefined,
  );
}
