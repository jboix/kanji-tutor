/**
 * What today's lesson gives a session (G3, V1, T3): the level gate, the new words in
 * order, the sentences to prefer and the grammar to bring in. With a class lesson, the lesson
 * is the class's. Without one, it is the current unit of the path (or a unit opened for
 * practice), and the level's word clusters fill in after the unit's words.
 */
import type { Repos } from '../repos.ts';
import type { KnowledgeLevel, LearnerLevel, Settings } from '../types.ts';
import { learnerLevelOf } from './learner-level.ts';
import { type LevelGate, taughtLevels } from './level-gate.ts';
import { type UnitView, unitPath } from './units.ts';

export interface LessonPlan {
  gate: LevelGate;
  /** The unit the session takes its new words from, if any. */
  unit?: UnitView;
  /** Untracked word ids to introduce, in order: the unit's, then the current cluster's. */
  fresh: string[];
  /** Sentence ids to prefer for their words: the unit's passage and its tagged sentences. */
  preferred: string[];
  /** The unit's grammar ids, in the unit's order. */
  grammar: string[];
}

export interface LessonPlanOptions {
  now: number;
  /** A unit to practise (`/read?unit=…`), instead of the class lesson or the path's current. */
  unit?: string | undefined;
  levels: ReadonlyMap<string, KnowledgeLevel>;
}

/** Cluster words queued after the unit's, at most: about one cluster (V1). */
export const CLUSTER_WORDS = 8;

/** Cluster levels to take new words from: the learner's first, then the easier ones. */
function clusterLevels(level: LearnerLevel): LearnerLevel[] {
  return ([level, 5, 4, 3] as const).filter((l, i, all) => l >= level && all.indexOf(l) === i);
}

/**
 * Untracked words of the first clusters on the path with any (V1): a cluster's remaining words
 * all come before the next cluster's, so one is finished before the next starts.
 */
async function clusterWords(repos: Repos, plan: LessonPlanOptions, level: LearnerLevel) {
  const out: string[] = [];
  for (const l of clusterLevels(level)) {
    for (const cluster of await repos.clusters.byLevel(l)) {
      out.push(...cluster.wordIds.filter((id) => !plan.levels.has(id) && !out.includes(id)));
      if (out.length >= CLUSTER_WORDS) return out.slice(0, CLUSTER_WORDS);
    }
  }
  return out;
}

async function classPlan(repos: Repos, settings: Settings, lesson: string): Promise<LessonPlan> {
  const items = await repos.items.byLesson(lesson);
  const stretch = new Set(items.filter((i) => i.kind === 'word').map((i) => i.ref));
  const gate = { level: learnerLevelOf(settings), stretch };
  return { gate, fresh: [], preferred: [], grammar: [] };
}

async function chosenUnit(repos: Repos, options: LessonPlanOptions) {
  const path = await unitPath(repos, options.now);
  const unit =
    options.unit === undefined
      ? path.current
      : path.units.find((view) => view.unit.id === options.unit && view.pack !== undefined);
  return { unit, path };
}

/**
 * The words the units teach: the session's unit and every opened unit that is not done.
 * They are never gated out while their unit is worked on, so its 80% can be reached.
 */
function teaching(unit: UnitView | undefined, path: readonly UnitView[]): UnitView[] {
  const opened = path.filter((view) => view.state === 'open' || view.state === 'current');
  return unit ? [unit, ...opened] : opened;
}

/**
 * Today's lesson (see the module comment). The words of the unit and of every opened unit are
 * taught there, so they pass the gate in sentences up to one level harder.
 */
export async function lessonPlan(repos: Repos, options: LessonPlanOptions): Promise<LessonPlan> {
  const settings = await repos.settings.get();
  const lesson = settings.currentLesson;
  if (lesson !== undefined && options.unit === undefined) return classPlan(repos, settings, lesson);
  const level = learnerLevelOf(settings);
  const { unit, path } = await chosenUnit(repos, options);
  const unitFresh = (unit?.wordIds ?? []).filter((id) => !options.levels.has(id));
  const clusters = await clusterWords(repos, options, level);
  const taught = taughtLevels(
    teaching(unit, path.units).map((view) => ({ level: view.unit.level, wordIds: view.wordIds })),
    level,
  );
  const plan: LessonPlan = {
    gate: { level, stretch: new Set(), taught },
    fresh: [...new Set([...unitFresh, ...clusters])],
    preferred: unit?.pack ? [...unit.pack.passageIds, ...unit.pack.sentenceIds] : [],
    grammar: unit ? [...unit.unit.grammar] : [],
  };
  if (unit) plan.unit = unit;
  return plan;
}
